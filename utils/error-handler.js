 
/**
 * EUDR Error Handler
 * 
 * This module provides error handling functionality for the EUDR API,
 * specifically for Conformance Test 4 which focuses on error handling
 * when submitting a DDS (Due Diligence Statement).
 */

const { logger } = require('./logger');

// Error code constants
const EUDR_ERROR_CODES = {
  // Authentication and API schema errors
  EUDR_WEBSERVICE_USER_NOT_EUDR_OPERATOR: 'The user is not registered in the EUDR domain as operator.',
  EUDR_WEBSERVICE_USER_FROM_MANY_OPERATOR: 'The user belongs to more than one operator.',
  EUDR_WEBSERVICE_USER_ACTIVITY_NOT_ALLOWED: 'The user is requesting to use an EUDR role that is not valid for the operator profile.',

  // Operator related errors
  EUDR_OPERATOR_EORI_FOR_ACTIVITY_MISSING: 'The operator must have an EU EORI if the activity is IMPORT or EXPORT',
  EUDR_BEHALF_OPERATOR_NOT_PROVIDED: 'For authorized representative role only: The on-behalf-of (represented) operator must be provided.',
  EUDR_BEHALF_OPERATOR_CITY_POSTALCODE_EMPTY_OR_INVALID: 'For authorized representative role only: The city and postal code of the on-behalf-of (represented) operator must be provided and valid.',
  EUDR_ACTIVITY_TYPE_NOT_COMPATIBLE: 'The selected activity is not allowed for the operator.',
  EUDR_ACTIVITY_TYPE_NOT_ALLOWED_FOR_NON_EU_OPERATOR: 'Non-EU operators must select Import activity.',

  // Commodity related errors
  EUDR_COMMODITIES_HS_CODE_INVALID: 'The HS-Code of a commodity is invalid',
  EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY: 'Net Mass is mandatory for IMPORT or EXPORT activity.',
  EUDR_COMMODITIES_DESCRIPTOR_QUANTITY_MISSING: 'At least one unit of measure quantity must be provided.',
  EUDR_COMMODITITY_PRODUCER_COUNTRY_CODE_INVALID: 'The ISO 2 country code provided for the producer is invalid.',

  // Geolocation related errors
  EUDR_COMMODITIES_PRODUCERS_EMPTY: 'No producers were provided.',
  EUDR_COMMODITIES_PRODUCER_GEO_EMPTY: 'No geolocation was provided and there is no referenced DDS.',
  EUDR_COMMODITIES_PRODUCER_GEO_INVALID: 'An invalid GEOjson file was provided for geolocation.',
  EUDR_COMMODITIES_PRODUCER_GEO_LATITUDE_INVALID: 'Latitude of points or vertices must be between -90 and +90.',
  EUDR_COMMODITIES_PRODUCER_GEO_LONGITUDE_INVALID: 'Longitude of points or vertices must be between -180 and +180.',
  EUDR_COMMODITIES_PRODUCER_GEO_POLYGON_INVALID: 'Each polygon must have at least 4 non-aligned points and cannot have intersections between sides.',
  EUDR_COMMODITIES_PRODUCER_GEO_INVALID_GEOMETRY: 'Each polygon must have at least 4 non-aligned points and cannot have intersections between sides.',
  EUDR_COMMODITIES_PRODUCER_GEO_AREA_INVALID: 'An area for a point must be a number and, for non-cattle commodities, it should be between 0,0001 and 4',
  EUDR_MAXIMUM_GEO_SIZE_REACHED: 'The maximum DDS file size has been exceeded',

  // Referenced DDS errors
  EUDR_REFERENCED_STATEMENT_NOT_FOUND: 'At least one referenced DDS is invalid (Referenced Number or Verification Number) or does not exist.',
  EUDR_MAXIMUM_REFERENCED_DDS_REACHED: 'The maximum number of referenced DDS is exceeded.',

  // Supplementary unit errors
  EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING: 'Supplementary units are provided but the supplementary unit qualifier is missing.',
  EUDR_COMMODITIES_DESCRIPTOR_NUMBER_OF_UNITS_MISSING: 'A supplementary unit qualifier is provided but the supplementary units are missing.',
  EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_NOT_ALLOWED: 'Supplementary Unit not allowed for import and export where the supplementary unit is not applicable.',
  EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_QUALIFIER_INVALID: 'Invalid Supplementary Unit type.',
  EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_QUALIFIER_NOT_COMPATIBLE: 'Supplementary Unit type not applicable.',
  EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_MISSING: 'Net Mass Percentage estimate or deviation is mandatory for Domestic or Trade activities.',
  EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_NOT_ALLOWED: 'Percentage estimate or deviation not allowed for Import/Export.',
  EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_INVALID: 'Percentage estimate or deviation lower than 0 or higher than 50.',

  // Species information errors
  EUDR_COMMODITIES_SPECIES_INFORMATION_COMMON_NAME_EMPTY: 'The common name is mandatory if the commodity contains Annex I wood (timber) products.',
  EUDR_COMMODITIES_SPECIES_INFORMATION_SCIENTIFIC_NAME_EMPTY: 'The scientific name is mandatory if the commodity contains Annex I wood (timber) products.',

  // Amend DDS specific errors
  EUDR_API_AMEND_ACTIVITY_TYPE_CHANGE_NOT_ALLOWED: 'The existing DDS activity cannot be modified.',
  EUDR_API_AMEND_OR_WITHDRAW_DDS_NOT_POSSIBLE: 'The user cannot amend a DDS if it is referenced in another DDS or if the amend cutoff date has expired.',
  EUDR_API_AMEND_NOT_ALLOWED_FOR_STATUS: 'The user can only amend when the DDS is in status Available.',
  EUDR_API_AMEND_OR_WITHDRAW_NOT_ALLOWED_FOR_STATUS: 'The user can only retract a DDS in status SUBMITTED or AVAILABLE.',
  EUDR_API_NO_DDS: 'No DDS corresponding to the provided UUID.',

  // Data validation errors
  EUDR_DATA_TYPE_VALIDATION_ERROR: 'Data type validation error - the provided value does not match the expected format.'
};

