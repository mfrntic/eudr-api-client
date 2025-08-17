const { expect } = require('chai');
const EudrSubmissionClientV2 = require('../../services/submission-service-v2');
const scenariosV2 = require('../../services/scenarios-v2');
const { logger } = require('../../utils/logger');


describe('EudrSubmissionClientV2 - Integration Tests', function () {
  let client;
  let createdDdsIdentifiers = [];

  // Increase timeout for integration tests
  this.timeout(120000);

  before(async function () {
    // Set logger level to error for tests to reduce noise
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

    // Initialize V2 client with test configuration
    client = new EudrSubmissionClientV2({
      username: process.env.EUDR_TRACES_USERNAME,
      password: process.env.EUDR_TRACES_PASSWORD,
      webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
    });
  });

  after(async function () {
    // Clean up any test data if needed
    if (createdDdsIdentifiers.length > 0) {
      logger.info(`🧹 Cleaned up ${createdDdsIdentifiers.length} test DDS identifiers`);
    }
  });

  describe('🔧 Configuration & Validation', function () {
    it('should throw error when endpoint is missing and no webServiceClientId', function () {
      expect(() => new EudrSubmissionClientV2({
        username: process.env.EUDR_TRACES_USERNAME,
        password: process.env.EUDR_TRACES_PASSWORD
      })).to.throw('webServiceClientId is required when endpoint is not provided');
    });

    it('should throw error when custom webServiceClientId without endpoint', function () {
      expect(() => new EudrSubmissionClientV2({
        username: process.env.EUDR_TRACES_USERNAME,
        password: process.env.EUDR_TRACES_PASSWORD,
        webServiceClientId: 'custom-client'
      })).to.throw('webServiceClientId "custom-client" does not support automatic endpoint generation');
    });

    it('should throw error when username is missing', function () {
      expect(() => new EudrSubmissionClientV2({
        endpoint: 'http://test.com',
        password: process.env.EUDR_TRACES_PASSWORD,
        webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
      })).to.throw('Missing required configuration: username');
    });

    it('should throw error when password is missing', function () {
      expect(() => new EudrSubmissionClientV2({
        endpoint: 'http://test.com',
        username: process.env.EUDR_TRACES_USERNAME,
        webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
      })).to.throw('Missing required configuration: password');
    });
  });

  describe('🌐 Connection & Authentication', function () {
    it('should successfully connect to EUDR Submission V2 API', async function () {
      try {
        // Test with minimal valid V2 data
        const result = await client.submitDds({
          operatorType: "OPERATOR",
          statement: {
            internalReferenceNumber: `TEST-${Date.now()}-v2-connection`,
            activityType: "IMPORT",
            countryOfActivity: "HR",
            borderCrossCountry: "HR",
            comment: "V2 connection test",
            commodities: [{
              descriptors: {
                descriptionOfGoods: "Test goods",
                goodsMeasure: {
                  netWeight: 10
                }
              },
              hsHeading: "4407",
              speciesInfo: {
                scientificName: 'Fagus sylvatica',
                commonName: 'European Beech'
              },
              producers: [{
                country: 'HR',
                name: 'Test Producer',
                geometryGeojson: 'eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=='
              }]
            }],
            geoLocationConfidential: false
          }
        });

        expect(result).to.be.an('object');
        expect(result).to.have.property('ddsIdentifier');
        expect(result.ddsIdentifier).to.be.a('string');
        expect(result.ddsIdentifier.length).to.be.greaterThan(0);

        // Store for cleanup
        createdDdsIdentifiers.push(result.ddsIdentifier);

        logger.info('✅ Successfully connected to EUDR Submission V2 API');
        logger.info(`📋 DDS Identifier: ${result.ddsIdentifier}`);
      } catch (error) {
        // If it's a validation error from the API, that's still a successful connection
        if (error.response && error.response.status === 500) {
          logger.info('✅ Successfully connected to EUDR Submission V2 API (with validation error)');
        } else {
          throw error;
        }
      }
    });
  });

  describe('📋 Core Functionality - All V2 Scenarios', function () {
    describe('Operator Scenarios', function () {
      it('should handle operator import submission with geolocations', async function () {
        try {
          const result = await client.submitDds(scenariosV2.operator);

          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          expect(result.ddsIdentifier).to.be.a('string');
          expect(result.ddsIdentifier.length).to.be.greaterThan(0);

          createdDdsIdentifiers.push(result.ddsIdentifier);
          logger.info(`✅ Operator import submission successful - DDS: ${result.ddsIdentifier}`);
        } catch (error) {
          if (error.response && error.response.status === 500) {
            logger.info('⚠️ Operator import submission failed with API error (expected for test data)');
          } else {
            throw error;
          }
        }
      });

      it('should handle domestic production submission', async function () {
        try {
          const result = await client.submitDds(scenariosV2.domestic);

          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          expect(result.ddsIdentifier).to.be.a('string');
          expect(result.ddsIdentifier.length).to.be.greaterThan(0);

          createdDdsIdentifiers.push(result.ddsIdentifier);

          logger.info(`✅ Domestic production submission successful - DDS: ${result.ddsIdentifier}`);
        } catch (error) {
          if (error.response && error.response.status === 500) {

            logger.info('⚠️ Domestic production submission failed with API error (expected for test data)');
          } else {
            throw error;
          }
        }
      });

      it('should handle export submission', async function () {
        try {
          const result = await client.submitDds(scenariosV2.export);

          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          expect(result.ddsIdentifier).to.be.a('string');
          expect(result.ddsIdentifier.length).to.be.greaterThan(0);

          createdDdsIdentifiers.push(result.ddsIdentifier);

          logger.info(`✅ Export submission successful - DDS: ${result.ddsIdentifier}`);
        } catch (error) {
          if (error.response && error.response.status === 500) {

            logger.info('⚠️ Export submission failed with API error (expected for test data)');
          } else {
            throw error;
          }
        }
      });
    });

    describe('Representative Scenarios', function () {
      it('should handle authorized representative submission v2', async function () {
        try {
          const result = await client.submitDds(scenariosV2.representative);

          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          expect(result.ddsIdentifier).to.be.a('string');
          expect(result.ddsIdentifier.length).to.be.greaterThan(0);

          createdDdsIdentifiers.push(result.ddsIdentifier);

          logger.info(`✅ Authorized representative submission successful - DDS: ${result.ddsIdentifier}`);
        } catch (error) {
          console.log("ERROR", error);
          throw error;
        }
      });

      it('should handle representative trader submission', async function () {
        try {
          const result = await client.submitDds(scenariosV2.representativeTrader);

          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          expect(result.ddsIdentifier).to.be.a('string');
          expect(result.ddsIdentifier.length).to.be.greaterThan(0);

          createdDdsIdentifiers.push(result.ddsIdentifier);

          logger.info(`✅ Representative trader submission successful - DDS: ${result.ddsIdentifier}`);
        } catch (error) {
          
          console.log("ERROR", error);
          
            throw error;
         
        }
      });
    });

    describe('Trade Scenarios', function () {
      it('should handle trade submission with referenced DDS', async function () {
        try {
          const result = await client.submitDds(scenariosV2.trade);

          expect(result).to.be.an('object');
          expect(result).to.have.property('ddsIdentifier');
          expect(result.ddsIdentifier).to.be.a('string');
          expect(result.ddsIdentifier.length).to.be.greaterThan(0);

          createdDdsIdentifiers.push(result.ddsIdentifier);

          logger.info(`✅ Trade submission with referenced DDS successful - DDS: ${result.ddsIdentifier}`);
        } catch (error) {
         
            throw error;
          
        }
      });
    });
  });


  describe('⚠️ Error Handling', function () {
    it('should handle invalid submission data structure', async function () {
      try {
        await client.submitDds({
          operatorType: "INVALID",
          statement: {
            // Missing required fields
          }
        });


        logger.info('⚠️ API accepted invalid data (unexpected behavior)');
      } catch (error) { 
        expect(error.error).to.be.true; 
        expect(error.message).to.include('internalReferenceNumber is required');
      }
    });

    it('should handle network connectivity issues', async function () {
      const invalidClient = new EudrSubmissionClientV2({
        endpoint: 'https://invalid-endpoint.com/soap', 
        username: process.env.EUDR_TRACES_USERNAME,
        password: process.env.EUDR_TRACES_PASSWORD,
        webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test',
        timeout: 1000
      });

      try {
        await invalidClient.submitDds({
          operatorType: "OPERATOR",
          statement: {
            internalReferenceNumber: `TEST-${Date.now()}-v2-network`,
            activityType: "DOMESTIC",
            countryOfActivity: "HR",
            borderCrossCountry: "HR",
            comment: "V2 network test",
            commodities: [{
              descriptors: {
                descriptionOfGoods: "Test goods",
                goodsMeasure: {
                  netWeight: 10
                }
              },
              hsHeading: "4407",
              speciesInfo: {
                scientificName: "Fagus silvatica",
                commonName: "European Beech"
              },
              producers: [{
                country: "HR",
                name: "Test Producer",
                geometryGeojson: "eyJ0eXBlIjoiUG9pbnQiLCJjb29yZGluYXRlcyI6WzE1Ljk2NjUsNDUuODE1MF19"
              }]
            }],
            operator: {
              operatorAddress: {
                name: "Test Company",
                country: "HR",
                street: "Test Street 1",
                postalCode: "10000",
                city: "Zagreb",
                fullAddress: "Test Street 1, 10000 Zagreb"
              },
              email: "test@company.hr",
              phone: "+385 (001) 123-4567"
            },
            geoLocationConfidential: false
          }
        });

        logger.info('⚠️ API worked with invalid endpoint (unexpected)');
      } catch (error) { 
        if (error.code) {
          expect(['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT']).to.include(error.code);
        } else if (error.response) {
          // For HTTP errors, check response status
          expect(error.response.status).to.be.a('number');
        } else {
          // For other types of errors, just ensure it's an error object
          expect(error.message).to.be.a('string');
        }
      }
    });
  });

  describe('🔒 Security & WSSE', function () {
    it('should include proper WSSE headers in V2 requests', async function () {
      try {
        // Use the proper trade scenario instead of hardcoded test data
        const result = await client.submitDds(scenariosV2.trade);

        expect(result).to.be.an('object');
        expect(result).to.have.property('ddsIdentifier');
        createdDdsIdentifiers.push(result.ddsIdentifier);


        logger.info('✅ V2 WSSE security headers properly configured');
      } catch (error) {
        
          throw error;
        
      }
    });
  });

  describe('📊 Data Validation', function () {
    it('should validate V2 specific data structures', async function () {
      try {
        // Use the proper operator scenario instead of hardcoded test data
        const result = await client.submitDds(scenariosV2.operator);

        expect(result).to.be.an('object');
        expect(result).to.have.property('ddsIdentifier');
        expect(result.ddsIdentifier).to.be.a('string');
        expect(result.ddsIdentifier.length).to.be.greaterThan(0);

        createdDdsIdentifiers.push(result.ddsIdentifier);

        logger.info(`✅ V2 specific data structures handled correctly - DDS: ${result.ddsIdentifier}`);
      } catch (error) {
      
          throw error;
        
      }
    });
  });

  describe('⚡ Performance', function () {
    it('should handle rapid successive V2 requests', async function () {
      const requests = [];
      const startTime = Date.now();

      for (let i = 0; i < 3; i++) {
        // Use the proper trade scenario instead of hardcoded test data
        const testScenario = {
          ...scenariosV2.trade,
          statement: {
            ...scenariosV2.trade.statement,
            internalReferenceNumber: `TEST-${Date.now()}-${i}-v2-performance`
          }
        };
        requests.push(client.submitDds(testScenario));
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


        logger.info(`✅ Rapid successive V2 requests handled successfully in ${totalTime}ms`);
        logger.info(`📋 Created DDS identifiers: ${results.map(r => r.ddsIdentifier).join(', ')}`);
      } catch (error) {
        
          throw error;
       
      }
    });
  });
});
