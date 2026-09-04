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
   * @param {string|Object} [config.bodyIdentity] Multi-operator BodyIdentity header (release 8.2.1).
   *        A plain string is shorthand for OperatorAccessIdentifier; an object accepts exactly one of
   *        operatorAccessIdentifier, authorityActivityAccessIdentifier,
   *        organicControlBodyAccessIdentifier, otherBodyAccessIdentifier. Max 16 characters (32 for otherBodyAccessIdentifier).
   *        Every operation also accepts a per-call `options.bodyIdentity` override.
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
