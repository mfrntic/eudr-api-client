/**
 * Wire-format normalisation for outgoing SOAP envelopes.
 *
 * The EUDR endpoints sit behind the European Commission's reverse proxy ("SNET RPS"), which runs
 * an HTTP request smuggling rule equivalent to OWASP CRS 921110. It rejects the request with
 * `403 SNET RPS - Access denied` when the body matches, case-insensitively and without a word
 * boundary:
 *
 *   (get|post|put|delete|head|options|patch|trace|connect|...)\s+[\w/]\S*(\s+http/\d|[\r\n])
 *
 * Ordinary values trip it as soon as any line break follows them anywhere in the body:
 * "Testbolaget Testbolaget", "Gadget Ltd", "Target Corp", "Head Office", "Output data".
 * The proxy decodes character references before matching, so `&#10;` / `&#13;` do not help.
 *
 * Sending the envelope without CR/LF removes the trigger. Whitespace between tags is
 * insignificant for these services; line breaks inside text values are replaced with a space.
 */
function compactSoapEnvelope(xml) {
  return String(xml)
    .replace(/>\s+</g, '><')
    .replace(/\s*[\r\n]+\s*/g, ' ')
    .trim();
}

module.exports = {
  compactSoapEnvelope
};
