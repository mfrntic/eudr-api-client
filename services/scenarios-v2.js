/**
 * EUDR Test Scenarios for V2 API
 * 
 * This module contains test scenarios for the EUDR Submission Service V2
 * based on the official examples from EUDR documentation.
 */

// Base64 encoded GeoJSON for testing - using the working GeoJSON provided by user
const testGeojson = 'eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=='

/**
 * Operator scenario - IMPORT activity with geolocation
 * Based on submitDdsRequestV2-Operator.xml
 */
const operatorScenario = {
  operatorType: 'OPERATOR',
  statement: {
    internalReferenceNumber: 'BE102',
    activityType: 'IMPORT',
    countryOfActivity: 'BE',
    borderCrossCountry: 'BE',
    comment: 'Import activity test',
    commodities: [
      {
        descriptors: {
          descriptionOfGoods: 'Import of wood products',
          goodsMeasure: {
            netWeight: 25
          }
        },
        hsHeading: '4401',
        speciesInfo: {
          scientificName: 'Fagus sylvatica',
          commonName: 'European Beech'
        },
        producers: [
          {
            country: 'FR',
            name: 'Producer 1',
            geometryGeojson: testGeojson
          }
        ]
      }
    ],
    operator: { // Added from scenarios.js structure
      operatorAddress: {
        name: 'GreenWood Solutions Ltd.',
        country: 'BE',
        street: 'Import Street 1',
        postalCode: '1000',
        city: 'Brussels',
        fullAddress: 'Import Street 1, 1000 Brussels'
      },
      email: 'info@greenwood-solutions.be',
      phone: '+32 (001) 123-4567'
    },
    geoLocationConfidential: false
  }
};

/**
 * Authorized Representative scenario - IMPORT activity with operator details
 * Based on submitDdsRequestV2-AuthorizedRepresentative.xml
 */
const representativeScenario = {
  operatorType: 'REPRESENTATIVE_OPERATOR',
  statement: {
    internalReferenceNumber: 'HR00005',
    activityType: 'IMPORT',
    operator: {
      referenceNumber: {
        identifierType: 'eori',
        identifierValue: 'HR09876356'
      },
      operatorAddress: {
        name: "GreenWood Solutions Ltd.",
        country: "HR",
        street: "Trg Republike 15",
        postalCode: "10000",
        city: "Zagreb",
        fullAddress: "Trg Republike 15, 10000 Zagreb"
      },
      email: "info@greenwood-solutions.hr",
      phone: "+385 (001) 480-4111"
    },
    countryOfActivity: 'HR',
    borderCrossCountry: 'HR',
    comment: 'Some comments for the CA',
    commodities: [
      {
        descriptors: {
          descriptionOfGoods: 'Import of wood products',
          goodsMeasure: {
            netWeight: 40 
          }
        },
        hsHeading: '4401',
        speciesInfo: {
          scientificName: 'Fagus sylvatica',
          commonName: 'European Beech'
        },
        producers: [
          {
            country: 'FR',
            name: 'Producer 1',
            geometryGeojson: testGeojson
          }
        ]
      }
    ],
    geoLocationConfidential: false
  }
};

/**
 * Domestic production scenario 
 * This is the working example that 100% works for V2 submission domestic
 */
const domesticSubmissionV2 = {
  operatorType: "OPERATOR",
  statement: {
    internalReferenceNumber: "DLE20/357",
    activityType: "DOMESTIC",
    operator: {
      operatorAddress: {
        name: "GreenWood Solutions Ltd.",
        country: "HR",
        street: "Trg Republike 15",
        postalCode: "10000",
        city: "Zagreb",
        fullAddress: "Trg Republike 15, 10000 Zagreb"
      },
      email: "info@greenwood-solutions.hr",
      phone: "+385 (001) 480-4111"
    },
    countryOfActivity: "HR",
    borderCrossCountry: "HR",
    comment: "",
    commodities: [
      {
        descriptors: {
          descriptionOfGoods: "Otprema prostornog drva s glavnog stovarišta (popratnica DLE20/357) - BUKVA OBIČNA",
          goodsMeasure: {
            supplementaryUnit: 20,
            supplementaryUnitQualifier: "MTQ" 
          }
        },
        hsHeading: "4401",
        speciesInfo: {
          scientificName: "Fagus silvatica",
          commonName: "BUKVA OBIČNA"
        },
        producers: [
          {
            country: "HR",
            name: "GreenWood Solutions Ltd.",
            geometryGeojson: testGeojson
          }
        ]
      },
      {
        descriptors: {
          descriptionOfGoods: "Otprema prostornog drva s glavnog stovarišta (popratnica DLE20/357) - BUKVA OSTALE",
          goodsMeasure: {
            supplementaryUnit: 20,
            supplementaryUnitQualifier: "MTQ" 
          }
        },
        hsHeading: "4401",
        speciesInfo: {
          scientificName: "Fagus sp.",
          commonName: "BUKVA OSTALE"
        },
        producers: [
          {
            country: "HR",
            name: "GreenWood Solutions Ltd.",
            geometryGeojson: testGeojson
          }
        ]
      }
    ],
    geoLocationConfidential: false
  }
};

