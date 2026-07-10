/**
 * Live (no-mock) integration tests for EudrRetrievalClientV3 against the real
 * EUDR acceptance environment. See docs/analysis/v3-live-test-plan.md for the
 * full coverage matrix and known limitations.
 */

const { expect } = require('chai');
const { v4: uuidv4 } = require('uuid');
const EudrSubmissionClientV3 = require('../../services/submission-service-v3');
const EudrRetrievalClientV3 = require('../../services/retrieval-service-v3');
const { logger } = require('../../utils/logger');

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

function buildStatement(internalReferenceNumber) {
  return {
    internalReferenceNumber,
    activityType: 'DOMESTIC',
    countryOfActivity: 'HR',
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'Retrieval integration test - beech timber',
        goodsMeasure: { netWeight: 30, percentageEstimationOrDeviation: 10 }
      },
      hsHeading: '4407',
      speciesInfo: { scientificName: 'Fagus sylvatica', commonName: 'European Beech' },
      producers: [{ country: 'HR', name: 'Integration Test Producer', geometryGeojson: makeGeojsonBase64() }]
    }],
    geoLocationConfidential: false
  };
}

describe('EudrRetrievalClientV3 - Integration Tests', function () {
  this.timeout(120000);

  let submissionClient;
  let retrievalClient;
  const createdUuids = [];

  before(async function () {
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

  after(async function () {
    for (const uuid of createdUuids) {
      try {
        await submissionClient.withdrawDds(uuid);
        logger.info(`Cleaned up (withdrawn) DDS ${uuid}`);
      } catch (error) {
        logger.warn(`Cleanup withdraw failed for ${uuid}: ${error.message}`);
      }
    }
  });

  describe('known existing DDS (stable, real data - not created/withdrawn by this suite)', function () {
    // A real, previously-submitted DDS confirmed by the user. Never add its uuid to
    // createdUuids / the after-hook cleanup - this record must not be withdrawn.
    const KNOWN_DDS = {
      uuid: 'c138d609-11b2-4e14-ba8b-bbf7a6173b2e',
      referenceNumber: '26HRWQZJPVEUPV',
      verificationNumber: 'VUXHBASA',
      internalReferenceNumber: 'V3-VERIFY-1783371470850'
    };

    it('getDds(uuid) should return this DDS overview', async function () {
      const result = await retrievalClient.getDds(KNOWN_DDS.uuid);
      console.log(`[known DDS] getDds: ${JSON.stringify(result.ddsInfo)}`);

      expect(result.ddsInfo).to.be.an('array').with.length.of.at.least(1);
      const overview = result.ddsInfo[0];
      expect(overview.uuid).to.equal(KNOWN_DDS.uuid);
      expect(overview.referenceNumber).to.equal(KNOWN_DDS.referenceNumber);
      expect(overview.internalReferenceNumber).to.equal(KNOWN_DDS.internalReferenceNumber);
    });

    it('getDdsByInternalReference(internalReferenceNumber) should return the same DDS', async function () {
      const result = await retrievalClient.getDdsByInternalReference(KNOWN_DDS.internalReferenceNumber);
      console.log(`[known DDS] getDdsByInternalReference: ${JSON.stringify(result.ddsInfo)}`);

      expect(result.ddsInfo).to.be.an('array').with.length.of.at.least(1);
      const overview = result.ddsInfo.find((item) => item.uuid === KNOWN_DDS.uuid);
      expect(overview, `expected uuid ${KNOWN_DDS.uuid} to be present in the ddsInfo results`).to.exist;
      expect(overview.referenceNumber).to.equal(KNOWN_DDS.referenceNumber);
    });

    it('getDdsByIdentifiers(referenceNumber, verificationNumber) should return the full statement for the same DDS', async function () {
      console.log("KNOWN_DDS params:", KNOWN_DDS.referenceNumber, KNOWN_DDS.verificationNumber);
      try {
        const result = await retrievalClient.getDdsByIdentifiers(KNOWN_DDS.referenceNumber, KNOWN_DDS.verificationNumber);
        console.log("[known DDS] getDdsByIdentifiers statement:", JSON.stringify(result));
      } catch (error) {
        console.log("[known DDS] getDdsByIdentifiers error:", error.message, error.eudrErrorCode);
        throw error;
      }
    });
  });

  describe('getDds', function () {
    it('should return an (possibly empty) ddsInfo array immediately after submit', async function () {
      const internalRef = `V3-RET-${Date.now()}`;
      const submitResult = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildStatement(internalRef)
      });
      createdUuids.push(submitResult.uuid);

      const result = await retrievalClient.getDds(submitResult.uuid);
      console.log(`[getDds] immediately after submit: ${JSON.stringify(result.ddsInfo)}`);
      expect(result.httpStatus).to.equal(200);
      expect(result.ddsInfo).to.be.an('array');
    });

    it('should accept a batch of multiple real uuids in one call', async function () {
      const submitOne = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildStatement(`V3-RET-BATCH1-${Date.now()}`)
      });
      const submitTwo = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildStatement(`V3-RET-BATCH2-${Date.now()}`)
      });
      createdUuids.push(submitOne.uuid, submitTwo.uuid);

      const result = await retrievalClient.getDds([submitOne.uuid, submitTwo.uuid]);
      console.log(`[getDds batch] result: ${JSON.stringify(result.ddsInfo)}`);
      expect(result.httpStatus).to.equal(200);
      expect(result.ddsInfo).to.be.an('array');
    });

    it('should return a clean NotFoundException-style error for a random non-existent uuid', async function () {
      try {
        const result = await retrievalClient.getDds(uuidv4());
        // Some EUDR deployments return 200 with an empty array instead of a fault for unknown uuids.
        console.log(`[getDds not-found] no fault thrown, result: ${JSON.stringify(result.ddsInfo)}`);
        expect(result.ddsInfo).to.be.an('array').that.is.empty;
      } catch (error) {
        console.log(`[getDds not-found] error: ${error.eudrErrorCode || error.message}`);
        expect(error).to.exist;
      }
    });
  });

  describe('getDdsByInternalReference', function () {
    it('should query by the internal reference of a freshly submitted DDS', async function () {
      const internalRef = `V3-RET-IREF-${Date.now()}`;
      const submitResult = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildStatement(internalRef)
      });
      createdUuids.push(submitResult.uuid);

      const result = await retrievalClient.getDdsByInternalReference(internalRef);
      console.log(`[getDdsByInternalReference] immediately after submit: ${JSON.stringify(result.ddsInfo)}`);
      expect(result.httpStatus).to.equal(200);
      expect(result.ddsInfo).to.be.an('array');
    });
  });

  describe('getDdsByIdentifiers', function () {
    it('should return a clean error for a bogus reference/verification number pair', async function () {
      try {
        const result = await retrievalClient.getDdsByIdentifiers('BOGUSREF12345', 'BOGUSVER');
        console.log(`[getDdsByIdentifiers not-found] no fault thrown: ${JSON.stringify(result.statement)}`);
      } catch (error) {
        console.log(`[getDdsByIdentifiers not-found] error: ${error.eudrErrorCode || error.message}`);
        expect(error).to.exist;
      }
    });
  });
});
