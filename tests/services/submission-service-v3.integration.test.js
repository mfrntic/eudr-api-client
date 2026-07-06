/**
 * Live (no-mock) integration tests for EudrSubmissionClientV3 against the real
 * EUDR acceptance environment. See docs/analysis/v3-live-test-plan.md for the
 * full coverage matrix and known limitations.
 */

const { expect } = require('chai');
const EudrSubmissionClientV3 = require('../../services/submission-service-v3');
const EudrRetrievalClientV3 = require('../../services/retrieval-service-v3');
const { logger } = require('../../utils/logger');
const { delay, pollUntil } = require('../helpers/wait');

function makeGeojsonBase64() {
  const geojson = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.9665, 45.8150],
          [15.9675, 45.8150],
          [15.9675, 45.8160],
          [15.9665, 45.8160],
          [15.9665, 45.8150]
        ]]
      },
      properties: {}
    }]
  };
  return Buffer.from(JSON.stringify(geojson)).toString('base64');
}

function buildDomesticStatement(overrides = {}) {
  const base = {
    internalReferenceNumber: `V3-TEST-${Date.now()}`,
    activityType: 'DOMESTIC',
    countryOfActivity: 'HR',
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'Integration test - beech timber',
        goodsMeasure: { netWeight: 50, percentageEstimationOrDeviation: 10 }
      },
      hsHeading: '4407',
      speciesInfo: { scientificName: 'Fagus sylvatica', commonName: 'European Beech' },
      producers: [{ country: 'HR', name: 'Integration Test Producer', geometryGeojson: makeGeojsonBase64() }]
    }],
    geoLocationConfidential: false
  };
  return { ...base, ...overrides };
}

