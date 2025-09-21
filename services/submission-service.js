/**
 * EUDR Submission Service Client (using axios for raw XML)
 * 
 * This module provides a reusable class for connecting to the EUDR Submission Service
 * with proper WSSE security headers using direct XML and HTTP requests.
 * This implementation uses axios for HTTP requests and builds the SOAP
 * envelope manually, which might be useful if the SOAP libraries don't
 * work as expected.
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

/**
 * EUDR Submission Service Client class
 */
class EudrSubmissionClient {
  /**
   * Create a new EUDR Submission Service client
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
   * const client = new EudrSubmissionClient({
   *   username: 'user',
   *   password: 'pass',
   *   webServiceClientId: 'eudr-test'
   * });
   * 
   * @example
   * // Manual endpoint override
   * const client = new EudrSubmissionClient({
   *   endpoint: 'https://custom-endpoint.com/ws/service',
   *   username: 'user',
   *   password: 'pass',
   *   webServiceClientId: 'custom-client'
   * });
   */
  constructor(config) {
    // Validate and potentially generate endpoint
    const validatedConfig = validateAndGenerateEndpoint(config, 'submission', 'v1');
    
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

    logger.debug("PASSWORD", password);
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
   * Create SOAP envelope for the submitDds operation
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

    // Create the complete SOAP envelope
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:v1="http://ec.europa.eu/tracesnt/certificate/eudr/submission/v1" 
                  xmlns:v11="http://ec.europa.eu/tracesnt/certificate/eudr/model/v1" 
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
        <v1:SubmitStatementRequest>
            <v1:operatorType>${request.operatorType}</v1:operatorType>
            <v1:statement>
                ${this.generateStatementXml(request.statement)}
            </v1:statement>
        </v1:SubmitStatementRequest>
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Create SOAP envelope for the amendDds operation
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

    // Create the complete SOAP envelope
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:v1="http://ec.europa.eu/tracesnt/certificate/eudr/submission/v1" 
                  xmlns:v11="http://ec.europa.eu/tracesnt/certificate/eudr/model/v1" 
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
        <v1:AmendStatementRequest>
            <v1:ddsIdentifier>${ddsIdentifier}</v1:ddsIdentifier>
            <v1:statement>
                ${this.generateStatementXml(statement)}
            </v1:statement>
        </v1:AmendStatementRequest>
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Generate XML for the statement part of the request
   * @private
   * @param {Object} statement - The statement object
   * @returns {string} Statement XML
   */
  generateStatementXml(statement) {
    let xml = '';

    logger.debug('statement01', statement);

    // Add required fields in correct order - with validation
    if (!statement.internalReferenceNumber) {
      throw new Error('internalReferenceNumber is required');
    }
    xml += `<v11:internalReferenceNumber>${statement.internalReferenceNumber}</v11:internalReferenceNumber>`;
    
    if (!statement.activityType) {
      throw new Error('activityType is required');
    }
    xml += `<v11:activityType>${statement.activityType}</v11:activityType>`;

    // Add operator details IMMEDIATELY after activityType (V1 XSD schema requirement - line 53)
    if (statement.operator) {
      xml += '<v11:operator>';
      if (statement.operator.referenceNumber) {
        const refArray = Array.isArray(statement.operator.referenceNumber) ? statement.operator.referenceNumber : [statement.operator.referenceNumber];
        for (const ref of refArray) {
          xml += '<v11:referenceNumber>';
          xml += `<v11:identifierType>${ref.identifierType}</v11:identifierType>`;
          xml += `<v11:identifierValue>${ref.identifierValue}</v11:identifierValue>`;
          xml += '</v11:referenceNumber>';
        }
      }
      if (statement.operator.nameAndAddress) {
        xml += '<v11:nameAndAddress>';
        xml += `<v4:name>${statement.operator.nameAndAddress.name}</v4:name>`;
        xml += `<v4:country>${statement.operator.nameAndAddress.country}</v4:country>`;
        xml += `<v4:address>${statement.operator.nameAndAddress.address}</v4:address>`;
        xml += '</v11:nameAndAddress>';
      }
      if (statement.operator.email) {
        xml += `<v11:email>${statement.operator.email}</v11:email>`;
      }
      if (statement.operator.phone) {
        xml += `<v11:phone>${statement.operator.phone}</v11:phone>`;
      }
      xml += '</v11:operator>';
    }

    // Add optional fields in correct order after operator
    if (statement.countryOfActivity) {
      xml += `<v11:countryOfActivity>${statement.countryOfActivity}</v11:countryOfActivity>`;
    }

    if (statement.borderCrossCountry) {
      xml += `<v11:borderCrossCountry>${statement.borderCrossCountry}</v11:borderCrossCountry>`;
    }

    if (statement.countryOfEntry) {
      xml += `<v11:countryOfEntry>${statement.countryOfEntry}</v11:countryOfEntry>`;
    }

    if (statement.comment) {
      xml += `<v11:comment>${statement.comment}</v11:comment>`;
    }

    // Add commodities after all other elements, but before geoLocationConfidential
    if (statement.commodities) {
      for (const commodity of Array.isArray(statement.commodities) ? statement.commodities : [statement.commodities]) {
        xml += '<v11:commodities>';
        xml += this.generateCommodityXml(commodity);
        xml += '</v11:commodities>';
      }
    }

    // Add geoLocationConfidential flag
    xml += `<v11:geoLocationConfidential>${statement.geoLocationConfidential || false}</v11:geoLocationConfidential>`;

    // Add associated statements if present (support both object and array)
    if (statement.associatedStatements) {
      const assocArray = Array.isArray(statement.associatedStatements) ? statement.associatedStatements : [statement.associatedStatements];
      for (const assoc of assocArray) {
        xml += '<v11:associatedStatements>';
        xml += `<v11:referenceNumber>${assoc.referenceNumber}</v11:referenceNumber>`;
        if (assoc.verificationNumber) {
          xml += `<v11:verificationNumber>${assoc.verificationNumber}</v11:verificationNumber>`;
        }
        xml += '</v11:associatedStatements>';
      }
    }

    logger.debug('xml', xml);

    return xml;
  }

  /**
   * Generate XML for a commodity
   * @private
   * @param {Object} commodity - The commodity object
   * @returns {string} Commodity XML
   */
  generateCommodityXml(commodity) {
    let xml = '';

    // Add descriptors
    if (commodity.descriptors) {
      xml += '<v11:descriptors>';
      if (commodity.descriptors.descriptionOfGoods) {
        xml += `<v11:descriptionOfGoods>${commodity.descriptors.descriptionOfGoods}</v11:descriptionOfGoods>`;
      }
      if (commodity.descriptors.goodsMeasure) {
        xml += '<v11:goodsMeasure>';
        const measure = commodity.descriptors.goodsMeasure;
        if (measure.volume) xml += `<v11:volume>${measure.volume}</v11:volume>`;
        if (measure.netWeight) xml += `<v11:netWeight>${measure.netWeight}</v11:netWeight>`;
        if (measure.supplementaryUnit) xml += `<v11:supplementaryUnit>${measure.supplementaryUnit}</v11:supplementaryUnit>`;
        if (measure.supplementaryUnitQualifier) xml += `<v11:supplementaryUnitQualifier>${measure.supplementaryUnitQualifier}</v11:supplementaryUnitQualifier>`;
        xml += '</v11:goodsMeasure>';
      }
      xml += '</v11:descriptors>';
    }

    // Add HS heading
    if (commodity.hsHeading) {
      xml += `<v11:hsHeading>${commodity.hsHeading}</v11:hsHeading>`;
    }

    // Add species info (support both object and array)
    if (commodity.speciesInfo) {
      const speciesInfoArray = Array.isArray(commodity.speciesInfo) ? commodity.speciesInfo : [commodity.speciesInfo];
      for (const speciesInfo of speciesInfoArray) {
        xml += '<v11:speciesInfo>';
        if (speciesInfo.scientificName) {
          xml += `<v11:scientificName>${speciesInfo.scientificName}</v11:scientificName>`;
        }
        if (speciesInfo.commonName) {
          xml += `<v11:commonName>${speciesInfo.commonName}</v11:commonName>`;
        }
        xml += '</v11:speciesInfo>';
      }
    }

    // Add producers
    if (commodity.producers) {
      for (const producer of Array.isArray(commodity.producers) ? commodity.producers : [commodity.producers]) {
        xml += '<v11:producers>';
        if (producer.country) xml += `<v11:country>${producer.country}</v11:country>`;
        if (producer.name) xml += `<v11:name>${producer.name}</v11:name>`;
        if (producer.geometryGeojson) xml += `<v11:geometryGeojson>${producer.geometryGeojson}</v11:geometryGeojson>`;
        xml += '</v11:producers>';
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
   * Submit a DDS to the EUDR Submission Service
   * @param {Object} request - Request object containing the DDS data
   * @param {Object} options - Additional options for the request
   * @param {boolean} options.rawResponse - Whether to return the raw XML response
   * @param {boolean} options.encodeGeojson - Whether to encode plain geometryGeojson strings to base64 (default: false)
   * @returns {Promise<Object>} Response object with DDS identifier
   */
  async submitDds(request, options = {}) {
    try {
      logger.debug('DEBUG: Starting submitDds with request:', JSON.stringify(request, null, 2));
      
      // Encode GeoJSON if requested
      if (options.encodeGeojson) {
        this.encodeGeojsonInRequest(request);
      }
      
      // Create SOAP envelope
      logger.debug('DEBUG: Creating SOAP envelope...');
      const soapEnvelope = this.createSoapEnvelope(request);
      logger.debug('DEBUG: SOAP envelope created, length:', soapEnvelope.length);

      // Send the request
      logger.debug('DEBUG: Sending request to:', this.config.endpoint);
      logger.debug('DEBUG: Timeout:', this.config.timeout);
      logger.debug('DEBUG: SOAP envelope preview (first 200 chars):', soapEnvelope.substring(0, 200));
      
      const response = await axios({
        method: 'post',
        url: this.config.endpoint,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/submission/v1'
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
      const parsedResponse = await this.parseResponse(response.data);

      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    }
    catch (error) {
      logger.debug('DEBUG: Error in submitDds:', error.message);
      logger.debug('DEBUG: Error type:', error.constructor.name);
      logger.debug('DEBUG: Error stack:', error.stack);
      
      // Log detailed error information
      if (error.response) {
        logger.debug('DEBUG: Error has response - Status:', error.response.status);
        logger.debug('DEBUG: Error has response - StatusText:', error.response.statusText);
        logger.debug('DEBUG: Error has response - Data length:', error.response.data?.length || 0);
        logger.debug('DEBUG: Error has response - Data type:', typeof error.response.data);
        if (error.response.data) {
          logger.debug('DEBUG: Error response data (first 1500 chars):', error.response.data.substring(0, 1500));
        }
      } else if (error.request) {
        logger.debug('DEBUG: Error has request but no response');
        logger.debug('DEBUG: Request details:', error.request);
      } else {
        logger.debug('DEBUG: Error has neither response nor request');
      }
      
      // Log additional error properties
      logger.debug('DEBUG: Error code:', error.code);
      logger.debug('DEBUG: Error config:', error.config);
      logger.debug('DEBUG: Error isAxiosError:', error.isAxiosError);
      
      // Use the error handler if available
      if (EudrErrorHandler) {
        logger.debug('DEBUG: Using EudrErrorHandler...');
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
   * Amend an existing DDS in the EUDR Submission Service
   * @param {string} ddsIdentifier - UUID of the DDS to amend
   * @param {Object} statement - The updated DDS statement
   * @param {Object} options - Additional options for the request
   * @param {boolean} options.rawResponse - Whether to return the raw XML response
   * @param {boolean} options.encodeGeojson - Whether to encode plain geometryGeojson strings to base64 (default: false)
   * @returns {Promise<Object>} Response object indicating success
   */
  async amendDds(ddsIdentifier, statement, options = {}) {
    try {
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
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/submission/v1#amendDds'
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
   * Create SOAP envelope for the retractDds operation
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
                  xmlns:v1="http://ec.europa.eu/tracesnt/certificate/eudr/submission/v1" 
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
        <v1:RetractStatementRequest>
            <v1:ddsIdentifier>${ddsIdentifier}</v1:ddsIdentifier>
        </v1:RetractStatementRequest>
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
            logger.debug('Raw XML response:', xmlResponse);
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
          logger.error(errorMsg);
          logger.error('Raw response:', xmlResponse);
          reject(new Error(errorMsg));
        }
      });
    });
  }

  /**
   * Retract a DDS from the EUDR Submission Service
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
        logger.debug('Request SOAP envelope:');
        logger.debug(soapEnvelope);
      }

      // Send the request
      const response = await axios({
        method: 'post',
        url: this.config.endpoint,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/submission/v1#retractDds'
        },
        data: soapEnvelope,
        timeout: this.config.timeout,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: this.config.ssl
        })
      });

      // Log response for debugging if requested
      if (options.debug) {
        logger.debug('Response status:', response.status);
        logger.debug('Response data:', response.data);
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
module.exports = EudrSubmissionClient;

// Example usage when run directly
if (require.main === module) {
  const scenarios = require('./scenarios');

  // Default configuration
  const defaultConfig = {
    username: 'n00ihxdy',
    password: '5YXQfrM9XSzS00FTSUPWT7scGEHLrd2NBc0DDJb6',
    webServiceClientId: 'eudr-test'
  };

  async function main() {
    try {
      // Create client instance
      const client = new EudrSubmissionClient(defaultConfig);

      // Get the test scenario from command-line arguments or use default
      const scenarioName = process.argv[2] || 'domestic';
      const request = scenarios[scenarioName.toLowerCase()] || scenarios.import;

      logger.info(`\nPreparing ${scenarioName} scenario SOAP request...`);
      logger.info('Sending request to EUDR Submission Service...');

      // Submit the DDS
      const result = await client.submitDds(request);

      logger.info('\nResponse received:');
      logger.info('HTTP Status:', result.httpStatus);
      logger.info('DDS Identifier:', result.ddsIdentifier);
      logger.info('\nRaw XML Response (first 150 chars):', result.raw.substring(0, 150) + '...');

      // Print usage instructions
      logger.info('\nKorištenje:');
      logger.info('  node eudr-submission-client-axios.js [scenarij]');
      logger.info('\nDostupni scenariji:');
      logger.info('  import         - Scenarij uvoza s geolokacijom');
      logger.info('  trade          - Scenarij trgovine s referenciranim DDS-om');
      logger.info('  representative - Scenarij ovlaštenog predstavnika');
      logger.info('  domestic       - Domaći scenarij s geolokacijom');
    } catch (error) {
      logger.error('Error in main function:');
      logger.error(JSON.stringify(error, null, 2));
    }
  }

  // Run the main function
  main();
} 