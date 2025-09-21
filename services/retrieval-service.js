/**
 * EUDR Retrieval Service Client (using axios for raw XML)
 * 
 * This module provides a reusable class for connecting to the EUDR Retrieval Service
 * with proper WSSE security headers using direct XML and HTTP requests.
 * 
 * Supports both CF3 and CF7 specifications:
 * - CF3 v1.4: getDdsInfo, getDdsInfoByInternalReferenceNumber (with rejection reason & CA communication)
 * - CF7 v1.4: getStatementByIdentifiers, getReferencedDDS (supply chain traversal)
 * 
 * Automatic endpoint generation:
 * - For webServiceClientId 'eudr-repository': production environment
 * - For webServiceClientId 'eudr-test': acceptance environment
 * - For custom webServiceClientId: endpoint must be provided manually
 */

const axios = require('axios');
const crypto = require('node:crypto');
const { v4: uuidv4 } = require('uuid');
const { parseString, processors } = require('xml2js');
const { validateAndGenerateEndpoint } = require('../utils/endpoint-utils');

/**
 * EUDR Retrieval Service Client class
 */
class EudrRetrievalClient {
  /**
   * Create a new EUDR Retrieval Service client
   * @param {Object} config - Configuration object
   * @param {string} [config.endpoint] - Service endpoint URL (optional for standard webServiceClientId: 'eudr-repository', 'eudr-test')
   * @param {string} config.username - Authentication username (required)
   * @param {string} config.password - Authentication password (required)
   * @param {string} config.webServiceClientId - Client ID ('eudr-repository', 'eudr-test', or custom)
   * @param {number} [config.timestampValidity=60] - Timestamp validity in seconds
   * @param {number} [config.timeout=10000] - Request timeout in milliseconds
   * @param {boolean} [config.ssl=false] - SSL configuration: true for secure (default), false to allow unauthorized certificates
   * 
   * @example
   * // Automatic endpoint generation for standard client IDs
   * const client = new EudrRetrievalClient({
   *   username: 'user',
   *   password: 'pass',
   *   webServiceClientId: 'eudr-test'
   * });
   * 
   * @example
   * // Manual endpoint override
   * const client = new EudrRetrievalClient({
   *   endpoint: 'https://custom-endpoint.com/ws/service',
   *   username: 'user',
   *   password: 'pass',
   *   webServiceClientId: 'custom-client'
   * });
   */
  constructor(config) {
    // Validate and potentially generate endpoint and SOAP action
    const validatedConfig = validateAndGenerateEndpoint(config, 'retrieval', 'v1');
    
    this.config = {
      // Default configuration (only for non-required fields)
      timestampValidity: 60, // 1 minute as per requirements
      timeout: 10000, // 10 seconds timeout
      ssl: false, // Default to insecure for backward compatibility
      ...validatedConfig // Override with validated config (includes endpoint)
    };

    // Validate required configuration first
    this.validateConfig();

    // Set endpoint - prioritize endpoint, fallback to wsdlUrl for compatibility
    if (this.config.endpoint) {
      this.endpoint = this.config.endpoint;
    } else if (this.config.wsdlUrl) {
      this.endpoint = this.config.wsdlUrl.replace('?wsdl', '');
    } else {
      throw new Error('Either endpoint or wsdlUrl must be provided');
    }
  }

  /**
   * Validate that required configuration is provided
   * @private
   * @throws {Error} If required configuration is missing
   */
  validateConfig() {
    // Check that either endpoint or wsdlUrl is provided
    if (!this.config.endpoint && !this.config.wsdlUrl) {
      throw new Error('Either endpoint or wsdlUrl must be provided');
    } 
    
    const requiredFields = ['username', 'password', 'webServiceClientId'];
    for (const field of requiredFields) {
      if (!this.config[field]) {
        throw new Error(`Missing required configuration: ${field}`);
      }
    }
  }

