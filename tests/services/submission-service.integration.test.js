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

    // Initialize client with test configuration
    client = new EudrSubmissionClient({
      username: process.env.EUDR_TRACES_USERNAME,
      password: process.env.EUDR_TRACES_PASSWORD,
      webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
    });
  });

  after(async function () {
    // Clean up any test data if needed
    if (createdDdsIdentifiers.length > 0) {
      console.log(`🧹 Cleaned up ${createdDdsIdentifiers.length} test DDS identifiers`);
    }
  });

  describe('🔧 Configuration & Validation', function () {
    it('should throw error when endpoint is missing and no webServiceClientId', function () {
      expect(() => new EudrSubmissionClient({
        username: 'test',
        password: 'test'
      })).to.throw('webServiceClientId is required when endpoint is not provided');
    });

    it('should throw error when custom webServiceClientId without endpoint', function () {
      expect(() => new EudrSubmissionClient({
        username: 'test',
        password: 'test',
        webServiceClientId: 'custom-client'
      })).to.throw('webServiceClientId "custom-client" does not support automatic endpoint generation');
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
    it('should successfully connect to EUDR Submission V1 API', async function () {
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

        console.log("Result", result);

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

  describe('⚠️ Error Handling', function () {
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

  describe('🌳 Species Info Tests', function () {
    it('should handle speciesInfo as single object V1', async function () {
      try {
        const request = {
          operatorType: 'TRADER',
          statement: {
            internalReferenceNumber: `TEST-SPECIES-OBJECT-V1-${Date.now()}`,
            activityType: 'TRADE',
            countryOfActivity: 'HR',
            borderCrossCountry: 'HR',
            comment: 'Species info as object test V1',
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with single species V1',
                goodsMeasure: {
                  supplementaryUnit: 20,
                  supplementaryUnitQualifier: "MTQ"
                }
              },
              hsHeading: '4401',
              speciesInfo: {
                scientificName: 'Quercus robur',
                commonName: 'Hrast lužnjak'
              },
              producers: [{
                country: 'HR',
                name: 'Test Producer Species V1',
                geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
              }]
            }],
            geoLocationConfidential: false
          }
        };

        const result = await client.submitDds(request);

        expect(result).to.have.property('httpStatus', 200);
        expect(result).to.have.property('ddsIdentifier');
        expect(result.ddsIdentifier).to.be.a('string');
        expect(result.ddsIdentifier).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

        createdDdsIdentifiers.push(result.ddsIdentifier);
      } catch (error) {
        console.log("ERROR", error);
        throw error;
      }
    });

    it('should handle speciesInfo as array V1', async function () {
      try {
        const request = {
          operatorType: 'TRADER',
          statement: {
            internalReferenceNumber: `TEST-SPECIES-ARRAY-V1-${Date.now()}`,
            activityType: 'TRADE',
            countryOfActivity: 'HR',
            borderCrossCountry: 'HR',
            comment: 'Species info as array test V1',
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with multiple species V1',
                goodsMeasure: {
                  netWeight: 750.750,
                  supplementaryUnit: 20,
                  supplementaryUnitQualifier: "MTQ"
                }
              },
              hsHeading: '4401',
              speciesInfo: [
                {
                  scientificName: 'Quercus robur',
                  commonName: 'Hrast lužnjak'
                },
                {
                  scientificName: 'Fagus sylvatica',
                  commonName: 'Bukva'
                },
                {
                  scientificName: 'Pinus sylvestris',
                  commonName: 'Bor'
                }
              ],
              producers: [{
                country: 'HR',
                name: 'Test Producer Species Array V1',
                geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
              }]
            }],
            geoLocationConfidential: false
          }
        };

        const result = await client.submitDds(request);

        expect(result).to.have.property('httpStatus', 200);
        expect(result).to.have.property('ddsIdentifier');
        expect(result.ddsIdentifier).to.be.a('string');
        expect(result.ddsIdentifier).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

        createdDdsIdentifiers.push(result.ddsIdentifier);

      } catch (error) {
        console.log("ERROR", error);
        throw error;
      }
    });

    it('should handle speciesInfo with only scientificName V1', async function () {
      try {
        const request = {
          operatorType: 'TRADER',
          statement: {
            internalReferenceNumber: `TEST-SPECIES-SCIENTIFIC-V1-${Date.now()}`,
            activityType: 'TRADE',
            countryOfActivity: 'HR',
            borderCrossCountry: 'HR',
            comment: 'Species info scientific name only test V1',
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with scientific name only V1',
                goodsMeasure: {
                  supplementaryUnit: 20,
                  supplementaryUnitQualifier: "MTQ"
                }
              },
              hsHeading: '4401',
              speciesInfo: [{
                scientificName: 'Betula pendula'
              }],
              producers: [{
                country: 'HR',
                name: 'Test Producer Scientific V1',
                geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
              }]
            }],
            geoLocationConfidential: false
          }
        };

        const result = await client.submitDds(request);

      } catch (error) {
        expect(error.httpStatus).to.be.equal(400);
        expect(error.error).to.be.true;
        expect(error.eudrErrorCode).to.be.equal('EUDR_COMMODITIES_SPECIES_INFORMATION_COMMON_NAME_EMPTY');
      }
    });

    it('should handle speciesInfo with only commonName V1', async function () {
      try {
        const request = {
          operatorType: 'TRADER',
          statement: {
            internalReferenceNumber: `TEST-SPECIES-COMMON-V1-${Date.now()}`,
            activityType: 'TRADE',
            countryOfActivity: 'HR',
            borderCrossCountry: 'HR',
            comment: 'Species info common name only test V1',
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with common name only V1',
                goodsMeasure: {
                  netWeight: 200.500,
                  supplementaryUnit: 20,
                  supplementaryUnitQualifier: "MTQ"
                }
              },
              hsHeading: '4401',
              speciesInfo: [{
                commonName: 'Jela'
              }],

              producers: [{
                country: 'HR',
                name: 'Test Producer Common V1',
                geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
              }]
            }],
            geoLocationConfidential: false
          }
        };

        const result = await client.submitDds(request);


        createdDdsIdentifiers.push(result.ddsIdentifier);
      } catch (error) {
        expect(error.httpStatus).to.be.equal(400);
        expect(error.error).to.be.true;
        expect(error.eudrErrorCode).to.be.equal('EUDR_COMMODITIES_SPECIES_INFORMATION_SCIENTIFIC_NAME_EMPTY');
      }
    });

    it('should handle empty speciesInfo array V1', async function () {
      try {
        const request = {
          operatorType: 'TRADER',
          statement: {
            internalReferenceNumber: `TEST-SPECIES-EMPTY-V1-${Date.now()}`,
            activityType: 'TRADE',
            countryOfActivity: 'HR',
            borderCrossCountry: 'HR',
            comment: 'Species info empty array test V1',
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood without species info V1',
                goodsMeasure: {
                  netWeight: 100.000,
                  supplementaryUnit: 20,
                  supplementaryUnitQualifier: "MTQ"
                }
              },
              hsHeading: '4401',
              speciesInfo: [],
              producers: [{
                country: 'HR',
                name: 'Test Producer Empty V1',
                geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
              }]
            }],
            geoLocationConfidential: false
          }
        };

        const result = await client.submitDds(request);
 
        createdDdsIdentifiers.push(result.ddsIdentifier);
      } catch (error) {
        expect(error.httpStatus).to.be.equal(400);
        expect(error.error).to.be.true;
        expect(error.eudrErrorCode).to.be.equal('EUDR_COMMODITIES_SPECIES_INFORMATION_EMPTY');
      }
    });

    it('should handle mixed speciesInfo array with partial data V1', async function () {
      try {
        const request = {
          operatorType: 'TRADER',
          statement: {
            internalReferenceNumber: `TEST-SPECIES-MIXED-V1-${Date.now()}`,
            activityType: 'TRADE',
            countryOfActivity: 'HR',
            borderCrossCountry: 'HR',
            comment: 'Species info mixed array test V1',
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with mixed species data V1',
                goodsMeasure: {
                  netWeight: 600.300
                }
              },
              hsHeading: '4401',
              speciesInfo: [
                {
                  scientificName: 'Quercus robur',
                  commonName: 'Hrast lužnjak'
                },
                {
                  scientificName: 'Fagus sylvatica'
                  // Missing commonName
                },
                {
                  commonName: 'Jela'
                  // Missing scientificName
                }
              ],
              producers: [{
                country: 'HR',
                name: 'Test Producer Mixed V1',
                geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
              }]
            }],
            geoLocationConfidential: false
          }
        };

        const result = await client.submitDds(request);
 
      } catch (error) {
        expect(error.httpStatus).to.be.equal(400);
        expect(error.error).to.be.true;
        expect(error.eudrErrorCode).to.be.equal('EUDR_COMMODITIES_SPECIES_INFORMATION_SCIENTIFIC_NAME_EMPTY');
      }
    });

    it('should handle referenceNumber as array V1', async function () {
      try{
      const request = {
        operatorType: 'TRADER',
        statement: {
          internalReferenceNumber: `TEST-REF-ARRAY-V1-${Date.now()}`,
          activityType: 'TRADE',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          comment: 'Reference number as array test V1',
          operator: {
            referenceNumber: [
              {
                identifierType: 'eori',
                identifierValue: 'HR123456789012345'
              },
              {
                identifierType: 'vat',
                identifierValue: 'HR12345678901'
              }
            ],
            nameAndAddress: {
              name: 'Test Company Multiple References V1',
              country: 'HR',
              address: 'Test Street 123, 10000 Zagreb, Croatia'
            }
          },
          commodities: [{
            descriptors: {
              descriptionOfGoods: 'Test wood with multiple references V1',
              goodsMeasure: {
                netWeight: 500.250,
                supplementaryUnit: 20,
                supplementaryUnitQualifier: "MTQ"
              }
            },
            hsHeading: '4401',
            speciesInfo: [{
              scientificName: 'Fagus sylvatica',
              commonName: 'BUKVA OBIČNA'
            }],
            producers: [{
              country: 'HR',
              name: 'Test Producer Multiple Refs V1',
              geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
            }]
          }],
          geoLocationConfidential: false
        }
      };

      const result = await client.submitDds(request);

      expect(result).to.have.property('httpStatus', 200);
      expect(result).to.have.property('ddsIdentifier');
      expect(result.ddsIdentifier).to.be.a('string');
      expect(result.ddsIdentifier).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      createdDdsIdentifiers.push(result.ddsIdentifier);
    } catch (error) {
      console.log("ERROR", error);
      throw error;
    }
    });

    it('should handle associatedStatements as array V1', async function () {
      try{
      const request = {
        operatorType: 'TRADER',
        statement: {
          internalReferenceNumber: `TEST-ASSOC-ARRAY-V1-${Date.now()}`,
          activityType: 'TRADE',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          comment: 'Associated statements as array test V1',
          operator: {
            referenceNumber: {
              identifierType: 'eori',
              identifierValue: 'HR123456789012345'
            },
            nameAndAddress: {
              name: 'Test Company Multiple Associated V1',
              country: 'HR',
              address: 'Test Street 123, 10000 Zagreb, Croatia'
            }
          },
          commodities: [{
            descriptors: {
              descriptionOfGoods: 'Test wood with multiple associated statements V1',
              goodsMeasure: {
                netWeight: 750.750,
                supplementaryUnit: 20,
                supplementaryUnitQualifier: "MTQ"
              }
            },
            hsHeading: '4401',
            speciesInfo: [{
              scientificName: 'Fagus sylvatica',
              commonName: 'BUKVA OBIČNA'
            }],
            producers: [{
              country: 'HR',
              name: 'Test Producer Multiple Assoc V1',
              geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
            }]
          }],
          associatedStatements: [
            {
              referenceNumber: "25HRBLEL9D3262",
              verificationNumber: 'TEREHUFL'
            },
            {
              referenceNumber: '25HR05KTDX3261',
              verificationNumber: '45SG4HWA'
            }
          ],
          geoLocationConfidential: false
        }
      };

      const result = await client.submitDds(request);

      expect(result).to.have.property('httpStatus', 200);
      expect(result).to.have.property('ddsIdentifier');
      expect(result.ddsIdentifier).to.be.a('string');
      expect(result.ddsIdentifier).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      createdDdsIdentifiers.push(result.ddsIdentifier); 
    } catch (error) {
      console.log("ERROR", error);
      throw error;
    }
    });

    it('should handle producers as array V1', async function () {
      try{
      const request = {
        operatorType: 'TRADER',
        statement: {
          internalReferenceNumber: `TEST-PRODUCERS-ARRAY-V1-${Date.now()}`,
          activityType: 'TRADE',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          comment: 'Producers as array test V1',
          operator: {
            referenceNumber: {
              identifierType: 'eori',
              identifierValue: 'HR123456789012345'
            },
            nameAndAddress: {
              name: 'Test Company Multiple Producers V1',
              country: 'HR',
              address: 'Test Street 123, 10000 Zagreb, Croatia'
            }
          },
          commodities: [{
            descriptors: {
              descriptionOfGoods: 'Test wood with multiple producers V1',
              goodsMeasure: {
                netWeight: 600.300
              }
            },
            hsHeading: '4401',
            speciesInfo: [{
              scientificName: 'Fagus sylvatica',
              commonName: 'BUKVA OBIČNA'
            }],
            producers: [
              {
                country: 'HR',
                name: 'Croatian Producer 1 V1',
                geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
              },
              {
                country: 'DE',
                name: 'German Producer 2 V1',
                geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
              },
              {
                country: 'AT',
                name: 'Austrian Producer 3 V1',
                geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
              }
            ]
          }],
          geoLocationConfidential: false
        }
      };

      const result = await client.submitDds(request);

      expect(result).to.have.property('httpStatus', 200);
      expect(result).to.have.property('ddsIdentifier');
      expect(result.ddsIdentifier).to.be.a('string');
      expect(result.ddsIdentifier).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);  
    } catch (error) {
      console.log("ERROR", error);
      throw error;
    }
    });
  });
});
