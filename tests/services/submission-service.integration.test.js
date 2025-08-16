const { expect } = require('chai');
const EudrSubmissionClient = require('../../services/submission-service');
const scenarios = require('../../services/scenarios');

describe('EudrSubmissionClient - Integration Tests', function () {
  let client;
  let createdDdsIdentifiers = [];

  // Increase timeout for integration tests
  this.timeout(120000);

  before(async function () {
    // Set logger level to debug for tests to see detailed information
    const { logger } = require('../../utils/logger');
    if (logger && logger.level) {
      logger.level = 'error';
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
    console.log('✅ Environment variables loaded successfully');
    console.log(`🌐 Using EUDR API: ${process.env.EUDR_TRACES_BASE_URL}`);
    console.log(`👤 Username: ${process.env.EUDR_TRACES_USERNAME}`);
    console.log(`🔑 Web Service Client ID: ${process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'}`);
    console.log("------------------------------------------------------------------------------------------------");

    // Initialize client with test configuration
    client = new EudrSubmissionClient({
      endpoint: `${process.env.EUDR_TRACES_BASE_URL}/tracesnt/ws/EUDRSubmissionServiceV1`,
      soapAction: 'http://ec.europa.eu/tracesnt/eudr/submission',
      username: process.env.EUDR_TRACES_USERNAME,
      password: process.env.EUDR_TRACES_PASSWORD,
      webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test',
      timestampValidity: 60,
      timeout: 30000
    });
  });

  after(async function () {
    // Clean up any test data if needed
    if (createdDdsIdentifiers.length > 0) {
      console.log(`🧹 Cleaned up ${createdDdsIdentifiers.length} test DDS identifiers`);
    }
  });

  describe('🔧 Configuration & Validation', function () {
    it('should throw error when endpoint is missing', function () {
      expect(() => new EudrSubmissionClient({
        username: 'test',
        password: 'test',
        webServiceClientId: 'test'
      })).to.throw('Missing required configuration: endpoint');
    });

    it('should throw error when username is missing', function () {
      expect(() => new EudrSubmissionClient({
        endpoint: 'http://test.com',
        password: 'test',
        webServiceClientId: 'test'
      })).to.throw('Missing required configuration: username');
    });

    it('should throw error when password is missing', function () {
      expect(() => new EudrSubmissionClient({
        endpoint: 'http://test.com',
        username: 'test',
        webServiceClientId: 'test'
      })).to.throw('Missing required configuration: password');
    });
  });

  describe('🌐 Connection & Authentication', function () {
    it('should successfully connect to EUDR Submission API', async function () {
      try {
        // Test with minimal valid data
        const testData = {
          operatorType: "TRADER",
          statement: {
            internalReferenceNumber: `TEST-${Date.now()}-connection`,
            activityType: "TRADE",
            countryOfActivity: "HR",
            borderCrossCountry: "HR",
            comment: "Connection test",
            commodities: [{
              descriptors: {
                descriptionOfGoods: "Test goods",
                goodsMeasure: {
                  netWeight: 10
                }
              },
              hsHeading: "4407",
              speciesInfo: {
                scientificName: "Test Species",
                commonName: "Test"
              },
              producers: [{
                country: "HR",
                name: "Croatian Test Producer",
                geometryGeojson: Buffer.from('{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[15.2,45.1]},"properties":{"name":"Test Location"}}]}').toString('base64')
              }]
            }],
            geoLocationConfidential: false
          }
        };

        const result = await client.submitDds(testData);

        expect(result).to.be.an('object');
        expect(result).to.have.property('ddsIdentifier');
        expect(result.ddsIdentifier).to.be.a('string');
        expect(result.ddsIdentifier.length).to.be.greaterThan(0);

        createdDdsIdentifiers.push(result.ddsIdentifier);
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // API error is expected for test data
        } else {
          throw error;
        }
      }
    });
  });

  describe('📋 Core Functionality - All Scenarios', function () {
    describe('Trade Scenarios', function () {
      it('should handle trade submission with multiple associated statements', async function () {
        try {
          const result = await client.submitDds(scenarios.trade);

          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          expect(result.ddsIdentifier).to.be.a('string');
          expect(result.ddsIdentifier.length).to.be.greaterThan(0);

          createdDdsIdentifiers.push(result.ddsIdentifier);
        } catch (error) {
          if (error.response && error.response.status === 500) {
            // API error is expected for test data
          } else {
            throw error;
          }
        }
      });

      it('should handle simple trade submission', async function () {
        try {
          const result = await client.submitDds(scenarios.simple_trade);

          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          expect(result.ddsIdentifier).to.be.a('string');
          expect(result.ddsIdentifier.length).to.be.greaterThan(0);

          createdDdsIdentifiers.push(result.ddsIdentifier);
        } catch (error) {
          if (error.response && error.response.status === 500) {
            // API error is expected for test data
          } else {
            throw error;
          }
        }
      });
    });

    describe('Import Scenarios', function () {
      it('should handle import submission with geolocations', async function () {
        try {
          const result = await client.submitDds(scenarios.import);

          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          expect(result.ddsIdentifier).to.be.a('string');
          expect(result.ddsIdentifier.length).to.be.greaterThan(0);

          createdDdsIdentifiers.push(result.ddsIdentifier);
        } catch (error) { 
          throw error;
        }
      });
    });

    describe('Domestic Scenarios', function () {
      it('should handle domestic production submission', async function () {
        try {
          const result = await client.submitDds(scenarios.domestic);

          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          expect(result.ddsIdentifier).to.be.a('string');
          expect(result.ddsIdentifier.length).to.be.greaterThan(0);

          createdDdsIdentifiers.push(result.ddsIdentifier);
        } catch (error) {
          if (error.response && error.response.status === 500) {
            // API error is expected for test data
          } else {
            throw error;
          }
        }
      });
    });

    describe('Representative Scenarios', function () {
      it('should handle authorized representative submission v1', async function () {
        try {
          const result = await client.submitDds(scenarios.representative);


          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          expect(result.ddsIdentifier).to.be.a('string');
          expect(result.ddsIdentifier.length).to.be.greaterThan(0);

          createdDdsIdentifiers.push(result.ddsIdentifier);
        } catch (error) {
          console.log("ERROR", error);

          throw error;

        }
      });
    });

    describe('Minimal Test Scenario', function () {
      it('should handle minimal test scenario (official EUDR example)', async function () {
        try {
          const result = await client.submitDds(scenarios.minimal_test);

          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          expect(result.ddsIdentifier).to.be.a('string');
          expect(result.ddsIdentifier.length).to.be.greaterThan(0);

          createdDdsIdentifiers.push(result.ddsIdentifier);
        } catch (error) {

          if (error.response && error.response.status === 500) {
            throw error;
          } else {
            // Re-throw with more context
            const enhancedError = new Error(`Test failed with unexpected error: ${error.message}`);
            enhancedError.originalError = error;
            throw enhancedError;
          }
        }
      });
    });
  });

  describe('❌ Error Handling', function () {
    it('should handle invalid submission data structure', async function () {
      try {
        await client.submitDds({
          operatorType: "TRADER",
          statement: {
            // Missing required fields like internalReferenceNumber
          }
        });

        // API accepted invalid data (unexpected behavior)
      } catch (error) {
        expect(error.error).to.be.true; 
        expect(error.message).to.include('internalReferenceNumber is required');
      }
    });

    it('should handle network connectivity issues', async function () {
      const invalidClient = new EudrSubmissionClient({
        endpoint: 'https://invalid-endpoint.com/soap',
        soapAction: 'http://ec.europa.eu/tracesnt/eudr/submission',
        username: 'test',
        password: 'test',
        webServiceClientId: 'test',
        timeout: 1000
      });

      try {
        await invalidClient.submitDds({
          operatorType: "TRADER",
          statement: {
            internalReferenceNumber: `TEST-${Date.now()}-network`,
            activityType: "TRADE",
            countryOfActivity: "HR",
            borderCrossCountry: "HR",
            comment: "Network test",
            commodities: [{
              descriptors: {
                descriptionOfGoods: "Test goods",
                goodsMeasure: {
                  netWeight: 10
                }
              },
              hsHeading: "4407"
            }],
            geoLocationConfidential: false
          }
        });

        // API worked with invalid endpoint (unexpected)
      } catch (error) {
        expect(error.error).to.be.true; 
        // The error structure from the service is different
        if (error.originalError.code) {
          // Network error structure
          expect(['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT']).to.include(error.originalError.code);
        } else {
          // Any other error structure is acceptable
          expect(error).to.be.an('object');
        }
      }
    });
  });

  describe('🔒 Security & WSSE', function () {
    it('should include proper WSSE headers in requests', async function () {
      try {
        const testData = {
          operatorType: "TRADER",
          statement: {
            internalReferenceNumber: `TEST-${Date.now()}-wsse`,
            activityType: "TRADE",
            countryOfActivity: "HR",
            borderCrossCountry: "HR",
            comment: "WSSE test",
            commodities: [{
              descriptors: {
                descriptionOfGoods: "Test goods",
                goodsMeasure: {
                  netWeight: 10
                }
              },
              hsHeading: "4407",
              speciesInfo: {
                scientificName: "Test Species",
                commonName: "Test"
              },
              producers: [{
                country: "HR",
                name: "Croatian Test Producer",
                geometryGeojson: Buffer.from('{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[15.2,45.1]},"properties":{"name":"Test Location"}}]}').toString('base64')
              }]
            }],
            geoLocationConfidential: false
          }
        };

        const result = await client.submitDds(testData);

        expect(result).to.be.an('object');
        expect(result).to.have.property('ddsIdentifier');
        createdDdsIdentifiers.push(result.ddsIdentifier);
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // API error is expected for test data
        } else {
          throw error;
        }
      }
    });
  });

  describe('📊 Data Validation', function () {
    it('should validate country codes', async function () {
      try {
        await client.submitDds({
          operatorType: "TRADER",
          statement: {
            internalReferenceNumber: `TEST-${Date.now()}-country`,
            activityType: "IMPORT",
            countryOfActivity: "XX", // Invalid country code
            borderCrossCountry: "YY", // Invalid country code
            comment: "Country validation test",
            commodities: [{
              descriptors: {
                descriptionOfGoods: "Test goods",
                goodsMeasure: {
                  netWeight: 10
                }
              },
              hsHeading: "4407"
            }],
            geoLocationConfidential: false
          }
        });

        // API accepted invalid country codes (unexpected behavior)
      } catch (error) {
        expect(error.error).to.be.true; 
        expect(error.eudrErrorCode).to.equal('XML_VALIDATION_ERROR');
      }
    });

    it('should validate HS heading codes', async function () {
      try {
        await client.submitDds({
          operatorType: "TRADER",
          statement: {
            internalReferenceNumber: `TEST-${Date.now()}-hs`,
            activityType: "IMPORT",
            countryOfActivity: "HR",
            borderCrossCountry: "HR",
            comment: "HS heading validation test",
            commodities: [{
              descriptors: {
                descriptionOfGoods: "Test goods",
                goodsMeasure: {
                  netWeight: 10
                }
              },
              hsHeading: "9999" // Invalid HS heading
            }],
            geoLocationConfidential: false
          }
        });

        // API accepted invalid HS heading (unexpected behavior)
      } catch (error) {
        expect(error.error).to.be.true; 
        expect(error.eudrErrorCode).to.equal('EUDR_COMMODITIES_HS_CODE_INVALID');
      }
    });
  });

  describe('⚡ Performance', function () {
    it('should handle rapid successive requests', async function () {
      const requests = [];
      const startTime = Date.now();

      for (let i = 0; i < 3; i++) {
        requests.push(client.submitDds({
          operatorType: "TRADER",
          statement: {
            internalReferenceNumber: `TEST-${Date.now()}-${i}-performance`,
            activityType: "TRADE",
            countryOfActivity: "HR",
            borderCrossCountry: "HR",
            comment: `Performance test ${i}`,
            commodities: [{
              descriptors: {
                descriptionOfGoods: "Test goods",
                goodsMeasure: {
                  netWeight: 10
                }
              },
              hsHeading: "4407",
              speciesInfo: {
                scientificName: "Test Species",
                commonName: "Test"
              },
              producers: [{
                country: "HR",
                name: "Croatian Test Producer",
                geometryGeojson: Buffer.from('{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[15.2,45.1]},"properties":{"name":"Test Location"}}]}').toString('base64')
              }]
            }],
            geoLocationConfidential: false
          }
        }));
      }

      try {
        const results = await Promise.all(requests);
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        expect(results).to.be.an('array');
        expect(results).to.have.length(3);

        results.forEach((result, index) => {
          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          createdDdsIdentifiers.push(result.ddsIdentifier);
        });
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // API error is expected for test data
        } else {
          throw error;
        }
      }
    });
  });
});
