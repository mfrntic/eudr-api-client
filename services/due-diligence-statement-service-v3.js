/**
 * Internal EUDR Due Diligence Statement V3 transport.
 *
 * Public API should expose specialized facades:
 * - EudrSubmissionClientV3
 * - EudrRetrievalClientV3
 *
 * This class centralizes shared config/bootstrap logic for both facades.
 */

const axios = require('axios');
const crypto = require('node:crypto');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const { parseString } = require('xml2js');
const EudrErrorHandler = require('../utils/error-handler');
const { logger } = require('../utils/logger');
const { validateAndGenerateEndpoint } = require('../utils/endpoint-utils');

const DDS_V3_NAMESPACE = 'http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3';

class EudrDueDiligenceStatementServiceV3Transport {
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
    const validatedConfig = validateAndGenerateEndpoint(config, 'submission', 'v3');

    this.config = {
      timestampValidity: 60,
      timeout: 10000,
      ssl: false,
      ...validatedConfig
    };

    this.validateConfig();
    this.endpoint = this.config.endpoint;
  }

  /**
   * Validate mandatory fields for V3 client bootstrap.
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
   * Helper for explicit endpoint construction from custom base URL.
   * @param {string} baseUrl
   * @param {string} serviceName
   * @returns {string}
   */
  static createEndpointFromBaseUrl(baseUrl, serviceName = 'EUDRDueDiligenceStatementServiceV3') {
    return `${baseUrl}/tracesnt/ws/${serviceName}`;
  }

  /**
   * Build the operation-specific SOAPAction per the published WSDL, e.g.
   * "http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3/submitDds".
   * @param {string} operationName
   * @returns {string}
   */
  soapActionFor(operationName) {
    return `${DDS_V3_NAMESPACE}/${operationName}`;
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
                  xmlns:dds="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3"
                  xmlns:eudrCommon="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3">
    <soapenv:Header>
${this.createSecurityHeaderXml()}
    </soapenv:Header>
    <soapenv:Body>
${bodyXml}
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  generateStatementXml(statement) {
    let xml = '';

    if (statement.internalReferenceNumber !== undefined) {
      xml += `<dds:internalReferenceNumber>${this.escapeXml(statement.internalReferenceNumber)}</dds:internalReferenceNumber>`;
    }

    if (!statement.activityType) {
      throw new Error('statement.activityType is required for V3 operations');
    }
    if (statement.activityType === 'TRADE') {
      const error = new Error(
        "V3 DDS does not support activityType 'TRADE'. Only DOMESTIC, IMPORT, EXPORT are allowed."
      );
      error.eudrErrorCode = 'EUDR_V3_ACTIVITY_TYPE_TRADE_NOT_SUPPORTED';
      error.eudrSpecific = true;
      throw error;
    }
    if (!['DOMESTIC', 'IMPORT', 'EXPORT'].includes(statement.activityType)) {
      const error = new Error(
        `Invalid activityType '${statement.activityType}'. V3 only allows: DOMESTIC, IMPORT, EXPORT.`
      );
      error.eudrErrorCode = 'EUDR_V3_ACTIVITY_TYPE_INVALID';
      error.eudrSpecific = true;
      throw error;
    }
    xml += `<dds:activityType>${this.escapeXml(statement.activityType)}</dds:activityType>`;

    if (statement.representedOperator) {
      xml += '<dds:representedOperator>';
      if (statement.representedOperator.operatorReferenceNumber) {
        xml += `<eudrCommon:operatorReferenceNumber>${this.escapeXml(statement.representedOperator.operatorReferenceNumber)}</eudrCommon:operatorReferenceNumber>`;
      }
      if (statement.representedOperator.address) {
        xml += `<eudrCommon:address>${this.escapeXml(statement.representedOperator.address)}</eudrCommon:address>`;
      }
      if (statement.representedOperator.email) {
        xml += `<eudrCommon:email>${this.escapeXml(statement.representedOperator.email)}</eudrCommon:email>`;
      }
      if (statement.representedOperator.name) {
        xml += `<eudrCommon:name>${this.escapeXml(statement.representedOperator.name)}</eudrCommon:name>`;
      }
      if (statement.representedOperator.phone) {
        xml += `<eudrCommon:phone>${this.escapeXml(statement.representedOperator.phone)}</eudrCommon:phone>`;
      }
      xml += '</dds:representedOperator>';
    }

    if (statement.countryOfActivity) {
      xml += `<dds:countryOfActivity>${this.escapeXml(statement.countryOfActivity)}</dds:countryOfActivity>`;
    }

    if (statement.borderCrossCountry) {
      xml += `<dds:borderCrossCountry>${this.escapeXml(statement.borderCrossCountry)}</dds:borderCrossCountry>`;
    }

    if (statement.comment) {
      xml += `<dds:comment>${this.escapeXml(statement.comment)}</dds:comment>`;
    }

    if (!statement.commodities) {
      throw new Error('statement.commodities is required for V3 operations');
    }

    const commodities = Array.isArray(statement.commodities) ? statement.commodities : [statement.commodities];
    for (const commodity of commodities) {
      xml += '<dds:commodities>';
      xml += this.generateCommodityXml(commodity);
      xml += '</dds:commodities>';
    }

    xml += `<dds:geoLocationConfidential>${statement.geoLocationConfidential === true ? 'true' : 'false'}</dds:geoLocationConfidential>`;

    if (statement.associatedStatements !== undefined) {
      const error = new Error(
        "V3 does not use 'associatedStatements'. Use 'groupedDeclarations' instead (an array of { groupedDeclaration: referenceNumber }). " +
        'Note: V3 grouping semantics differ from V1/V2 referenced statements — grouped declarations receive GROUPED status and cannot be individually amended/withdrawn.'
      );
      error.eudrErrorCode = 'EUDR_V3_LEGACY_ASSOCIATED_STATEMENTS_FIELD';
      error.eudrSpecific = true;
      throw error;
    }

    if (statement.groupedDeclarations) {
      const groupedDeclarations = Array.isArray(statement.groupedDeclarations)
        ? statement.groupedDeclarations
        : [statement.groupedDeclarations];

      for (const grouped of groupedDeclarations) {
        const groupedValue = grouped.groupedDeclaration || grouped.referenceNumber || grouped;
        xml += '<dds:groupedDeclarations>';
        xml += `<eudrCommon:groupedDeclaration>${this.escapeXml(groupedValue)}</eudrCommon:groupedDeclaration>`;
        xml += '</dds:groupedDeclarations>';
      }
    }

    return xml;
  }

  generateCommodityXml(commodity) {
    let xml = '';

    if (commodity.position !== undefined) {
      xml += `<dds:position>${this.escapeXml(commodity.position)}</dds:position>`;
    }

    if (commodity.descriptors) {
      xml += '<dds:descriptors>';
      if (commodity.descriptors.descriptionOfGoods) {
        xml += `<eudrCommon:descriptionOfGoods>${this.escapeXml(commodity.descriptors.descriptionOfGoods)}</eudrCommon:descriptionOfGoods>`;
      }
      if (commodity.descriptors.goodsMeasure) {
        const measure = commodity.descriptors.goodsMeasure;
        xml += '<eudrCommon:goodsMeasure>';
        if (measure.percentageEstimationOrDeviation !== undefined) {
          xml += `<eudrCommon:percentageEstimationOrDeviation>${this.escapeXml(measure.percentageEstimationOrDeviation)}</eudrCommon:percentageEstimationOrDeviation>`;
        }
        if (measure.netWeight !== undefined) {
          xml += `<eudrCommon:netWeight>${this.escapeXml(measure.netWeight)}</eudrCommon:netWeight>`;
        }
        if (measure.supplementaryUnit !== undefined) {
          xml += `<eudrCommon:supplementaryUnit>${this.escapeXml(measure.supplementaryUnit)}</eudrCommon:supplementaryUnit>`;
        }
        if (measure.supplementaryUnitQualifier) {
          xml += `<eudrCommon:supplementaryUnitQualifier>${this.escapeXml(measure.supplementaryUnitQualifier)}</eudrCommon:supplementaryUnitQualifier>`;
        }
        xml += '</eudrCommon:goodsMeasure>';
      }
      xml += '</dds:descriptors>';
    }

    if (commodity.hsHeading) {
      xml += `<dds:hsHeading>${this.escapeXml(commodity.hsHeading)}</dds:hsHeading>`;
    }

    if (commodity.speciesInfo) {
      const species = Array.isArray(commodity.speciesInfo) ? commodity.speciesInfo : [commodity.speciesInfo];
      for (const speciesItem of species) {
        xml += '<dds:speciesInfo>';
        if (speciesItem.scientificName) {
          xml += `<dds:scientificName>${this.escapeXml(speciesItem.scientificName)}</dds:scientificName>`;
        }
        if (speciesItem.commonName) {
          xml += `<dds:commonName>${this.escapeXml(speciesItem.commonName)}</dds:commonName>`;
        }
        xml += '</dds:speciesInfo>';
      }
    }

    if (commodity.producers) {
      const producers = Array.isArray(commodity.producers) ? commodity.producers : [commodity.producers];
      for (const producer of producers) {
        xml += '<dds:producers>';
        if (producer.position !== undefined) {
          xml += `<dds:position>${this.escapeXml(producer.position)}</dds:position>`;
        }
        if (producer.country) {
          xml += `<dds:country>${this.escapeXml(producer.country)}</dds:country>`;
        }
        if (producer.name) {
          xml += `<dds:name>${this.escapeXml(producer.name)}</dds:name>`;
        }
        if (producer.geometryGeojson) {
          xml += `<dds:geometryGeojson>${this.escapeXml(producer.geometryGeojson)}</dds:geometryGeojson>`;
        }
        xml += '</dds:producers>';
      }
    }

    return xml;
  }

  createSubmitSoapEnvelope(request) {
    if (!request || !request.statement) {
      throw new Error('submitDds requires request.statement');
    }
    if (request.operatorType !== undefined) {
      const error = new Error(
        "V3 does not use 'operatorType'. Use 'operatorRole' instead, with one of: OPERATOR, REPRESENTATIVE_OPERATOR."
      );
      error.eudrErrorCode = 'EUDR_V3_LEGACY_OPERATOR_TYPE_FIELD';
      error.eudrSpecific = true;
      throw error;
    }
    if (!request.operatorRole) {
      throw new Error('submitDds requires operatorRole (V3)');
    }
    if (!['OPERATOR', 'REPRESENTATIVE_OPERATOR'].includes(request.operatorRole)) {
      const error = new Error(
        `Invalid operatorRole '${request.operatorRole}'. V3 only allows: OPERATOR, REPRESENTATIVE_OPERATOR.`
      );
      error.eudrErrorCode = 'EUDR_V3_OPERATOR_ROLE_INVALID';
      error.eudrSpecific = true;
      throw error;
    }

    const bodyXml = `        <dds:SubmitDdsRequest>
            <dds:operatorRole>${this.escapeXml(request.operatorRole)}</dds:operatorRole>
            <dds:statement>
                ${this.generateStatementXml(request.statement)}
            </dds:statement>
        </dds:SubmitDdsRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  createAmendSoapEnvelope(uuid, statement) {
    if (!uuid) {
      throw new Error('amendDds requires uuid (V3)');
    }
    if (!statement) {
      throw new Error('amendDds requires statement (V3)');
    }

    const bodyXml = `        <dds:AmendDdsRequest>
            <dds:uuid>${this.escapeXml(uuid)}</dds:uuid>
            <dds:statement>
                ${this.generateStatementXml(statement)}
            </dds:statement>
        </dds:AmendDdsRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  createWithdrawSoapEnvelope(uuid) {
    if (!uuid) {
      throw new Error('withdrawDds requires uuid (V3)');
    }

    const bodyXml = `        <dds:WithdrawDdsRequest>
            <dds:uuid>${this.escapeXml(uuid)}</dds:uuid>
        </dds:WithdrawDdsRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  createGetDdsSoapEnvelope(uuids) {
    const uuidList = Array.isArray(uuids) ? uuids : [uuids];
    if (uuidList.length === 0 || !uuidList[0]) {
      throw new Error('getDds requires at least one uuid');
    }
    if (uuidList.length > 100) {
      throw new Error('getDds accepts a maximum of 100 uuids per call');
    }

    const uuidListXml = uuidList
      .map((uuid) => `<dds:uuidList>${this.escapeXml(uuid)}</dds:uuidList>`)
      .join('');

    const bodyXml = `        <dds:GetDdsRequest>
            ${uuidListXml}
        </dds:GetDdsRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  createGetDdsByInternalReferenceSoapEnvelope(internalReferenceNumber) {
    if (!internalReferenceNumber) {
      throw new Error('getDdsByInternalReference requires internalReferenceNumber');
    }

    const bodyXml = `        <dds:GetDdsByInternalReferenceRequest>
            <dds:internalReference>${this.escapeXml(internalReferenceNumber)}</dds:internalReference>
        </dds:GetDdsByInternalReferenceRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  createGetDdsByIdentifiersSoapEnvelope(referenceNumber, verificationNumber) {
    if (!referenceNumber || !verificationNumber) {
      throw new Error('getDdsByIdentifiers requires referenceNumber and verificationNumber');
    }

    const bodyXml = `        <dds:GetDdsByIdentifiersRequest>
            <dds:referenceAndVerificationNumber>
                <eudrCommon:referenceNumber>${this.escapeXml(referenceNumber)}</eudrCommon:referenceNumber>
                <eudrCommon:verificationNumber>${this.escapeXml(verificationNumber)}</eudrCommon:verificationNumber>
            </dds:referenceAndVerificationNumber>
        </dds:GetDdsByIdentifiersRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  parseSubmitResponse(xmlResponse) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse V3 submit response: ${err.message}`));
          return;
        }

        try {
          const envelope = result['S:Envelope'] || result['soapenv:Envelope'] || result['SOAP-ENV:Envelope'];
          const body = envelope['S:Body'] || envelope['soapenv:Body'] || envelope['SOAP-ENV:Body'];
          const responseKey = Object.keys(body).find((key) => key.endsWith(':SubmitDdsResponse'));
          const response = body[responseKey];
          const uuidKey = response ? Object.keys(response).find((key) => key.endsWith(':uuid')) : null;

          resolve({
            raw: xmlResponse,
            parsed: result,
            uuid: uuidKey ? response[uuidKey] : null
          });
        } catch (error) {
          reject(new Error(`Failed to extract V3 submit response payload: ${error.message}`));
        }
      });
    });
  }

  parseModificationResponse(xmlResponse, operationName) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse V3 ${operationName} response: ${err.message}`));
          return;
        }

        try {
          const envelope = result['S:Envelope'] || result['soapenv:Envelope'] || result['SOAP-ENV:Envelope'];
          const body = envelope['S:Body'] || envelope['soapenv:Body'] || envelope['SOAP-ENV:Body'];
          const suffix = operationName === 'amend' ? ':AmendDdsResponse' : ':WithdrawDdsResponse';
          const responseKey = Object.keys(body).find((key) => key.endsWith(suffix));
          const response = body[responseKey];
          const uuidKey = response ? Object.keys(response).find((key) => key.endsWith(':uuid')) : null;
          const statusKey = response ? Object.keys(response).find((key) => key.endsWith(':status')) : null;

          resolve({
            raw: xmlResponse,
            parsed: result,
            uuid: uuidKey ? response[uuidKey] : null,
            status: statusKey ? response[statusKey] : null
          });
        } catch (error) {
          reject(new Error(`Failed to extract V3 ${operationName} response payload: ${error.message}`));
        }
      });
    });
  }

  /**
   * Flatten a single ddsOverviewList item (OverviewType) into a plain object,
   * stripping the eudrCommon/dds namespace prefixes from keys.
   */
  mapOverviewItem(item) {
    const mapped = {};
    for (const [key, value] of Object.entries(item || {})) {
      mapped[key.split(':').pop()] = value;
    }
    return mapped;
  }

  /**
   * Shared parser for getDds/getDdsByInternalReference, both of which return
   * a ddsOverviewList (DdsOverviewResponseType) under a different response element.
   */
  parseOverviewResponse(xmlResponse, responseElementName) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse V3 ${responseElementName} response: ${err.message}`));
          return;
        }

        try {
          const envelope = result['S:Envelope'] || result['soapenv:Envelope'] || result['SOAP-ENV:Envelope'];
          const body = envelope['S:Body'] || envelope['soapenv:Body'] || envelope['SOAP-ENV:Body'];
          const responseKey = Object.keys(body).find((key) => key.endsWith(`:${responseElementName}`));
          const response = responseKey ? body[responseKey] : null;
          const listKey = response ? Object.keys(response).find((key) => key.endsWith(':ddsOverviewList')) : null;
          const rawList = listKey ? response[listKey] : null;
          const overviewList = Array.isArray(rawList) ? rawList : (rawList ? [rawList] : []);

          resolve({
            raw: xmlResponse,
            parsed: result,
            ddsInfo: overviewList.map((item) => this.mapOverviewItem(item))
          });
        } catch (error) {
          reject(new Error(`Failed to extract V3 ${responseElementName} payload: ${error.message}`));
        }
      });
    });
  }

  /**
   * Recursively strip namespace prefixes and normalize repeatable DDS statement
   * fields (commodities/producers/speciesInfo/groupedDeclarations) to arrays.
   */
  normalizeStatement(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.normalizeStatement(item));
    }

    const normalized = {};
    for (const [key, value] of Object.entries(obj)) {
      const propertyName = key.split(':').pop();

      if (['commodities', 'producers', 'speciesInfo', 'groupedDeclarations'].includes(propertyName)) {
        const arrayValue = Array.isArray(value) ? value : (value ? [value] : []);
        normalized[propertyName] = arrayValue.map((item) => this.normalizeStatement(item));
      } else {
        normalized[propertyName] = this.normalizeStatement(value);
      }
    }
    return normalized;
  }

  /**
   * Parser for getDdsByIdentifiers, which returns the full DDS statement
   * (DueDiligenceStatementBaseType) rather than a ddsOverviewList.
   */
  parseStatementResponse(xmlResponse) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse V3 getDdsByIdentifiers response: ${err.message}`));
          return;
        }

        try {
          const envelope = result['S:Envelope'] || result['soapenv:Envelope'] || result['SOAP-ENV:Envelope'];
          const body = envelope['S:Body'] || envelope['soapenv:Body'] || envelope['SOAP-ENV:Body'];
          const responseKey = Object.keys(body).find((key) => key.endsWith(':GetDdsByIdentifiersResponse'));
          const response = responseKey ? body[responseKey] : null;
          const statementKey = response ? Object.keys(response).find((key) => key.endsWith(':statement')) : null;
          const rawStatement = statementKey ? response[statementKey] : null;

          resolve({
            raw: xmlResponse,
            parsed: result,
            statement: rawStatement ? this.normalizeStatement(rawStatement) : null
          });
        } catch (error) {
          reject(new Error(`Failed to extract V3 getDdsByIdentifiers payload: ${error.message}`));
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

  async submitDds(request, options = {}) {
    try {
      const soapEnvelope = this.createSubmitSoapEnvelope(request);
      const response = await this.sendSoapRequest(
        soapEnvelope,
        this.soapActionFor('submitDds')
      );

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseSubmitResponse(response.data);
      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in V3 submitDds');
      throw EudrErrorHandler.handleError(error);
    }
  }

  async amendDds(uuid, statement, options = {}) {
    try {
      const soapEnvelope = this.createAmendSoapEnvelope(uuid, statement);
      const response = await this.sendSoapRequest(
        soapEnvelope,
        this.soapActionFor('amendDds')
      );

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseModificationResponse(response.data, 'amend');
      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in V3 amendDds');
      throw EudrErrorHandler.handleError(error);
    }
  }

  async withdrawDds(uuid, options = {}) {
    try {
      const soapEnvelope = this.createWithdrawSoapEnvelope(uuid);
      const response = await this.sendSoapRequest(
        soapEnvelope,
        this.soapActionFor('withdrawDds')
      );

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseModificationResponse(response.data, 'withdraw');
      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in V3 withdrawDds');
      throw EudrErrorHandler.handleError(error);
    }
  }

  async getDds(uuids, options = {}) {
    try {
      const soapEnvelope = this.createGetDdsSoapEnvelope(uuids);
      const response = await this.sendSoapRequest(soapEnvelope, this.soapActionFor('getDds'));

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseOverviewResponse(response.data, 'GetDdsResponse');
      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in V3 getDds');
      throw EudrErrorHandler.handleError(error);
    }
  }

  async getDdsByInternalReference(internalReferenceNumber, options = {}) {
    try {
      const soapEnvelope = this.createGetDdsByInternalReferenceSoapEnvelope(internalReferenceNumber);
      const response = await this.sendSoapRequest(soapEnvelope, this.soapActionFor('getDdsByInternalReference'));

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseOverviewResponse(response.data, 'GetDdsByInternalReferenceResponse');
      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in V3 getDdsByInternalReference');
      throw EudrErrorHandler.handleError(error);
    }
  }

  async getDdsByIdentifiers(referenceNumber, verificationNumber, options = {}) {
    try {
      const soapEnvelope = this.createGetDdsByIdentifiersSoapEnvelope(referenceNumber, verificationNumber);
      const response = await this.sendSoapRequest(soapEnvelope, this.soapActionFor('getDdsByIdentifiers'));

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseStatementResponse(response.data);
      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in V3 getDdsByIdentifiers');
      throw EudrErrorHandler.handleError(error);
    }
  }
}

module.exports = EudrDueDiligenceStatementServiceV3Transport;
