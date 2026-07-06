/**
 * Live (no-mock) integration tests for EudrVerifyDeclarationClientV3 against the real
 * EUDR acceptance environment. This suite submits a DDS, waits for retrieval data to
 * expose reference/verification numbers, then calls verifyDeclaration separately.
 */

const { expect } = require('chai');
const EudrSubmissionClientV3 = require('../../services/submission-service-v3');
const EudrRetrievalClientV3 = require('../../services/retrieval-service-v3');
const EudrVerifyDeclarationClientV3 = require('../../services/verification-service-v3');
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

function buildStatement(internalReferenceNumber) {
  return {
    internalReferenceNumber,
    activityType: 'DOMESTIC',
    countryOfActivity: 'HR',
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'Verify integration test - beech timber',
        goodsMeasure: { netWeight: 40, percentageEstimationOrDeviation: 10 }
      },
      hsHeading: '4407',
      speciesInfo: { scientificName: 'Fagus sylvatica', commonName: 'European Beech' },
      producers: [{ country: 'HR', name: 'Integration Test Producer', geometryGeojson: makeGeojsonBase64() }]
    }],
    geoLocationConfidential: false
  };
}

describe('EudrVerifyDeclarationClientV3 - Integration Tests', function() {
  this.timeout(120000);

  let submissionClient;
  let retrievalClient;
  let verifyClient;
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
    verifyClient = new EudrVerifyDeclarationClientV3(baseConfig);
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

  describe('verifyDeclaration', function() {
    it('should verify a freshly submitted DDS after reference and verification numbers appear', async function() {
      const internalReferenceNumber = `V3-VERIFY-${Date.now()}`;
      const submitResult = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildStatement(internalReferenceNumber)
      });
      createdUuids.push(submitResult.uuid);

      const poll = await pollUntil(
        () => retrievalClient.getDds(submitResult.uuid),
        (result) => Boolean(result.ddsInfo && result.ddsInfo.length > 0 && result.ddsInfo[0].referenceNumber && result.ddsInfo[0].verificationNumber),
        { intervalMs: 3000, timeoutMs: 30000 }
      );

      if (!poll.ready) {
        console.log('[verifyDeclaration] referenceNumber/verificationNumber did not become available within 30s - skipping verification assertion.');
        this.skip();
        return;
      }

      const overview = poll.result.ddsInfo[0];

      await delay(5000);

      const verification = await verifyClient.verifyDeclaration(overview.referenceNumber, overview.verificationNumber);
      console.log(`[verifyDeclaration] response: ${JSON.stringify(verification)}`);

      expect(verification.httpStatus).to.equal(200);
      expect(verification.result).to.be.oneOf(['EXISTING_USABLE', 'EXISTING_NON_USABLE']);
      expect(verification.dateTime).to.be.a('string');
      expect(verification.status).to.be.a('string');
    });
  });
});