// Add at the top with other constants
const ERROR_CODE_MAPPINGS = {
  // Map the qualifier missing error to the supplementary unit missing error
  'EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_QUALIFIER_MISSING': 'EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING'
};

/**
 * EUDR Error Handler class
 */
class EudrErrorHandler {
  // Expose error codes as static property
  static get EUDR_ERROR_CODES() {
    return EUDR_ERROR_CODES;
  }

  /**
   * Parse SOAP fault from XML response
   * @param {string} xmlResponse - XML response from EUDR API
   * @returns {Object|null} Parsed error object or null if no error
   */
  static parseSoapFault(xmlResponse) {
    if (!xmlResponse) return null;

    const result = {
      faultCode: null,
      faultString: null,
      errorDetails: []  // Changed to array to support multiple errors
    };

    // Parse basic SOAP fault information
    const faultMatch = xmlResponse.match(/<faultcode>(.*?)<\/faultcode>.*?<faultstring>(.*?)<\/faultstring>/s);
    if (faultMatch) {
      result.faultCode = faultMatch[1];
      result.faultString = faultMatch[2];

      // Handle SAX parsing and XML validation exceptions
      if (result.faultString.includes('SAXParseException') || result.faultString.includes('cvc-')) {
        // Handle data type validation errors (e.g., decimal sent as integer)
        const dataTypeMatch = result.faultString.match(/cvc-datatype-valid\.1\.2\.1:\s*'([^']+)'\s*is not a valid value for\s*'([^']+)'/);
        if (dataTypeMatch) {
          const invalidValue = dataTypeMatch[1];
          const expectedType = dataTypeMatch[2];
          const errorDetail = {
            errorCode: 'EUDR_DATA_TYPE_VALIDATION_ERROR',
            message: `Value '${invalidValue}' is not valid for type '${expectedType}'`,
            type: 'DataTypeValidation',
            invalidValue: invalidValue,
            expectedType: expectedType,
            userFriendlyMessage: this.generateDataTypeErrorMessage(invalidValue, expectedType)
          };
          result.errorDetails.push(errorDetail);
          return result;
        }

        // Extract the actual validation error message, handling both formats
        const saxMatch = result.faultString.match(/(?:SAXParseException[^;]*;\s*org\.xml\.sax\.SAXException:\s*(?:org\.xml\.sax\.SAXParseException;\s*)?|^)(cvc-.*?)(?:\n|$)/);
        if (saxMatch) {
          const errorMessage = saxMatch[1].trim();
          const errorDetail = {
            errorCode: 'XML_VALIDATION_ERROR',
            message: errorMessage,
            type: 'SAXParseException'
          };

          // Try to extract the missing element name and namespace from the error message
          const elementMatch = errorMessage.match(/element '(?:[^:]+:)?(\w+)'/);
          const namespaceMatch = errorMessage.match(/{"([^"]+)":(\w+)}/);

          if (elementMatch) {
            errorDetail.missingElement = elementMatch[1];
          }
          if (namespaceMatch) {
            errorDetail.namespace = namespaceMatch[1];
            // If we didn't get the element from the first match, get it from here
            if (!errorDetail.missingElement) {
              errorDetail.missingElement = namespaceMatch[2];
            }
          }

          result.errorDetails.push(errorDetail);
          return result;
        }
      }
    }

    // Parse all error details using regex to find all Error elements
    const errorRegex = /<ns4:Error>[\s\S]*?<ns4:ID>(.*?)<\/ns4:ID>[\s\S]*?<ns4:Message[^>]*>(.*?)<\/ns4:Message>([\s\S]*?)<\/ns4:Error>/g;
    let errorMatch;
    let foundErrors = false;

    while ((errorMatch = errorRegex.exec(xmlResponse)) !== null) {
      foundErrors = true;
      const errorDetail = {
        errorCode: errorMatch[1]?.replace(/-/g, '_'),
        message: errorMatch[2]
      };

      // Check for optional Field tag if present
      const fieldMatch = errorMatch[3]?.match(/<ns4:Field[^>]*>(.*?)<\/ns4:Field>/);
      if (fieldMatch) {
        errorDetail.field = fieldMatch[1];
      }

      // Map the error code if needed
      const mappedErrorCode = ERROR_CODE_MAPPINGS[errorDetail.errorCode] || errorDetail.errorCode;

      // If the error code matches one of our known EUDR error codes, include the standard message
      if (EUDR_ERROR_CODES[mappedErrorCode]) {
        errorDetail.standardMessage = EUDR_ERROR_CODES[mappedErrorCode];
      }

      result.errorDetails.push(errorDetail);
    }

    if (foundErrors) {
      return result;
    }

    // If no BusinessRulesValidationException found, check for EUDR specific error codes in the response
    for (const errorCode of Object.keys(EUDR_ERROR_CODES)) {
      if (xmlResponse.includes(errorCode)) {
        result.errorDetails.push({
          errorCode,
          standardMessage: EUDR_ERROR_CODES[errorCode]
        });
        return result;
      }
    }

    // If we found any fault information, return the result
    if (result.faultCode || result.faultString) {
      return result;
    }

    return null;
  }

