/**
 * EUDR Retrieval Service Client V3
 *
 * Public V3 facade for DDS retrieval operations.
 */

const EudrDueDiligenceStatementServiceV3Transport = require('./due-diligence-statement-service-v3');

class EudrRetrievalClientV3 {
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
    this.transport = new EudrDueDiligenceStatementServiceV3Transport(config);
    this.config = this.transport.config;
    this.endpoint = this.transport.endpoint;
  }

  static createEndpointFromBaseUrl(baseUrl, serviceName = 'EUDRDueDiligenceStatementServiceV3') {
    return EudrDueDiligenceStatementServiceV3Transport.createEndpointFromBaseUrl(baseUrl, serviceName);
  }

  async getDds(uuid, options = {}) {
    return this.transport.getDds(uuid, options);
  }

  async getDdsByInternalReference(internalReferenceNumber, options = {}) {
    return this.transport.getDdsByInternalReference(internalReferenceNumber, options);
  }

  async getDdsByIdentifiers(referenceNumber, verificationNumber, options = {}) {
    return this.transport.getDdsByIdentifiers(referenceNumber, verificationNumber, options);
  }
}

module.exports = EudrRetrievalClientV3;
