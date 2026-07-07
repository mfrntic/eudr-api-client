/**
 * Live (no-mock) integration tests for EudrVerifyDeclarationClientV3 against the real
 * EUDR acceptance environment. Coverage cross-checked against
 * "EUDR Downstream Operator and Trader API Reference v1.0.md" (docs/eudr_docs 1.5) and the
 * live WSDL/XSD served by EUDRVerifyDeclarationServiceV3 (?xsd=2/?xsd=3). See
 * docs/analysis/v3-live-test-plan.md for the full coverage matrix and known limitations.
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

  describe('known existing DDS (stable, real data - not created/withdrawn by this suite)', function() {
    // Same stable AVAILABLE record used as KNOWN_DDS in retrieval-service-v3.integration.test.js.
    // Notably, getDdsByIdentifiers fails on this exact reference/verification pair with a
    // server-side "Data not found." NotFoundException (see v3-live-test-plan.md, Known
    // Limitation #6) - verifyDeclaration correctly resolving it here is independent evidence
    // that the getDdsByIdentifiers failure is isolated to that operation, not a problem with
    // the reference/verification numbers themselves or with this account's data.
    const KNOWN_DDS = {
      referenceNumber: '26HRWQZJPVEUPV',
      verificationNumber: 'VUXHBASA'
    };

    it('should return EXISTING_USABLE with status AVAILABLE for a known AVAILABLE DDS', async function() {
      const result = await verifyClient.verifyDeclaration(KNOWN_DDS.referenceNumber, KNOWN_DDS.verificationNumber);
      console.log(`[known DDS] verifyDeclaration: ${JSON.stringify(result)}`);

      expect(result.httpStatus).to.equal(200);
      expect(result.result).to.equal('EXISTING_USABLE');
      expect(result.status).to.equal('AVAILABLE');
      expect(result.dateTime).to.be.a('string');
    });
  });

  describe('verifyDeclaration - not found', function() {
    it('should return a normal 200 response with result NON_EXISTENT for a bogus reference/verification pair, not a fault', async function() {
      // Documented behavior differs from getDdsByIdentifiers/getSdByIdentifiers, which throw a
      // NotFoundException (surfaced as a generic HTTP 500) for an unmatched pair. verifyDeclaration
      // instead returns a normal 200 with result: NON_EXISTENT and no `status` field - confirmed live,
      // matching "EUDR Downstream Operator and Trader API Reference v1.0.md" §5.1.4 exactly.
      const result = await verifyClient.verifyDeclaration('ZZZZZZZZZZZZZZ', 'ZZZZZZZZ');
      console.log(`[not found] verifyDeclaration: ${JSON.stringify(result)}`);

      expect(result.httpStatus).to.equal(200);
      expect(result.result).to.equal('NON_EXISTENT');
      expect(result.status).to.be.null;
      expect(result.dateTime).to.be.a('string');
    });
  });

  describe('verifyDeclaration - schema-level validation (server-enforced, not client-validated)', function() {
    // The client does not pre-validate referenceNumber/verificationNumber length client-side
    // (only presence). The server enforces eudrCommon:ReferenceNumberType (maxLength 14) and
    // eudrCommon:VerificationNumberType (minLength 5, maxLength 35) from the XSD. Confirmed live:
    // violating these returns a raw JAX-WS SAXParseException fault (cvc-minLength-valid /
    // cvc-maxLength-valid), mapped by EudrErrorHandler to eudrErrors[0].code ===
    // 'XML_VALIDATION_ERROR' with httpStatus 400 - NOT the BusinessRulesValidationException shape
    // shown in the docs' sample XML (§5.1.5), which appears to be a generic example shared across
    // services rather than what this operation actually returns for length violations.
    it('should surface an XML_VALIDATION_ERROR when verificationNumber is shorter than the 5-char minimum', async function() {
      try {
        await verifyClient.verifyDeclaration('26HRWQZJPVEUPV', 'AB');
        expect.fail('Expected verifyDeclaration to reject a too-short verificationNumber');
      } catch (error) {
        console.log(`[schema validation] short verificationNumber error: ${JSON.stringify(error.eudrErrors)}`);
        expect(error.httpStatus).to.equal(400);
        expect(error.eudrErrors).to.have.lengthOf(1);
        expect(error.eudrErrors[0].code).to.equal('XML_VALIDATION_ERROR');
        expect(error.eudrErrors[0].message).to.include('minLength');
      }
    });

    it('should surface an XML_VALIDATION_ERROR when referenceNumber exceeds the 14-char maximum', async function() {
      try {
        await verifyClient.verifyDeclaration('26HRWQZJPVEUPVXXXXXX', 'VUXHBASA');
        expect.fail('Expected verifyDeclaration to reject a too-long referenceNumber');
      } catch (error) {
        console.log(`[schema validation] long referenceNumber error: ${JSON.stringify(error.eudrErrors)}`);
        expect(error.httpStatus).to.equal(400);
        expect(error.eudrErrors).to.have.lengthOf(1);
        expect(error.eudrErrors[0].code).to.equal('XML_VALIDATION_ERROR');
        expect(error.eudrErrors[0].message).to.include('maxLength');
      }
    });
  });

  describe('verifyDeclaration - freshly submitted DDS', function() {
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

  describe('verifyDeclaration - withdrawn DDS', function() {
    it('should return EXISTING_NON_USABLE with status WITHDRAWN once a withdrawn DDS is indexed', async function() {
      const internalReferenceNumber = `V3-VERIFY-WD-${Date.now()}`;
      const submitResult = await submissionClient.submitDds({
        operatorRole: 'OPERATOR',
        statement: buildStatement(internalReferenceNumber)
      });
      createdUuids.push(submitResult.uuid);

      // withdrawDds is confirmed to succeed immediately after submit (see
      // submission-service-v3.integration.test.js), independent of when referenceNumber/
      // verificationNumber become queryable via getDds.
      await submissionClient.withdrawDds(submitResult.uuid);

      // Discovered while writing this test: getDds(uuid) can throw a raw
      // InternalSystemException (HTTP 500, faultCode env:Server) for a withdrawn DDS instead of
      // either an empty array or a WITHDRAWN overview - observed to persist for several minutes,
      // not just a brief blip (see v3-live-test-plan.md Known Limitations for details). Treat a
      // thrown error the same as "not ready yet" here so this pre-existing server-side quirk
      // doesn't crash a test whose actual target is verifyDeclaration's behavior, not getDds's
      // error handling.
      const poll = await pollUntil(
        async () => {
          try {
            return await retrievalClient.getDds(submitResult.uuid);
          } catch (error) {
            console.log(`[verifyDeclaration withdrawn] getDds threw while polling (treated as not-ready): ${error.message} - ${JSON.stringify(error.details && error.details.soapFault)}`);
            return { ddsInfo: [] };
          }
        },
        (result) => Boolean(
          result.ddsInfo &&
          result.ddsInfo.length > 0 &&
          result.ddsInfo[0].referenceNumber &&
          result.ddsInfo[0].verificationNumber &&
          result.ddsInfo[0].status === 'WITHDRAWN'
        ),
        { intervalMs: 3000, timeoutMs: 30000 }
      );

      if (!poll.ready) {
        console.log('[verifyDeclaration withdrawn] referenceNumber/verificationNumber/WITHDRAWN status did not become available within 30s - skipping verification assertion.');
        this.skip();
        return;
      }

      const overview = poll.result.ddsInfo[0];

      await delay(5000);

      const verification = await verifyClient.verifyDeclaration(overview.referenceNumber, overview.verificationNumber);
      console.log(`[verifyDeclaration withdrawn] response: ${JSON.stringify(verification)}`);

      expect(verification.httpStatus).to.equal(200);
      expect(verification.result).to.equal('EXISTING_NON_USABLE');
      expect(verification.status).to.equal('WITHDRAWN');
      expect(verification.dateTime).to.be.a('string');
    });
  });
});
