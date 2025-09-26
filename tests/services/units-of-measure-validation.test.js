/**
 * Tests for Units of Measure Validation functionality
 * Tests the validation logic for Import/Export and Domestic/Trade activities
 */

const { expect } = require('chai');
const EudrSubmissionClientV2 = require('../../services/submission-service-v2');

describe('Units of Measure Validation', function() {
  let client;

  before(async function() {
    // Load environment variables
    require('dotenv').config();

    // Validate required environment variables
    const requiredEnvVars = [
      'EUDR_TRACES_USERNAME',
      'EUDR_TRACES_PASSWORD'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Initialize V2 client with real credentials
    client = new EudrSubmissionClientV2({
      username: process.env.EUDR_TRACES_USERNAME,
      password: process.env.EUDR_TRACES_PASSWORD,
      webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test'
    });
  });

  describe('Import/Export Activities Validation', function() {
    it('should require Net Mass for Import activities', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-001',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4701',
            descriptors: {
              goodsMeasure: {
                // Missing netWeight - should fail
                supplementaryUnit: 50,
                supplementaryUnitQualifier: 'KSD'
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      try {
        await client.submitDds(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY');
        expect(error.message).to.include('Net Mass is mandatory for IMPORT or EXPORT activity');
      }
    });

    it('should require Net Mass for Export activities', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-002',
          activityType: 'EXPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4401',
            descriptors: {
              goodsMeasure: {
                // Missing netWeight - should fail
                volume: 10
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      try {
        await client.submitDds(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY');
        expect(error.message).to.include('Net Mass is mandatory for IMPORT or EXPORT activity');
      }
    });

    it('should require supplementary unit for HS codes in Appendix I', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-003',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4701', // HS code in Appendix I
            descriptors: {
              goodsMeasure: {
                netWeight: 1000
                // Missing supplementary unit - should fail
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      try {
        await client.submitDds(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING');
        expect(error.message).to.include('Supplementary unit is mandatory for HS code 4701');
      }
    });

    it('should forbid supplementary unit for HS codes not in Appendix I', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-004',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4401', // HS code NOT in Appendix I
            descriptors: {
              goodsMeasure: {
                netWeight: 1000,
                supplementaryUnit: 50, // Should not be allowed
                supplementaryUnitQualifier: 'MTQ'
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      try {
        await client.submitDds(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_NOT_ALLOWED');
        expect(error.message).to.include('Supplementary unit not allowed for HS code 4401');
      }
    });

    it('should forbid percentage estimation for Import activities', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-005',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4401',
            descriptors: {
              goodsMeasure: {
                netWeight: 1000,
                percentageEstimationOrDeviation: 15 // Should not be allowed
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      try {
        await client.submitDds(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_NOT_ALLOWED');
        expect(error.message).to.include('Percentage estimate or deviation not allowed for Import/Export activities');
      }
    });

    it('should validate supplementary unit qualifier compatibility', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-006',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4701', // Requires KSD
            descriptors: {
              goodsMeasure: {
                netWeight: 1000,
                supplementaryUnit: 50,
                supplementaryUnitQualifier: 'MTQ' // Wrong qualifier - should be KSD
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      try {
        await client.submitDds(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_QUALIFIER_NOT_COMPATIBLE');
        expect(error.message).to.include('Invalid supplementary unit type for HS code');
      }
    });

    it('should accept valid Import submission', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-007',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4701', // HS code in Appendix I
            descriptors: {
              goodsMeasure: {
                netWeight: 1000,
                supplementaryUnit: 50,
                supplementaryUnitQualifier: 'KSD' // Correct qualifier
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      // This should not throw an error during validation
      // (Note: Will still fail at API level due to test credentials, but validation should pass)
      try {
        await client.submitDds(request);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY');
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING');
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_NOT_ALLOWED');
      }
    });
  });

  describe('Domestic/Trade Activities Validation', function() {
    it('should validate percentage estimation range (0-25%)', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-008',
          activityType: 'DOMESTIC',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4401',
            descriptors: {
              goodsMeasure: {
                netWeight: 1000,
                percentageEstimationOrDeviation: 30 // Invalid - should be 0-25%
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      try {
        await client.submitDds(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_INVALID');
        expect(error.message).to.include('Percentage estimate or deviation must be between 0 and 25');
      }
    });

    it('should validate negative percentage estimation', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-009',
          activityType: 'DOMESTIC',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4401',
            descriptors: {
              goodsMeasure: {
                netWeight: 1000,
                percentageEstimationOrDeviation: -5 // Invalid - should be 0-25%
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      try {
        await client.submitDds(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_INVALID');
        expect(error.message).to.include('Percentage estimate or deviation must be between 0 and 25');
      }
    });

    it('should validate supplementary unit qualifier for Domestic activities', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-010',
          activityType: 'DOMESTIC',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4401',
            descriptors: {
              goodsMeasure: {
                netWeight: 1000,
                supplementaryUnit: 50,
                supplementaryUnitQualifier: 'INVALID' // Invalid qualifier
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      try {
        await client.submitDds(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_QUALIFIER_INVALID');
        expect(error.message).to.include('Invalid supplementary unit type');
      }
    });

    it('should accept valid Domestic submission with percentage', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-011',
          activityType: 'DOMESTIC',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4401',
            descriptors: {
              goodsMeasure: {
                netWeight: 1000,
                percentageEstimationOrDeviation: 15 // Valid percentage
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      // This should not throw an error during validation
      try {
        await client.submitDds(request);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_INVALID');
      }
    });

    it('should accept valid Trade submission with supplementary unit', async function() {
      const request = {
        operatorType: 'TRADER',
        statement: {
          internalReferenceNumber: 'TEST-012',
          activityType: 'TRADE',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4401',
            descriptors: {
              goodsMeasure: {
                netWeight: 1000,
                supplementaryUnit: 50,
                supplementaryUnitQualifier: 'MTQ' // Valid qualifier
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      // This should not throw an error during validation
      try {
        await client.submitDds(request);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_QUALIFIER_INVALID');
      }
    });
  });

  describe('HS Code Validation', function() {
    it('should validate 4-digit HS codes correctly', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-013',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4701', // 4-digit code in Appendix I
            descriptors: {
              goodsMeasure: {
                netWeight: 1000,
                supplementaryUnit: 50,
                supplementaryUnitQualifier: 'KSD' // Correct for 4701
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      // This should not throw an error during validation
      try {
        await client.submitDds(request);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_QUALIFIER_NOT_COMPATIBLE');
      }
    });

    it('should handle HS codes not in Appendix I', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-014',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '9999', // HS code not in Appendix I
            descriptors: {
              goodsMeasure: {
                netWeight: 1000
                // No supplementary unit needed
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      // This should not throw an error during validation
      try {
        await client.submitDds(request);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING');
      }
    });
  });

  describe('Units of Measure Validation - Valid Cases', function() {
    it('should pass units of measure validation for valid Import with HS code in Appendix I', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: `TEST-${Date.now()}-valid-import`,
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          comment: 'Units of measure validation test',
          commodities: [{
            hsHeading: '4407', // HS code NOT in Appendix I
            descriptors: {
              descriptionOfGoods: 'Test goods',
              goodsMeasure: {
                netWeight: 10
                // No supplementary unit needed for 4407
              }
            },
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
      };

      try{
      // This should pass both units of measure validation AND API call
      const result = await client.submitDds(request);
      
      // If we get here, both validation and API call succeeded
      expect(result).to.exist;
      expect(result).to.have.property('ddsIdentifier');
      expect(result.ddsIdentifier).to.be.a('string');
      expect(result.ddsIdentifier.length).to.be.greaterThan(0);
      console.log('✅ Valid Import submission succeeded with DDS Identifier:', result.ddsIdentifier);
      } catch (error) {
        // Should fail at API level, not validation level
        console.log('Error for Valid Import submission:', error);
        throw error;
      }
    });

    it('should pass units of measure validation for valid Domestic with percentage', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-VALID-002',
          activityType: 'DOMESTIC',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4401', // Any HS code
            descriptors: {
              descriptionOfGoods: 'Test domestic wood products',
              goodsMeasure: {
                netWeight: 500,
                percentageEstimationOrDeviation: 15 // Valid percentage
              }
            },
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
      };

      // This should pass both units of measure validation AND API call
      const result = await client.submitDds(request);
      
      // If we get here, both validation and API call succeeded
      expect(result).to.exist;
      expect(result).to.have.property('ddsIdentifier');
      expect(result.ddsIdentifier).to.be.a('string');
      expect(result.ddsIdentifier.length).to.be.greaterThan(0);
      console.log('✅ Valid Domestic submission succeeded with DDS Identifier:', result.ddsIdentifier);
    });

    it.skip('should pass units of measure validation for valid Trade with supplementary unit', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: `TEST-${Date.now()}-valid-trade`,
          activityType: 'TRADE',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          comment: 'Units of measure validation test',
          commodities: [{
            hsHeading: '4401', // Any HS code
            descriptors: {
              descriptionOfGoods: 'Test goods',
              goodsMeasure: { 
                supplementaryUnit: 25,
                supplementaryUnitQualifier: 'MTQ' // Valid supplementary unit
              }
            },
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
      };

      try {     
        const result = await client.submitDds(request);
        
        // If we get here, validation and API call succeeded
        expect(result).to.exist;
        expect(result).to.have.property('ddsIdentifier');
        expect(result.ddsIdentifier).to.be.a('string');
        expect(result.ddsIdentifier.length).to.be.greaterThan(0);
        console.log('✅ Valid Trade submission succeeded with DDS Identifier:', result.ddsIdentifier);
      } catch (error) {
        // Should fail at API level, not validation level
        console.log('Error for Valid Trade submission:', error);
        throw error;
      }


    });
  });

  describe('HS Codes Not in Appendix I', function() {
    it('should accept Import with HS code not in Appendix I (no supplementary unit)', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-018',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '9999', // HS code not in Appendix I
            descriptors: {
              goodsMeasure: {
                netWeight: 1000
                // No supplementary unit needed - should be valid
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      // This should pass validation and reach API level
      try {
        const result = await client.submitDds(request);
        // If we get here, validation passed successfully
        expect(result).to.exist;
        expect(result.status).to.equal(200);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING');
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY');
        // Should fail with some other API error (like invalid HS code, etc.)
        expect(error.eudrErrorCode).to.exist;
      }
    });

    it('should accept Export with HS code not in Appendix I (no supplementary unit)', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-019',
          activityType: 'EXPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '1234', // HS code not in Appendix I
            descriptors: {
              goodsMeasure: {
                netWeight: 500
                // No supplementary unit needed - should be valid
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      // This should pass validation and reach API level
      try {
        const result = await client.submitDds(request);
        // If we get here, validation passed successfully
        expect(result).to.exist;
        expect(result.status).to.equal(200);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING');
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY');
        // Should fail with some other API error (like invalid HS code, etc.)
        expect(error.eudrErrorCode).to.exist;
      }
    });

    it('should accept Domestic with HS code not in Appendix I (with percentage)', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-020',
          activityType: 'DOMESTIC',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '5555', // HS code not in Appendix I
            descriptors: {
              goodsMeasure: {
                netWeight: 300,
                percentageEstimationOrDeviation: 10 // Valid for Domestic
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      // This should pass validation and reach API level
      try {
        const result = await client.submitDds(request);
        // If we get here, validation passed successfully
        expect(result).to.exist;
        expect(result.status).to.equal(200);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_INVALID');
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING');
        // Should fail with some other API error (like invalid HS code, etc.)
        expect(error.eudrErrorCode).to.exist;
      }
    });

    it('should accept Trade with HS code not in Appendix I (with supplementary unit)', async function() {
      const request = {
        operatorType: 'TRADER',
        statement: {
          internalReferenceNumber: 'TEST-021',
          activityType: 'TRADE',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '7777', // HS code not in Appendix I
            descriptors: {
              goodsMeasure: {
                netWeight: 200,
                supplementaryUnit: 15,
                supplementaryUnitQualifier: 'MTQ' // Valid for Trade
              }
            }
          }],
          geoLocationConfidential: false
        }
      };

      // This should pass validation and reach API level
      try {
        const result = await client.submitDds(request);
        // If we get here, validation passed successfully
        expect(result).to.exist;
        expect(result.status).to.equal(200);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_NOT_ALLOWED');
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_QUALIFIER_INVALID');
        // Should fail with some other API error (like invalid HS code, etc.)
        expect(error.eudrErrorCode).to.exist;
      }
    });

    it('should handle mixed HS codes (some in Appendix I, some not)', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-022',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [
            {
              hsHeading: '4701', // HS code IN Appendix I - requires supplementary unit
              descriptors: {
                goodsMeasure: {
                  netWeight: 1000,
                  supplementaryUnit: 50,
                  supplementaryUnitQualifier: 'KSD'
                }
              }
            },
            {
              hsHeading: '8888', // HS code NOT in Appendix I - no supplementary unit needed
              descriptors: {
                goodsMeasure: {
                  netWeight: 500
                }
              }
            }
          ],
          operator: {
            name: 'Test Company',
            country: 'HR',
            street: 'Test Street 1',
            postalCode: '10000',
            city: 'Zagreb',
            fullAddress: 'Test Street 1, 10000 Zagreb',
            email: 'test@test.com',
            phone: '+385 1 234 5678'
          },
          geoLocationConfidential: false
        }
      };

      // This should pass validation and reach API level
      try {
        const result = await client.submitDds(request);
        // If we get here, validation passed successfully
        expect(result).to.exist;
        expect(result.status).to.equal(200);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING');
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_NOT_ALLOWED');
        // Should fail with some other API error (like invalid HS code, etc.)
        expect(error.eudrErrorCode).to.exist;
      }
    });
  });

  describe('Edge Cases', function() {
    it('should handle missing commodities array', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-015',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          // No commodities - should not throw validation error
          operator: {
            name: 'Test Company',
            country: 'HR',
            street: 'Test Street 1',
            postalCode: '10000',
            city: 'Zagreb',
            fullAddress: 'Test Street 1, 10000 Zagreb',
            email: 'test@test.com',
            phone: '+385 1 234 5678'
          },
          geoLocationConfidential: false
        }
      };

      // This should not throw an error during validation
      try {
        await client.submitDds(request);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY');
      }
    });

    it('should handle missing goodsMeasure', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-016',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [{
            hsHeading: '4401'
            // No descriptors.goodsMeasure - should not throw validation error
          }],
          geoLocationConfidential: false
        }
      };

      // This should not throw an error during validation
      try {
        await client.submitDds(request);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY');
      }
    });

    it('should handle multiple commodities', async function() {
      const request = {
        operatorType: 'OPERATOR',
        statement: {
          internalReferenceNumber: 'TEST-017',
          activityType: 'IMPORT',
          countryOfActivity: 'HR',
          borderCrossCountry: 'HR',
          commodities: [
            {
              hsHeading: '4701', // Requires supplementary unit
              descriptors: {
                goodsMeasure: {
                  netWeight: 1000,
                  supplementaryUnit: 50,
                  supplementaryUnitQualifier: 'KSD'
                }
              }
            },
            {
              hsHeading: '4401', // Does not require supplementary unit
              descriptors: {
                goodsMeasure: {
                  netWeight: 500
                }
              }
            }
          ],
          operator: {
            name: 'Test Company',
            country: 'HR',
            street: 'Test Street 1',
            postalCode: '10000',
            city: 'Zagreb',
            fullAddress: 'Test Street 1, 10000 Zagreb',
            email: 'test@test.com',
            phone: '+385 1 234 5678'
          },
          geoLocationConfidential: false
        }
      };

      // This should not throw an error during validation
      try {
        await client.submitDds(request);
      } catch (error) {
        // Should fail at API level, not validation level
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING');
        expect(error.eudrErrorCode).to.not.equal('EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_NOT_ALLOWED');
      }
    });
  });
});
