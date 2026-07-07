/**
 * Unit tests for EudrVerifyDeclarationClientV3.
 */

const { expect } = require('chai');
const EudrVerifyDeclarationClientV3 = require('../../services/verification-service-v3');
const EudrErrorHandler = require('../../utils/error-handler');

describe('EudrVerifyDeclarationClientV3', function() {
  const baseConfig = {
    username: 'testuser',
    password: 'testpass',
    webServiceClientId: 'eudr-test'
  };

  it('should initialize with automatic endpoint generation', function() {
    const client = new EudrVerifyDeclarationClientV3(baseConfig);

    expect(client.config.endpoint).to.equal('https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRVerifyDeclarationServiceV3');
    expect(client.config.webServiceClientId).to.equal('eudr-test');
  });

  it('should expose verifyDeclaration', function() {
    const client = new EudrVerifyDeclarationClientV3(baseConfig);

    expect(client.verifyDeclaration).to.be.a('function');
  });

  it('should generate verifyDeclaration SOAP envelope', function() {
    const client = new EudrVerifyDeclarationClientV3(baseConfig);
    const soapEnvelope = client.createVerifyDeclarationSoapEnvelope('26BE7XTVCZAQ2S', 'SFFCB4Y3');

    expect(soapEnvelope).to.include('<verify:VerifyDeclarationRequest>');
    expect(soapEnvelope).to.include('<verify:referenceNumber>26BE7XTVCZAQ2S</verify:referenceNumber>');
    expect(soapEnvelope).to.include('<verify:verificationNumber>SFFCB4Y3</verify:verificationNumber>');
    expect(client.soapActionFor('verifyDeclaration')).to.equal('http://ec.europa.eu/tracesnt/certificate/eudr/verification/v3/verify-declaration');
  });

  it('should parse EXISTING_USABLE verify response', async function() {
    const client = new EudrVerifyDeclarationClientV3(baseConfig);
    const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:VerifyDeclarationResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3">
      <ns5:result>EXISTING_USABLE</ns5:result>
      <ns5:status>AVAILABLE</ns5:status>
      <ns5:dateTime>2026-05-20T10:00:00.000Z</ns5:dateTime>
    </ns5:VerifyDeclarationResponse>
  </S:Body>
</S:Envelope>`;

    const parsed = await client.parseVerifyDeclarationResponse(xmlResponse);
    expect(parsed.result).to.equal('EXISTING_USABLE');
    expect(parsed.status).to.equal('AVAILABLE');
    expect(parsed.dateTime).to.equal('2026-05-20T10:00:00.000Z');
  });

  it('should parse EXISTING_NON_USABLE verify response', async function() {
    const client = new EudrVerifyDeclarationClientV3(baseConfig);
    const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:VerifyDeclarationResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3">
      <ns5:result>EXISTING_NON_USABLE</ns5:result>
      <ns5:status>WITHDRAWN</ns5:status>
      <ns5:dateTime>2026-05-20T10:00:00.000Z</ns5:dateTime>
    </ns5:VerifyDeclarationResponse>
  </S:Body>
</S:Envelope>`;

    const parsed = await client.parseVerifyDeclarationResponse(xmlResponse);
    expect(parsed.result).to.equal('EXISTING_NON_USABLE');
    expect(parsed.status).to.equal('WITHDRAWN');
    expect(parsed.dateTime).to.equal('2026-05-20T10:00:00.000Z');
  });

  it('should parse NON_EXISTENT verify response without status', async function() {
    const client = new EudrVerifyDeclarationClientV3(baseConfig);
    const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:VerifyDeclarationResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3">
      <ns5:result>NON_EXISTENT</ns5:result>
      <ns5:dateTime>2026-05-20T10:00:00.000Z</ns5:dateTime>
    </ns5:VerifyDeclarationResponse>
  </S:Body>
</S:Envelope>`;

    const parsed = await client.parseVerifyDeclarationResponse(xmlResponse);
    expect(parsed.result).to.equal('NON_EXISTENT');
    expect(parsed.status).to.be.null;
    expect(parsed.dateTime).to.equal('2026-05-20T10:00:00.000Z');
  });

  it('should surface field/message from a BusinessRulesValidationException without an error code', function() {
    // Matches the exact fault shape documented for verifyDeclaration in
    // "EUDR Downstream Operator and Trader API Reference v1.0.md" §5.1.5 - no <ID>/error code,
    // just <errors><error><field>/<message>.
    const mockError = {
      response: {
        status: 500,
        statusText: 'Internal Server Error',
        data: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><soapenv:Fault><faultcode>soapenv:Server</faultcode><faultstring>Business rules validation failed</faultstring><detail><verify:BusinessRulesValidationException xmlns:verify="http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3"><errors><error><field>referenceNumber</field><message>Reference number format is invalid</message></error></errors></verify:BusinessRulesValidationException></detail></soapenv:Fault></soapenv:Body></soapenv:Envelope>`
      }
    };

    const errorResponse = EudrErrorHandler.handleError(mockError);

    expect(errorResponse.eudrErrors).to.have.lengthOf(1);
    expect(errorResponse.eudrErrors[0].field).to.equal('referenceNumber');
    expect(errorResponse.eudrErrors[0].message).to.equal('Reference number format is invalid');
  });
});