  /**
   * Generate user-friendly error messages for data type validation errors
   * @param {string} invalidValue - The invalid value
   * @param {string} expectedType - The expected data type
   * @returns {string} User-friendly error message
   */
  static generateDataTypeErrorMessage(invalidValue, expectedType) {
    switch (expectedType.toLowerCase()) {
      case 'integer':
        if (invalidValue.includes('.')) {
          return `The value '${invalidValue}' contains decimal places but must be a whole number (integer). Please remove decimal places or check if the field should accept decimal values.`;
        }
        return `The value '${invalidValue}' is not a valid integer. Please provide a whole number.`;
        
      case 'decimal':
        return `The value '${invalidValue}' is not a valid decimal number. Please check the format.`;
        
      case 'boolean':
        return `The value '${invalidValue}' is not a valid boolean. Please use 'true' or 'false'.`;
        
      case 'date':
        return `The value '${invalidValue}' is not a valid date format. Please use ISO 8601 format (YYYY-MM-DD).`;
        
      case 'datetime':
        return `The value '${invalidValue}' is not a valid datetime format. Please use ISO 8601 format (YYYY-MM-DDTHH:mm:ss).`;
        
      default:
        return `The value '${invalidValue}' is not valid for the expected type '${expectedType}'. Please check the data format requirements.`;
    }
  }

