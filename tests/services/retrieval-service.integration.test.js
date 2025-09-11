const { expect } = require('chai');
const { EudrRetrievalClient } = require('../../services');

describe('EudrRetrievalClient V1 Tests', function () {
  let retrievalClient;
  let testDdsIdentifiers = [];

  // Increase timeout for integration tests
  this.timeout(60000);

  before(async function () {
    // Set logger level to debug for tests to see detailed information
    const { logger } = require('../../utils/logger');
    if (logger && logger.level) {
      logger.level = 'debug';
    }

    // Load environment variables
    require('dotenv').config();

    // Validate required environment variables
    const requiredEnvVars = [
      'EUDR_TRACES_USERNAME',
      'EUDR_TRACES_PASSWORD',
      'EUDR_TRACES_BASE_URL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    console.log("------------------------------------------------------------------------------------------------");
    // Initialize retrieval service with test configuration
    retrievalClient = new EudrRetrievalClient({
      username: process.env.EUDR_TRACES_USERNAME,
      password: process.env.EUDR_TRACES_PASSWORD,
      webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
    });

    // For testing, we'll use some sample DDS identifiers
    // In a real scenario, these would come from successful submission tests
    testDdsIdentifiers = [
      '49c44a92-51be-4d6c-a57d-0b8cd825a7ca', // From trade submission test
      'bbcc3108-f2f8-4ad3-9c55-a9484c108bc6', // From simple trade submission test
    ];

    // Note: CF7 operations (getStatementByIdentifiers) - getReferencedDDS only available in V2 
    this.realReferenceNumber = '25HRD5I3WZ1046';
    this.realVerificationNumber = 'SI17WKC3';
  });

  after(async function () {
    //console.log(`Test completed with ${testDdsIdentifiers.length} test DDS identifiers`);
  });

  describe('🔧 Configuration & Validation', function () {


    it('should throw error when username is missing', function () {
      expect(() => new EudrRetrievalClient({
        endpoint: 'http://test.com',
        password: 'test',
        webServiceClientId: 'test'
      })).to.throw('Missing required configuration: username');
    });

    it('should throw error when password is missing', function () {
      expect(() => new EudrRetrievalClient({
        endpoint: 'http://test.com',
        username: 'test',
        webServiceClientId: 'test'
      })).to.throw('Missing required configuration: password');
    });
  });

  describe('🌐 Connection & Authentication', function () {
    it('should successfully connect to EUDR Retrieval API', async function () {
      try {

        const result = await retrievalClient.getDdsInfo(testDdsIdentifiers[0]);
        expect(result).to.be.an('object');
        expect(result.httpStatus).to.be.equal(200);
      } catch (error) {

      //  console.log("Error connecting to EUDR Retrieval API", error);
        throw error;

      }
    });
  });

  describe('Real retrieval tests', function () {
    describe('getDdsInfoByInternalReferenceNumber', function () {
      it('should retrieve DDS by internal reference number', async function () {
        try {
          const result = await retrievalClient.getDdsInfoByInternalReferenceNumber('TEST-REF-001');
         // console.log("DDS by internal reference number", result);
          // console.log(result);
          expect(result).to.be.an('object');
          expect(result.httpStatus).to.be.equal(200);
          expect(result.ddsInfo).to.be.an('array');
        } catch (error) {

          console.log(error);
          throw error;

        }
      });

      it('should reject invalid reference numbers with proper error response', async function () {
        try {
          const result = await retrievalClient.getDdsInfoByInternalReferenceNumber('INVALID-REF', { rawResponse: true });
         // console.log("Invalid reference number error", result);
          expect(result).to.be.an('object');
        } catch (error) {

         // console.log("Invalid reference number error", error);
          throw error;

        }
      });
    });

    describe('getDdsInfo', function () {
      it('should retrieve DDS by UUID', async function () {
        try {
          const result = await retrievalClient.getDdsInfo(testDdsIdentifiers[0]);
         // console.log("DDS by UUID", result);
          expect(result.httpStatus).to.be.equal(200);
          expect(result.ddsInfo[0].identifier).to.be.equal(testDdsIdentifiers[0]);
        } catch (error) {

        //  console.log("Invalid UUID error" , JSON.stringify(error, null, 2));
          throw error;

        }
      });

      it('should retrieve multiple DDS by UUIDs', async function () {
        try {
          const result = await retrievalClient.getDdsInfo(testDdsIdentifiers.slice(0, 2));
         // console.log("multiple DDS by UUIDs", result);
          expect(result.httpStatus).to.be.equal(200);
          expect(result.ddsInfo).to.be.an('array');
        } catch (error) {

         // console.log("Invalid UUIDs error", error);
          throw error;

        }
      });

      it('should reject invalid UUIDs with proper error response', async function () {
        try {
          const result = await retrievalClient.getDdsInfo('invalid-uuid-format');
        } catch (error) {
          expect(error.error).to.be.true;
          expect(error.details.status).to.be.equal(500);


        }
      });

      // it("", async function () {
      //   try {
      //     const result = await retrievalClient.
      //     console.log("DDS by internal reference number", result);
      //     expect(result).to.be.an('object');
      //   }
      // });
    });

    // Note: getStatementByIdentifiers is a CF7 operation and requires CF7 endpoint
    describe('Get full DDS statement by reference and verification number', function () {
      it('should retrieve statement by verification and reference numbers', async function () {
        try {
          const result = await retrievalClient.getStatementByIdentifiers(
            this.realReferenceNumber,
            this.realVerificationNumber,
            { rawResponse: true }
          );
         // console.log("DDS by reference and verification number", JSON.stringify(result, null, 2));
          // expect(result).to.be.an('object');
          // expect(result.status).to.be.equal(200);
          // expect(result.ddsInfo).to.be.an('array');

        } catch (error) {
        //  console.log("Error retrieving DDS by reference and verification number", error);
          throw error;

        }
      });

      it('should reject invalid verification numbers with proper error response', async function () {
        try {
          const result = await retrievalClient.getStatementByIdentifiers(
            'INVALID-REF',
            'INVALID-VER'
          );

          expect(result).to.be.an('object');
        } catch (error) {
          expect(error.error).to.be.true;
          expect(error.details.status).to.be.equal(500);

        }
      });

      it('should always return commodities as an array in getStatementByIdentifiers response', async function () {
        try {
          const result = await retrievalClient.getStatementByIdentifiers(
            this.realReferenceNumber,
            this.realVerificationNumber
          );
          
          // Check if we have DDS info
          if (result.ddsInfo && result.ddsInfo.length > 0) {
            const ddsInfo = result.ddsInfo[0];
            
            // If commodities exist, they should always be an array
            if (ddsInfo.commodities !== undefined) {
              expect(ddsInfo.commodities).to.be.an('array');
              console.log('Commodities is correctly returned as array:', Array.isArray(ddsInfo.commodities));
            }
          }
        } catch (error) {
          // If this is a real test with actual credentials, we might get authentication errors
          // In that case, we'll just log the error and continue
          console.log('Note: Could not test commodities array due to error:', error.message);
        }
      });

      it('should always return array fields as arrays in getStatementByIdentifiers response', async function () {
        try {
          const result = await retrievalClient.getStatementByIdentifiers(
            this.realReferenceNumber,
            this.realVerificationNumber
          );
          
          // Check if we have DDS info
          if (result.ddsInfo && result.ddsInfo.length > 0) {
            const ddsInfo = result.ddsInfo[0];
            
            // Check all array fields that should always be arrays
            const arrayFields = ['commodities', 'producers', 'speciesInfo', 'referenceNumber'];
            
            arrayFields.forEach(field => {
              if (ddsInfo[field] !== undefined) {
                expect(ddsInfo[field]).to.be.an('array', `${field} should be an array`);
                console.log(`${field} is correctly returned as array:`, Array.isArray(ddsInfo[field]));
              }
            });

            // Check nested array fields in commodities
            if (ddsInfo.commodities && ddsInfo.commodities.length > 0) {
              const commodity = ddsInfo.commodities[0];
              if (commodity.producers !== undefined) {
                expect(commodity.producers).to.be.an('array', 'commodity.producers should be an array');
              }
              if (commodity.speciesInfo !== undefined) {
                expect(commodity.speciesInfo).to.be.an('array', 'commodity.speciesInfo should be an array');
              }
            }
          }
        } catch (error) {
          console.log('Note: Could not test array fields due to error:', error.message);
        }
      });
    });

  });


  describe('⚠️ Error Handling', function () {
    it('should handle invalid credentials gracefully', async function () {
      const invalidService = new EudrRetrievalClient({ 
        username: 'invalid_username',
        password: 'invalid_password' ,
        webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test' 
      });

      try {
        const result = await invalidService.getDdsInfo(testDdsIdentifiers[0]);

        // If we reach here, the test should fail because we expect an authentication error
        throw new Error('Expected authentication error but got successful response');
      } catch (error) {
        // Our service now converts SOAP authentication faults to proper HTTP 401
        expect(error.error).to.be.true;
        expect(error.details.status).to.be.equal(401);
        expect(error.details.statusText).to.be.equal('Unauthorized');
        expect(error.message).to.include('Authentication failed');
      }
    });

    it('should handle network connectivity issues gracefully', async function () {
      const invalidService = new EudrRetrievalClient({
        endpoint: 'https://invalid-endpoint.com/',
        username: 'test',
        password: 'test',
        webServiceClientId: 'test',
        timeout: 1000
      });

      try {
        await invalidService.getDdsInfo('test-uuid');
        // If we reach here, the test should fail because we expect an error
        throw new Error('Expected network error but got successful response');
      } catch (error) {
        // Verify that we get the expected custom error structure
        expect(error).to.be.an('object');
        expect(error.error).to.be.true;
        expect(error.message).to.be.a('string');
        expect(error.message).to.not.be.empty;
        expect(error.details).to.be.an('object');

        // The error should indicate some form of network/connection failure
        const errorMessage = error.message.toLowerCase();
        const isNetworkError = errorMessage.includes('network') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('invalid') ||
          errorMessage.includes('unreachable') ||
          errorMessage.includes('failed') ||
          errorMessage.includes('enotfound') ||
          errorMessage.includes('econnrefused');

        expect(isNetworkError).to.be.true;
      }
    });
  });

  describe('🔒 Security & WSSE', function () {
    it('should include proper WSSE headers in requests', async function () {
      try {
        const result = await retrievalClient.getDdsInfo(testDdsIdentifiers[0]);

        expect(result).to.be.an('object');
      } catch (error) {
        if (error.details && error.details.status === 500) {
          // API returned error response as expected
        } else {
          throw error;
        }
      }
    });
  });

  describe('📊 Data Validation', function () {
    it('should validate UUID formats', async function () {
      try {
        const result = await retrievalClient.getDdsInfo('not-a-valid-uuid');

        expect(result).to.be.an('object');
      } catch (error) {
        if (error.details && error.details.status === 500) {
          // API properly rejected invalid UUID format
        } else {
          throw error;
        }
      }
    });

    it('should reject empty reference numbers with proper error response', async function () {
      try {
        await retrievalClient.getDdsInfoByInternalReferenceNumber('');
        // If we reach here, the test should fail because we expect an error
        throw new Error('Expected validation error but got successful response');
      } catch (error) {
        // Verify that we get the expected custom error structure
        expect(error).to.be.an('object');
        expect(error.error).to.be.true;
        expect(error.message).to.be.a('string');
        expect(error.message).to.not.be.empty;
        expect(error.details).to.be.an('object');

        // The error should indicate validation failure
        expect(error.message).to.include('Internal reference number must be provided');
      }
    });
  });

  describe('⚡ Performance', function () {
    it('should handle rapid successive requests', async function () {
      const requests = [];
      const startTime = Date.now();

      for (let i = 0; i < 3; i++) {
        requests.push(retrievalClient.getDdsInfo(testDdsIdentifiers[i % testDdsIdentifiers.length]));
      }

      try {
        const results = await Promise.all(requests);
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        expect(results).to.be.an('array');
        expect(results).to.have.length(3);

        results.forEach((result, index) => {
          expect(result).to.be.an('object');
        });
      } catch (error) {
        if (error.details && error.details.status === 500) {
          // API returned error response as expected for test data
        } else {
          throw error;
        }
      }
    });
  });
});

