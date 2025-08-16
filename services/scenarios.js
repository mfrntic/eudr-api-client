/**
 * EUDR Submission Service Test Scenarios
 * 
 * This file contains example request objects for testing different
 * EUDR submission scenarios including trade, import, domestic, and
 * authorized representative submissions.
 * 
 * Based on real working data from EUDR API tests.
 */

const scenarios = {
  /**
   * Trade submission with multiple associated statements
   * This example shows how to reference multiple existing DDS statements
   * Note: EUDR schema supports up to 2000 associated statements
   */
  trade: {
    operatorType: "TRADER",
    statement: {
      internalReferenceNumber: "DLE20/358",
      activityType: "TRADE",
      countryOfActivity: "HR",
      borderCrossCountry: "HR",
      comment: "Trade submission with multiple associated statements",
      commodities: [{
        descriptors: {
          descriptionOfGoods: "Traded wood products from main warehouse",
          goodsMeasure: {
            netWeight: 20,
            volume: 15
          }
        },
        hsHeading: "4401",
        speciesInfo: {
          scientificName: "Fagus silvatica",
          commonName: "BUKVA OBIČNA"
        }
      }],
      operator: {
        nameAndAddress: {
          name: "GreenWood Solutions Ltd.",
          country: "HR",
          address: "Trg Republike 15, 10000 Zagreb"
        },
        email: "info@greenwood-solutions.hr",
        phone: "+385 (001) 480-4111"
      },
      geoLocationConfidential: false,
      associatedStatements: [
        {
          referenceNumber: "25NLSN6LX69730",
          verificationNumber: "K7R8LA90"
        },
        {
          referenceNumber: "25NLWPAZWQ8865",
          verificationNumber: "GLE9SMMM"
        }
      ]
    }
  },

  /**
   * Import submission with geolocations
   * This example shows how to submit an import with producer geolocations
   */
  import: {
    operatorType: "OPERATOR",
    statement: {
      internalReferenceNumber: "DLE20/359",
      activityType: "IMPORT",
      countryOfActivity: "HR",
      borderCrossCountry: "HR",
      comment: "Import with geolocations",
      commodities: [{
        descriptors: {
          descriptionOfGoods: "Imported wood products from France",
          goodsMeasure: {
            netWeight: 30,
            volume: 15
          }
        },
        hsHeading: "4401",
        speciesInfo: {
          scientificName: "Fagus silvatica",
          commonName: "BUKVA OBIČNA"
        },
        producers: [{
          country: "FR",
          name: "French Wood Producer",
          geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
        }]
      }],
      operator: {
        nameAndAddress: {
          name: "GreenWood Solutions Ltd.",
          country: "HR",
          address: "Trg Republike 15, 10000 Zagreb"
        },
        email: "info@greenwood-solutions.hr",
        phone: "+385 (001) 480-4111"
      },
      geoLocationConfidential: false
    }
  },

  /**
   * Domestic submission with geolocations
   * This example shows how to submit a domestic production statement
   * Based on real working data from EUDR API tests
   */
  domestic: {
    operatorType: "OPERATOR",
    statement: {
      internalReferenceNumber: "DLE20/357",
      activityType: "DOMESTIC",
      countryOfActivity: "HR",
      borderCrossCountry: "HR",
      comment: "",
      commodities: [
        {
          descriptors: {
            descriptionOfGoods: "Otprema prostornog drva s glavnog stovarišta (popratnica DLE20/357) - BUKVA OBIČNA",
            goodsMeasure: {
              volume: 20,
              netWeight: 16
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
              geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
            }
          ]
        },
        {
          descriptors: {
            descriptionOfGoods: "Otprema prostornog drva s glavnog stovarišta (popratnica DLE20/357) - BUKVA OSTALE",
            goodsMeasure: {
              volume: 15,
              netWeight: 12
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
              geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1sxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXSxbMTQuOTY5ODU4Mjc1LDQ1LjE4ODM0NDEwNl0sWzE0Ljk2ODIyMzYzMSw0NS4xODY4NjQzMTRdLFsxNC45NjI0NDc0NjQsNDUuMTg1Njg0NTJdLFsxNC45NjM2MzE4MzksNDUuMTkxMTExMzkxXSxbMTQuOTY2MTQ1ODEzLDQ1LjE5MDg2MjIzNF0sWzE0Ljk2NzU4NDQwMyw0NS4xOTIyODAxMDZdLFsxNC45NzA0NTk4MzIsNDUuMTkyMzk4MjUyXV1dfSwicHJvcGVydGllcyI6eyJnamlkIjoiNTgwIiwiZ29kaW5hIjoyMDE2LCJwb3Zyc2luYSI6MzEuMjQsIm96bmFrYSI6IjQyIGEifX1dfQ=="
            }
          ]
        }
      ],
      operator: {
        nameAndAddress: {
          name: "GreenWood Solutions Ltd.",
          country: "HR",
          address: "Trg Republike 15, 10000 Zagreb"
        },
        email: "info@greenwood-solutions.hr",
        phone: "+385 (001) 480-4111"
      },
      geoLocationConfidential: false
    }
  },

  /**
   * Authorized representative submission
   * This example shows how to submit on behalf of another operator
   */
  representative: {
    operatorType: "OPERATOR",
    statement: {
      internalReferenceNumber: "DLE20/360",
      activityType: "IMPORT",
      operator: {
        referenceNumber: {
          identifierType: "eori",
          identifierValue: "HR123456789"
        },
        nameAndAddress: {
          name: "Croatian Import Company",
          country: "HR",
          address: "Ulica Kneza Branimira 2, 10000 Zagreb"
        },
        email: "contact@croatianimport.hr",
        phone: "+385 (001) 480-4111"
      },
      countryOfActivity: "HR",
      borderCrossCountry: "HR",
      comment: "Import by authorized representative",
      commodities: [{
        descriptors: {
          descriptionOfGoods: "Wood products imported by representative",
          goodsMeasure: {
            netWeight: 25,
            volume: 12
          }
        },
        hsHeading: "4401",
        speciesInfo: {
          scientificName: "Fagus silvatica",
          commonName: "BUKVA OBIČNA"
        },
        producers: [{
          country: "GH",
          name: "Ghana Wood Board",
          geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1stMS4xODY0LDYuNTI0NF0sWy0xLjE4NzQsNi41MjQ0XSxbLTEuMTg3NCw2LjUzNDRdLFstMS4xODY0LDYuNTM0NF0sWy0xLjE4NjQsNi41MjQ0XV1dfSwicHJvcGVydGllcyI6eyJuYW1lIjoiR2hhbmEgV29vZCBCb2FyZCJ9fV19"
        }]
      }],
      geoLocationConfidential: false
    }
  },

  /**
   * Simple trade submission with single associated statement
   * This example shows the basic structure for a trade submission
   */
  simple_trade: {
    operatorType: "TRADER",
    statement: {
      internalReferenceNumber: "DLE20/361",
      activityType: "TRADE",
      countryOfActivity: "HR",
      borderCrossCountry: "HR",
      comment: "Simple trade submission",
      commodities: [{
        descriptors: {
          descriptionOfGoods: "Traded wood products",
          goodsMeasure: {
            netWeight: 10,
            volume: 8
          }
        },
        hsHeading: "4401",
        speciesInfo: {
          scientificName: "Fagus silvatica",
          commonName: "BUKVA OBIČNA"
        }
      }],
      operator: {
        nameAndAddress: {
          name: "GreenWood Solutions Ltd.",
          country: "HR",
          address: "Trg Republike 15, 10000 Zagreb"
        },
        email: "info@greenwood-solutions.hr",
        phone: "+385 (001) 480-4111"
      },
      geoLocationConfidential: false,
      associatedStatements: [
        {
          referenceNumber: "25NLSN6LX69730",
          verificationNumber: "K7R8LA90"
        }
      ]
    }
  },

  /**
   * Minimal test scenario that exactly matches the official EUDR example
   * This is for debugging the associated statements issue
   */
  minimal_test: {
    operatorType: "OPERATOR",
    statement: {
      internalReferenceNumber: "DLE20/362",
      activityType: "DOMESTIC",
      countryOfActivity: "HR",
      borderCrossCountry: "HR",
      comment: "Minimal test scenario",
      commodities: [{
        descriptors: {
          descriptionOfGoods: "Test wood products",
          goodsMeasure: {
            netWeight: 5,
            volume: 4
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
            geometryGeojson: "eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9seWdvbiIsImNvb3JkaW5hdGVzIjpbW1stMS4xODY0LDYuNTI0NF0sWy0xLjE4NzQsNi41MjQ0XSxbLTEuMTg3NCw2LjUzNDRdLFstMS4xODY0LDYuNTM0NF0sWy0xLjE4NjQsNi41MjQ0XV1dfSwicHJvcGVydGllcyI6eyJuYW1lIjoiR2hhbmEgV29vZCBCb2FyZCJ9fV19"
          }
        ]
      }],
      operator: {
        nameAndAddress: {
          name: "GreenWood Solutions Ltd.",
          country: "HR",
          address: "Trg Republike 15, 10000 Zagreb"
        },
        email: "info@greenwood-solutions.hr",
        phone: "+385 (001) 480-4111"
      },
      geoLocationConfidential: false
    }
  }
};

module.exports = scenarios; 