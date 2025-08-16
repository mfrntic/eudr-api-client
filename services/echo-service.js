/**
 * EUDR Echo Service Client (using axios for raw XML)
 * 
 * This module provides a reusable class for connecting to the EUDR Echo Service
 * with proper WSSE security headers using direct XML and HTTP requests.
 */

const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { parseString } = require('xml2js');

/**
 * EUDR Echo Service Client class
 */
class EudrEchoClient {
  /**
   * Create a new EUDR Echo Service client
   * @param {Object} config - Configuration object
   * @param {string} config.endpoint - Service endpoint URL
   * @param {string} config.soapAction - SOAP action URI
   * @param {string} config.username - Authentication username
   * @param {string} config.password - Authentication password
   * @param {string} config.webServiceClientId - Client ID
   * @param {number} config.timestampValidity - Timestamp validity in seconds (default: 60)
   * @param {number} config.timeout - Request timeout in milliseconds (default: 10000)
   */
  constructor(config) {
    this.config = {
      // Default configuration
      endpoint: '',
      soapAction: 'http://ec.europa.eu/tracesnt/eudr/echo',
      username: '',
      password: '',
      webServiceClientId: 'eudr-test',
      timestampValidity: 60, // 1 minute as per requirements
      timeout: 10000, // 10 seconds timeout
      ...config // Override with provided config
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
    const requiredFields = ['endpoint', 'soapAction', 'username', 'password', 'webServiceClientId'];
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
   * Create SOAP envelope for the testEcho operation
   * @private
   * @param {string} message - Message to echo
   * @returns {string} Complete SOAP envelope as XML string
   */
  createSoapEnvelope(message) {
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
<soapenv:Envelope 
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
  xmlns:echo="http://ec.europa.eu/tracesnt/eudr/echo"
  xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4">
  <soapenv:Header>
    <wsse:Security 
      xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" 
      xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
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
    <echo:EudrEchoRequest>
      <echo:query>${message}</echo:query>
    </echo:EudrEchoRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
  }
  
  /**
   * Parse XML response to extract the echo status message
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
          // Extract the status message from the response
          const envelope = result['S:Envelope'];
          const body = envelope['S:Body'];
          const response = body['ns3:EudrEchoResponse'];
          
          // Handle different response formats
          let status = 'No status message found';
          if (response && response.status) {
            status = response.status;
          } else if (response && response['ns3:status']) {
            status = response['ns3:status'];
          }
          
          resolve({
            raw: xmlResponse,
            parsed: result,
            status: status
          });
        } catch (error) {
          reject(new Error(`Failed to extract status from response: ${error.message}`));
        }
      });
    });
  }
  
  /**
   * Call the EUDR Echo Service
   * @param {string} message - Message to echo
   * @param {Object} options - Additional options
   * @param {boolean} options.rawResponse - Whether to return the raw XML response (default: false)
   * @returns {Promise<Object>} Response object with status and raw XML
   */
  async echo(message, options = {}) {
    try {
      // Create SOAP envelope
      const soapEnvelope = this.createSoapEnvelope(message);
      
      // Send the request
      const response = await axios({
        method: 'post',
        url: this.config.endpoint,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': this.config.soapAction
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
}

module.exports = EudrEchoClient; 