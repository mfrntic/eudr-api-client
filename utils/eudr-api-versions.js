/**
 * Per-version wire constants for the EUDR V3 and V4 services.
 *
 * V4 (Information System release 8.2.2, API documentation v1.3) keeps the V3 operations and
 * data model, so the V3 transports are parameterized with one of these profiles instead of
 * being duplicated. Sources: the vendored live schemas in `docs/eudr_docs 8.2.2/V3` and `/V4`.
 *
 * Differences that are NOT a plain `v3` -> `v4` substitution:
 * - Verify Declaration renames its namespace: `.../verify-declaration/v3` -> `.../verification/v4`.
 *   The V3 SOAPAction already used `.../verification/v3/verify-declaration`.
 * - SD V3 publishes getSd/getSdByInternalReference/getSdByIdentifiers SOAPActions under the
 *   due-diligence-statement namespace (a WSDL quirk); V4 fixed it to simplified-declaration.
 * - SD internalReferenceNumber is ReferenceNumberType (max 14) in V3 and
 *   InternalReferenceNumberType (max 50) in V4.
 * - The base header namespace (`.../sanco/tracesnt/base/v4`) is the same in both versions.
 */

const BASE_HEADER_NAMESPACE = 'http://ec.europa.eu/sanco/tracesnt/base/v4';

function buildProfile(version, { verifyNamespace, verifySoapAction, sdGetActionsNamespace, maxSdInternalReferenceLength }) {
  const ddsNamespace = `http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/${version}`;
  const sdNamespace = `http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/${version}`;
  const sdGetNamespace = sdGetActionsNamespace === 'dds' ? ddsNamespace : sdNamespace;

  return Object.freeze({
    version,
    serviceSuffix: version.toUpperCase(),
    baseHeaderNamespace: BASE_HEADER_NAMESPACE,
    ddsNamespace,
    sdNamespace,
    verifyNamespace,
    commonNamespace: `http://ec.europa.eu/tracesnt/certificate/eudr/common/${version}`,
    bodyNamespace: `http://ec.europa.eu/tracesnt/body/${version}`,
    verifySoapAction,
    sdSoapActions: Object.freeze({
      submitSd: `${sdNamespace}/submitSd`,
      updateSd: `${sdNamespace}/updateSd`,
      withdrawSd: `${sdNamespace}/withdrawSd`,
      getSd: `${sdGetNamespace}/getSd`,
      getSdByInternalReference: `${sdGetNamespace}/getSdByInternalReference`,
      getSdByIdentifiers: `${sdGetNamespace}/getSdByIdentifiers`
    }),
    maxSdInternalReferenceLength,
    services: Object.freeze({
      dds: `EUDRDueDiligenceStatementService${version.toUpperCase()}`,
      sd: `EUDRSimplifiedDeclarationService${version.toUpperCase()}`,
      verify: `EUDRVerifyDeclarationService${version.toUpperCase()}`
    })
  });
}

const API_VERSIONS = Object.freeze({
  v3: buildProfile('v3', {
    verifyNamespace: 'http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3',
    verifySoapAction: 'http://ec.europa.eu/tracesnt/certificate/eudr/verification/v3/verify-declaration',
    sdGetActionsNamespace: 'dds',
    maxSdInternalReferenceLength: 14
  }),
  v4: buildProfile('v4', {
    verifyNamespace: 'http://ec.europa.eu/tracesnt/certificate/eudr/verification/v4',
    verifySoapAction: 'http://ec.europa.eu/tracesnt/certificate/eudr/verification/v4/verify-declaration',
    sdGetActionsNamespace: 'sd',
    maxSdInternalReferenceLength: 50
  })
});

/**
 * @param {string} [version='v3']
 * @returns {Object} frozen version profile
 */
function getApiVersionProfile(version = 'v3') {
  const profile = API_VERSIONS[version];
  if (!profile) {
    throw new Error(`Unsupported EUDR API version: ${version}. Supported: ${Object.keys(API_VERSIONS).join(', ')}`);
  }
  return profile;
}

module.exports = {
  API_VERSIONS,
  BASE_HEADER_NAMESPACE,
  getApiVersionProfile
};
