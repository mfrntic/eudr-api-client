/**
 * EUDR Retrieval Service V2 Client (using axios for raw XML)
 * 
 * This module provides a reusable class for connecting to the EUDR Retrieval Service V2
 * with proper WSSE security headers using direct XML and HTTP requests.
 * 
 * Supports CF3 and CF7 specifications with V2 enhancements:
 * - CF3 v1.4: getDdsInfo, getDdsInfoByInternalReferenceNumber (with rejection reason & CA communication)
 * - CF7 v1.4: getStatementByIdentifiers, getReferencedDds (supply chain traversal with V2 namespace)
 * 
 * Key V2 improvements:
 * - Corrected SOAPAction URLs to match WSDL specification
 * - Full getReferencedDds implementation with v2 namespace
 * - Updated endpoint to use EUDRRetrievalServiceV2
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
 * EUDR Retrieval Service V2 Client class
 */
class EudrRetrievalClientV2 {
  /**
   * Create a new EUDR Retrieval Service V2 client
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
   * const client = new EudrRetrievalClientV2({
   *   username: 'user',
   *   password: 'pass',
   *   webServiceClientId: 'eudr-test'
   * });
   * 
   * @example
   * // Manual endpoint override
   * const client = new EudrRetrievalClientV2({
   *   endpoint: 'https://custom-endpoint.com/ws/service',
   *   username: 'user',
   *   password: 'pass',
   *   webServiceClientId: 'custom-client'
   * });
   */
  constructor(config) {
    // Validate and potentially generate endpoint and SOAP action for V2
    const validatedConfig = validateAndGenerateEndpoint(config, 'retrieval', 'v2');
    
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
   * @param {string} serviceName - Service name (default: 'EUDRRetrievalServiceV2')
   * @returns {string} Complete endpoint URL
   */
  static createEndpointFromBaseUrl(baseUrl, serviceName = 'EUDRRetrievalServiceV2') {
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
      errorType: error.errorType || 'UNKNOWN',
      details: {}
    };

    if (error.response) {
      // The request was made and the server responded with a status code
      let status = error.response.status;
      let statusText = error.response.statusText;
      
      // Check for specific EUDR error codes first
      if (error.response.data && error.response.data.includes('EUDR-API-NO-DDS') || error.response.data.includes('EUDR-WEBSERVICE-STATEMENT-NOT-FOUND')) {
        status = 404; // Not Found
        statusText = 'DDS Not Found';
        errorResponse.message = 'DDS not found - the requested DDS does not exist or is not accessible';
        errorResponse.errorType = 'DDS_NOT_FOUND';
      }
      // Check for invalid verification number error
      else if (error.response.data && error.response.data.includes('EUDR-VERIFICATION-NUMBER-INVALID')) {
        status = 400; // Bad Request
        statusText = 'Invalid Verification Number';
        errorResponse.message = 'Invalid verification number - the provided verification number contains invalid characters or format';
        errorResponse.errorType = 'INVALID_VERIFICATION_NUMBER';
      }
     
      // Check for BusinessRulesValidationException fault
      else if (error.response.data && 
          (error.response.data.includes('BusinessRulesValidationException') ||
           error.response.data.includes('BusinessRulesValidationExceptionMessage') ||
           error.response.data.includes('cvc-minLength-valid') ||
           error.response.data.includes('cvc-maxLength-valid') ||
           error.response.data.includes('cvc-pattern-valid') ||
           error.response.data.includes('cvc-type.3.1.3') ||
           error.response.data.includes('SAXParseException') ||
           (error.response.data.includes('<faultcode>S:Client</faultcode>') && 
            error.response.data.includes('facet-valid')))) {
        status = 400; // Bad Request
        statusText = 'Business Rules Validation Failed';
        errorResponse.message = 'Request failed business rules validation';
        errorResponse.errorType = 'BUSINESS_RULES_VALIDATION';
      }
      // Check if this is a SOAP authentication fault and convert to 401
      else if (status === 500 && error.response.data && 
          (error.response.data.includes('UnauthenticatedException') || 
           error.response.data.includes('Authentication') ||
           error.response.data.includes('Unauthorized'))) {
        status = 401;
        statusText = 'Unauthorized';
        errorResponse.message = 'Authentication failed - invalid credentials';
        errorResponse.errorType = 'AUTHENTICATION_FAILED';
      }
      
      errorResponse.details = {
        httpStatus: 500, //SOAP uvijek vraća 500
        status: status,
        statusText: statusText,
        soapFault: error.response.data
      };
      
      // Add fault details if available
      if (error.faultDetails) {
        errorResponse.details.faultDetails = error.faultDetails;
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorResponse.errorType = 'NETWORK_ERROR';
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
      `<v2:identifier>${uuid}</v2:identifier>`
    ).join('');

    // Create the complete SOAP envelope with v2 namespace
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:v2="http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v2" 
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
        <v2:GetStatementInfoRequest>
            ${identifierElements}
        </v2:GetStatementInfoRequest>
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

    // Create the complete SOAP envelope with v2 namespace
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:v2="http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v2" 
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
        <v2:GetDdsInfoByInternalReferenceNumberRequest>${internalReferenceNumber}</v2:GetDdsInfoByInternalReferenceNumberRequest>
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Parse XML response to extract the DDS information
   * @private
   * @param {string} xmlResponse - XML response from the service
   * @returns {Promise<Object>} Parsed response object
   */
  parseResponse(xmlResponse) {
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
          const referencedDdsResponse = responseKeys.find(key => key.endsWith(':GetReferencedDdsResponse'));
          
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
              
              // Check for specific fault types
              if (fault.faultcode && 
                  (fault.faultcode.includes('BusinessRulesValidationException') ||
                   (fault.faultcode.includes('S:Client') && fault.faultstring && 
                    (fault.faultstring.includes('cvc-') || fault.faultstring.includes('facet-valid') || fault.faultstring.includes('SAXParseException'))))) {
                const error = new Error(`Business Rules Validation Failed: ${fault.faultstring || 'Request failed business rules validation'}`);
                error.errorType = 'BUSINESS_RULES_VALIDATION';
                error.faultDetails = fault;
                reject(error);
                return;
              }
              
              // Generic SOAP fault
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
          const referenceDdsKey = responseItemKeys.find(key => key.endsWith(':referenceDds'));
          
          const ddsInfoItems = ddsInfoResponse[statementInfoKey] || ddsInfoResponse[statementKey] || ddsInfoResponse[referenceDdsKey];
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
                  // Ensure referenceNumber is always an array
                  const referenceNumbers = Array.isArray(value) ? value : (value ? [value] : []);
                  cleaned[propertyName] = referenceNumbers.map(ref => cleanObject(ref));
                } else {
                  cleaned[propertyName] = cleanObject(value);
                }
              }
              return cleaned;
            };
            return cleanObject(item);
          });

          resolve({
            ddsInfo: mappedDdsInfo
          });

        } catch (error) {
          reject(new Error(`Failed to extract DDS info from response: ${error.message}`));
        }
      });
    });
  }

  /**
   * Retrieve DDS information by UUID (CF3 v1.4) - V2 Implementation
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
        const error = new Error('UUID(s) must be provided');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }

      // Ensure uuids is an array
      const uuidArray = Array.isArray(uuids) ? uuids : [uuids];

      // Check limit (100 UUIDs per call as per documentation)
      if (uuidArray.length > 100) {
        const error = new Error('Maximum of 100 UUIDs can be retrieved in a single call');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }

      // Create SOAP envelope
      const soapEnvelope = this.createGetDdsInfoEnvelope(uuidArray);

      // Send the request with corrected SOAPAction
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
   * Retrieve DDS information by internal reference number (CF3 v1.4) - V2 Implementation
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
        const error = new Error('Internal reference number must be provided');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }

      // Validate length (min 3, max 50 characters as per documentation)
      if (internalReferenceNumber.length < 3 || internalReferenceNumber.length > 50) {
        const error = new Error('Internal reference number must be between 3 and 50 characters');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }

      // Create SOAP envelope
      const soapEnvelope = this.createGetDdsInfoByInternalReferenceNumberEnvelope(internalReferenceNumber);

      // Send the request with corrected SOAPAction
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
                  xmlns:v2="http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v2" 
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
        <v2:GetStatementByIdentifiersRequest>
            <v2:referenceNumber>${referenceNumber}</v2:referenceNumber>
            <v2:verificationNumber>${verificationNumber}</v2:verificationNumber>
        </v2:GetStatementByIdentifiersRequest>
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Retrieve DDS by reference number and verification number (CF7 v1.4) - V2 Implementation
   * @param {string} referenceNumber - DDS reference number
   * @param {string} verificationNumber - DDS verification number
   * @param {Object} options - Additional options
   * @param {boolean} options.rawResponse - Whether to return the raw XML response
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
        const error = new Error('Reference number and verification number must be provided');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }

      // Validate reference number format and length (based on real examples: 25HRW9IURY3412)
      if (referenceNumber.length > 15) {
        const error = new Error('Reference number too long');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }
      
      if (referenceNumber.length < 8) {
        const error = new Error('Reference number too short');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }

      // Validate verification number format and length (based on real examples: COAASVYH)
      if (verificationNumber.length !== 8) {
        const error = new Error('Verification number must be exactly 8 characters');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }

      // Validate reference number format (based on real examples: 25HRW9IURY3412)
      if (!/^[A-Z0-9]+$/.test(referenceNumber)) {
        const error = new Error('Reference number must contain only uppercase letters and numbers');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }

      // Validate verification number format (based on real examples: COAASVYH)
      if (!/^[A-Z0-9]+$/.test(verificationNumber)) {
        const error = new Error('Verification number must contain only uppercase letters and numbers');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }

      // Create SOAP envelope
      const soapEnvelope = this.createGetStatementByIdentifiersEnvelope(referenceNumber, verificationNumber);

      // Send the request with corrected SOAPAction for V2
      const response = await axios({
        method: 'post',
        url: this.endpoint,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/getStatementByIdentifiers'
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
   * Create SOAP envelope for the getReferencedDds operation (CF7 v1.4 - V2 Implementation)
   * Uses v2 namespace and referenceDdsVerificationNumber parameter as per v1.4 specification
   * @private
   * @param {string} referenceNumber - DDS reference number
   * @param {string} securityNumber - Reference Verification Number (security number)
   * @returns {string} Complete SOAP envelope as XML string
   */
  createGetReferencedDdsEnvelope(referenceNumber, securityNumber) {
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
                  xmlns:v2="http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v2" 
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
        <v2:GetReferencedDdsRequest>
            <v2:referenceNumber>${referenceNumber}</v2:referenceNumber>
            <v2:referenceDdsVerificationNumber>${securityNumber}</v2:referenceDdsVerificationNumber>
        </v2:GetReferencedDdsRequest>
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Retrieve subsequent referenced DDS without verification number (CF7 v1.4 - V2 Implementation)
   * @param {string} referenceNumber - DDS reference number
   * @param {string} securityNumber - Reference Verification Number (security number)
   * @param {Object} options - Additional options
   * @param {boolean} options.rawResponse - Whether to return the raw XML response
   * @returns {Promise<Object>} Response object with DDS information
   * @throws {Object} Error response object with details
   */
  async getReferencedDds(referenceNumber, securityNumber, options = {}) {
    try {
      // Validate input
      if (!referenceNumber || !securityNumber) {
        const error = new Error('Reference number and security number must be provided');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }

      // Validate reference number format and length (based on XSD: DocumentReferenceNumberType maxLength="50")
      if (referenceNumber.length < 1 || referenceNumber.length > 50) {
        const error = new Error('Reference number must be between 1 and 50 characters');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }

      // Validate reference number format (should contain only alphanumeric characters)
      if (!/^[A-Z0-9]+$/.test(referenceNumber)) {
        const error = new Error('Reference number must contain only uppercase letters and numbers');
        error.errorType = 'BUSINESS_RULES_VALIDATION';
        throw error;
      }

     
      // Create SOAP envelope
      const soapEnvelope = this.createGetReferencedDdsEnvelope(referenceNumber, securityNumber);

      // Send the request with corrected SOAPAction for V2
      const response = await axios({
        method: 'post',
        url: this.endpoint,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/getReferencedDds'
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
}

module.exports = EudrRetrievalClientV2;
