/**
 * Unit tests for compactSoapEnvelope (EC reverse proxy "403 SNET RPS - Access denied").
 */

const { expect } = require('chai');
const http = require('http');
const { compactSoapEnvelope } = require('../../utils/soap-envelope');
const EudrSubmissionClientV3 = require('../../services/submission-service-v3');

// Equivalent of the OWASP CRS 921110 rule the proxy applies (verified against acceptance).
const SMUGGLING_RULE = /(?:get|post|head|options|connect|put|delete|trace|track|patch|propfind|proppatch|mkcol|copy|move|lock|unlock)\s+[\w/][^\s]*(?:\s+http\/\d|[\r\n])/i;

function submitRequest() {
  return {
    operatorRole: 'OPERATOR',
    statement: {
      internalReferenceNumber: 'INT-REF-1',
      activityType: 'IMPORT',
      comment: 'Gadget Ltd\r\nHead Office',
      commodities: [{
        descriptors: {
          descriptionOfGoods: 'Test goods',
          goodsMeasure: { netWeight: 100 }
        },
        hsHeading: '4401',
        producers: [{
          country: 'SE',
          name: 'Testbolaget Testbolaget',
          geometryGeojson: Buffer.from('{"type":"FeatureCollection","features":[]}').toString('base64')
        }]
      }],
      geoLocationConfidential: false
    }
  };
}

describe('compactSoapEnvelope', function() {
  it('removes every CR/LF and the whitespace between tags', function() {
    const xml = '<?xml version="1.0"?>\n<a:x xmlns:a="urn:a"\n     xmlns:b="urn:b">\r\n  <b:y>v</b:y>\n</a:x>\n';

    expect(compactSoapEnvelope(xml)).to.equal('<?xml version="1.0"?><a:x xmlns:a="urn:a" xmlns:b="urn:b"><b:y>v</b:y></a:x>');
  });

  it('replaces line breaks inside text values with a single space', function() {
    expect(compactSoapEnvelope('<a>line1\r\n   line2\nline3</a>')).to.equal('<a>line1 line2 line3</a>');
  });

  it('keeps spaces inside text values', function() {
    expect(compactSoapEnvelope('<a>Testbolaget  Testbolaget</a>')).to.equal('<a>Testbolaget  Testbolaget</a>');
  });

  it('makes a DDS V3 envelope with "Testbolaget Testbolaget" pass the proxy rule', function() {
    const client = new EudrSubmissionClientV3({ username: 'u', password: 'p', webServiceClientId: 'eudr-test' });
    const raw = client.transport.createSubmitSoapEnvelope(submitRequest());
    const compact = compactSoapEnvelope(raw);

    expect(raw).to.match(SMUGGLING_RULE);
    expect(compact).to.not.match(SMUGGLING_RULE);
    expect(compact).to.not.match(/[\r\n]/);
    expect(compact).to.include('<dds:name>Testbolaget Testbolaget</dds:name>');
    expect(compact).to.include('<dds:comment>Gadget Ltd Head Office</dds:comment>');
  });

  it('is applied to the body actually sent on the wire', async function() {
    let received = null;
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        received = body;
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end('<ok/>');
      });
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    try {
      const client = new EudrSubmissionClientV3({
        username: 'u',
        password: 'p',
        webServiceClientId: 'eudr-test',
        endpoint: `http://127.0.0.1:${server.address().port}/tracesnt/ws/EUDRDueDiligenceStatementServiceV3`
      });
      const envelope = client.transport.createSubmitSoapEnvelope(submitRequest());
      await client.transport.sendSoapRequest(envelope, 'submitDds');
    } finally {
      server.close();
    }

    expect(received).to.include('<dds:name>Testbolaget Testbolaget</dds:name>');
    expect(received).to.not.match(/[\r\n]/);
    expect(received).to.not.match(SMUGGLING_RULE);
  });
});
