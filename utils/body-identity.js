/**
 * BodyIdentity SOAP header support (multi-operator API authentication).
 *
 * Added by EUDR Information System release 8.2.1: an API user belonging to more than one
 * EUDR body can declare which one it acts as by sending an optional `BodyIdentity` header.
 * The header is declared on all six DDS V3 and all six SD V3 operations; it is NOT declared
 * on the Verify Declaration V3 service.
 *
 * Wire contract (namespace http://ec.europa.eu/tracesnt/body/v3, `elementFormDefault` absent
 * so the child element is unqualified):
 *
 *   <body:BodyIdentity xmlns:body="http://ec.europa.eu/tracesnt/body/v3">
 *       <OperatorAccessIdentifier>ABC123</OperatorAccessIdentifier>
 *   </body:BodyIdentity>
 *
 * `BodyIdentityType` is a choice of exactly one identifier, each an xs:token of max length 16.
 */

const BODY_IDENTITY_NAMESPACE = 'http://ec.europa.eu/tracesnt/body/v3';
const BODY_IDENTITY_MAX_LENGTH = 16;

/**
 * Accepted input keys mapped to their XSD element names.
 * Both the camelCase form and the element name itself are accepted as input keys.
 */
const BODY_IDENTITY_ELEMENTS = {
  operatorAccessIdentifier: 'OperatorAccessIdentifier',
  authorityActivityAccessIdentifier: 'AuthorityActivityAccessIdentifier',
  organicControlBodyAccessIdentifier: 'OrganicControlBodyAccessIdentifier',
  otherBodyAccessIdentifier: 'OtherBodyAccessIdentifier'
};

const BODY_IDENTITY_INPUT_KEYS = Object.keys(BODY_IDENTITY_ELEMENTS).reduce((acc, key) => {
  acc[key] = BODY_IDENTITY_ELEMENTS[key];
  acc[BODY_IDENTITY_ELEMENTS[key]] = BODY_IDENTITY_ELEMENTS[key];
  return acc;
}, {});

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function invalid(message) {
  const error = new Error(message);
  error.eudrErrorCode = 'EUDR_V3_BODY_IDENTITY_INVALID';
  error.eudrSpecific = true;
  return error;
}

/**
 * Normalize a bodyIdentity input into `{ element, value }`, or null when nothing was provided.
 *
 * Accepted shapes:
 * - a plain string — shorthand for OperatorAccessIdentifier (the multi-operator case)
 * - an object carrying exactly one of operatorAccessIdentifier, authorityActivityAccessIdentifier,
 *   organicControlBodyAccessIdentifier, otherBodyAccessIdentifier (XSD element names also accepted)
 *
 * @param {string|Object} [bodyIdentity]
 * @returns {{element: string, value: string}|null}
 */
function normalizeBodyIdentity(bodyIdentity) {
  if (bodyIdentity === undefined || bodyIdentity === null || bodyIdentity === '') {
    return null;
  }

  let element;
  let value;

  if (typeof bodyIdentity === 'string' || typeof bodyIdentity === 'number') {
    element = BODY_IDENTITY_ELEMENTS.operatorAccessIdentifier;
    value = String(bodyIdentity).trim();
  } else if (typeof bodyIdentity === 'object' && !Array.isArray(bodyIdentity)) {
    const providedKeys = Object.keys(bodyIdentity).filter(
      (key) => bodyIdentity[key] !== undefined && bodyIdentity[key] !== null && bodyIdentity[key] !== ''
    );

    const unknownKeys = providedKeys.filter((key) => !BODY_IDENTITY_INPUT_KEYS[key]);
    if (unknownKeys.length > 0) {
      throw invalid(
        `Unknown bodyIdentity field(s): ${unknownKeys.join(', ')}. ` +
        `Allowed: ${Object.keys(BODY_IDENTITY_ELEMENTS).join(', ')}.`
      );
    }
    if (providedKeys.length === 0) {
      throw invalid(
        `bodyIdentity requires exactly one of: ${Object.keys(BODY_IDENTITY_ELEMENTS).join(', ')}.`
      );
    }
    if (providedKeys.length > 1) {
      throw invalid(
        `bodyIdentity accepts exactly one identifier, received ${providedKeys.length} (${providedKeys.join(', ')}). ` +
        'BodyIdentityType is an XSD choice.'
      );
    }

    element = BODY_IDENTITY_INPUT_KEYS[providedKeys[0]];
    value = String(bodyIdentity[providedKeys[0]]).trim();
  } else {
    throw invalid('bodyIdentity must be a string or an object with exactly one identifier field.');
  }

  if (!value) {
    throw invalid('bodyIdentity value must be a non-empty string.');
  }
  if (value.length > BODY_IDENTITY_MAX_LENGTH) {
    const error = new Error(
      `bodyIdentity value '${value}' is ${value.length} characters; the EUDR schema allows a maximum of ${BODY_IDENTITY_MAX_LENGTH}.`
    );
    error.eudrErrorCode = 'EUDR_V3_BODY_IDENTITY_TOO_LONG';
    error.eudrSpecific = true;
    throw error;
  }

  return { element, value };
}

/**
 * Build the BodyIdentity header XML, or an empty string when no identifier was provided.
 * The namespace is declared inline so envelopes without a bodyIdentity stay byte-identical
 * to the pre-8.2.1 output.
 *
 * @param {string|Object} [bodyIdentity]
 * @returns {string}
 */
function buildBodyIdentityHeaderXml(bodyIdentity) {
  const normalized = normalizeBodyIdentity(bodyIdentity);
  if (!normalized) {
    return '';
  }

  return `
        <body:BodyIdentity xmlns:body="${BODY_IDENTITY_NAMESPACE}">
            <${normalized.element}>${escapeXml(normalized.value)}</${normalized.element}>
        </body:BodyIdentity>`;
}

module.exports = {
  BODY_IDENTITY_NAMESPACE,
  BODY_IDENTITY_MAX_LENGTH,
  BODY_IDENTITY_ELEMENTS,
  normalizeBodyIdentity,
  buildBodyIdentityHeaderXml
};
