/**
 * EUDR Submission Service Client V2 (using axios for raw XML)
 * 
 * This module provides a reusable class for connecting to the EUDR Submission Service V2
 * with proper WSSE security headers using direct XML and HTTP requests.
 * This implementation uses axios for HTTP requests and builds the SOAP
 * envelope manually for the V2 API version.
 * 
 * Key differences from V1:
 * - Updated namespaces to v2
 * - New operator address structure with separate fields
 * - Removed volume field from goodsMeasure
 * - Support for new fields like fullAddress
 * 
 * Automatic endpoint generation:
 * - For webServiceClientId 'eudr-repository': production environment
 * - For webServiceClientId 'eudr-test': acceptance environment
 * - For custom webServiceClientId: endpoint must be provided manually
 */

// Required dependencies
const axios = require('axios');
const crypto = require('node:crypto');
const { v4: uuidv4 } = require('uuid');
const { parseString } = require('xml2js');
const EudrErrorHandler = require('../utils/error-handler');
const { logger } = require('../utils/logger');
const { validateAndGenerateEndpoint } = require('../utils/endpoint-utils');

// Constants for Units of Measure validation based on economic_operators.md
const HS_CODES_WITH_SUPPLEMENTARY_UNITS = {
  // 4-digit codes (match on first 4 digits)
  '4011': 'NAR',
  '4013': 'NAR',
  '4104': 'NAR',
  '4403': 'MTQ',
  '4406': 'MTQ',
  '4408': 'MTQ',
  '4410': 'MTQ',
  '4411': 'MTQ',
  '4412': 'MTQ',
  '4413': 'MTQ',
  '4701': 'KSD',
  '4702': 'KSD',
  '4704': 'KSD',
  '4705': 'KSD'
};

// Valid supplementary unit types for Domestic/Trade activities
const VALID_SUPPLEMENTARY_UNIT_TYPES = ['KSD', 'MTK', 'MTQ', 'MTR', 'NAR', 'NPR'];

/**
 * EUDR Submission Service Client V2 class
 */
class EudrSubmissionClientV2 {
  /**
   * Create a new EUDR Submission Service V2 client
   * @param {Object} config - Configuration object
   * @param {string} [config.endpoint] - Service endpoint URL (optional for standard webServiceClientId: 'eudr-repository', 'eudr-test')
   * @param {string} config.username - Authentication username
   * @param {string} config.password - Authentication password
   * @param {string} config.webServiceClientId - Client ID ('eudr-repository', 'eudr-test', or custom)
   * @param {number} [config.timestampValidity=60] - Timestamp validity in seconds
   * @param {number} [config.timeout=10000] - Request timeout in milliseconds
   * @param {boolean} [config.ssl=false] - SSL configuration: true for secure (default), false to allow unauthorized certificates
   * 
   * @example
   * // Automatic endpoint generation for standard client IDs
   * const client = new EudrSubmissionClientV2({
   *   username: 'user',
   *   password: 'pass',
   *   webServiceClientId: 'eudr-test'
   * });
   * 
   * @example
   * // Manual endpoint override
   * const client = new EudrSubmissionClientV2({
   *   endpoint: 'https://custom-endpoint.com/ws/service',
   *   username: 'user',
   *   password: 'pass',
   *   webServiceClientId: 'custom-client'
   * });
   */
  constructor(config) {
    // Validate and potentially generate endpoint
    const validatedConfig = validateAndGenerateEndpoint(config, 'submission', 'v2');
    
    this.config = {
      // Default configuration
      timestampValidity: 60, // 1 minute as per requirements
      timeout: 10000, // 10 seconds timeout
      ssl: false, // Default to insecure for backward compatibility
      ...validatedConfig // Override with validated config (includes endpoint)
    };

    // Validate required configuration
    this.validateConfig();
  }

  /**
   * Validate that required configuration is provided
   * @private
   * @throws {Error} If required configuration is missing
   */
  validateConfig() {
    const requiredFields = ['endpoint', 'username', 'password', 'webServiceClientId'];
    for (const field of requiredFields) {
      if (!this.config[field]) {
        throw new Error(`Missing required configuration: ${field}`);
      }
    }
  }

  /**
   * Generate a random nonce
   * @private
   * @returns {Object} Object containing nonce in different formats
   */
  generateNonce() {
    // Generate 16 random bytes
    const nonceBytes = crypto.randomBytes(16);

    // Convert to base64
    const nonceBase64 = nonceBytes.toString('base64');

    return {
      bytes: nonceBytes,
      base64: nonceBase64
    };
  }

