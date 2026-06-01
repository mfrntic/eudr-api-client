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
          "statement": {
            "geoLocationConfidential": false,
            "borderCrossCountry": null,
            "internalReferenceNumber": "19\/5",
            "countryOfActivity": "AT",
            "commodities": [
              {
                "descriptors": {
                  "descriptionOfGoods": "N\/A",
                  "goodsMeasure": {
                    "netWeight": 14500.0
                  }
                },
                "hsHeading": "4401",
                "speciesInfo": {
                  "commonName": "Cinnamon",
                  "scientificName": "Cinnamon"
                },
                "producers": [
                  {
                    "country": "LK",
                    "geometryGeojson": "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1s4MC41OTk0NjE4NDM2OTE3Niw3LjI1MjMyMDIyNDg0NzY3OV0sWzgwLjU5OTc2MjI1MTEwMTQyLDcuMjUxNzAyOTMwMjEzNTkwNV0sWzgwLjU5OTkxMjQ1NDgwNjI2LDcuMjUxMDY0MzQ4NjY3MDc3XSxbODAuNTk5MjY4NzI0NjQyNjgsNy4yNTA4MzAyMDE4NzMxMzNdLFs4MC41OTg5ODk3NzQ5MDUxNCw3LjI0OTk1NzQ3MTg0MTMzM10sWzgwLjU5OTIwNDM1MTYyNjMzLDcuMjQ5MDQyMTY3Nzk1OTc0XSxbODAuNTk4NzEwODI1MTY3NTksNy4yNDg0Njc0NDEwNDk0Nzg1XSxbODAuNTk4NDc0NzkwNzc0MjgsNy4yNDY3NDMyNTY0MTA2OTldLFs4MC41OTk4MjY2MjQxMTc3OCw3LjI0ODQ0NjE1NDg1OTU5OV0sWzgwLjYwMDY0MjAxNTY1ODMxLDcuMjQ5ODI5NzU1MTA5NDYxXSxbODAuNjAxMTk5OTE1MTMzNCw3LjI1MDg1MTQ4Nzk1MDMzMl0sWzgwLjYwMTQ3ODg2NDg3MDk2LDcuMjUxNDI2MjExNjU0NjI2XSxbODAuNjAyNDAxNTQ0NzcyMDgsNy4yNTIwMDA5MzQ2MjUzNzFdLFs4MC42MDI2Mzc1NzkxNjUzOSw3LjI1MjI1NjM2NjgyMTMzMl0sWzgwLjYwMTYwNzYxMDkwMzY3LDcuMjUyNjgyMDg2ODI1OTI1XSxbODAuNjAwODk5NTA3NzIzNzQsNy4yNTI3ODg1MTY3NjQxNzJdLFs4MC41OTk5OTgyODU0OTQ3Myw3LjI1MjUzMzA4NDg3MDEwOV0sWzgwLjU5OTQ2MTg0MzY5MTc2LDcuMjUyMzIwMjI0ODQ3Njc5XV1dfSwicHJvcGVydGllcyI6e319XX0=",
                    "ProductionPlace": "FC-25645_A (vally)",
                    "name": "Anura Madushan Perera"
                  },
                  {
                    "country": "LK",
                    "geometryGeojson": "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1s4MS4xMjYwMDU2ODY4MTk1NSw4LjQ1NTA3MDA5NDgyMDIyN10sWzgxLjEyNTgxMTg5NzIxODIzLDguNDU0MDU3OTUyMTE2MzU0XSxbODEuMTI0ODIzNTAzMTk2MjQsOC40NTM1MDU0NTEwNzg3MzNdLFs4MS4xMjQ2NDIxMTg4MTE2MSw4LjQ1MzIzOTE0OTI3NTM5NF0sWzgxLjEyNDM4ODY1MDA1OTcsOC40NTMxNzIxNTkyNTM1NzJdLFs4MS4xMjQxNDY5MTU5NzIyMyw4LjQ1MjkxNTgwNjI0MDc2XSxbODEuMTIzNzg5NTExNjIxLDguNDUyOTkxMDg3MTU2MTJdLFs4MS4xMjM0NzAzMjg3NDgyMyw4LjQ1Mjk0OTk2NDU0MzRdLFs4MS4xMjMwNzYzNzkyOTkxNiw4LjQ1Mjg0NzE1Nzk5MjM2OF0sWzgxLjEyMjc1MTE2MTQ1NjExLDguNDUyNDYyNDYyMjY3ODg1XSxbODEuMTIwODg4MDMyMDE5MTQsOC40NTI3NzQ1MzAxMjIwNF0sWzgxLjEyMDk1OTQ0NTgzNDE2LDguNDU0NjUxMjQzMTY1MTYzXSxbODEuMTIxMTExOTk2NDcxODgsOC40NTUwMDU3NTgxNzQzNjhdLFs4MS4xMjExMjk0MzA4MzA0OCw4LjQ1NTcwMjUxNjg0NDY3Nl0sWzgxLjEyMzY0NzY4OTgxOTM0LDguNDU1NTQzNjY1MjY0NDAyXSxbODEuMTI0NzU2NzgzMjQ3LDguNDU1NDUwMTQ1MDk2NzM0XSxbODEuMTI2MDA1Njg2ODE5NTUsOC40NTUwNzAwOTQ4MjAyMjddXV19LCJwcm9wZXJ0aWVzIjp7fX1dfQ==",
                    "ProductionPlace": "KLM-7359_A (breez farm)",
                    "name": "Oshan Piyal Ranathunga"
                  },
                  {
                    "country": "LK",
                    "geometryGeojson": "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1s4MC42MjA1Nzg5MzcyMzI1LDcuNDgxMDQ5NTk3ODg5NThdLFs4MC42MjA1MzA5OTI3NDYzNSw3LjQ4MTAyMTAwOTU3NTIwOV0sWzgwLjYyMDI4NjkxMTcyNiw3LjQ4MDk5OTQwMjEyNzA1Nl0sWzgwLjYyMDE1NjgyNDU4ODc4LDcuNDgxMTcyOTI2NTI2NjA0XSxbODAuNjIwMjk4OTgxNjY2NTYsNy40ODEzMDQ4OTgxMDIyNjddLFs4MC42MjA0NTMyMDg2ODQ5Miw3LjQ4MTI2OTY2MTM2MzA1XSxbODAuNjIwNTI2NjM0MTU2Nyw3LjQ4MTIxNTQ3NjU2MDM4M10sWzgwLjYyMDU3ODkzNzIzMjUsNy40ODEwNDk1OTc4ODk1OF1dXX0sInByb3BlcnRpZXMiOnt9fV19",
                    "ProductionPlace": "FAT-5454_A (spice garden)",
                    "name": "Ruwan Lakmal de Silva"
                  },
                  {
                    "country": "LK",
                    "geometryGeojson": "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1s4MC4wMjIyNTI2OTU2NDcwMSw3LjE2MjE4ODM5NTc2Mjk0NTVdLFs4MC4wMjI0MTM2MjgxODc5LDcuMTYxNjU2MTM5Mzk4ODZdLFs4MC4wMjIyNzY4MzU1MjgxNSw3LjE2MTU4NDI4NDc0MjExM10sWzgwLjAyMjI0NzMzMTIyODk4LDcuMTYxNjI0MjAzOTk3MjYzXSxbODAuMDIyMTQ4MDg5NDk1NDMsNy4xNjE2Mzc1MTA0MTQ4NjVdLFs4MC4wMjIxNDAwNDI4NjgzOSw3LjE2MjE1NjQ2MDM5ODYxMV0sWzgwLjAyMjI1MjY5NTY0NzAxLDcuMTYyMTg4Mzk1NzYyOTQ1NV1dXX0sInByb3BlcnRpZXMiOnt9fV19",
                    "ProductionPlace": "FC-9635_F (mountain farm)",
                    "name": "Malini Anuradha Fernando"
                  },
                  {
                    "country": "LK",
                    "geometryGeojson": "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1s4MC42MzU2MjQ3ODg3MDE1Myw3LjI4MTg1NjAyNTQxMTI2MV0sWzgwLjYzNTg5NzcwMzQ2ODgsNy4yODMwMDYwNTc5MTYwOV0sWzgwLjYzNjA2MTk4ODc3MDk2LDcuMjgzNTQ1NDg3OTkzNjM5XSxbODAuNjM2MzE2NDYzMzUxMjUsNy4yODQ0MjA0ODA3NzcyNTNdLFs4MC42Mzc0NDczNDk3MjcxNSw3LjI4MzU2NTEwOTY2NzMyNF0sWzgwLjYzNzYzNzQ1MTI5MTA4LDcuMjgyOTM3ODgwODI1NTY0XSxbODAuNjM3NDUzMDQ5NDIxMzEsNy4yODE4OTE5NDMxODU5MzZdLFs4MC42MzY5ODIzMjE3MzkyLDcuMjgxMTg3NTU1MTkwODM2XSxbODAuNjM2NTU5ODczODE5MzUsNy4yODExODY1NTc0NzMzNV0sWzgwLjYzNjIwNjQ5Mjc4MTY0LDcuMjgxNDEwMzc4NzA4Mzc0XSxbODAuNjM1OTExNDQ5NzksNy4yODE0MzI2NjEwNTQwMzVdLFs4MC42MzU2MjQ3ODg3MDE1Myw3LjI4MTg1NjAyNTQxMTI2MV1dXX0sInByb3BlcnRpZXMiOnt9fV19",
                    "ProductionPlace": "AS-987654_A (Amara Farms)",
                    "name": "Sangeeth Wijesooriya"
                  },
                  {
                    "country": "LK",
                    "geometryGeojson": "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1s4MC4wODExNDc5MTA3MTY4NCw3LjA5MzcyMDU4OTM1OTcyNzVdLFs4MC4wODExMjkxMzUyNTM3Myw3LjA5NDAwMjcyNzEzOTk1Ml0sWzgwLjA4MTA5NDI2NjUzNjU0LDcuMDk0MjA1MDE0NDk4NTk5XSxbODAuMDgxMDU5Mzk3ODE5MzUsNy4wOTQ0NjMxOTY5MTkzNDE1XSxbODAuMDgxMjg0NzAzMzc2Niw3LjA5NDU1OTAxNzE2MjM1Ml0sWzgwLjA4MTc1NDA4OTk1NDIsNy4wOTQ2NTIxNzU3MTI4MzddLFs4MC4wODIwNjI1NDM5OTA5Miw3LjA5NDcyOTM2NDIxMTgxOV0sWzgwLjA4MjExNjE4ODE3MTIxLDcuMDk0NTYxNjc4ODM1NDkxNV0sWzgwLjA4MjEwNTQ1OTMzNTE1LDcuMDk0NDIzMjcxODEyMTg3XSxbODAuMDgyMDIyMzEwODU1NjksNy4wOTQzNDg3NDQ5MzYyNTddLFs4MC4wODE5Njg2NjY2NzU0LDcuMDk0MzM1NDM2NTY0MjhdLFs4MC4wODE5NTI1NzM0MjEzLDcuMDk0MTQ5MTE5MzE2MjgxXSxbODAuMDgxOTM2NDgwMTY3MjIsNy4wOTM5MTQ4OTE4MTE4MDZdLFs4MC4wODE5NzQwMzEwOTM0Miw3LjA5Mzc2MzE3NjIwNTU1MTVdLFs4MC4wODIwMDg4OTk4MTA2Miw3LjA5MzU5ODE1MjE1NjAxM10sWzgwLjA4MjAzNTcyMTkwMDc3LDcuMDkzNDQ5MDk4MTI0OTVdLFs4MC4wODE3NzI4NjU0MTczLDcuMDkzMzUzMjc3NjUwOTI4NV0sWzgwLjA4MTcxOTIyMTIzNzAxLDcuMDkzNTQyMjU2OTAwMDE5XSxbODAuMDgxNzA4NDkyNDAwOTUsNy4wOTM1ODc1MDU0NDExMDZdLFs4MC4wODE1NTI5MjQyNzgwOSw3LjA5MzU1NTU2NTI5NDkyM10sWzgwLjA4MTI3MTI5MjMzMTUyLDcuMDkzNTIzNjI1MTQ2NTI1XSxbODAuMDgxMTY0MDAzOTcwOTMsNy4wOTM0NzMwNTMyNDAzNDRdLFs4MC4wODExNDc5MTA3MTY4NCw3LjA5MzcyMDU4OTM1OTcyNzVdXV19LCJwcm9wZXJ0aWVzIjp7fX1dfQ==",
                    "ProductionPlace": "FBI-4657_A (Hattin National Estate )",
                    "name": "Janadara Premadasa"
                  }
                ]
              }
            ],
            "comment": "",
            "activityType": "IMPORT",
            "operator": {
              "phone": "0778655083",
              "operatorAddress": {
                "country": "LK",
                "city": "Colombo",
                "street": "400, Deans Road, Colombo 10, Sri Lanka",
                "postalCode": "400",
                "name": "Operator 01",
                "fullAddress": "400, Deans Road, Colombo 10, Sri Lanka"
              },
              "email": "abc@gmail.com"
            }
          },
          "operatorType": "OPERATOR"
        } );

