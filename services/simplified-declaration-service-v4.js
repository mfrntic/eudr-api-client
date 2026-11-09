/**
 * Simplified Declaration client (submitSd, updateSd, withdrawSd, getSd, getSdByInternalReference, deprecated getSdByIdentifiers) (EUDR API V4, Information System release 8.2.2).
 *
 * V4 keeps the V3 operations and data model; this class reuses the V3 implementation with the
 * V4 wire profile (utils/eudr-api-versions.js): /v4 namespaces, the ...ServiceV4 endpoint, and
 * the V4 body namespace for BodyIdentity. Parsed responses also expose the V4-only
 * `userMessage` (EudrUserMessage response header). See docs/analysis/release-8.2.2-v4-conformance.md.
 */

const EudrSimplifiedDeclarationClientV3 = require('./simplified-declaration-service-v3');

class EudrSimplifiedDeclarationClientV4 extends EudrSimplifiedDeclarationClientV3 {
  /**
   * @param {Object} config Same options as {@link EudrSimplifiedDeclarationClientV3}.
   */
  constructor(config) {
    super(config, 'v4');
  }

  static createEndpointFromBaseUrl(baseUrl, serviceName = 'EUDRSimplifiedDeclarationServiceV4') {
    return super.createEndpointFromBaseUrl(baseUrl, serviceName);
  }
}

module.exports = EudrSimplifiedDeclarationClientV4;