  /**
   * Get current timestamp in ISO format
   * @private
   * @returns {string} Current timestamp in ISO format
   */
  getCurrentTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Get expiration timestamp based on current time plus validity period
   * @private
   * @param {number} validityInSeconds - Validity period in seconds
   * @returns {string} Expiration timestamp in ISO format
   */
  getExpirationTimestamp(validityInSeconds) {
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + validityInSeconds);
    return expirationDate.toISOString();
  }

  /**
   * Generate password digest according to WS-Security standard
   * @private
   * @param {Buffer} nonce - Nonce as bytes
   * @param {string} created - Created timestamp
   * @param {string} password - Password
   * @returns {string} Password digest in base64
   */
  generatePasswordDigest(nonce, created, password) {
    logger.debug({ password: password ? '***' : 'undefined' }, 'Generating password digest');
    // Concatenate nonce + created + password
    const concatenated = Buffer.concat([
      nonce,
      Buffer.from(created),
      Buffer.from(password)
    ]);

    // Create SHA-1 hash
    const hash = crypto.createHash('sha1').update(concatenated).digest();

    // Convert to base64
    return hash.toString('base64');
  }

  /**
   * Encode plain GeoJSON strings to base64 in request
   * @private
   * @param {Object} request - The DDS submission request object
   */
  encodeGeojsonInRequest(request) {
    if (!request.statement || !request.statement.commodities) {
      return;
    }

    const processCommodities = (commodities) => {
      if (!Array.isArray(commodities)) {
        commodities = [commodities];
      }

      commodities.forEach(commodity => {
        if (commodity.producers && Array.isArray(commodity.producers)) {
          commodity.producers.forEach(producer => {
            if (producer.geometryGeojson) {
              // Handle different input types
              if (typeof producer.geometryGeojson === 'object') {
                // If it's an object, stringify it first
                try {
                  producer.geometryGeojson = Buffer.from(JSON.stringify(producer.geometryGeojson), 'utf-8').toString('base64');
                } catch (error) {
                  logger.warn('Invalid GeoJSON object, skipping encoding:', error.message);
                }
              } else if (typeof producer.geometryGeojson === 'string') {
                try {
                  // Check if it's already base64 encoded
                  const decoded = Buffer.from(producer.geometryGeojson, 'base64').toString('utf-8');
                  JSON.parse(decoded); // Try to parse as JSON
                  // If successful, it's already base64 encoded, do nothing
                } catch (error) {
                  // If it fails, it's a plain JSON string, encode it
                  try {
                    JSON.parse(producer.geometryGeojson); // Validate it's valid JSON
                    producer.geometryGeojson = Buffer.from(producer.geometryGeojson, 'utf-8').toString('base64');
                  } catch (jsonError) {
                    // If it's not valid JSON, leave it as is
                    logger.warn('Invalid GeoJSON format, skipping encoding:', jsonError.message);
                  }
                }
              }
            }
          });
        }
      });
    };

    processCommodities(request.statement.commodities);
  }

  /**
   * Create SOAP envelope for the submitDds operation (V2)
   * @private
   * @param {Object} request - The DDS submission request object
   * @returns {string} Complete SOAP envelope as XML string
   */
  createSoapEnvelope(request) {
    // Generate required values for security header
    const nonce = this.generateNonce();
    const created = this.getCurrentTimestamp();
    const expires = this.getExpirationTimestamp(this.config.timestampValidity);
    const passwordDigest = this.generatePasswordDigest(nonce.bytes, created, this.config.password);

    // Generate unique IDs for the security elements
    const timestampId = `TS-${uuidv4()}`;
    const usernameTokenId = `UsernameToken-${uuidv4()}`;

    // Create the complete SOAP envelope with V2 namespaces
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:v2="http://ec.europa.eu/tracesnt/certificate/eudr/submission/v2" 
                  xmlns:v21="http://ec.europa.eu/tracesnt/certificate/eudr/model/v2" 
                  xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4">
    <soapenv:Header>    
        <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" 
                      xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" 
                      soapenv:mustUnderstand="1">
            <wsu:Timestamp wsu:Id="${timestampId}">
                <wsu:Created>${created}</wsu:Created>
                <wsu:Expires>${expires}</wsu:Expires>
            </wsu:Timestamp>
            <wsse:UsernameToken wsu:Id="${usernameTokenId}">
                <wsse:Username>${this.config.username}</wsse:Username>
                <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${passwordDigest}</wsse:Password>
                <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce.base64}</wsse:Nonce>
                <wsu:Created>${created}</wsu:Created>
            </wsse:UsernameToken>
        </wsse:Security>
        <v4:WebServiceClientId>${this.config.webServiceClientId}</v4:WebServiceClientId>
    </soapenv:Header>
    <soapenv:Body>
        <v2:SubmitStatementRequest>
            <v2:operatorType>${request.operatorType}</v2:operatorType>
            <v2:statement>
                ${this.generateStatementXml(request.statement)}
            </v2:statement>
        </v2:SubmitStatementRequest>
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Create SOAP envelope for the amendDds operation (V2)
   * @private
   * @param {string} ddsIdentifier - UUID of the DDS to amend
   * @param {Object} statement - The updated DDS statement
   * @returns {string} Complete SOAP envelope as XML string
   */
  createAmendSoapEnvelope(ddsIdentifier, statement) {
    // Generate required values for security header
    const nonce = this.generateNonce();
    const created = this.getCurrentTimestamp();
    const expires = this.getExpirationTimestamp(this.config.timestampValidity);
    const passwordDigest = this.generatePasswordDigest(nonce.bytes, created, this.config.password);

    // Generate unique IDs for the security elements
    const timestampId = `TS-${uuidv4()}`;
    const usernameTokenId = `UsernameToken-${uuidv4()}`;

    // Create the complete SOAP envelope with V2 namespaces
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:v2="http://ec.europa.eu/tracesnt/certificate/eudr/submission/v2" 
                  xmlns:v21="http://ec.europa.eu/tracesnt/certificate/eudr/model/v2" 
                  xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4">
    <soapenv:Header>    
        <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" 
                      xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" 
                      soapenv:mustUnderstand="1">
            <wsu:Timestamp wsu:Id="${timestampId}">
                <wsu:Created>${created}</wsu:Created>
                <wsu:Expires>${expires}</wsu:Expires>
            </wsu:Timestamp>
            <wsse:UsernameToken wsu:Id="${usernameTokenId}">
                <wsse:Username>${this.config.username}</wsse:Username>
                <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${passwordDigest}</wsse:Password>
                <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce.base64}</wsse:Nonce>
                <wsu:Created>${created}</wsu:Created>
            </wsse:UsernameToken>
        </wsse:Security>
        <v4:WebServiceClientId>${this.config.webServiceClientId}</v4:WebServiceClientId>
    </soapenv:Header>
    <soapenv:Body>
        <v2:AmendStatementRequest>
            <v2:ddsIdentifier>${ddsIdentifier}</v2:ddsIdentifier>
            <v2:statement>
                ${this.generateStatementXml(statement)}
            </v2:statement>
        </v2:AmendStatementRequest>
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Validate units of measure according to economic_operators.md rules
   * @private
   * @param {Object} statement - The statement object to validate
   * @throws {Error} If validation fails
   */
  validateUnitsOfMeasure(statement) {
    if (!statement.commodities) {
      return; // No commodities to validate
    }

    const commodities = Array.isArray(statement.commodities) ? statement.commodities : [statement.commodities];
    const activityType = statement.activityType;

    for (const commodity of commodities) {
      if (!commodity.descriptors || !commodity.descriptors.goodsMeasure) {
        continue; // Skip if no goods measure
      }

      const measure = commodity.descriptors.goodsMeasure;
      const hsHeading = commodity.hsHeading;

      // Validate based on activity type
      if (activityType === 'IMPORT' || activityType === 'EXPORT') {
        this.validateImportExportUnits(measure, hsHeading);
      } else if (activityType === 'DOMESTIC' || activityType === 'TRADE') {
        this.validateDomesticTradeUnits(measure);
      }
    }
  }

  /**
   * Validate units of measure for Import/Export activities
   * @private
   * @param {Object} measure - The goods measure object
   * @param {string} hsHeading - The HS heading code
   * @throws {Error} If validation fails
   */
  validateImportExportUnits(measure, hsHeading) {
    // Percentage estimation not allowed for Import/Export (check first)
    if (measure.percentageEstimationOrDeviation !== undefined) {
      const error = new Error('Percentage estimate or deviation not allowed for Import/Export activities.');
      error.eudrErrorCode = 'EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_NOT_ALLOWED';
      error.eudrSpecific = true;
      throw error;
    }

    // Net Mass is mandatory for Import/Export
    if (!measure.netWeight) {
      const error = new Error('Net Mass is mandatory for IMPORT or EXPORT activity.');
      error.eudrErrorCode = 'EUDR_COMMODITIES_DESCRIPTOR_NET_MASS_EMPTY';
      error.eudrSpecific = true;
      throw error;
    }

    // Check if HS code requires supplementary unit
    if (hsHeading) {
      const requiredSupplementaryUnit = this.getRequiredSupplementaryUnit(hsHeading);
      
      if (requiredSupplementaryUnit) {
        // Supplementary unit is mandatory for this HS code
        if (!measure.supplementaryUnit || !measure.supplementaryUnitQualifier) {
          const error = new Error(`Supplementary unit is mandatory for HS code ${hsHeading}. Required type: ${requiredSupplementaryUnit}`);
          error.eudrErrorCode = 'EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING';
          error.eudrSpecific = true;
          throw error;
        }

        // Validate supplementary unit type matches requirement
        if (measure.supplementaryUnitQualifier !== requiredSupplementaryUnit) {
          const error = new Error(`Invalid supplementary unit type for HS code ${hsHeading}. Expected: ${requiredSupplementaryUnit}, got: ${measure.supplementaryUnitQualifier}`);
          error.eudrErrorCode = 'EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_QUALIFIER_NOT_COMPATIBLE';
          error.eudrSpecific = true;
          throw error;
        }
      } else {
        // No supplementary unit should be provided for this HS code
        if (measure.supplementaryUnit || measure.supplementaryUnitQualifier) {
          const error = new Error(`Supplementary unit not allowed for HS code ${hsHeading} in Import/Export activities.`);
          error.eudrErrorCode = 'EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_NOT_ALLOWED';
          error.eudrSpecific = true;
          throw error;
        }
      }
    }
  }

  /**
   * Validate units of measure for Domestic/Trade activities
   * @private
   * @param {Object} measure - The goods measure object
   * @throws {Error} If validation fails
   */
  validateDomesticTradeUnits(measure) {
    // Validate percentage estimation (0-25%)
    if (measure.percentageEstimationOrDeviation !== undefined) {
      const percentage = parseFloat(measure.percentageEstimationOrDeviation);
      if (isNaN(percentage) || percentage < 0 || percentage > 25) {
        const error = new Error('Percentage estimate or deviation must be between 0 and 25 for Domestic/Trade activities.');
        error.eudrErrorCode = 'EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_INVALID';
        error.eudrSpecific = true;
        throw error;
      }
    }

    // Validate supplementary unit type if provided
    if (measure.supplementaryUnitQualifier) {
      if (!VALID_SUPPLEMENTARY_UNIT_TYPES.includes(measure.supplementaryUnitQualifier)) {
        const error = new Error(`Invalid supplementary unit type: ${measure.supplementaryUnitQualifier}. Valid types: ${VALID_SUPPLEMENTARY_UNIT_TYPES.join(', ')}`);
        error.eudrErrorCode = 'EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_QUALIFIER_INVALID';
        error.eudrSpecific = true;
        throw error;
      }

      // If supplementary unit qualifier is provided, supplementary unit must also be provided
      if (!measure.supplementaryUnit) {
        const error = new Error('Supplementary unit quantity is required when supplementary unit qualifier is provided.');
        error.eudrErrorCode = 'EUDR_COMMODITIES_DESCRIPTOR_NUMBER_OF_UNITS_MISSING';
        error.eudrSpecific = true;
        throw error;
      }
    }

    // If supplementary unit is provided, qualifier must also be provided
    if (measure.supplementaryUnit && !measure.supplementaryUnitQualifier) {
      const error = new Error('Supplementary unit qualifier is required when supplementary unit quantity is provided.');
      error.eudrErrorCode = 'EUDR_COMMODITIES_DESCRIPTOR_SUPPLEMENTARY_UNIT_MISSING';
      error.eudrSpecific = true;
      throw error;
    }

    // Validate combinations: at least one unit of measure must be provided
    if (!measure.netWeight && !measure.supplementaryUnit) {
      const error = new Error('At least one unit of measure quantity must be provided for Domestic/Trade activities.');
      error.eudrErrorCode = 'EUDR_COMMODITIES_DESCRIPTOR_QUANTITY_MISSING';
      error.eudrSpecific = true;
      throw error;
    }
  }

  /**
   * Get required supplementary unit for HS code
   * @private
   * @param {string} hsHeading - The HS heading code
   * @returns {string|null} Required supplementary unit type or null
   */
  getRequiredSupplementaryUnit(hsHeading) {
    if (!hsHeading) return null;

    // First check for exact 6-digit match
    if (HS_CODES_WITH_SUPPLEMENTARY_UNITS[hsHeading]) {
      return HS_CODES_WITH_SUPPLEMENTARY_UNITS[hsHeading];
    }

    // Then check for 4-digit match (first 4 digits)
    if (hsHeading.length >= 4) {
      const fourDigitCode = hsHeading.substring(0, 4);
      return HS_CODES_WITH_SUPPLEMENTARY_UNITS[fourDigitCode] || null;
    }

    return null;
  }

  /**
   * Generate XML for the statement part of the request (V2)
   * @private
   * @param {Object} statement - The statement object
   * @returns {string} Statement XML
   */
  generateStatementXml(statement) {
    let xml = '';

    logger.debug({ statement }, 'Generating statement XML');

    // Add required fields in correct order - with validation
    if (!statement.internalReferenceNumber) {
      throw new Error('internalReferenceNumber is required');
    }
    xml += `<v21:internalReferenceNumber>${statement.internalReferenceNumber}</v21:internalReferenceNumber>`;
    
    if (!statement.activityType) {
      throw new Error('activityType is required');
    }
    xml += `<v21:activityType>${statement.activityType}</v21:activityType>`;

    // Add operator details immediately after activityType (V2 structure)
    if (statement.operator) {
      xml += '<v21:operator>';
      if (statement.operator.referenceNumber) {
        const refArray = Array.isArray(statement.operator.referenceNumber) ? statement.operator.referenceNumber : [statement.operator.referenceNumber];
        for (const ref of refArray) {
          xml += '<v21:referenceNumber>';
          xml += `<v21:identifierType>${ref.identifierType}</v21:identifierType>`;
          xml += `<v21:identifierValue>${ref.identifierValue}</v21:identifierValue>`;
          xml += '</v21:referenceNumber>';
        }
      }
      
      // V2: Use operatorAddress instead of nameAndAddress
      if (statement.operator.operatorAddress) {
        xml += '<v21:operatorAddress>';
        xml += `<v21:name>${statement.operator.operatorAddress.name}</v21:name>`;
        xml += `<v21:country>${statement.operator.operatorAddress.country}</v21:country>`;
        xml += `<v21:street>${statement.operator.operatorAddress.street}</v21:street>`;
        xml += `<v21:postalCode>${statement.operator.operatorAddress.postalCode}</v21:postalCode>`;
        xml += `<v21:city>${statement.operator.operatorAddress.city}</v21:city>`;
        if (statement.operator.operatorAddress.fullAddress) {
          xml += `<v21:fullAddress>${statement.operator.operatorAddress.fullAddress}</v21:fullAddress>`;
        }
        xml += '</v21:operatorAddress>';
      }
      
      if (statement.operator.email) {
        xml += `<v21:email>${statement.operator.email}</v21:email>`;
      }
      if (statement.operator.phone) {
        xml += `<v21:phone>${statement.operator.phone}</v21:phone>`;
      }
      xml += '</v21:operator>';
    }

    // Add optional fields in correct order
    if (statement.countryOfActivity) {
      xml += `<v21:countryOfActivity>${statement.countryOfActivity}</v21:countryOfActivity>`;
    }

    if (statement.borderCrossCountry) {
      xml += `<v21:borderCrossCountry>${statement.borderCrossCountry}</v21:borderCrossCountry>`;
    }

    if (statement.countryOfEntry) {
      xml += `<v21:countryOfEntry>${statement.countryOfEntry}</v21:countryOfEntry>`;
    }

    if (statement.comment) {
      xml += `<v21:comment>${statement.comment}</v21:comment>`;
    }

    // Add commodities (must come before operator according to schema)
    if (statement.commodities) {
      for (const commodity of Array.isArray(statement.commodities) ? statement.commodities : [statement.commodities]) {
        xml += '<v21:commodities>';
        xml += this.generateCommodityXml(commodity);
        xml += '</v21:commodities>';
      }
    }



    // Add geoLocationConfidential flag
    xml += `<v21:geoLocationConfidential>${statement.geoLocationConfidential || false}</v21:geoLocationConfidential>`;

    // Add associated statements if present (support both object and array)
    if (statement.associatedStatements) {
      const assocArray = Array.isArray(statement.associatedStatements) ? statement.associatedStatements : [statement.associatedStatements];
      for (const assoc of assocArray) {
        xml += '<v21:associatedStatements>';
        xml += `<v21:referenceNumber>${assoc.referenceNumber}</v21:referenceNumber>`;
        if (assoc.verificationNumber) {
          xml += `<v21:verificationNumber>${assoc.verificationNumber}</v21:verificationNumber>`;
        }
        xml += '</v21:associatedStatements>';
      }
    }

    logger.debug({ xml }, 'Generated statement XML');

    return xml;
  }

  /**
   * Generate XML for a commodity (V2)
   * @private
   * @param {Object} commodity - The commodity object
   * @returns {string} Commodity XML
   */
  generateCommodityXml(commodity) {
    let xml = '';

    // Add descriptors
    if (commodity.descriptors) {
      xml += '<v21:descriptors>';
      if (commodity.descriptors.descriptionOfGoods) {
        xml += `<v21:descriptionOfGoods>${commodity.descriptors.descriptionOfGoods}</v21:descriptionOfGoods>`;
      }
      if (commodity.descriptors.goodsMeasure) {
        xml += '<v21:goodsMeasure>';
        const measure = commodity.descriptors.goodsMeasure;
        
        // V2: Add percentageEstimationOrDeviation (required in V2)
        if (measure.percentageEstimationOrDeviation !== undefined) {
          xml += `<v21:percentageEstimationOrDeviation>${measure.percentageEstimationOrDeviation}</v21:percentageEstimationOrDeviation>`;
        }
        
        // V2: volume field is still supported in V1.4 documentation
        if (measure.volume) {
          xml += `<v21:volume>${measure.volume}</v21:volume>`;
        }
        
        if (measure.netWeight) xml += `<v21:netWeight>${measure.netWeight}</v21:netWeight>`;
        if (measure.supplementaryUnit) xml += `<v21:supplementaryUnit>${measure.supplementaryUnit}</v21:supplementaryUnit>`;
        if (measure.supplementaryUnitQualifier) xml += `<v21:supplementaryUnitQualifier>${measure.supplementaryUnitQualifier}</v21:supplementaryUnitQualifier>`;
        xml += '</v21:goodsMeasure>';
      }
      xml += '</v21:descriptors>';
    }

    // Add HS heading
    if (commodity.hsHeading) {
      xml += `<v21:hsHeading>${commodity.hsHeading}</v21:hsHeading>`;
    }

    // Add species info (support both object and array)
    if (commodity.speciesInfo) {
      const speciesInfoArray = Array.isArray(commodity.speciesInfo) ? commodity.speciesInfo : [commodity.speciesInfo];
      for (const speciesInfo of speciesInfoArray) {
        xml += '<v21:speciesInfo>';
        if (speciesInfo.scientificName) {
          xml += `<v21:scientificName>${speciesInfo.scientificName}</v21:scientificName>`;
        }
        if (speciesInfo.commonName) {
          xml += `<v21:commonName>${speciesInfo.commonName}</v21:commonName>`;
        }
        xml += '</v21:speciesInfo>';
      }
    }

    // Add producers
    if (commodity.producers) {
      for (const producer of Array.isArray(commodity.producers) ? commodity.producers : [commodity.producers]) {
        xml += '<v21:producers>';
        if (producer.country) xml += `<v21:country>${producer.country}</v21:country>`;
        if (producer.name) xml += `<v21:name>${producer.name}</v21:name>`;
        if (producer.geometryGeojson) xml += `<v21:geometryGeojson>${producer.geometryGeojson}</v21:geometryGeojson>`;
        xml += '</v21:producers>';
      }
    }

    return xml;
  }

  /**
   * Parse XML response to extract the DDS identifier
   * @private
   * @param {string} xmlResponse - XML response from the service
   * @returns {Promise<Object>} Parsed response object
   */
  parseResponse(xmlResponse) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse XML response: ${err.message}`));
          return;
        }

        try {
          // Extract the DDS identifier from the response
          const envelope = result['S:Envelope'] || result['soapenv:Envelope'];
          const body = envelope['S:Body'] || envelope['soapenv:Body'];
          
          // Find response with flexible namespace support
          const responseKeys = Object.keys(body);
          const submitResponseKey = responseKeys.find(key => key.endsWith(':SubmitStatementResponse'));
          const response = body[submitResponseKey];
          
          // Find ddsIdentifier with flexible namespace support
          const ddsIdentifierKey = response ? Object.keys(response).find(key => key.endsWith(':ddsIdentifier')) : null;
          const ddsIdentifier = response && ddsIdentifierKey ? response[ddsIdentifierKey] : null;

          resolve({
            raw: xmlResponse,
            parsed: result,
            ddsIdentifier: ddsIdentifier
          });
        } catch (error) {
          reject(new Error(`Failed to extract DDS identifier from response: ${error.message}`));
        }
      });
    });
  }

  /**
   * Parse XML response from amendDds operation
   * @private
   * @param {string} xmlResponse - XML response from the service
   * @returns {Promise<Object>} Parsed response object
   */
  parseAmendResponse(xmlResponse) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse XML response: ${err.message}`));
          return;
        }

        try {
          // Extract response information from the SOAP response
          const envelope = result['S:Envelope'] || result['SOAP-ENV:Envelope'] || result['soapenv:Envelope'];
          const body = envelope['S:Body'] || envelope['SOAP-ENV:Body'] || envelope['soapenv:Body'];
          
          // For amend, success is indicated by HTTP 200 status with no fault element
          resolve({
            raw: xmlResponse,
            parsed: result,
            success: true,
            message: 'DDS amended successfully'
          });
        } catch (error) {
          reject(new Error(`Failed to process amend response: ${error.message}`));
        }
      });
    });
  }

  /**
   * Submit a DDS to the EUDR Submission Service V2
   * @param {Object} request - Request object containing the DDS data
   * @param {Object} options - Additional options for the request
   * @param {boolean} options.rawResponse - Whether to return the raw XML response
   * @param {boolean} options.encodeGeojson - Whether to encode plain geometryGeojson strings to base64 (default: false)
   * @returns {Promise<Object>} Response object with DDS identifier
   */
  async submitDds(request, options = {}) {
    try {
      logger.debug({ request }, 'Starting submitDds');
      
      // Validate units of measure before processing
      this.validateUnitsOfMeasure(request.statement);
      
      // Encode GeoJSON if requested
      if (options.encodeGeojson) {
        this.encodeGeojsonInRequest(request);
      }
      
      // Create SOAP envelope
      logger.debug('Creating SOAP envelope...');
      const soapEnvelope = this.createSoapEnvelope(request);
      logger.debug({ soapEnvelopeLength: soapEnvelope.length }, 'SOAP envelope created');

      // Send the request
      logger.debug({ endpoint: this.config.endpoint, timeout: this.config.timeout }, 'Sending request to EUDR Submission Service V2');
      logger.debug({ timeout: this.config.timeout }, 'Timeout:');
      logger.debug({ soapEnvelopePreview: soapEnvelope.substring(0, 200) }, 'SOAP envelope preview (first 200 chars):');
      
      const response = await axios({
        method: 'post',
        url: this.config.endpoint,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/submission/v2'
        },
        data: soapEnvelope,
        timeout: this.config.timeout,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: this.config.ssl
        })
      });

      logger.info({ status: response.status, data: response.data }, 'Response received');

      // Return raw response if requested
      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      // Parse the XML response
      const parsedResponse = await this.parseResponse(response.data);

      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    }
    catch (error) {
      logger.debug({ error }, 'Error in submitDds');
      logger.debug({ errorType: error.constructor.name }, 'Error type:');
      logger.debug({ errorStack: error.stack }, 'Error stack:');
      
      // Log detailed error information
      if (error.response) {
        logger.debug({ status: error.response.status }, 'Error has response - Status:');
        logger.debug({ statusText: error.response.statusText }, 'Error has response - StatusText:');
        logger.debug({ dataLength: error.response.data?.length || 0 }, 'Error has response - Data length:');
        logger.debug({ dataType: typeof error.response.data }, 'Error has response - Data type:');
        if (error.response.data) {
          logger.debug({ dataPreview: error.response.data.substring(0, 1500) }, 'Error response data (first 1500 chars):');
        }
      } else if (error.request) {
        logger.debug({ requestDetails: error.request }, 'Error has request but no response');
      } else {
        logger.debug({ errorMessage: error.message }, 'Error has neither response nor request');
      }
      
      // Log additional error properties
      logger.debug({ errorCode: error.code }, 'Error code:');
      logger.debug({ errorConfig: error.config }, 'Error config:');
      logger.debug({ isAxiosError: error.isAxiosError }, 'Error isAxiosError:');
      
      // Use the error handler if available
      if (EudrErrorHandler) {
        logger.debug('Using EudrErrorHandler...');
        const handledError = EudrErrorHandler.handleError(error);
        // Preserve the original error properties for the controller
        handledError.originalError = error;
        throw handledError;
      }

      // Default error handling if error handler is not available
      const errorResponse = {
        error: true,
        message: error.message,
        details: {}
      };

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorResponse.details = {
          httpStatus: error.response.status,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      }
      else if (error.request) {
        // The request was made but no response was received
        errorResponse.details = {
          request: 'Request sent but no response received'
        };
      }

      throw errorResponse;
    }
  }

  /**
   * Amend an existing DDS in the EUDR Submission Service V2
   * @param {string} ddsIdentifier - UUID of the DDS to amend
   * @param {Object} statement - The updated DDS statement
   * @param {Object} options - Additional options for the request
   * @param {boolean} options.rawResponse - Whether to return the raw XML response
   * @param {boolean} options.encodeGeojson - Whether to encode plain geometryGeojson strings to base64 (default: false)
   * @returns {Promise<Object>} Response object indicating success
   */
  async amendDds(ddsIdentifier, statement, options = {}) {
    try {
      // Validate units of measure before processing
      this.validateUnitsOfMeasure(statement);
      
      // Encode GeoJSON if requested
      if (options.encodeGeojson) {
        this.encodeGeojsonInRequest({ statement });
      }
      
      // Create SOAP envelope
      const soapEnvelope = this.createAmendSoapEnvelope(ddsIdentifier, statement);

      // Send the request
      const response = await axios({
        method: 'post',
        url: this.config.endpoint,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/submission/v2#amendDds'
        },
        data: soapEnvelope,
        timeout: this.config.timeout,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: this.config.ssl
        })
      });

      // Return raw response if requested
      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      // Parse the XML response
      const parsedResponse = await this.parseAmendResponse(response.data);

      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    }
    catch (error) {
      // Use the error handler if available
      if (EudrErrorHandler) {
        throw EudrErrorHandler.handleError(error);
      }

      // Default error handling if error handler is not available
      const errorResponse = {
        error: true,
        message: error.message,
        details: {}
      };

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorResponse.details = {
          httpStatus: error.response.status,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      }
      else if (error.request) {
        // The request was made but no response was received
        errorResponse.details = {
          request: 'Request sent but no response received'
        };
      }

      throw errorResponse;
    }
  }

  /**
   * Create SOAP envelope for the retractDds operation (V2)
   * @private
   * @param {string} ddsIdentifier - UUID of the DDS to retract
   * @returns {string} Complete SOAP envelope as XML string
   */
  createRetractSoapEnvelope(ddsIdentifier) {
    // Generate required values for security header
    const nonce = this.generateNonce();
    const created = this.getCurrentTimestamp();
    const expires = this.getExpirationTimestamp(this.config.timestampValidity);
    const passwordDigest = this.generatePasswordDigest(nonce.bytes, created, this.config.password);

    // Generate unique IDs for the security elements
    const timestampId = `TS-${uuidv4()}`;
    const usernameTokenId = `UsernameToken-${uuidv4()}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:v2="http://ec.europa.eu/tracesnt/certificate/eudr/submission/v2" 
                  xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4">
    <soapenv:Header>    
        <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" 
                      xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" 
                      soapenv:mustUnderstand="1">
            <wsu:Timestamp wsu:Id="${timestampId}">
                <wsu:Created>${created}</wsu:Created>
                <wsu:Expires>${expires}</wsu:Expires>
            </wsu:Timestamp>
            <wsse:UsernameToken wsu:Id="${usernameTokenId}">
                <wsse:Username>${this.config.username}</wsse:Username>
                <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${passwordDigest}</wsse:Password>
                <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce.base64}</wsse:Nonce>
                <wsu:Created>${created}</wsu:Created>
            </wsse:UsernameToken>
        </wsse:Security>
        <v4:WebServiceClientId>${this.config.webServiceClientId}</v4:WebServiceClientId>
    </soapenv:Header>
    <soapenv:Body>
        <v2:RetractStatementRequest>
            <v2:ddsIdentifier>${ddsIdentifier}</v2:ddsIdentifier>
        </v2:RetractStatementRequest>
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Parse XML response from retractDds operation
   * @private
   * @param {string} xmlResponse - XML response from the service
   * @returns {Promise<Object>} Parsed response object
   */
  parseRetractResponse(xmlResponse) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse XML response: ${err.message}`));
          return;
        }

        try {
          // Extract response information from the SOAP response
          const envelope = result['S:Envelope'] || result['SOAP-ENV:Envelope'] || result['soapenv:Envelope'];
          if (!envelope) {
            throw new Error('Invalid response: Missing Envelope element');
          }

          const body = envelope['S:Body'] || envelope['SOAP-ENV:Body'] || envelope['soapenv:Body'];
          if (!body) {
            throw new Error('Invalid response: Missing Body element');
          }

          // Find the RetractStatementResponse element regardless of namespace prefix
          let response = null;
          let status = null;

          // Look for any key that ends with 'RetractStatementResponse'
          for (const key in body) {
            if (key.endsWith(':RetractStatementResponse') || key === 'RetractStatementResponse') {
              response = body[key];
              break;
            }
          }

          if (!response) {
            // If we can't find the response element, try to extract raw response data
            logger.debug({ rawXmlResponse: xmlResponse }, 'Raw XML response:');
            throw new Error('Invalid response: Missing RetractStatementResponse element');
          }

          // Look for status field with any namespace prefix
          for (const key in response) {
            if (key.endsWith(':status') || key === 'status') {
              status = response[key];
              break;
            }
          }

          const success = status === 'SC_200_OK';

          resolve({
            raw: xmlResponse,
            parsed: result,
            success,
            status,
            message: success ? 'DDS retracted successfully' : `Retract failed with status: ${status || 'unknown'}`
          });
        } catch (error) {
          // Include the raw response in the error for debugging
          const errorMsg = `Failed to process retract response: ${error.message}`;
          logger.debug({ error, rawResponse: xmlResponse }, errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });
  }

  /**
   * Retract a DDS from the EUDR Submission Service V2
   * @param {string} ddsIdentifier - UUID of the DDS to retract
   * @param {Object} options - Additional options for the request
   * @returns {Promise<Object>} Response object indicating success
   * @throws {Error} If the request fails or returns an error
   */
  async retractDds(ddsIdentifier, options = {}) {
    try {
      if (!ddsIdentifier) {
        throw new Error('DDS identifier is required');
      }

      // Create SOAP envelope
      const soapEnvelope = this.createRetractSoapEnvelope(ddsIdentifier);

      // Enable debug logging if requested
      if (options.debug) {
        logger.debug({ requestSoapEnvelope: soapEnvelope }, 'Request SOAP envelope V2:');
      }

      // Send the request
      const response = await axios({
        method: 'post',
        url: this.config.endpoint,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/submission/v2#retractDds'
        },
        data: soapEnvelope,
        timeout: this.config.timeout,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: this.config.ssl
        })
      });

      // Log response for debugging if requested
      if (options.debug) {
        logger.debug({ responseStatus: response.status }, 'Response status V2:');
        logger.debug({ responseData: response.data }, 'Response data V2:');
      }

      // Return raw response if requested
      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      // Parse the XML response
      const parsedResponse = await this.parseRetractResponse(response.data);

      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    }
    catch (error) {
      // Use the error handler if available
      if (EudrErrorHandler) {
        throw EudrErrorHandler.handleError(error);
      }

      // Default error handling if error handler is not available
      const errorResponse = {
        error: true,
        message: error.message,
        details: {}
      };

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorResponse.details = {
          httpStatus: error.response.status,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      }
      else if (error.request) {
        // The request was made but no response was received
        errorResponse.details = {
          request: 'Request sent but no response received'
        };
      }

      throw errorResponse;
    }
  }
}

