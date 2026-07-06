/**
 * EUDR Verify Declaration Service Client V3
 *
 * Public V3 facade for declaration verification.
 */

const axios = require('axios');
const crypto = require('node:crypto');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const { parseString } = require('xml2js');
const EudrErrorHandler = require('../utils/error-handler');
const { logger } = require('../utils/logger');
const { validateAndGenerateEndpoint } = require('../utils/endpoint-utils');

const VERIFY_V3_NAMESPACE = 'http://ec.europa.eu/tracesnt/certificate/eudr/verification/v3';

class EudrVerifyDeclarationClientV3 {
  /**
   * @param {Object} config
   * @param {string} [config.endpoint]
   * @param {string} config.username
   * @param {string} config.password
   * @param {string} config.webServiceClientId
   * @param {number} [config.timestampValidity=60]
   * @param {number} [config.timeout=10000]
   * @param {boolean} [config.ssl=false]
   */
  constructor(config) {
    const validatedConfig = validateAndGenerateEndpoint(config, 'verification', 'v3');

    this.config = {
      timestampValidity: 60,
      timeout: 10000,
      ssl: false,
      ...validatedConfig
    };

    this.validateConfig();
    this.endpoint = this.config.endpoint;
  }

  validateConfig() {
    const requiredFields = ['endpoint', 'username', 'password', 'webServiceClientId'];

    for (const field of requiredFields) {
      if (!this.config[field]) {
        throw new Error(`Missing required configuration: ${field}`);
      }
    }
  }

  static createEndpointFromBaseUrl(baseUrl, serviceName = 'EUDRVerifyDeclarationServiceV3') {
    return `${baseUrl}/tracesnt/ws/${serviceName}`;
  }

  soapActionFor(operationName) {
    if (operationName !== 'verifyDeclaration') {
      throw new Error(`Unknown verification V3 operation: ${operationName}`);
    }

    return `${VERIFY_V3_NAMESPACE}/verify-declaration`;
  }

  generateNonce() {
    const nonceBytes = crypto.randomBytes(16);

    return {
      bytes: nonceBytes,
      base64: nonceBytes.toString('base64')
    };
  }

  getCurrentTimestamp() {
    return new Date().toISOString();
  }

  getExpirationTimestamp(validityInSeconds) {
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + validityInSeconds);
    return expirationDate.toISOString();
  }

  generatePasswordDigest(nonce, created, password) {
    const concatenated = Buffer.concat([
      nonce,
      Buffer.from(created),
      Buffer.from(password)
    ]);

    return crypto.createHash('sha1').update(concatenated).digest('base64');
  }

  escapeXml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  createSecurityHeaderXml() {
    const nonce = this.generateNonce();
    const created = this.getCurrentTimestamp();
    const expires = this.getExpirationTimestamp(this.config.timestampValidity);
    const passwordDigest = this.generatePasswordDigest(nonce.bytes, created, this.config.password);
    const timestampId = `TS-${uuidv4()}`;
    const usernameTokenId = `UsernameToken-${uuidv4()}`;

    return `
        <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                       xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
                       soapenv:mustUnderstand="1">
            <wsu:Timestamp wsu:Id="${timestampId}">
                <wsu:Created>${created}</wsu:Created>
                <wsu:Expires>${expires}</wsu:Expires>
            </wsu:Timestamp>
            <wsse:UsernameToken wsu:Id="${usernameTokenId}">
                <wsse:Username>${this.escapeXml(this.config.username)}</wsse:Username>
                <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${passwordDigest}</wsse:Password>
                <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce.base64}</wsse:Nonce>
                <wsu:Created>${created}</wsu:Created>
            </wsse:UsernameToken>
        </wsse:Security>
        <v4:WebServiceClientId>${this.escapeXml(this.config.webServiceClientId)}</v4:WebServiceClientId>`;
  }

  createSoapEnvelope(bodyXml) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:v4="http://ec.europa.eu/sanco/tracesnt/base/v4"
                  xmlns:verify="http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3"
                  xmlns:eudrCommon="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3">
    <soapenv:Header>
${this.createSecurityHeaderXml()}
    </soapenv:Header>
    <soapenv:Body>
${bodyXml}
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  createVerifyDeclarationSoapEnvelope(referenceNumber, verificationNumber) {
    if (!referenceNumber || !verificationNumber) {
      throw new Error('verifyDeclaration requires referenceNumber and verificationNumber');
    }

    const bodyXml = `        <verify:VerifyDeclarationRequest>
            <verify:referenceNumber>${this.escapeXml(referenceNumber)}</verify:referenceNumber>
            <verify:verificationNumber>${this.escapeXml(verificationNumber)}</verify:verificationNumber>
        </verify:VerifyDeclarationRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  parseVerifyDeclarationResponse(xmlResponse) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse V3 verifyDeclaration response: ${err.message}`));
          return;
        }

        try {
          const envelope = result['S:Envelope'] || result['soapenv:Envelope'] || result['SOAP-ENV:Envelope'];
          const body = envelope['S:Body'] || envelope['soapenv:Body'] || envelope['SOAP-ENV:Body'];
          const responseKey = Object.keys(body).find((key) => key.endsWith(':VerifyDeclarationResponse'));
          const response = responseKey ? body[responseKey] : null;
          const resultKey = response ? Object.keys(response).find((key) => key.endsWith(':result')) : null;
          const statusKey = response ? Object.keys(response).find((key) => key.endsWith(':status')) : null;
          const dateTimeKey = response ? Object.keys(response).find((key) => key.endsWith(':dateTime')) : null;

          resolve({
            raw: xmlResponse,
            parsed: result,
            result: resultKey ? response[resultKey] : null,
            status: statusKey ? response[statusKey] : null,
            dateTime: dateTimeKey ? response[dateTimeKey] : null
          });
        } catch (error) {
          reject(new Error(`Failed to extract V3 verifyDeclaration payload: ${error.message}`));
        }
      });
    });
  }

  async sendSoapRequest(soapEnvelope, soapAction) {
    return axios({
      method: 'post',
      url: this.config.endpoint,
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: soapAction
      },
      data: soapEnvelope,
      timeout: this.config.timeout,
      httpsAgent: new https.Agent({
        rejectUnauthorized: this.config.ssl
      })
    });
  }

  async verifyDeclaration(referenceNumber, verificationNumber, options = {}) {
    try {
      const soapEnvelope = this.createVerifyDeclarationSoapEnvelope(referenceNumber, verificationNumber);
      const response = await this.sendSoapRequest(soapEnvelope, this.soapActionFor('verifyDeclaration'));

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseVerifyDeclarationResponse(response.data);
      return {
        httpStatus: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in V3 verifyDeclaration');
      throw EudrErrorHandler.handleError(error);
    }
  }
}

module.exports = EudrVerifyDeclarationClientV3;