/**
 * Live (no-mock) integration tests for EudrRetrievalClientV3 against the real
 * EUDR acceptance environment. See docs/analysis/v3-live-test-plan.md for the
 * full coverage matrix and known limitations.
 */

const { expect } = require('chai');
const { v4: uuidv4 } = require('uuid');
const EudrSubmissionClientV3 = require('../../services/submission-service-v3');
const EudrSubmissionClientV4 = require('../../services/submission-service-v4');
const EudrRetrievalClientV3 = require('../../services/retrieval-service-v3');
const EudrRetrievalClientV4 = require('../../services/retrieval-service-v4');
const { logger } = require('../../utils/logger');
const { resolveOrCleanNotFound } = require('../helpers/wait');
const { skipWithoutCredentials } = require('../helpers/credentials');

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

// The same live suite runs against both API versions: V4 (release 8.2.2) keeps the V3
// operations and data model, so every expectation applies to both unless noted.
const API_VERSIONS = [
  { label: 'V3', SubmissionClient: EudrSubmissionClientV3, RetrievalClient: EudrRetrievalClientV3 },
  { label: 'V4', SubmissionClient: EudrSubmissionClientV4, RetrievalClient: EudrRetrievalClientV4 }
];

for (const api of API_VERSIONS) {
  describe(`EudrRetrievalClient${api.label} - Integration Tests`, function () {
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
      if (skipWithoutCredentials(this, requiredEnvVars)) return;

      const baseConfig = {
        username: process.env.EUDR_TRACES_USERNAME,
        password: process.env.EUDR_TRACES_PASSWORD,
        webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
      };
      submissionClient = new api.SubmissionClient(baseConfig);
      retrievalClient = new api.RetrievalClient(baseConfig);
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
        if (api.label === 'V4') {
          // V4-only OverviewType.referenceNumberInfo: free text, populated in every lifecycle state.
          expect(overview.referenceNumberInfo).to.be.a('string').and.not.empty;
        } else {
          expect(overview.referenceNumberInfo).to.equal(undefined);
        }
      });

      it('getDdsByInternalReference(internalReferenceNumber) should return the same DDS', async function () {
        const result = await retrievalClient.getDdsByInternalReference(KNOWN_DDS.internalReferenceNumber);
        console.log(`[known DDS] getDdsByInternalReference: ${JSON.stringify(result.ddsInfo)}`);

        expect(result.ddsInfo).to.be.an('array').with.length.of.at.least(1);
        const overview = result.ddsInfo.find((item) => item.uuid === KNOWN_DDS.uuid);
        expect(overview, `expected uuid ${KNOWN_DDS.uuid} to be present in the ddsInfo results`).to.exist;
        expect(overview.referenceNumber).to.equal(KNOWN_DDS.referenceNumber);
      });

      // Release 8.2.2 discontinued detail retrieval over the API on V3 and V4 alike: the server
      // answers every call with a NotFoundException ("Statement details can only be accessed through
      // the UI"). This replaces the earlier expectation of a full statement, which had been failing
      // with that fault for exactly this record - the cause is now documented by the Commission.
      it('getDdsByIdentifiers(referenceNumber, verificationNumber) should report EUDR_DETAIL_RETRIEVAL_UNSUPPORTED', async function () {
        try {
          const result = await retrievalClient.getDdsByIdentifiers(KNOWN_DDS.referenceNumber, KNOWN_DDS.verificationNumber);
          expect.fail(`getDdsByIdentifiers unexpectedly returned content: ${JSON.stringify(result.statement)}`);
        } catch (error) {
          console.log(`[known DDS] getDdsByIdentifiers: ${error.eudrErrorCode} - ${error.eudrErrorMessage}`);
          expect(error.httpStatus).to.equal(404);
          expect(error.notFound).to.equal(true);
          expect(error.detailRetrievalUnsupported).to.equal(true);
          expect(error.eudrErrorCode).to.equal('EUDR_DETAIL_RETRIEVAL_UNSUPPORTED');
        }
      });
    });

    describe('getDds', function () {
      it('should return an (possibly empty) ddsInfo array immediately after submit', async function () {
        const internalRef = `${api.label}-RET-${Date.now()}`;
        const submitResult = await submissionClient.submitDds({
          operatorRole: 'OPERATOR',
          statement: buildStatement(internalRef)
        });
        createdUuids.push(submitResult.uuid);

        const result = await resolveOrCleanNotFound(
          retrievalClient.getDds(submitResult.uuid),
          'getDds immediately after submit',
          expect
        );
        if (!result) return;

        console.log(`[getDds] immediately after submit: ${JSON.stringify(result.ddsInfo)}`);
        expect(result.httpStatus).to.equal(200);
        expect(result.ddsInfo).to.be.an('array');
      });

      it('should accept a batch of multiple real uuids in one call', async function () {
        const submitOne = await submissionClient.submitDds({
          operatorRole: 'OPERATOR',
          statement: buildStatement(`${api.label}-RET-BATCH1-${Date.now()}`)
        });
        const submitTwo = await submissionClient.submitDds({
          operatorRole: 'OPERATOR',
          statement: buildStatement(`${api.label}-RET-BATCH2-${Date.now()}`)
        });
        createdUuids.push(submitOne.uuid, submitTwo.uuid);

        const result = await resolveOrCleanNotFound(
          retrievalClient.getDds([submitOne.uuid, submitTwo.uuid]),
          'getDds batch',
          expect
        );
        if (!result) return;

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
        const internalRef = `${api.label}-RET-IREF-${Date.now()}`;
        const submitResult = await submissionClient.submitDds({
          operatorRole: 'OPERATOR',
          statement: buildStatement(internalRef)
        });
        createdUuids.push(submitResult.uuid);

        const result = await resolveOrCleanNotFound(
          retrievalClient.getDdsByInternalReference(internalRef),
          'getDdsByInternalReference immediately after submit',
          expect
        );
        if (!result) return;

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
}
