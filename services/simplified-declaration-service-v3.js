/**
 * EUDR Simplified Declaration (SD) V3 client.
 *
 * SD is a new V3-only concept (no V1/V2 precedent), so it is exposed as a single
 * unified client covering all 6 operations, unlike the DDS submission/retrieval
 * facade split which exists purely to mirror the pre-existing V1/V2 pattern.
 *
 * This file intentionally duplicates the WS-Security/SOAP-envelope boilerplate
 * from services/due-diligence-statement-service-v3.js rather than sharing it,
 * consistent with how the V1/V2/V3 DDS transports are each self-contained.
 */

const axios = require('axios');
const crypto = require('node:crypto');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const { parseString } = require('xml2js');
const EudrErrorHandler = require('../utils/error-handler');
const { logger } = require('../utils/logger');
const { validateAndGenerateEndpoint } = require('../utils/endpoint-utils');

const SD_V3_NAMESPACE = 'http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3';
const DDS_V3_NAMESPACE = 'http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3';

/**
 * Real WSDL quirk (confirmed against the live acceptance WSDL): submitSd/updateSd/withdrawSd
 * use the simplified-declaration namespace path, but getSd/getSdByInternalReference/
 * getSdByIdentifiers use the due-diligence-statement namespace path instead. This is not
 * a typo in this file - it mirrors what the published WSDL actually specifies.
 */
const SD_SOAP_ACTIONS = {
  submitSd: `${SD_V3_NAMESPACE}/submitSd`,
  updateSd: `${SD_V3_NAMESPACE}/updateSd`,
  withdrawSd: `${SD_V3_NAMESPACE}/withdrawSd`,
  getSd: `${DDS_V3_NAMESPACE}/getSd`,
  getSdByInternalReference: `${DDS_V3_NAMESPACE}/getSdByInternalReference`,
  getSdByIdentifiers: `${DDS_V3_NAMESPACE}/getSdByIdentifiers`
};

class EudrSimplifiedDeclarationClientV3 {
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
    const validatedConfig = validateAndGenerateEndpoint(config, 'simplified-declaration', 'v3');

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

  static createEndpointFromBaseUrl(baseUrl, serviceName = 'EUDRSimplifiedDeclarationServiceV3') {
    return `${baseUrl}/tracesnt/ws/${serviceName}`;
  }