/**
 * Trade scenario without geolocation but with referenced DDS
 */
const tradeScenario = {
  operatorType: 'TRADER',
  statement: {
    internalReferenceNumber: 'HRTR001',
    activityType: 'TRADE',
    countryOfActivity: 'HR',
    borderCrossCountry: 'HR', // Added from scenarios.js
    comment: 'Trade operation test',
    commodities: [
      {
        descriptors: {
          descriptionOfGoods: 'Traded wood products',
          goodsMeasure: {
            netWeight: 50,
            percentageEstimationOrDeviation: 5 // V2 required when using netWeight
          }
        },
        hsHeading: '4401',
        speciesInfo: {
          scientificName: 'Fagus sylvatica',
          commonName: 'European Beech'
        },
        producers: [
          {
            country: 'HR',
            name: 'Croatian Trading Company',
            geometryGeojson: testGeojson
          }
        ]
      }
    ],
    operator: {
      operatorAddress: {
        name: 'GreenWood Solutions Ltd.',
        country: 'HR',
        street: 'Trg Republike 15',
        postalCode: '10000',
        city: 'Zagreb',
        fullAddress: 'Trg Republike 15, 10000 Zagreb'
      },
      email: 'info@greenwood-solutions.hr',
      phone: '+385 (001) 480-4111'
    },
    geoLocationConfidential: false,
    associatedStatements: [ // Added from scenarios.js
      {
        referenceNumber: '25NLSN6LX69730',
        verificationNumber: 'K7R8LA90'
      },
      {
        referenceNumber: '25NLWPAZWQ8865',
        verificationNumber: 'GLE9SMMM'
      }
    ]
  }
};

/**
 * Export scenario
 */
const exportScenario = {
  operatorType: 'OPERATOR',
  statement: {
    internalReferenceNumber: 'BE102',
    activityType: 'EXPORT',
    countryOfActivity: 'BE',
    borderCrossCountry: 'BE',
    comment: 'Import activity test',
    commodities: [
      {
        descriptors: {
          descriptionOfGoods: 'Import of wood products',
          goodsMeasure: {
            netWeight: 25
          }
        },
        hsHeading: '4401',
        speciesInfo: {
          scientificName: 'Fagus sylvatica',
          commonName: 'European Beech'
        },
        producers: [
          {
            country: 'FR',
            name: 'Producer 1',
            geometryGeojson: testGeojson
          }
        ]
      }
    ],
    operator: { // Added from scenarios.js structure
      operatorAddress: {
        name: 'GreenWood Solutions Ltd.',
        country: 'BE',
        street: 'Import Street 1',
        postalCode: '1000',
        city: 'Brussels',
        fullAddress: 'Import Street 1, 1000 Brussels'
      },
      email: 'info@greenwood-solutions.be',
      phone: '+32 (001) 123-4567'
    },
    geoLocationConfidential: false
  }
};

/**
 * Representative trader scenario
 */
const representativeTraderScenario = {
  operatorType: 'REPRESENTATIVE_TRADER',
  statement: {
    internalReferenceNumber: 'HRREP001',
    activityType: 'TRADE',
    operator: {
      referenceNumber: {
        identifierType: 'vat',
        identifierValue: 'HR12345678901'
      },
      operatorAddress: {
        name: 'GreenWood Solutions Ltd.',
        country: 'BE',
        street: 'Import Street 1',
        postalCode: '1000',
        city: 'Brussels',
        fullAddress: 'Import Street 1, 1000 Brussels'
      },
      email: 'info@greenwood-solutions.be',
      phone: '+32 (001) 123-4567'
    },
    countryOfActivity: 'HR',
    comment: 'Trade operation on behalf of client',
    commodities: [
      {
        descriptors: {
          descriptionOfGoods: 'Traded timber products',
          goodsMeasure: {
            netWeight: 75,
            percentageEstimationOrDeviation: 5 // V2 required when using netWeight
          }
        },
        hsHeading: '4401',
        speciesInfo: {
          scientificName: 'Fagus sylvatica',
          commonName: 'European Beech'
        },
        producers: [
          {
            country: 'HR',
            name: 'Croatian Trading Company',
            geometryGeojson: testGeojson
          }
        ]
      }
    ],
    geoLocationConfidential: false
  }
};

// Export all scenarios in same format as scenarios.js
const scenarios = {
  operator: operatorScenario,
  representative: representativeScenario,
  domestic: domesticSubmissionV2,
  trade: tradeScenario,
  export: exportScenario,
  representativeTrader: representativeTraderScenario,
  
  // Aliases for convenience
  import: operatorScenario,
  auth_representative: representativeScenario,
  authorized_representative: representativeScenario,
  rep_trader: representativeTraderScenario,
  
  // Additional scenarios to match scenarios.js structure
  simple_trade: tradeScenario, // Use same trade scenario as simple trade
  minimal_test: operatorScenario // Use operator scenario as minimal test
};

module.exports = scenarios;
