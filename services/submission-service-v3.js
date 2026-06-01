/**
 * EUDR Submission Service Client V3
 *
 * Public V3 facade for DDS write operations.
 */

const EudrDueDiligenceStatementServiceV3Transport = require('./due-diligence-statement-service-v3');

class EudrSubmissionClientV3 {
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

  async submitDds(request, options = {}) {
    return this.transport.submitDds(request, options);
  }

  async amendDds(uuid, statement, options = {}) {
    return this.transport.amendDds(uuid, statement, options);
  }

  async withdrawDds(uuid, options = {}) {
    return this.transport.withdrawDds(uuid, options);
  }
}

module.exports = EudrSubmissionClientV3;