  /**
   * Helper method to create endpoint from base URL and service name
   * @static
   * @param {string} baseUrl - Base URL (e.g., from EUDR_TRACES_BASE_URL env var)
   * @param {string} serviceName - Service name (default: 'EUDRRetrievalServiceV1')
   * @returns {string} Complete endpoint URL
   */
  static createEndpointFromBaseUrl(baseUrl, serviceName = 'EUDRRetrievalServiceV1') {
    return `${baseUrl}/tracesnt/ws/${serviceName}`;
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
   * Process and standardize error responses
   * Converts SOAP authentication faults to proper HTTP status codes
   * @private
   * @param {Error} error - The caught error
   * @returns {Object} Structured error response
   */
  processError(error) {
    const errorResponse = {
      error: true,
      message: error.message,
      details: {}
    };

    if (error.response) {
      // The request was made and the server responded with a status code
      let status = error.response.status;
      let statusText = error.response.statusText;
      
      // Check if this is a SOAP authentication fault and convert to 401
      if (status === 500 && error.response.data && 
          (error.response.data.includes('UnauthenticatedException') || 
           error.response.data.includes('Authentication') ||
           error.response.data.includes('Unauthorized'))) {
        status = 401;
        statusText = 'Unauthorized';
        errorResponse.message = 'Authentication failed - invalid credentials';
      }
      
      errorResponse.details = {
        httpStatus: status,
        status: status,
        statusText: statusText,
        data: error.response.data
      };
    } else if (error.request) {
      // The request was made but no response was received
      errorResponse.details = {
        request: 'Request sent but no response received'
      };
    }

    return errorResponse;
  }

  /**
   * Create SOAP envelope for the getDdsInfo operation (retrieve via UUID)
   * @private
   * @param {string|string[]} uuids - UUID or array of UUIDs to retrieve
   * @returns {string} Complete SOAP envelope as XML string
   */
  createGetDdsInfoEnvelope(uuids) {
    // Generate required values for security header
    const nonce = this.generateNonce();
    const created = this.getCurrentTimestamp();
    const expires = this.getExpirationTimestamp(this.config.timestampValidity);
    const passwordDigest = this.generatePasswordDigest(nonce.bytes, created, this.config.password);

    // Generate unique IDs for the security elements
    const timestampId = `TS-${uuidv4()}`;
    const usernameTokenId = `UsernameToken-${uuidv4()}`;

    // Ensure uuids is an array
    const uuidArray = Array.isArray(uuids) ? uuids : [uuids];

    // Create UUID elements
    const identifierElements = uuidArray.map(uuid =>
      `<v1:identifier>${uuid}</v1:identifier>`
    ).join('');

    // Create the complete SOAP envelope
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:v1="http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v1" 
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
        <v1:GetStatementInfoRequest>
            ${identifierElements}
        </v1:GetStatementInfoRequest>
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Create SOAP envelope for the getDdsInfoByInternalReferenceNumber operation
   * @private
   * @param {string} internalReferenceNumber - Internal reference number to search for
   * @returns {string} Complete SOAP envelope as XML string
   */
  createGetDdsInfoByInternalReferenceNumberEnvelope(internalReferenceNumber) {
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
                  xmlns:v1="http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v1" 
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
        <v1:GetDdsInfoByInternalReferenceNumberRequest>${internalReferenceNumber}</v1:GetDdsInfoByInternalReferenceNumberRequest>
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Parse XML response to extract the DDS information
   * @private
   * @param {string} xmlResponse - XML response from the service
   * @param {Object} options - Additional options
   * @param {boolean} options.decodeGeojson - Whether to decode base64 geometryGeojson to plain string
   * @returns {Promise<Object>} Parsed response object
   */
  parseResponse(xmlResponse, options = {}) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { 
        explicitArray: false,
        valueProcessors: [processors.parseNumbers] 
      }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse XML response: ${err.message}`));
          return;
        }

        try {
          // Extract the DDS information from the response
          const envelope = result['S:Envelope'] || result['soapenv:Envelope'];
          const body = envelope['S:Body'] || envelope['soapenv:Body'];

          // Check response type and extract appropriate data
          // Support multiple namespace prefixes (ns4, ns5, etc.)
          let ddsInfoResponse;
          
          // Find response by checking multiple possible namespace prefixes
          const responseKeys = Object.keys(body);
          const statementInfoResponse = responseKeys.find(key => key.endsWith(':GetStatementInfoResponse'));
          const ddsInfoByRefResponse = responseKeys.find(key => key.endsWith(':GetDdsInfoByInternalReferenceNumberResponse'));
          const statementByIdResponse = responseKeys.find(key => key.endsWith(':GetStatementByIdentifiersResponse'));
          const referencedDdsResponse = responseKeys.find(key => key.endsWith(':GetReferencedDDSResponse') || key.endsWith(':GetReferencedDdsResponse'));
          
          if (statementInfoResponse) {
            ddsInfoResponse = body[statementInfoResponse];
          }
          else if (ddsInfoByRefResponse) {
            ddsInfoResponse = body[ddsInfoByRefResponse];
          }
          else if (statementByIdResponse) {
            ddsInfoResponse = body[statementByIdResponse];
          }
          else if (referencedDdsResponse) {
            ddsInfoResponse = body[referencedDdsResponse];
          }
          else {
            // Check for fault
            if (body['S:Fault'] || body['soapenv:Fault']) {
              const fault = body['S:Fault'] || body['soapenv:Fault'];
              reject(new Error(`SOAP Fault: ${fault.faultstring || JSON.stringify(fault)}`));
              return;
            }

            // Enhanced error message with debug information
            const availableKeys = Object.keys(body).join(', ');
            reject(new Error(`Unknown response format. Available keys: ${availableKeys}`));
            return;
          }

          // Extract statement info with flexible namespace support
          const responseItemKeys = Object.keys(ddsInfoResponse || {});
          const statementInfoKey = responseItemKeys.find(key => key.endsWith(':statementInfo'));
          const statementKey = responseItemKeys.find(key => key.endsWith(':statement'));
          
          const ddsInfoItems = ddsInfoResponse[statementInfoKey] || ddsInfoResponse[statementKey];
          const ddsInfoArray = Array.isArray(ddsInfoItems) ? ddsInfoItems : (ddsInfoItems ? [ddsInfoItems] : []);

          const mappedDdsInfo = ddsInfoArray.map(item => {
            const cleanObject = (obj) => {
              if (!obj || typeof obj !== 'object') return obj;

              if (Array.isArray(obj)) {
                return obj.map(subItem => cleanObject(subItem));
              }

              const cleaned = {};
              for (const [key, value] of Object.entries(obj)) {
                const propertyName = key.split(':').pop();
                
                if (propertyName === 'associateStatement') {
                  const statements = Array.isArray(value) ? value : [value];
                  cleaned['associatedStatements'] = statements.map(st => cleanObject(st));
                } else if (propertyName === 'commodities') {
                  // Ensure commodities is always an array
                  const commodities = Array.isArray(value) ? value : (value ? [value] : []);
                  cleaned[propertyName] = commodities.map(commodity => cleanObject(commodity));
                } else if (propertyName === 'producers') {
                  // Ensure producers is always an array
                  const producers = Array.isArray(value) ? value : (value ? [value] : []);
                  cleaned[propertyName] = producers.map(producer => cleanObject(producer));
                } else if (propertyName === 'speciesInfo') {
                  // Ensure speciesInfo is always an array
                  const speciesInfo = Array.isArray(value) ? value : (value ? [value] : []);
                  cleaned[propertyName] = speciesInfo.map(species => cleanObject(species));
                } else if (propertyName === 'referenceNumber') {
                  // referenceNumber is always a single value, not an array
                  cleaned[propertyName] = value;
                } else {
                  cleaned[propertyName] = cleanObject(value);
                }
              }
              return cleaned;
            };
            return cleanObject(item);
          });

          // Special handling for getStatementByIdentifiers - return complete DDS structure
          if (statementByIdResponse) {
            // For getStatementByIdentifiers, we need to return the complete DDS structure
            // that matches the submission request format
            const processedDdsInfo = mappedDdsInfo.map(item => {
              // Convert status from object to string for consistency with submission format
              // but preserve the date information
              if (item.status && typeof item.status === 'object') {
                const statusValue = item.status.status || item.status;
                const statusDate = item.status.date;
                item.status = statusValue;
                if (statusDate) {
                  item.statusDate = statusDate;
                }
              }
              
              // Check if any producer has geometryGeojson to determine geoLocationConfidential
              let hasGeometry = false;
              if (item.commodities && Array.isArray(item.commodities)) {
                for (const commodity of item.commodities) {
                  if (commodity.producers && Array.isArray(commodity.producers)) {
                    for (const producer of commodity.producers) {
                      if (producer.geometryGeojson) {
                        hasGeometry = true;
                        // Decode GeoJSON if requested
                        if (options.decodeGeojson) {
                          try {
                            const decodedString = Buffer.from(producer.geometryGeojson, 'base64').toString('utf-8');
                            producer.geometryGeojson = JSON.parse(decodedString);
                          } catch (error) {
                            // If decoding fails, keep original value
                            console.warn('Failed to decode geometryGeojson:', error.message);
                          }
                        }
                      }
                    }
                  }
                }
              }
              
              // Add missing fields that should be present in complete DDS structure
              if (!item.geoLocationConfidential) {
                item.geoLocationConfidential = !hasGeometry; // false if geometry exists, true if not
              }
              
              // Ensure all required fields are present for complete DDS structure
              if (!item.activityType) {
                item.activityType = 'DOMESTIC'; // Default value
              }
              
              return item;
            });
            
            resolve({
              ddsInfo: processedDdsInfo
            });
          } else {
            // For other methods, return the standard format
            resolve({
              ddsInfo: mappedDdsInfo
            });
          }

        } catch (error) {
          reject(new Error(`Failed to extract DDS info from response: ${error.message}`));
        }
      });
    });
  }

  /**
   * Retrieve DDS information by UUID (CF3 v1.4)
   * @param {string|string[]} uuids - UUID or array of UUIDs to retrieve (max 100)
   * @param {Object} options - Additional options
   * @param {boolean} options.rawResponse - Whether to return the raw XML response
   * @returns {Promise<Object>} Response object with DDS information including v1.4 fields:
   *   - rejection reason (if status is "Rejected")
   *   - CA communication (if provided)
   */
  async getDdsInfo(uuids, options = {}) {
    try {
      // Validate input
      if (!uuids) {
        throw new Error('UUID(s) must be provided');
      }

      // Ensure uuids is an array
      const uuidArray = Array.isArray(uuids) ? uuids : [uuids];

      // Check limit (100 UUIDs per call as per documentation)
      if (uuidArray.length > 100) {
        throw new Error('Maximum of 100 UUIDs can be retrieved in a single call');
      }

      // Create SOAP envelope
      const soapEnvelope = this.createGetDdsInfoEnvelope(uuidArray);

      // Send the request
      const response = await axios({
        method: 'post',
        url: this.endpoint,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/getDdsInfo'
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

      const result = {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };

      // Add raw response only if requested
      if (options.rawResponse) {
        result.raw = response.data;
      }

      return result;
    } catch (error) {
      // Use the centralized error processing
      throw this.processError(error);
    }
  }

  /**
   * Retrieve DDS information by internal reference number (CF3 v1.4)
   * @param {string} internalReferenceNumber - Internal reference number to search for (3-50 chars)
   * @param {Object} options - Additional options
   * @param {boolean} options.rawResponse - Whether to return the raw XML response
   * @returns {Promise<Object>} Response object with DDS information including v1.4 fields:
   *   - rejection reason (if status is "Rejected")
   *   - CA communication (if provided)
   */
  async getDdsInfoByInternalReferenceNumber(internalReferenceNumber, options = {}) {
    try {
      // Validate input
      if (!internalReferenceNumber) {
        throw new Error('Internal reference number must be provided');
      }

      // Validate length (min 3, max 50 characters as per documentation)
      if (internalReferenceNumber.length < 3 || internalReferenceNumber.length > 50) {
        throw new Error('Internal reference number must be between 3 and 50 characters');
      }

      // Create SOAP envelope
      const soapEnvelope = this.createGetDdsInfoByInternalReferenceNumberEnvelope(internalReferenceNumber);

      // Send the request
      const response = await axios({
        method: 'post',
        url: this.endpoint,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/getDdsInfoByInternalReferenceNumber'
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

      const result = {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };

      // Add raw response only if requested
      if (options.rawResponse) {
        result.raw = response.data;
      }

      return result;
    } catch (error) {
      // Use the centralized error processing
      throw this.processError(error);
    }
  }

  /**
   * Create SOAP envelope for the getStatementByIdentifiers operation
   * @private
   * @param {string} referenceNumber - DDS reference number
   * @param {string} verificationNumber - DDS verification number
   * @returns {string} Complete SOAP envelope as XML string
   */
  createGetStatementByIdentifiersEnvelope(referenceNumber, verificationNumber) {
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
                  xmlns:v1="http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v1" 
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
        <v1:GetStatementByIdentifiersRequest>
            <v1:referenceNumber>${referenceNumber}</v1:referenceNumber>
            <v1:verificationNumber>${verificationNumber}</v1:verificationNumber>
        </v1:GetStatementByIdentifiersRequest>
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Retrieve DDS by reference number and verification number (CF7 v1.4)
   * @param {string} referenceNumber - DDS reference number
   * @param {string} verificationNumber - DDS verification number
   * @param {Object} options - Additional options
   * @param {boolean} options.rawResponse - Whether to return the raw XML response
   * @param {boolean} options.decodeGeojson - Whether to decode base64 geometryGeojson to plain string (default: false)
   * @returns {Promise<Object>} Response object with complete DDS content including v1.4 fields:
   *   - Full DDS content (geolocation, activity, etc.)
   *   - Referenced DDS list with security numbers for supply chain traversal
   *   - Availability date
   * @throws {Object} Error response object with details
   */
  async getStatementByIdentifiers(referenceNumber, verificationNumber, options = {}) {
    try {
      // Validate input
      if (!referenceNumber || !verificationNumber) {
        throw new Error('Reference number and verification number must be provided');
      }

      // Create SOAP envelope
      const soapEnvelope = this.createGetStatementByIdentifiersEnvelope(referenceNumber, verificationNumber);

      // Send the request
      const response = await axios({
        method: 'post',
        url: this.endpoint,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/eudr4authorities/getStatementByIdentifiers'
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
      const parsedResponse = await this.parseResponse(response.data, options);

      const result = {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };

      // Add raw response only if requested
      if (options.rawResponse) {
        result.raw = response.data;
      }

      return result;
    } catch (error) {
      // Use the centralized error processing
      throw this.processError(error);
    }
  }

  /**
   * Process errors with centralized handling and SOAP to HTTP conversion
   * @private
   * @param {Object} error - The error object from axios or other source
   * @returns {Object} Processed error response
   */
  processError(error) {
    const errorResponse = {
      error: true,
      message: error.message,
      details: {}
    };

    if (error.response) {
      let status = error.response.status;
      let statusText = error.response.statusText;

      // Check if this is a SOAP authentication fault and convert to 401
      if (status === 500 && error.response.data &&
          (error.response.data.includes('UnauthenticatedException') ||
           error.response.data.includes('Authentication') ||
           error.response.data.includes('Unauthorized'))) {
        status = 401;
        statusText = 'Unauthorized';
        errorResponse.message = 'Authentication failed - invalid credentials';
      }

      errorResponse.details = {
        httpStatus: status,
        status: status,
        statusText: statusText,
        data: error.response.data
      };
    } else if (error.request) {
      errorResponse.details = {
        request: 'Request sent but no response received'
      };
    }
    return errorResponse;
  }
}

module.exports = EudrRetrievalClient;