  sdSoapActionFor(operationName) {
    const soapAction = SD_SOAP_ACTIONS[operationName];
    if (!soapAction) {
      throw new Error(`Unknown SD V3 operation: ${operationName}`);
    }
    return soapAction;
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
                  xmlns:sd="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3"
                  xmlns:eudrCommon="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3">
    <soapenv:Header>
${this.createSecurityHeaderXml()}
    </soapenv:Header>
    <soapenv:Body>
${bodyXml}
    </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Build an EconomicOperatorIdentificationType element body (used for representedOperator).
   * Per the V3 schema: operatorReferenceNumber is a structured {identifierType, identifierValue}
   * pair, operatorAddress is a structured AddressType, and operatorName is mandatory.
   */
  generateEconomicOperatorXml(operator) {
    if (!operator.operatorName) {
      throw new Error('representedOperator.operatorName is required');
    }

    let xml = '';

    if (operator.operatorReferenceNumber) {
      const ref = operator.operatorReferenceNumber;
      if (!ref.identifierType || !ref.identifierValue) {
        throw new Error('representedOperator.operatorReferenceNumber requires identifierType and identifierValue');
      }
      xml += '<eudrCommon:operatorReferenceNumber>';
      xml += `<eudrCommon:identifierType>${this.escapeXml(ref.identifierType)}</eudrCommon:identifierType>`;
      xml += `<eudrCommon:identifierValue>${this.escapeXml(ref.identifierValue)}</eudrCommon:identifierValue>`;
      xml += '</eudrCommon:operatorReferenceNumber>';
    }

    if (operator.operatorAddress) {
      const address = operator.operatorAddress;
      if (!address.country || !address.street || !address.postalCode || !address.city) {
        throw new Error('representedOperator.operatorAddress requires country, street, postalCode and city');
      }
      xml += '<eudrCommon:operatorAddress>';
      xml += `<eudrCommon:country>${this.escapeXml(address.country)}</eudrCommon:country>`;
      xml += `<eudrCommon:street>${this.escapeXml(address.street)}</eudrCommon:street>`;
      xml += `<eudrCommon:postalCode>${this.escapeXml(address.postalCode)}</eudrCommon:postalCode>`;
      xml += `<eudrCommon:city>${this.escapeXml(address.city)}</eudrCommon:city>`;
      if (address.fullAddress) {
        xml += `<eudrCommon:fullAddress>${this.escapeXml(address.fullAddress)}</eudrCommon:fullAddress>`;
      }
      xml += '</eudrCommon:operatorAddress>';
    }

    if (operator.operatorEmail) {
      xml += `<eudrCommon:operatorEmail>${this.escapeXml(operator.operatorEmail)}</eudrCommon:operatorEmail>`;
    }

    if (operator.operatorPhone) {
      xml += `<eudrCommon:operatorPhone>${this.escapeXml(operator.operatorPhone)}</eudrCommon:operatorPhone>`;
    }

    xml += `<eudrCommon:operatorName>${this.escapeXml(operator.operatorName)}</eudrCommon:operatorName>`;

    return xml;
  }

  generateSdStatementXml(statement) {
    let xml = '';

    if (!statement.internalReferenceNumber) {
      const error = new Error('statement.internalReferenceNumber is required for Simplified Declarations (unlike DDS, it is mandatory).');
      error.eudrErrorCode = 'EUDR_V3_SD_INTERNAL_REFERENCE_REQUIRED';
      error.eudrSpecific = true;
      throw error;
    }
    xml += `<sd:internalReferenceNumber>${this.escapeXml(statement.internalReferenceNumber)}</sd:internalReferenceNumber>`;

    if (!statement.activityType) {
      throw new Error('statement.activityType is required for SD operations');
    }
    if (!['DOMESTIC', 'IMPORT', 'EXPORT'].includes(statement.activityType)) {
      const error = new Error(
        `Invalid activityType '${statement.activityType}'. SD only allows: DOMESTIC, IMPORT, EXPORT.`
      );
      error.eudrErrorCode = 'EUDR_V3_SD_ACTIVITY_TYPE_INVALID';
      error.eudrSpecific = true;
      throw error;
    }
    xml += `<sd:activityType>${this.escapeXml(statement.activityType)}</sd:activityType>`;

    if (statement.representedOperator) {
      xml += `<sd:representedOperator>${this.generateEconomicOperatorXml(statement.representedOperator)}</sd:representedOperator>`;
    }

    if (statement.countryOfActivity) {
      xml += `<sd:countryOfActivity>${this.escapeXml(statement.countryOfActivity)}</sd:countryOfActivity>`;
    }

    if (statement.borderCrossCountry) {
      xml += `<sd:borderCrossCountry>${this.escapeXml(statement.borderCrossCountry)}</sd:borderCrossCountry>`;
    }

    if (statement.comment) {
      xml += `<sd:comment>${this.escapeXml(statement.comment)}</sd:comment>`;
    }

    if (!statement.commodities) {
      throw new Error('statement.commodities is required for SD operations');
    }

    const commodities = Array.isArray(statement.commodities) ? statement.commodities : [statement.commodities];
    for (const commodity of commodities) {
      xml += '<sd:commodities>';
      xml += this.generateSdCommodityXml(commodity);
      xml += '</sd:commodities>';
    }

    xml += `<sd:geoLocationConfidential>${statement.geoLocationConfidential === true ? 'true' : 'false'}</sd:geoLocationConfidential>`;

    if (statement.groupedDeclarations) {
      const groupedDeclarations = Array.isArray(statement.groupedDeclarations)
        ? statement.groupedDeclarations
        : [statement.groupedDeclarations];

      for (const grouped of groupedDeclarations) {
        const groupedValue = grouped.groupedDeclaration || grouped.referenceNumber || grouped;
        xml += '<sd:groupedDeclarations>';
        xml += `<eudrCommon:groupedDeclaration>${this.escapeXml(groupedValue)}</eudrCommon:groupedDeclaration>`;
        xml += '</sd:groupedDeclarations>';
      }
    }

    return xml;
  }

  generateSdCommodityXml(commodity) {
    let xml = '';

    if (commodity.position !== undefined) {
      xml += `<sd:position>${this.escapeXml(commodity.position)}</sd:position>`;
    }

    if (!commodity.descriptors) {
      throw new Error('commodity.descriptors is required for SD commodities');
    }
    xml += '<sd:descriptors>';
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
    xml += '</sd:descriptors>';

    if (!commodity.hsHeading) {
      throw new Error('commodity.hsHeading is required for SD commodities');
    }
    xml += `<sd:hsHeading>${this.escapeXml(commodity.hsHeading)}</sd:hsHeading>`;

    if (commodity.producers) {
      const producers = Array.isArray(commodity.producers) ? commodity.producers : [commodity.producers];
      for (const producer of producers) {
        xml += '<sd:producers>';
        xml += this.generateSdProducerXml(producer);
        xml += '</sd:producers>';
      }
    }

    return xml;
  }

  generateSdProducerXml(producer) {
    let xml = '';

    if (producer.producerPosition !== undefined) {
      xml += `<sd:producerPosition>${this.escapeXml(producer.producerPosition)}</sd:producerPosition>`;
    }

    if (!producer.producerCountry) {
      const error = new Error('producer.producerCountry is required for SD producers');
      error.eudrErrorCode = 'EUDR_V3_SD_PRODUCER_COUNTRY_REQUIRED';
      error.eudrSpecific = true;
      throw error;
    }
    xml += `<sd:producerCountry>${this.escapeXml(producer.producerCountry)}</sd:producerCountry>`;

    if (producer.producerName) {
      xml += `<sd:producerName>${this.escapeXml(producer.producerName)}</sd:producerName>`;
    }

    const location = producer.producerLocation || producer;
    const choicesProvided = ['geometryGeojson', 'postalAddress', 'cadastralIdentifier']
      .filter((key) => location[key] !== undefined);

    if (choicesProvided.length !== 1) {
      const error = new Error(
        'producer.producerLocation must provide exactly one of: geometryGeojson, postalAddress, cadastralIdentifier ' +
        `(found ${choicesProvided.length}: ${choicesProvided.join(', ') || 'none'}).`
      );
      error.eudrErrorCode = 'EUDR_V3_SD_PRODUCER_LOCATION_INVALID';
      error.eudrSpecific = true;
      throw error;
    }

    xml += '<sd:producerLocation>';
    if (location.geometryGeojson !== undefined) {
      xml += `<sd:geometryGeojson>${this.escapeXml(location.geometryGeojson)}</sd:geometryGeojson>`;
    } else if (location.postalAddress !== undefined) {
      const addresses = Array.isArray(location.postalAddress) ? location.postalAddress : [location.postalAddress];
      for (const address of addresses) {
        xml += '<sd:postalAddress>';
        if (address.producerStreet) {
          xml += `<sd:producerStreet>${this.escapeXml(address.producerStreet)}</sd:producerStreet>`;
        }
        if (!address.producerPostalCode) {
          throw new Error('postalAddress.producerPostalCode is required');
        }
        xml += `<sd:producerPostalCode>${this.escapeXml(address.producerPostalCode)}</sd:producerPostalCode>`;
        if (!address.producerCity) {
          throw new Error('postalAddress.producerCity is required');
        }
        xml += `<sd:producerCity>${this.escapeXml(address.producerCity)}</sd:producerCity>`;
        xml += '</sd:postalAddress>';
      }
    } else {
      const identifiers = Array.isArray(location.cadastralIdentifier)
        ? location.cadastralIdentifier
        : [location.cadastralIdentifier];
      for (const identifier of identifiers) {
        xml += `<sd:cadastralIdentifier>${this.escapeXml(identifier)}</sd:cadastralIdentifier>`;
      }
    }
    xml += '</sd:producerLocation>';

    return xml;
  }

  createSubmitSoapEnvelope(request) {
    if (!request || !request.statement) {
      throw new Error('submitSd requires request.statement');
    }
    if (!request.operatorRole) {
      throw new Error('submitSd requires operatorRole (V3 SD)');
    }
    if (!['MICRO_OPERATOR', 'REPRESENTATIVE_MSPO', 'MEMBER_STATE'].includes(request.operatorRole)) {
      const error = new Error(
        `Invalid operatorRole '${request.operatorRole}'. SD only allows: MICRO_OPERATOR, REPRESENTATIVE_MSPO, MEMBER_STATE.`
      );
      error.eudrErrorCode = 'EUDR_V3_SD_OPERATOR_ROLE_INVALID';
      error.eudrSpecific = true;
      throw error;
    }

    const bodyXml = `        <sd:SubmitSdRequest>
            <sd:operatorRole>${this.escapeXml(request.operatorRole)}</sd:operatorRole>
            <sd:statement>
                ${this.generateSdStatementXml(request.statement)}
            </sd:statement>
        </sd:SubmitSdRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  createUpdateSoapEnvelope(sdIdentifier, statement) {
    if (!sdIdentifier) {
      throw new Error('updateSd requires sdIdentifier (V3 SD)');
    }
    if (!statement) {
      throw new Error('updateSd requires statement (V3 SD)');
    }

    const bodyXml = `        <sd:UpdateSdRequest>
            <sd:sdIdentifier>${this.escapeXml(sdIdentifier)}</sd:sdIdentifier>
            <sd:statement>
                ${this.generateSdStatementXml(statement)}
            </sd:statement>
        </sd:UpdateSdRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  createWithdrawSoapEnvelope(sdIdentifier) {
    if (!sdIdentifier) {
      throw new Error('withdrawSd requires sdIdentifier (V3 SD)');
    }

    const bodyXml = `        <sd:WithdrawSdRequest>
            <sd:sdIdentifier>${this.escapeXml(sdIdentifier)}</sd:sdIdentifier>
        </sd:WithdrawSdRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  createGetSdSoapEnvelope(uuids) {
    const entries = Array.isArray(uuids) ? uuids : [uuids];
    if (entries.length === 0 || !entries[0]) {
      throw new Error('getSd requires at least one uuid');
    }
    if (entries.length > 100) {
      throw new Error('getSd accepts a maximum of 100 uuids per call');
    }

    const entriesXml = entries.map((entry) => {
      const { uuid, version } = typeof entry === 'string' ? { uuid: entry, version: undefined } : entry;
      if (!uuid) {
        throw new Error('getSd entries require a uuid');
      }
      let entryXml = `<sd:uuidAndVersionNumberList><eudrCommon:uuid>${this.escapeXml(uuid)}</eudrCommon:uuid>`;
      if (version !== undefined) {
        entryXml += `<eudrCommon:versionNumber>${this.escapeXml(version)}</eudrCommon:versionNumber>`;
      }
      entryXml += '</sd:uuidAndVersionNumberList>';
      return entryXml;
    }).join('');

    const bodyXml = `        <sd:GetSdRequest>
            ${entriesXml}
        </sd:GetSdRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  createGetSdByInternalReferenceSoapEnvelope(internalReferenceNumber) {
    if (!internalReferenceNumber) {
      throw new Error('getSdByInternalReference requires internalReferenceNumber');
    }

    const bodyXml = `        <sd:GetSdByInternalReferenceRequest>
            <sd:internalReference>${this.escapeXml(internalReferenceNumber)}</sd:internalReference>
        </sd:GetSdByInternalReferenceRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  createGetSdByIdentifiersSoapEnvelope(referenceNumber, verificationNumber) {
    if (!referenceNumber || !verificationNumber) {
      throw new Error('getSdByIdentifiers requires referenceNumber and verificationNumber');
    }

    const bodyXml = `        <sd:GetSdByIdentifiersRequest>
            <sd:referenceAndVerificationNumber>
                <eudrCommon:referenceNumber>${this.escapeXml(referenceNumber)}</eudrCommon:referenceNumber>
                <eudrCommon:verificationNumber>${this.escapeXml(verificationNumber)}</eudrCommon:verificationNumber>
            </sd:referenceAndVerificationNumber>
        </sd:GetSdByIdentifiersRequest>`;

    return this.createSoapEnvelope(bodyXml);
  }

  parseSubmitSdResponse(xmlResponse) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse SD submit response: ${err.message}`));
          return;
        }

        try {
          const envelope = result['S:Envelope'] || result['soapenv:Envelope'] || result['SOAP-ENV:Envelope'];
          const body = envelope['S:Body'] || envelope['soapenv:Body'] || envelope['SOAP-ENV:Body'];
          const responseKey = Object.keys(body).find((key) => key.endsWith(':SubmitSdResponse'));
          const response = responseKey ? body[responseKey] : null;
          const sdIdentifierKey = response ? Object.keys(response).find((key) => key.endsWith(':sdIdentifier')) : null;

          resolve({
            raw: xmlResponse,
            parsed: result,
            sdIdentifier: sdIdentifierKey ? response[sdIdentifierKey] : null
          });
        } catch (error) {
          reject(new Error(`Failed to extract SD submit response payload: ${error.message}`));
        }
      });
    });
  }

  parseSdModificationResponse(xmlResponse, operationName) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse SD ${operationName} response: ${err.message}`));
          return;
        }

        try {
          const envelope = result['S:Envelope'] || result['soapenv:Envelope'] || result['SOAP-ENV:Envelope'];
          const body = envelope['S:Body'] || envelope['soapenv:Body'] || envelope['SOAP-ENV:Body'];
          const suffix = operationName === 'update' ? ':UpdateSdResponse' : ':WithdrawSdResponse';
          const responseKey = Object.keys(body).find((key) => key.endsWith(suffix));
          const response = responseKey ? body[responseKey] : null;
          const uuidKey = response ? Object.keys(response).find((key) => key.endsWith(':uuid')) : null;
          const versionKey = response ? Object.keys(response).find((key) => key.endsWith(':version')) : null;
          const statusKey = response ? Object.keys(response).find((key) => key.endsWith(':status')) : null;

          resolve({
            raw: xmlResponse,
            parsed: result,
            uuid: uuidKey ? response[uuidKey] : null,
            version: versionKey ? response[versionKey] : null,
            status: statusKey ? response[statusKey] : null
          });
        } catch (error) {
          reject(new Error(`Failed to extract SD ${operationName} response payload: ${error.message}`));
        }
      });
    });
  }

  mapOverviewItem(item) {
    const mapped = {};
    for (const [key, value] of Object.entries(item || {})) {
      mapped[key.split(':').pop()] = value;
    }
    return mapped;
  }

  parseSdOverviewResponse(xmlResponse, responseElementName) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse SD ${responseElementName} response: ${err.message}`));
          return;
        }

        try {
          const envelope = result['S:Envelope'] || result['soapenv:Envelope'] || result['SOAP-ENV:Envelope'];
          const body = envelope['S:Body'] || envelope['soapenv:Body'] || envelope['SOAP-ENV:Body'];
          const responseKey = Object.keys(body).find((key) => key.endsWith(`:${responseElementName}`));
          const response = responseKey ? body[responseKey] : null;
          const listKey = response ? Object.keys(response).find((key) => key.endsWith(':sdOverviewList')) : null;
          const rawList = listKey ? response[listKey] : null;
          const overviewList = Array.isArray(rawList) ? rawList : (rawList ? [rawList] : []);

          resolve({
            raw: xmlResponse,
            parsed: result,
            sdInfo: overviewList.map((item) => this.mapOverviewItem(item))
          });
        } catch (error) {
          reject(new Error(`Failed to extract SD ${responseElementName} payload: ${error.message}`));
        }
      });
    });
  }

  normalizeSdStatement(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.normalizeSdStatement(item));
    }

    const normalized = {};
    for (const [key, value] of Object.entries(obj)) {
      const propertyName = key.split(':').pop();

      if (['commodities', 'producers', 'postalAddress', 'cadastralIdentifier', 'groupedDeclarations'].includes(propertyName)) {
        const arrayValue = Array.isArray(value) ? value : (value ? [value] : []);
        normalized[propertyName] = arrayValue.map((item) => this.normalizeSdStatement(item));
      } else {
        normalized[propertyName] = this.normalizeSdStatement(value);
      }
    }
    return normalized;
  }

  parseSdStatementResponse(xmlResponse) {
    return new Promise((resolve, reject) => {
      parseString(xmlResponse, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse SD getSdByIdentifiers response: ${err.message}`));
          return;
        }

        try {
          const envelope = result['S:Envelope'] || result['soapenv:Envelope'] || result['SOAP-ENV:Envelope'];
          const body = envelope['S:Body'] || envelope['soapenv:Body'] || envelope['SOAP-ENV:Body'];
          const responseKey = Object.keys(body).find((key) => key.endsWith(':GetSdByIdentifiersResponse'));
          const response = responseKey ? body[responseKey] : null;
          const statementKey = response ? Object.keys(response).find((key) => key.endsWith(':statement')) : null;
          const rawStatement = statementKey ? response[statementKey] : null;

          resolve({
            raw: xmlResponse,
            parsed: result,
            statement: rawStatement ? this.normalizeSdStatement(rawStatement) : null
          });
        } catch (error) {
          reject(new Error(`Failed to extract SD getSdByIdentifiers payload: ${error.message}`));
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

  async submitSd(request, options = {}) {
    try {
      const soapEnvelope = this.createSubmitSoapEnvelope(request);
      const response = await this.sendSoapRequest(soapEnvelope, this.sdSoapActionFor('submitSd'));

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseSubmitSdResponse(response.data);
      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in SD submitSd');
      throw EudrErrorHandler.handleError(error);
    }
  }

  async updateSd(sdIdentifier, statement, options = {}) {
    try {
      const soapEnvelope = this.createUpdateSoapEnvelope(sdIdentifier, statement);
      const response = await this.sendSoapRequest(soapEnvelope, this.sdSoapActionFor('updateSd'));

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseSdModificationResponse(response.data, 'update');
      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in SD updateSd');
      throw EudrErrorHandler.handleError(error);
    }
  }

  async withdrawSd(sdIdentifier, options = {}) {
    try {
      const soapEnvelope = this.createWithdrawSoapEnvelope(sdIdentifier);
      const response = await this.sendSoapRequest(soapEnvelope, this.sdSoapActionFor('withdrawSd'));

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseSdModificationResponse(response.data, 'withdraw');
      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in SD withdrawSd');
      throw EudrErrorHandler.handleError(error);
    }
  }

  async getSd(uuids, options = {}) {
    try {
      const soapEnvelope = this.createGetSdSoapEnvelope(uuids);
      const response = await this.sendSoapRequest(soapEnvelope, this.sdSoapActionFor('getSd'));

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseSdOverviewResponse(response.data, 'GetSdResponse');
      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in SD getSd');
      throw EudrErrorHandler.handleError(error);
    }
  }

  async getSdByInternalReference(internalReferenceNumber, options = {}) {
    try {
      const soapEnvelope = this.createGetSdByInternalReferenceSoapEnvelope(internalReferenceNumber);
      const response = await this.sendSoapRequest(soapEnvelope, this.sdSoapActionFor('getSdByInternalReference'));

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseSdOverviewResponse(response.data, 'GetSdByInternalReferenceResponse');
      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in SD getSdByInternalReference');
      throw EudrErrorHandler.handleError(error);
    }
  }

  async getSdByIdentifiers(referenceNumber, verificationNumber, options = {}) {
    try {
      const soapEnvelope = this.createGetSdByIdentifiersSoapEnvelope(referenceNumber, verificationNumber);
      const response = await this.sendSoapRequest(soapEnvelope, this.sdSoapActionFor('getSdByIdentifiers'));

      if (options.rawResponse) {
        return {
          httpStatus: response.status,
          status: response.status,
          data: response.data
        };
      }

      const parsedResponse = await this.parseSdStatementResponse(response.data);
      return {
        httpStatus: response.status,
        status: response.status,
        ...parsedResponse
      };
    } catch (error) {
      logger.debug({ error }, 'Error in SD getSdByIdentifiers');
      throw EudrErrorHandler.handleError(error);
    }
  }
}

module.exports = EudrSimplifiedDeclarationClientV3;