  /**
   * Handle error response from EUDR API
   * @param {Object} error - Error object from axios or other source
   * @returns {Error} Error object with additional EUDR-specific properties
   */
  static handleError(error) {
    logger.trace("Starting handleError with error:", error.message);

    // Create a proper Error object
    const errorResponse = new Error(error.message || 'Unknown error');
    
    // Set default properties
    errorResponse.httpStatus = 500;
    errorResponse.error = true;
    errorResponse.message = error.message || 'Unknown error';
    errorResponse.details = {
      status: null,
      statusText: null,
      rawData: null,
      soapFault: null
    };
    errorResponse.eudrSpecific = false;
    errorResponse.eudrErrors = [];  // Array to hold multiple EUDR errors

    if (error.response) {
      // console.log("Error has response with status:", error.response.status);

      errorResponse.details.status = error.response.status;
      errorResponse.details.statusText = error.response.statusText;
      errorResponse.details.rawData = error.response.data;

      if (typeof error.response.data === 'string') {
        // console.log("Response data is a string, parsing SOAP fault");

        const soapFault = this.parseSoapFault(error.response.data);
        // console.log("Parsed soapFault:", soapFault);

        if (soapFault) {
          errorResponse.details.soapFault = soapFault;
          // console.log("Assigned soapFault to errorResponse.details.soapFault");

          // Check for authorization-related errors and set appropriate HTTP status
          if (soapFault.faultString && (
            soapFault.faultString.includes('not authorized') ||
            soapFault.faultString.includes('not allowed') ||
            soapFault.faultString.includes('permission') ||
            soapFault.faultString.includes('role') ||
            soapFault.faultString.includes('You are not authorized')
          )) {
            errorResponse.httpStatus = 403; // Forbidden - authenticated but not authorized
          } else if (soapFault.faultCode === 'S:Client' && soapFault.faultString) {
            // For other client-side errors, use 400 Bad Request
            errorResponse.httpStatus = 400;
          }

          if (soapFault.errorDetails && soapFault.errorDetails.length > 0) {
            // Process all errors
            soapFault.errorDetails.forEach(errorDetail => {
              // Check for specific authorization error codes
              if (errorDetail.errorCode === 'EUDR_WEBSERVICE_USER_ACTIVITY_NOT_ALLOWED' ||
                  errorDetail.errorCode === 'EUDR_WEBSERVICE_USER_NOT_EUDR_OPERATOR' ||
                  errorDetail.errorCode === 'EUDR_WEBSERVICE_USER_FROM_MANY_OPERATOR' ||
                  errorDetail.message?.includes('not authorized') ||
                  errorDetail.message?.includes('not allowed') ||
                  errorDetail.message?.includes('role')) {
                errorResponse.httpStatus = 403; // Forbidden
              }

              // Handle data type validation errors specially
              if (errorDetail.errorCode === 'EUDR_DATA_TYPE_VALIDATION_ERROR') {
                errorResponse.eudrSpecific = true;
                errorResponse.wellKnownError = true;
                errorResponse.httpStatus = 400; // Bad Request for validation errors

                // Add to the array of EUDR errors with user-friendly message
                errorResponse.eudrErrors.push({
                  code: errorDetail.errorCode,
                  message: errorDetail.userFriendlyMessage || errorDetail.message,
                  technicalMessage: errorDetail.message,
                  invalidValue: errorDetail.invalidValue,
                  expectedType: errorDetail.expectedType,
                  field: errorDetail.field || null
                });
                return; // Skip further processing for this error
              }

              // Map the error code if needed
              const mappedErrorCode = ERROR_CODE_MAPPINGS[errorDetail.errorCode] || errorDetail.errorCode;

              if (EUDR_ERROR_CODES[mappedErrorCode]) {
                errorResponse.eudrSpecific = true;
                errorResponse.wellKnownError = true;

                // Add to the array of EUDR errors
                errorResponse.eudrErrors.push({
                  code: mappedErrorCode,
                  message: EUDR_ERROR_CODES[mappedErrorCode] ||
                    errorDetail.standardMessage ||
                    errorDetail.message,
                  field: errorDetail.field || null
                });
              }
              else if (errorResponse.details?.soapFault?.errorDetails?.length > 0) {
                errorResponse.eudrSpecific = true;
                errorResponse.wellKnownError = false;
                // Add to the array of EUDR errors
                errorResponse.eudrErrors = errorResponse.details.soapFault.errorDetails.map(errorDetail => ({
                  code: errorDetail.errorCode,
                  message: errorDetail.message,
                  field: errorDetail.field || null
                }));
              }
            });

            // For backward compatibility, set the first error as the main error
            if (errorResponse.eudrErrors.length > 0) {
              errorResponse.eudrErrorCode = errorResponse.eudrErrors[0].code;
              errorResponse.eudrErrorMessage = errorResponse.eudrErrors[0].message;
            }
          }
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorResponse.details.request = 'Request sent but no response received';
    } else {
      // Something happened in setting up the request that triggered an Error
      errorResponse.details.setupError = error.message || 'Error in request setup';
    }

    // Special handling for authentication errors
    if (error.response && error.response.status === 401) {
      errorResponse.httpStatus = 401; // Unauthorized
      // Create a default soapFault for authentication errors if one wasn't parsed
      if (!errorResponse.details.soapFault) {
        errorResponse.details.soapFault = {
          faultCode: 'env:Client',
          faultString: 'UnauthenticatedException',
          errorDetails: null
        };
      }
    }

    // If we have an error object with eudrSpecific flag already set (from previous processing)
    if (error.eudrSpecific) {
      errorResponse.eudrSpecific = true;
      errorResponse.eudrErrorCode = error.eudrErrorCode;
      errorResponse.eudrErrorMessage = error.eudrErrorMessage;
    }

    // logger.trace("Final errorResponse:", errorResponse);
    return errorResponse;
  }

  /**
   * Debug helper to print the raw XML response
   * @param {string} xmlResponse - XML response from EUDR API
   */
  static debugXmlResponse(xmlResponse) {
    if (!xmlResponse) {
      logger.trace('No XML response to debug');
      return;
    }

    logger.trace('\n--- XML Response Debug (first 500 chars) ---');
    logger.trace(xmlResponse.substring(0, 500) + (xmlResponse.length > 500 ? '...' : ''));
    logger.trace('--- End XML Response Debug ---\n');
  }
}

// Export the class
module.exports = EudrErrorHandler; 