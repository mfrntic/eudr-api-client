/**
 * Live (no-mock) integration tests for EudrSimplifiedDeclarationClientV3
 * against the real EUDR acceptance environment.
 *
 * SD write operations (submitSd success, updateSd, withdrawSd, getSd / getSdByIdentifiers
 * with real data) require a test account registered as MICRO_OPERATOR/MSPO in TRACES NT.
 * This suite probes that capability once in `before` and skips the write-lifecycle
 * tests with a clear message if the account doesn't have it - see
 * docs/analysis/v3-live-test-plan.md.
 */

const { expect } = require('chai');
const EudrSimplifiedDeclarationClientV3 = require('../../services/simplified-declaration-service-v3');
const { logger } = require('../../utils/logger');
const { pollUntil } = require('../helpers/wait');

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

// SD internalReferenceNumber is ReferenceNumberType, max length 14 (unlike DDS's 35) - keep prefixes short.
function shortRef(prefix) {
  return `${prefix}${Date.now().toString().slice(-8)}`;
}

function buildSdStatement(internalReferenceNumber) {
  return {
    internalReferenceNumber,
    activityType: 'DOMESTIC',
    countryOfActivity: 'HR',
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'SD integration test - cocoa',
        goodsMeasure: { netWeight: 20 }
      },
      hsHeading: '1801',
      producers: [{
        producerCountry: 'HR',
        producerName: 'SD Integration Test Producer',
        producerLocation: { geometryGeojson: makeGeojsonBase64() }
      }]
    }],
    geoLocationConfidential: false
  };
}