// Export the class
module.exports = EudrSubmissionClientV2;

// Example usage when run directly
if (require.main === module) {
  const scenariosV2 = require('./scenarios-v2');

  // Default configuration
  const defaultConfig = {
    username: 'n00ihxdy',
    password: '5YXQfrM9XSzS00FTSUPWT7scGEHLrd2NBc0DDJb6',
    webServiceClientId: 'eudr-test'
  };

  async function main() {
    try {
      // Create client instance
      const client = new EudrSubmissionClientV2(defaultConfig);

      // Get the test scenario from command-line arguments or use default
      const scenarioName = process.argv[2] || 'operator';
      const request = scenariosV2[scenarioName.toLowerCase()] || scenariosV2.operator;

      logger.info({ scenarioName }, `Preparing ${scenarioName} scenario V2 SOAP request...`);
      logger.info('Sending request to EUDR Submission Service V2...');

      // Submit the DDS
      const result = await client.submitDds(request);

      logger.info({ httpStatus: result.httpStatus, ddsIdentifier: result.ddsIdentifier }, 'Response received:');
      logger.info({ ddsIdentifier: result.ddsIdentifier }, 'DDS Identifier:');
      logger.info({ rawXmlResponse: result.raw.substring(0, 150) + '...' }, 'Raw XML Response (first 150 chars):');

      // Print usage instructions
      logger.info('\nKorištenje V2:');
      logger.info('  node submission-service-v2.js [scenarij]');
      logger.info('\nDostupni scenariji V2:');
      logger.info('  operator             - Operator scenarij s geolokacijom');
      logger.info('  representative       - Ovlašteni predstavnik scenarij');
      logger.info('  domestic             - Domaći scenarij s geolokacijom');
    } catch (error) {
      logger.debug({ error }, 'Error in main function V2:');
      logger.debug({ errorJson: JSON.stringify(error, null, 2) }, 'Error JSON:');
    }
  }

  // Run the main function
  main();
}
