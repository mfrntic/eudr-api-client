/**
 * EUDR Retrieval Service Client (using axios for raw XML)
 * 
 * This module provides a reusable class for connecting to the EUDR Retrieval Service
 * with proper WSSE security headers using direct XML and HTTP requests.
 * 
 * Supports both CF3 and CF7 specifications:
 * - CF3 v1.4: getDdsInfo, getDdsInfoByInternalReferenceNumber (with rejection reason & CA communication)
 * - CF7 v1.4: getStatementByIdentifiers, getReferencedDDS (supply chain traversal)
 */

const axios = require('axios');
const crypto = require('node:crypto');
const { v4: uuidv4 } = require('uuid');
const { parseString, processors } = require('xml2js');

/**
 * EUDR Retrieval Service Client class
 */
class EudrRetrievalClient {
  /**
   * Create a new EUDR Retrieval Service client
   * @param {Object} config - Configuration object
   * @param {string} config.wsdlUrl - Service WSDL URL (required)
   * @param {string} config.username - Authentication username (required)
   * @param {string} config.password - Authentication password (required)
   * @param {string} config.webServiceClientId - Client ID (required)
   * @param {number} config.timestampValidity - Timestamp validity in seconds (default: 60)
   * @param {number} config.timeout - Request timeout in milliseconds (default: 10000)
   */
  constructor(config) {
    this.config = {
      // Default configuration (only for non-required fields)
      endpoint: '',
      username: '',
      password: '',
      webServiceClientId: 'eudr-test',
      timestampValidity: 60, // 1 minute as per requirements
      timeout: 10000, // 10 seconds timeout
      ...config // Override with provided config
    };

    // Validate required configuration first
    this.validateConfig();

    // Extract the endpoint from the WSDL URL
    this.endpoint = this.config.wsdlUrl.replace('?wsdl', '');
  }