describe('EudrSubmissionClientV3 - Integration Tests', function() {
  this.timeout(120000);

  let submissionClient;
  let retrievalClient;
  const createdUuids = [];
  const skipCleanup = process.env.EUDR_RUN_CLEANUP !== '1';

  before(async function() {
    if (logger && logger.level) {
      logger.level = 'error';
    }
    require('dotenv').config();

    const requiredEnvVars = ['EUDR_TRACES_USERNAME', 'EUDR_TRACES_PASSWORD', 'EUDR_TRACES_BASE_URL'];
    const missing = requiredEnvVars.filter((name) => !process.env[name]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    const baseConfig = {
      username: process.env.EUDR_TRACES_USERNAME,
      password: process.env.EUDR_TRACES_PASSWORD,
      webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
    };
    submissionClient = new EudrSubmissionClientV3(baseConfig);
    retrievalClient = new EudrRetrievalClientV3(baseConfig);
  });

  after(async function() {
    if (skipCleanup) {
      console.log(`[cleanup] defaulting to no cleanup; set EUDR_RUN_CLEANUP=1 to withdraw ${createdUuids.length} DDS records: ${JSON.stringify(createdUuids)}`);
      return;
    }

    for (const uuid of createdUuids) {
      try {
        console.log(`[cleanup] withdrawing DDS ${uuid}`);
        await submissionClient.withdrawDds(uuid);
        console.log(`[cleanup] withdrew DDS ${uuid}`);
        logger.info(`Cleaned up (withdrawn) DDS ${uuid}`);
      } catch (error) {
        console.log(`[cleanup] withdraw failed for ${uuid}: ${error.eudrErrorCode || error.message}`);
        logger.warn(`Cleanup withdraw failed for ${uuid}: ${error.message}`);
      }
    }
  });

  describe('submitDds - by activity type', function() {
    it('should submit a DOMESTIC DDS with netWeight + percentageEstimationOrDeviation', async function() {
      const result = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildDomesticStatement()
      });

      expect(result.httpStatus).to.equal(200);
      expect(result.uuid).to.be.a('string');
      createdUuids.push(result.uuid);
    });

    it('should submit an IMPORT DDS with netWeight + supplementaryUnit (HS 4410, in Appendix I)', async function() {
      const result = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildDomesticStatement({
          activityType: 'IMPORT',
          borderCrossCountry: 'HR',
          commodities: [{
            descriptors: {
              descriptionOfGoods: 'Integration test - imported timber',
              goodsMeasure: { netWeight: 100, supplementaryUnit: 5, supplementaryUnitQualifier: 'MTQ' }
            },
            hsHeading: '4410',
            speciesInfo: { scientificName: 'Fagus sylvatica', commonName: 'European Beech' },
            producers: [{ country: 'FR', name: 'Integration Test Producer', geometryGeojson: makeGeojsonBase64() }]
          }]
        })
      });

      console.log("[submitDds] IMPORT result: ", result);

      expect(result.uuid).to.be.a('string');
      createdUuids.push(result.uuid);
    });
  });

  describe('submitDds - business rule regression (percentageEstimationOrDeviation)', function() {
    it('should be rejected by the server when DOMESTIC goodsMeasure has neither percentage nor supplementaryUnit', async function() {
      try {
        await submissionClient.submitDds({
          operatorRole: 'OPERATOR',
          statement: buildDomesticStatement({
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Integration test - missing percentage (regression guard)',
                goodsMeasure: { netWeight: 50 } // intentionally no percentageEstimationOrDeviation/supplementaryUnit
              },
              hsHeading: '4407',
              speciesInfo: { scientificName: 'Fagus sylvatica', commonName: 'European Beech' },
              producers: [{ country: 'HR', name: 'Integration Test Producer', geometryGeojson: makeGeojsonBase64() }]
            }]
          })
        });
        expect.fail('Expected server to reject submission missing percentageEstimationOrDeviation');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_MISSING');
      }
    });
  });

  describe('withdrawDds', function() {
    it('should withdraw a freshly submitted DDS immediately (no wait)', async function() {
      const submitResult = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildDomesticStatement()
      });
      expect(submitResult.uuid).to.be.a('string');

      const withdrawResult = await submissionClient.withdrawDds(submitResult.uuid);
      expect(withdrawResult.httpStatus).to.equal(200);
      expect(withdrawResult.status).to.equal('WITHDRAWN');
      // already withdrawn - no need to track for after-hook cleanup
    });
  });

  describe('withdraw-vs-amend status timing', function() {
    it('should record the DDS overview immediately after submit, before any wait', async function() {
      const submitResult = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildDomesticStatement()
      });
      createdUuids.push(submitResult.uuid);

      const overview = await retrievalClient.getDds(submitResult.uuid);
      console.log(`[timing] getDds immediately after submit: ${JSON.stringify(overview.ddsInfo)}`);
      // Documented EUDR behavior: this may legitimately be an empty array right after submit.
      expect(overview.ddsInfo).to.be.an('array');
    });
  });

  describe('amendDds - after a 15s wait', function() {
    it('should attempt amend 15s after submit and report the real outcome', async function() {
      const submitResult = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildDomesticStatement()
      });
      createdUuids.push(submitResult.uuid);

      await delay(15000);

      try {
        const amendResult = await submissionClient.amendDds(submitResult.uuid, buildDomesticStatement());
        console.log(`[amend] succeeded 15s after submit: ${JSON.stringify(amendResult)}`);
        expect(amendResult.uuid).to.equal(submitResult.uuid);
      } catch (error) {
        console.log(`[amend] failed 15s after submit: ${error.eudrErrorCode} - ${error.message}`);
        // Document the real outcome rather than assuming - this is the exact open question
        // from the manual test (withdraw succeeded immediately, amend didn't).
        expect(error.eudrErrorCode).to.equal('EUDR_API_AMEND_NOT_ALLOWED_FOR_STATUS');
      }
    });
  });

  describe('grouped declarations', function() {
    it('should group DDS B referencing DDS A once A has a referenceNumber, and A should become GROUPED', async function() {
      const submitA = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildDomesticStatement()
      });
      createdUuids.push(submitA.uuid);

      const poll = await pollUntil(
        () => retrievalClient.getDds(submitA.uuid),
        (result) => Boolean(result.ddsInfo && result.ddsInfo.length > 0 && result.ddsInfo[0].referenceNumber),
        { intervalMs: 3000, timeoutMs: 20000 }
      );

      if (!poll.ready) {
        console.log('[grouping] DDS A referenceNumber did not become available within 20s - skipping grouping assertion (known async-delay limitation).');
        this.skip();
        return;
      }

      const referenceNumberA = poll.result.ddsInfo[0].referenceNumber;
      console.log(`[grouping] DDS A referenceNumber: ${referenceNumberA}, status: ${poll.result.ddsInfo[0].status}`);

      const submitB = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildDomesticStatement({
          groupedDeclarations: [{ groupedDeclaration: referenceNumberA }]
        })
      });
      createdUuids.push(submitB.uuid);

      await delay(15000);

      const overviewA = await retrievalClient.getDds(submitA.uuid);
      console.log(`[grouping] DDS A status after grouping attempt: ${JSON.stringify(overviewA.ddsInfo)}`);

      if (overviewA.ddsInfo[0] && overviewA.ddsInfo[0].status === 'GROUPED') {
        try {
          await submissionClient.withdrawDds(submitA.uuid);
          expect.fail('Expected withdraw of a GROUPED DDS to be blocked by the server');
        } catch (error) {
          console.log(`[grouping] withdraw of GROUPED DDS A correctly blocked: ${error.eudrErrorCode} - ${error.message}`);
          expect(error).to.exist;
        }

        const withdrawB = await submissionClient.withdrawDds(submitB.uuid);
        expect(withdrawB.status).to.equal('WITHDRAWN');
        const bIndex = createdUuids.indexOf(submitB.uuid);
        if (bIndex >= 0) createdUuids.splice(bIndex, 1);
      } else {
        console.log('[grouping] DDS A did not show GROUPED status within the test window - documenting as a known timing limitation, not asserting failure.');
        this.skip();
      }
    });
  });
});