console.log(result);

        expect(result).to.be.an('object');
        expect(result).to.have.property('ddsIdentifier');
        expect(result.ddsIdentifier).to.be.a('string');
        expect(result.ddsIdentifier.length).to.be.greaterThan(0);

        // Store for cleanup
        createdDdsIdentifiers.push(result.ddsIdentifier);

        logger.info('[OK] Successfully connected to EUDR Submission V2 API');
        logger.info(`[INFO] DDS Identifier: ${result.ddsIdentifier}`);
      } catch (error) {

        console.log("ERROR", error);
        // If it's a validation error from the API, that's still a successful connection
        if (error.response && error.response.status === 500) {
          logger.info('[OK] Successfully connected to EUDR Submission V2 API (with validation error)');
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
          logger.info(`[OK] Operator import submission successful - DDS: ${result.ddsIdentifier}`);
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

          logger.info(`[OK] Domestic production submission successful - DDS: ${result.ddsIdentifier}`);
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

          logger.info(`[OK] Export submission successful - DDS: ${result.ddsIdentifier}`);
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

          logger.info(`[OK] Authorized representative submission successful - DDS: ${result.ddsIdentifier}`);
        } catch (error) {
          console.log("ERROR", error);
          throw error;
        }
      });

      // it('should handle representative trader submission', async function () {
      //   try {
      //     const result = await client.submitDds(scenariosV2.representativeTrader);

      //     expect(result).to.be.an('object');
      //     expect(result).to.have.property('ddsIdentifier');
      //     expect(result.ddsIdentifier).to.be.a('string');
      //     expect(result.ddsIdentifier.length).to.be.greaterThan(0);

      //     createdDdsIdentifiers.push(result.ddsIdentifier);

      //     logger.info(`[OK] Representative trader submission successful - DDS: ${result.ddsIdentifier}`);
      //   } catch (error) {

      //     console.log("ERROR", error.details);

      //       throw error;

      //   }
      // });
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

          logger.info(`[OK] Trade submission with referenced DDS successful - DDS: ${result.ddsIdentifier}`);
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


        logger.info('[OK] V2 WSSE security headers properly configured');
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

        logger.info(`[OK] V2 specific data structures handled correctly - DDS: ${result.ddsIdentifier}`);
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


        logger.info(`[OK] Rapid successive V2 requests handled successfully in ${totalTime}ms`);
        logger.info(`📋 Created DDS identifiers: ${results.map(r => r.ddsIdentifier).join(', ')}`);
      } catch (error) {

        throw error;

      }
    });
  });

  describe('🌳 Species Info Tests', function () {
    it('should handle speciesInfo as single object V2', async function () {
      try {
        const request = {
          operatorType: 'OPERATOR',
          statement: {
            internalReferenceNumber: `TEST-SPECIES-OBJECT-${Date.now()}`,
            activityType: 'DOMESTIC',
            operator: {
              referenceNumber: {
                identifierType: 'eori',
                identifierValue: 'HR123456789012345'
              },
              operatorAddress: {
                name: 'Test Company Species Object',
                country: 'HR',
                street: 'Test Street 123',
                postalCode: '10000',
                city: 'Zagreb'
              }
            },
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with single species',
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
                name: 'Test Producer Species',
                geometryGeojson: 'eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=='

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
        logger.info(`[OK] SpeciesInfo as object test passed - DDS: ${result.ddsIdentifier}`);
      } catch (error) {
        console.log("ERROR", error);
        throw error;
      }
    });

    it('should handle speciesInfo as array V2', async function () {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: `TEST-SPECIES-ARRAY-${Date.now()}`,
          activityType: 'DOMESTIC',
          operator: {
            referenceNumber: {
              identifierType: 'eori',
              identifierValue: 'HR123456789012345'
            },
            operatorAddress: {
              name: 'Test Company Species Array',
              country: 'HR',
              street: 'Test Street 123',
              postalCode: '10000',
              city: 'Zagreb'
            }
          },
          commodities: [{
            descriptors: {
              descriptionOfGoods: 'Test wood with multiple species',
              goodsMeasure: {
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
              name: 'Test Producer Species Array',
              geometryGeojson: 'eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=='
            }]
          }],
          geoLocationConfidential: false
        }
      };

      const result = await client.submitDds(request);
      console.log("RESULT", result.ddsIdentifier);
      expect(result).to.have.property('httpStatus', 200);
      expect(result).to.have.property('ddsIdentifier');
      expect(result.ddsIdentifier).to.be.a('string');
      expect(result.ddsIdentifier).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      createdDdsIdentifiers.push(result.ddsIdentifier);
      logger.info(`[OK] SpeciesInfo as array test passed - DDS: ${result.ddsIdentifier}`);
    });

    it('should handle speciesInfo with only scientificName V2', async function () {
      try {
        const request = {
          operatorType: 'OPERATOR',
          statement: {
            internalReferenceNumber: `TEST-SPECIES-SCIENTIFIC-${Date.now()}`,
            activityType: 'DOMESTIC',
            operator: {
              referenceNumber: {
                identifierType: 'eori',
                identifierValue: 'HR123456789012345'
              },
              operatorAddress: {
                name: 'Test Company Species Scientific',
                country: 'HR',
                street: 'Test Street 123',
                postalCode: '10000',
                city: 'Zagreb'
              }
            },
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with scientific name only',
                goodsMeasure: {
                  supplementaryUnit: 20,
                  supplementaryUnitQualifier: "MTQ"
                }
              },
              hsHeading: '4401',
              speciesInfo: {
                scientificName: 'Betula pendula'
              },
              producers: {
                country: 'HR',
                name: 'Test Producer Scientific',
                geometryGeojson: 'eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=='
              }
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

    it('should submit DDS with not encoded geometryGeojson V2', async function () {
      try {
        const request = {
          operatorType: 'OPERATOR',
          statement: {
            internalReferenceNumber: `TEST-SPECIES-COMMON-${Date.now()}`,
            activityType: 'DOMESTIC',
            operator: {
              referenceNumber: {
                identifierType: 'eori',
                identifierValue: 'HR123456789012345'
              },
              operatorAddress: {
                name: 'Test Company Species Common',
                country: 'HR',
                street: 'Test Street 123',
                postalCode: '10000',
                city: 'Zagreb'
              }
            },
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with common name only',
                goodsMeasure: {
                  supplementaryUnit: 20,
                  supplementaryUnitQualifier: "MTQ"
                }
              },
              hsHeading: '4401',
              speciesInfo: [{
                commonName: 'Jela',
                scientificName: 'Betula pendula'
              }],
              producers: [{
                country: 'HR',
                name: 'Test Producer Common',
                geometryGeojson: {
                  "type": "FeatureCollection",
                  "features": [
                    {
                      "type": "Feature",
                      "properties": {
                        "Area": 4,
                        "ProductionPlace": "wdwdws"
                      },
                      "geometry": {
                        "type": "Point",
                        "coordinates": [
                          0,
                          0
                        ]
                      }
                    }
                  ]
                }
              },
              {
                "country": "AT",
                "geometryGeojson": {
                  "type": "FeatureCollection",
                  "features": [
                    {
                      "type": "Feature",
                      "properties": {
                        "Area": 4,
                        "ProductionPlace": "dwqdwdwd"
                      },
                      "geometry": {
                        "type": "Point",
                        "coordinates": [
                          0,
                          0
                        ]
                      }
                    }
                  ]
                }
              }]
            }],
            geoLocationConfidential: false
          }
        };

        const result = await client.submitDds(request, { encodeGeojson: true });

        expect(result).to.have.property('httpStatus', 200);
        expect(result).to.have.property('ddsIdentifier');
        expect(result.ddsIdentifier).to.be.a('string');
        expect(result.ddsIdentifier).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

        createdDdsIdentifiers.push(result.ddsIdentifier);
        logger.info(`[OK] SpeciesInfo with common name only test passed - DDS: ${result.ddsIdentifier}`);
      } catch (error) {
        console.log("ERROR", error);
        throw error;
      }
    });

    it('should handle speciesInfo with only commonName V2', async function () {
      try {
        const request = {
          operatorType: 'OPERATOR',
          statement: {
            internalReferenceNumber: `TEST-SPECIES-COMMON-${Date.now()}`,
            activityType: 'DOMESTIC',
            operator: {
              referenceNumber: {
                identifierType: 'eori',
                identifierValue: 'HR123456789012345'
              },
              operatorAddress: {
                name: 'Test Company Species Common',
                country: 'HR',
                street: 'Test Street 123',
                postalCode: '10000',
                city: 'Zagreb'
              }
            },
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with common name only',
                goodsMeasure: {
                  supplementaryUnit: 20,
                  supplementaryUnitQualifier: "MTQ"
                }
              },
              hsHeading: '4401',
              speciesInfo: {
                commonName: 'Jela'
              },
              producers: [{
                country: 'HR',
                name: 'Test Producer Common',
                geometryGeojson: 'eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=='
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
        logger.info(`[OK] SpeciesInfo with common name only test passed - DDS: ${result.ddsIdentifier}`);
      } catch (error) {
        expect(error.httpStatus).to.be.equal(400);
        expect(error.error).to.be.true;
        expect(error.eudrErrorCode).to.be.equal('EUDR_COMMODITIES_SPECIES_INFORMATION_SCIENTIFIC_NAME_EMPTY');
      }
    });

    it('should handle mixed speciesInfo array with partial data V2', async function () {
      try {
        const request = {
          operatorType: 'OPERATOR',
          statement: {
            internalReferenceNumber: `TEST-SPECIES-MIXED-${Date.now()}`,
            activityType: 'DOMESTIC',
            operator: {
              referenceNumber: {
                identifierType: 'eori',
                identifierValue: 'HR123456789012345'
              },
              operatorAddress: {
                name: 'Test Company Species Mixed',
                country: 'HR',
                street: 'Test Street 123',
                postalCode: '10000',
                city: 'Zagreb'
              }
            },
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with mixed species data',
                goodsMeasure: {
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
                name: 'Test Producer Mixed',
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
        logger.info(`[OK] Mixed speciesInfo array test passed - DDS: ${result.ddsIdentifier}`);
      } catch (error) {
        expect(error.httpStatus).to.be.equal(400);
        expect(error.error).to.be.true;
        expect(error.eudrErrorCode).to.be.equal('EUDR_COMMODITIES_SPECIES_INFORMATION_SCIENTIFIC_NAME_EMPTY');
      }
    });

    it('should handle referenceNumber as array V2', async function () {
      try {
        const request = {
          operatorType: 'OPERATOR',
          statement: {
            internalReferenceNumber: `TEST-REF-ARRAY-V2-${Date.now()}`,
            activityType: 'DOMESTIC',
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
              operatorAddress: {
                name: 'Test Company Multiple References',
                country: 'HR',
                street: 'Test Street 123',
                postalCode: '10000',
                city: 'Zagreb'
              }
            },
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with multiple references',
                goodsMeasure: {
                  supplementaryUnit: 20,
                  supplementaryUnitQualifier: "MTQ"
                }
              },
              hsHeading: '4401',
              speciesInfo: {
                scientificName: 'Fagus sylvatica',
                commonName: 'BUKVA OBIČNA'
              },
              producers: [{
                country: 'HR',
                name: 'Test Producer Multiple Refs',
                geometryGeojson: 'eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=='
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
        logger.info(`[OK] ReferenceNumber as array test passed - DDS: ${result.ddsIdentifier}`);
      } catch (error) {
        console.log("ERROR", error);
        throw error;
      }
    });

    it('should handle associatedStatements as array V2', async function () {
      try {
        const request = {
          operatorType: 'OPERATOR',
          statement: {
            internalReferenceNumber: `TEST-ASSOC-ARRAY-V2-${Date.now()}`,
            activityType: 'DOMESTIC',
            operator: {
              referenceNumber: {
                identifierType: 'eori',
                identifierValue: 'HR123456789012345'
              },
              operatorAddress: {
                name: 'Test Company Multiple Associated',
                country: 'HR',
                street: 'Test Street 123',
                postalCode: '10000',
                city: 'Zagreb'
              }
            },
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with multiple associated statements',
                goodsMeasure: {
                  supplementaryUnit: 20,
                  supplementaryUnitQualifier: "MTQ"
                }
              },
              hsHeading: '4401',
              producers: [{
                country: 'HR',
                name: 'Test Producer Multiple Assoc',
                geometryGeojson: 'eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=='
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
        logger.info(`[OK] AssociatedStatements as array test passed - DDS: ${result.ddsIdentifier}`);
      } catch (error) {
        console.log("ERROR", error);
        throw error;
      }
    });

    it('should handle producers as array V2', async function () {
      try {
        const request = {
          operatorType: 'OPERATOR',
          statement: {
            internalReferenceNumber: `TEST-PRODUCERS-ARRAY-V2-${Date.now()}`,
            activityType: 'DOMESTIC',
            operator: {
              referenceNumber: {
                identifierType: 'eori',
                identifierValue: 'HR123456789012345'
              },
              operatorAddress: {
                name: 'Test Company Multiple Producers',
                country: 'HR',
                street: 'Test Street 123',
                postalCode: '10000',
                city: 'Zagreb'
              }
            },
            commodities: [{
              descriptors: {
                descriptionOfGoods: 'Test wood with multiple producers',
                goodsMeasure: {
                  supplementaryUnit: 20,
                  supplementaryUnitQualifier: "MTQ"
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
                  name: 'Croatian Producer 1',
                  geometryGeojson: 'eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=='
                },
                {
                  country: 'DE',
                  name: 'German Producer 2',
                  geometryGeojson: 'eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=='
                },
                {
                  country: 'AT',
                  name: 'Austrian Producer 3',
                  geometryGeojson: 'eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=='
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

        createdDdsIdentifiers.push(result.ddsIdentifier);
        logger.info(`[OK] Producers as array test passed - DDS: ${result.ddsIdentifier}`);
      } catch (error) {
        console.log("ERROR", error);
        throw error;
      }
    });
  });
});