  /**
   * Validate that required configuration is provided
   * @private
   * @throws {Error} If required configuration is missing
   */
  validateConfig() {
    const requiredFields = ['wsdlUrl', 'username', 'password', 'webServiceClientId'];
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
          let ddsInfoResponse;
          if (body['ns5:GetStatementInfoResponse']) {
            ddsInfoResponse = body['ns5:GetStatementInfoResponse'];
          }
          else if (body['ns5:GetDdsInfoByInternalReferenceNumberResponse']) {
            ddsInfoResponse = body['ns5:GetDdsInfoByInternalReferenceNumberResponse'];
          }
          else if (body['ns5:GetStatementByIdentifiersResponse']) {
            ddsInfoResponse = body['ns5:GetStatementByIdentifiersResponse'];
          }
          else if (body['ns5:GetReferencedDDSResponse'] || body['ns5:GetReferencedDdsResponse']) {
            ddsInfoResponse = body['ns5:GetReferencedDDSResponse'] || body['ns5:GetReferencedDdsResponse'];
          }
          else {
            // Check for fault
            if (body['S:Fault'] || body['soapenv:Fault']) {
              const fault = body['S:Fault'] || body['soapenv:Fault'];
              reject(new Error(`SOAP Fault: ${fault.faultstring || JSON.stringify(fault)}`));
              return;
            }

            reject(new Error('Unknown response format'));
            return;
          }

          const ddsInfoItems = ddsInfoResponse['ns5:statementInfo'] || ddsInfoResponse['ns5:statement'];
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
                } else {
                  cleaned[propertyName] = cleanObject(value);
                }
              }
              return cleaned;
            };
            return cleanObject(item);
          });

          resolve({
            raw: xmlResponse,
            parsed: result,
            ddsInfo: mappedDdsInfo,
 
          });

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
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v1#getDdsInfo'
        },
        data: soapEnvelope,
        timeout: this.config.timeout
      });

      // Return raw response if requested
      if (options.rawResponse) {
        return {
          status: response.status,
          data: response.data
        };
      }

      // Parse the XML response
      const parsedResponse = await this.parseResponse(response.data);

      return {
        httpStatus: response.status,
        ...parsedResponse
      };
    } catch (error) {
      // Create a more structured error response
      const errorResponse = {
        error: true,
        message: error.message,
        details: {}
      };

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorResponse.details = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      } else if (error.request) {
        // The request was made but no response was received
        errorResponse.details = {
          request: 'Request sent but no response received'
        };
      }

      throw errorResponse;
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
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v1#GetDdsInfoByInternalReferenceNumberRequest'
        },
        data: soapEnvelope,
        timeout: this.config.timeout
      });

      // Return raw response if requested
      if (options.rawResponse) {
        return {
          status: response.status,
          data: response.data
        };
      }

      // Parse the XML response
      const parsedResponse = await this.parseResponse(response.data);

      return {
        httpStatus: response.status,
        ...parsedResponse
      };
    } catch (error) {
      // Create a more structured error response
      const errorResponse = {
        error: true,
        message: error.message,
        details: {}
      };

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorResponse.details = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      } else if (error.request) {
        // The request was made but no response was received
        errorResponse.details = {
          request: 'Request sent but no response received'
        };
      }

      throw errorResponse;
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
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v1#getStatementByIdentifiers'
        },
        data: soapEnvelope,
        timeout: this.config.timeout
      });

      // Return raw response if requested
      if (options.rawResponse) {
        return {
          status: response.status,
          data: response.data
        };
      }

      // Parse the XML response
      const parsedResponse = await this.parseResponse(response.data);

      return {
        httpStatus: response.status,
        ...parsedResponse
      };
    } catch (error) {
      // Create a more structured error response
      const errorResponse = {
        error: true,
        message: error.message,
        details: {}
      };

      if (error.response) {
        errorResponse.details = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      } else if (error.request) {
        errorResponse.details = {
          request: 'Request sent but no response received'
        };
      }

      throw errorResponse;
    }
  }

  /**
   * Create SOAP envelope for the getReferencedDDS operation (CF7 v1.4)
   * Uses v2 namespace and referenceDdsVerificationNumber parameter as per v1.4 specification
   * @private
   * @param {string} referenceNumber - DDS reference number
   * @param {string} securityNumber - Reference Verification Number (security number)
   * @returns {string} Complete SOAP envelope as XML string
   */
  createGetReferencedDDSEnvelope(referenceNumber, securityNumber) {
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
   * Retrieve subsequent referenced DDS without verification number (CF7 v1.4)
   * @param {string} referenceNumber - DDS reference number
   * @param {string} securityNumber - Reference Verification Number (security number)
   * @param {Object} options - Additional options
   * @param {boolean} options.rawResponse - Whether to return the raw XML response
   * @returns {Promise<Object>} Response object with DDS information
   * @throws {Object} Error response object with details
   */
  async getReferencedDDS(referenceNumber, securityNumber, options = {}) {
    try {
      // Validate input
      if (!referenceNumber || !securityNumber) {
        throw new Error('Reference number and security number must be provided');
      }

      // Create SOAP envelope
      const soapEnvelope = this.createGetReferencedDDSEnvelope(referenceNumber, securityNumber);

      // Send the request
      const response = await axios({
        method: 'post',
        url: this.endpoint,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://ec.europa.eu/tracesnt/certificate/eudr/retrieval/v1#getReferencedDDS'
        },
        data: soapEnvelope,
        timeout: this.config.timeout
      });

      // Return raw response if requested
      if (options.rawResponse) {
        return {
          status: response.status,
          data: response.data
        };
      }

      // Parse the XML response
      const parsedResponse = await this.parseResponse(response.data);

      return {
        httpStatus: response.status,
        ...parsedResponse
      };
    } catch (error) {
      // Create a more structured error response
      const errorResponse = {
        error: true,
        message: error.message,
        details: {}
      };

      if (error.response) {
        errorResponse.details = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      } else if (error.request) {
        errorResponse.details = {
          request: 'Request sent but no response received'
        };
      }

      throw errorResponse;
    }
  }
}

module.exports = EudrRetrievalClient;