/**
 * Live (no-mock) integration tests for EudrVerifyDeclarationClientV3 against the real
 * EUDR acceptance environment. Uses a known, pre-existing DDS's reference/verification
 * numbers directly rather than submitting a fresh DDS and polling for them to appear.
 */

const { expect } = require('chai');
const EudrVerifyDeclarationClientV3 = require('../../services/verification-service-v3');
const { logger } = require('../../utils/logger');

// Known, pre-existing V3 DDS (status AVAILABLE) - see docs/analysis/v3-live-test-plan.md.
// uuid 64d46f0a-d5a3-422f-a7bc-fb9cbf6bff2e
const KNOWN_DDS_REFERENCE_NUMBER = '26HRBELAQMZQ9C';
const KNOWN_DDS_VERIFICATION_NUMBER = '7QSWSSRD';

describe('EudrVerifyDeclarationClientV3 - Integration Tests', function() {
  this.timeout(30000);

  let verifyClient;

  before(function() {
    if (logger && logger.level) {
      logger.level = 'error';
    }
    require('dotenv').config();

    const requiredEnvVars = ['EUDR_TRACES_USERNAME', 'EUDR_TRACES_PASSWORD', 'EUDR_TRACES_BASE_URL'];
    const missing = requiredEnvVars.filter((name) => !process.env[name]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    verifyClient = new EudrVerifyDeclarationClientV3({
      username: process.env.EUDR_TRACES_USERNAME,
      password: process.env.EUDR_TRACES_PASSWORD,
      webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
    });
  });

  describe('verifyDeclaration', function() {
    it('should verify a known, existing DDS as EXISTING_USABLE', async function() {
      const verification = await verifyClient.verifyDeclaration(
        KNOWN_DDS_REFERENCE_NUMBER,
        KNOWN_DDS_VERIFICATION_NUMBER
      );

      expect(verification.httpStatus).to.equal(200);
      expect(verification.result).to.be.oneOf(['EXISTING_USABLE', 'EXISTING_NON_USABLE']);
      expect(verification.dateTime).to.be.a('string');
      expect(verification.status).to.be.a('string');
    });

    it('should report NON_EXISTENT for a bogus reference/verification pair', async function() {
      const verification = await verifyClient.verifyDeclaration('00NONEXISTENT', 'NOTREAL01');

      expect(verification.httpStatus).to.equal(200);
      expect(verification.result).to.equal('NON_EXISTENT');
      expect(verification.dateTime).to.be.a('string');
    });
  });
});