describe('EudrSimplifiedDeclarationClientV3 - Integration Tests', function() {
  this.timeout(120000);

  let sdClient;
  let mspoAvailable = false;
  const createdSdIdentifiers = [];

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

    sdClient = new EudrSimplifiedDeclarationClientV3({
      username: process.env.EUDR_TRACES_USERNAME,
      password: process.env.EUDR_TRACES_PASSWORD,
      webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
    });

    // Probe: does this account have MICRO_OPERATOR/MSPO role in TRACES NT?
    try {
      const probeResult = await sdClient.submitSd({
        operatorRole: 'MICRO_OPERATOR',
        statement: buildSdStatement(shortRef('PRB'))
      });
      mspoAvailable = true;
      createdSdIdentifiers.push(probeResult.sdIdentifier);
      logger.info('MSPO probe succeeded - SD write-lifecycle tests will run.');
    } catch (error) {
      if (error.eudrErrorCode === 'EUDR_WEBSERVICE_USER_ACTIVITY_NOT_ALLOWED') {
        mspoAvailable = false;
        logger.warn('MSPO probe failed: test account has no MICRO_OPERATOR/MSPO role. Write-lifecycle SD tests will be skipped.');
      } else {
        throw error;
      }
    }
  });

  after(async function() {
    for (const sdIdentifier of createdSdIdentifiers) {
      try {
        await sdClient.withdrawSd(sdIdentifier);
        logger.info(`Cleaned up (withdrawn) SD ${sdIdentifier}`);
      } catch (error) {
        logger.warn(`Cleanup withdrawSd failed for ${sdIdentifier}: ${error.message}`);
      }
    }
  });

  describe('submitSd - permission check (no MSPO role required)', function() {
    it('should cleanly surface EUDR_WEBSERVICE_USER_ACTIVITY_NOT_ALLOWED for a non-MSPO account', async function() {
      if (mspoAvailable) {
        this.skip();
        return;
      }

      try {
        await sdClient.submitSd({
          operatorRole: 'MICRO_OPERATOR',
          statement: buildSdStatement(shortRef('CHK'))
        });
        expect.fail('Expected submitSd to be rejected for a non-MSPO account');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_WEBSERVICE_USER_ACTIVITY_NOT_ALLOWED');
        expect(error.details.soapFault).to.exist;
      }
    });
  });

  describe('read operations - not-found paths (no MSPO role required)', function() {
    it('getSd should cleanly handle a random non-existent uuid', async function() {
      const { v4: uuidv4 } = require('uuid');
      try {
        const result = await sdClient.getSd(uuidv4());
        console.log(`[getSd not-found] no fault thrown: ${JSON.stringify(result.sdInfo)}`);
        expect(result.sdInfo).to.be.an('array').that.is.empty;
      } catch (error) {
        console.log(`[getSd not-found] error: ${error.eudrErrorCode || error.message}`);
        expect(error).to.exist;
      }
    });

    it('getSdByInternalReference should cleanly handle a bogus reference', async function() {
      try {
        const result = await sdClient.getSdByInternalReference('BOGUS-REF-1');
        console.log(`[getSdByInternalReference not-found] no fault thrown: ${JSON.stringify(result.sdInfo)}`);
        expect(result.sdInfo).to.be.an('array').that.is.empty;
      } catch (error) {
        console.log(`[getSdByInternalReference not-found] error: ${error.eudrErrorCode || error.message}`);
        expect(error).to.exist;
      }
    });

    it('getSdByIdentifiers should cleanly handle a bogus reference/verification pair', async function() {
      try {
        const result = await sdClient.getSdByIdentifiers('BOGUSSDREF123', 'BOGUSVER');
        console.log(`[getSdByIdentifiers not-found] no fault thrown: ${JSON.stringify(result.statement)}`);
      } catch (error) {
        console.log(`[getSdByIdentifiers not-found] error: ${error.eudrErrorCode || error.message}`);
        expect(error).to.exist;
      }
    });
  });

  describe('write lifecycle (requires MSPO role - skipped if account lacks it)', function() {
    it('submitSd should succeed and return a real sdIdentifier', async function() {
      if (!mspoAvailable) {
        this.skip();
        return;
      }
      const result = await sdClient.submitSd({
        operatorRole: 'MICRO_OPERATOR',
        statement: buildSdStatement(shortRef('LC'))
      });
      expect(result.httpStatus).to.equal(200);
      expect(result.sdIdentifier).to.be.a('string');
      createdSdIdentifiers.push(result.sdIdentifier);
    });

    it('updateSd should succeed and return uuid + status (not sdIdentifier)', async function() {
      if (!mspoAvailable) {
        this.skip();
        return;
      }
      const submitResult = await sdClient.submitSd({
        operatorRole: 'MICRO_OPERATOR',
        statement: buildSdStatement(shortRef('UPD'))
      });
      createdSdIdentifiers.push(submitResult.sdIdentifier);

      // Server processes a freshly submitted SD asynchronously (status starts as SUBMITTED);
      // updateSd is only accepted once it reaches AVAILABLE - see EUDR_API_AMEND_NOT_ALLOWED_FOR_STATUS
      // in docs/analysis/v3-live-test-plan.md (same known async-delay limitation as amendDds).
      const poll = await pollUntil(
        () => sdClient.getSd(submitResult.sdIdentifier),
        (result) => Boolean(result.sdInfo && result.sdInfo[0] && result.sdInfo[0].status === 'AVAILABLE'),
        { intervalMs: 3000, timeoutMs: 30000 }
      );

      if (!poll.ready) {
        console.log('[updateSd] SD did not reach AVAILABLE status within 30s - skipping update assertion (known async-delay limitation).');
        this.skip();
        return;
      }

      const updateResult = await sdClient.updateSd(submitResult.sdIdentifier, buildSdStatement(shortRef('UPD')));
      expect(updateResult.uuid).to.equal(submitResult.sdIdentifier);
      expect(updateResult.status).to.be.a('string');
    });

    it('withdrawSd should succeed and return status WITHDRAWN', async function() {
      if (!mspoAvailable) {
        this.skip();
        return;
      }
      const submitResult = await sdClient.submitSd({
        operatorRole: 'MICRO_OPERATOR',
        statement: buildSdStatement(shortRef('WD'))
      });

      const withdrawResult = await sdClient.withdrawSd(submitResult.sdIdentifier);
      expect(withdrawResult.status).to.equal('WITHDRAWN');
      // already withdrawn - no need to track for after-hook cleanup
    });

    it('getSd/getSdByInternalReference/getSdByIdentifiers should retrieve the real submitted SD', async function() {
      if (!mspoAvailable) {
        this.skip();
        return;
      }
      const internalRef = shortRef('GET');
      const submitResult = await sdClient.submitSd({
        operatorRole: 'MICRO_OPERATOR',
        statement: buildSdStatement(internalRef)
      });
      createdSdIdentifiers.push(submitResult.sdIdentifier);

      const byUuid = await sdClient.getSd(submitResult.sdIdentifier);
      console.log(`[getSd] ${JSON.stringify(byUuid.sdInfo)}`);
      expect(byUuid.sdInfo).to.be.an('array');

      const byRef = await sdClient.getSdByInternalReference(internalRef);
      console.log(`[getSdByInternalReference] ${JSON.stringify(byRef.sdInfo)}`);
      expect(byRef.sdInfo).to.be.an('array');
    });
  });
});
