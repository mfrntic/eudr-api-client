/**
 * Helpers for reading SOAP response envelopes.
 */

const XML_ENTITIES = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&amp;': '&'
};

function decodeXmlText(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&(lt|gt|quot|apos|amp);/g, (entity) => XML_ENTITIES[entity]);
}

/**
 * Extract the V4 `EudrUserMessage` response header (EUDR announcements, max 2000 characters).
 *
 * The API documentation v1.3 shows it as `<eudr:EudrUserMessage xmlns:eudr=".../eudr/common/v4">`
 * inside `soapenv:Header`, but the published XSD only defines `EudrUserMessageType` (no global
 * element) and the WSDL declares no output header. It is therefore matched leniently by local name,
 * with any prefix, and only inside the SOAP Header. V3 responses never carry it.
 *
 * @param {string} xmlResponse raw response body
 * @returns {string|null} the message text, or null when absent/empty
 */
function extractUserMessage(xmlResponse) {
  if (typeof xmlResponse !== 'string' || xmlResponse.indexOf('EudrUserMessage') === -1) {
    return null;
  }

  const headerMatch = xmlResponse.match(/<(?:[\w.-]+:)?Header\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?Header>/);
  if (!headerMatch) {
    return null;
  }

  const messageMatch = headerMatch[1].match(
    /<((?:[\w.-]+:)?EudrUserMessage)\b[^>]*?(?:\/>|>([\s\S]*?)<\/\1>)/
  );
  if (!messageMatch || messageMatch[2] === undefined) {
    return null;
  }

  const text = decodeXmlText(messageMatch[2]).trim();
  return text.length > 0 ? text : null;
}

module.exports = {
  extractUserMessage
};
