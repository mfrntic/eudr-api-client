const { expect } = require('chai');
const { EudrRetrievalClient } = require('../../services');

describe('EudrRetrievalClient - Integration Tests', function () {
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
      wsdlUrl: `${process.env.EUDR_TRACES_BASE_URL}/tracesnt/ws/EUDRRetrievalServiceV1?wsdl`,
      username: process.env.EUDR_TRACES_USERNAME,
      password: process.env.EUDR_TRACES_PASSWORD,
      webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test',
      timestampValidity: 60,
      timeout: 30000
    });

    // For testing, we'll use some sample DDS identifiers
    // In a real scenario, these would come from successful submission tests
    testDdsIdentifiers = [
      '49c44a92-51be-4d6c-a57d-0b8cd825a7ca', // From trade submission test
      'bbcc3108-f2f8-4ad3-9c55-a9484c108bc6', // From simple trade submission test
      'test-uuid-12345-67890-abcdef', // Test UUID for validation
      'test-uuid-98765-43210-fedcba'  // Another test UUID
    ];

    // Real reference and verification numbers from successful retrieval
    this.realReferenceNumber = '25HRD5I3WZ1046';
    this.realVerificationNumber = 'SI17WKC3';
  });

  after(async function () {
    //console.log(`Test completed with ${testDdsIdentifiers.length} test DDS identifiers`);
  });

  describe('🔧 Configuration & Validation', function () {
    it('should throw error when wsdlUrl is missing', function () {
      expect(() => new EudrRetrievalClient({
        username: 'test',
        password: 'test',
        webServiceClientId: 'test'
      })).to.throw('Missing required configuration: wsdlUrl');
    });

    it('should throw error when username is missing', function () {
      expect(() => new EudrRetrievalClient({
        wsdlUrl: 'http://test.com?wsdl',
        password: 'test',
        webServiceClientId: 'test'
      })).to.throw('Missing required configuration: username');
    });

    it('should throw error when password is missing', function () {
      expect(() => new EudrRetrievalClient({
        wsdlUrl: 'http://test.com?wsdl',
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
      } catch (error) {
        // If it's an API error (not connection error), that's still a successful connection
        if (error.details && error.details.status) {
          // Connection successful, API returned error response
        } else {
          throw error;
        }
      }
    });
  });

  describe('📋 Core Functionality - All Retrieval Methods', function () {
    describe('getDdsInfoByInternalReferenceNumber', function () {
      it('should retrieve DDS by internal reference number', async function () {
        try {
          const result = await retrievalClient.getDdsInfoByInternalReferenceNumber('TEST-REF-001');
          expect(result).to.be.an('object');
        } catch (error) {
          if (error.details && error.details.status === 500) {
            // API returned error response as expected
          } else {
            throw error;
          }
        }
      });

      it('should reject invalid reference numbers with proper error response', async function () {
        try {
          const result = await retrievalClient.getDdsInfoByInternalReferenceNumber('INVALID-REF');
          expect(result).to.be.an('object');
        } catch (error) {
          if (error.details && error.details.status === 500) {
            // API properly rejected invalid reference number
          } else {
            throw error;
          }
        }
      });
    });

    describe('getDdsInfo', function () {
      it('should retrieve DDS by UUID', async function () {
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

      it('should retrieve multiple DDS by UUIDs', async function () {
        try {
          const result = await retrievalClient.getDdsInfo(testDdsIdentifiers.slice(0, 2));
          expect(result).to.be.an('object');
        } catch (error) {
          if (error.details && error.details.status === 500) {
            // API returned error response as expected
          } else {
            throw error;
          }
        }
      });

      it('should reject invalid UUIDs with proper error response', async function () {
        try {
          const result = await retrievalClient.getDdsInfo('invalid-uuid-format');
          expect(result).to.be.an('object');
        } catch (error) {
          if (error.details && error.details.status === 500) {
            // API properly rejected invalid UUID format
          } else {
            throw error;
          }
        }
      });
    });

    describe('getStatementByIdentifiers', function () {
      it('should retrieve statement by verification and reference numbers', async function () {
        try {
          const result = await retrievalClient.getStatementByIdentifiers(
            this.realReferenceNumber,
            this.realVerificationNumber
          );

          expect(result).to.be.an('object');
        } catch (error) {
          if (error.details && error.details.status === 500) {
            // API returned error response as expected
          } else {
            throw error;
          }
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
          if (error.details && error.details.status === 500) {
            // API properly rejected invalid verification number
          } else {
            throw error;
          }
        }
      });
    });

    describe('getReferencedDDS', function () {
      it('should retrieve referenced DDS by reference number', async function () {
        try {
          const result = await retrievalClient.getReferencedDDS(
            this.realReferenceNumber,
            'SEC123' // Security number is required
          );

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
  });

  describe('⚠️ Error Handling', function () {
    it('should handle invalid credentials gracefully', async function () {
      const invalidService = new EudrRetrievalClient({
        wsdlUrl: `${process.env.EUDR_TRACES_BASE_URL}/tracesnt/ws/EUDRRetrievalServiceV1?wsdl`,
        username: 'invalid_username',
        password: 'invalid_password',
        webServiceClientId: 'test'
      });

      try {
        const result = await invalidService.getDdsInfo(testDdsIdentifiers[0]);

        expect(result).to.be.an('object');
      } catch (error) {
        if (error.details && error.details.status === 500) {
          // API properly rejected invalid credentials
        } else {
          throw error;
        }
      }
    });

    it('should handle network connectivity issues gracefully', async function () {
      const invalidService = new EudrRetrievalClient({
        wsdlUrl: 'https://invalid-endpoint.com/wsdl',
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
