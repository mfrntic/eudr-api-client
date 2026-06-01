/**
 * Unit tests for EudrSubmissionClientV3 facade.
 */

const { expect } = require('chai');
const EudrSubmissionClientV3 = require('../../services/submission-service-v3');

describe('EudrSubmissionClientV3', function() {
  const baseConfig = {
    username: 'testuser',
    password: 'testpass',
    webServiceClientId: 'eudr-test'
  };

  it('should initialize with automatic endpoint generation', function() {
    const client = new EudrSubmissionClientV3(baseConfig);

    expect(client.config.endpoint).to.equal('https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRDueDiligenceStatementServiceV3');
    expect(client.config.webServiceClientId).to.equal('eudr-test');
  });

  it('should expose write methods', function() {
    const client = new EudrSubmissionClientV3(baseConfig);

    expect(client.submitDds).to.be.a('function');
    expect(client.amendDds).to.be.a('function');
    expect(client.withdrawDds).to.be.a('function');
  });

  it('should generate submit SOAP envelope with V3 request shape', function() {
    const client = new EudrSubmissionClientV3(baseConfig);
    const soapEnvelope = client.transport.createSubmitSoapEnvelope({
      operatorRole: 'OPERATOR',
      statement: {
        internalReferenceNumber: 'INT-REF-1',
        activityType: 'IMPORT',
        commodities: [{
          descriptors: {
            descriptionOfGoods: 'Test goods',
            goodsMeasure: { netWeight: 100 }
          },
          hsHeading: '1801'
        }],
        geoLocationConfidential: false
      }
    });

    expect(soapEnvelope).to.include('<dds:SubmitDdsRequest>');
    expect(soapEnvelope).to.include('<dds:operatorRole>OPERATOR</dds:operatorRole>');
    expect(soapEnvelope).to.include('<dds:activityType>IMPORT</dds:activityType>');
    expect(soapEnvelope).to.include('http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3');
  });

  it('should generate amend SOAP envelope with V3 request shape', function() {
    const client = new EudrSubmissionClientV3(baseConfig);
    const soapEnvelope = client.transport.createAmendSoapEnvelope('071874bd-8c62-4cac-8eb6-b2fbe003410c', {
      activityType: 'IMPORT',
      commodities: [{
        descriptors: {
          descriptionOfGoods: 'Updated goods',
          goodsMeasure: { netWeight: 150 }
        },
        hsHeading: '1801'
      }],
      geoLocationConfidential: false
    });

    expect(soapEnvelope).to.include('<dds:AmendDdsRequest>');
    expect(soapEnvelope).to.include('<dds:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</dds:uuid>');
    expect(soapEnvelope).to.include('<dds:statement>');
  });

  it('should generate withdraw SOAP envelope with V3 request shape', function() {
    const client = new EudrSubmissionClientV3(baseConfig);
    const soapEnvelope = client.transport.createWithdrawSoapEnvelope('071874bd-8c62-4cac-8eb6-b2fbe003410c');

    expect(soapEnvelope).to.include('<dds:WithdrawDdsRequest>');
    expect(soapEnvelope).to.include('<dds:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</dds:uuid>');
  });

  it('should parse submit response and extract uuid', async function() {
    const client = new EudrSubmissionClientV3(baseConfig);
    const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:SubmitDdsResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3">
      <ns5:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</ns5:uuid>
    </ns5:SubmitDdsResponse>
  </S:Body>
</S:Envelope>`;

    const parsed = await client.transport.parseSubmitResponse(xmlResponse);
    expect(parsed.uuid).to.equal('071874bd-8c62-4cac-8eb6-b2fbe003410c');
  });

  it('should parse amend response and extract uuid and status', async function() {
    const client = new EudrSubmissionClientV3(baseConfig);
    const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:AmendDdsResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3">
      <ns5:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</ns5:uuid>
      <ns5:status>AVAILABLE</ns5:status>
    </ns5:AmendDdsResponse>
  </S:Body>
</S:Envelope>`;

    const parsed = await client.transport.parseModificationResponse(xmlResponse, 'amend');
    expect(parsed.uuid).to.equal('071874bd-8c62-4cac-8eb6-b2fbe003410c');
    expect(parsed.status).to.equal('AVAILABLE');
  });

  it('should validate required submitDds input fields', function() {
    const client = new EudrSubmissionClientV3(baseConfig);
    expect(() => client.transport.createSubmitSoapEnvelope({ statement: {} })).to.throw('submitDds requires operatorRole (V3)');
    expect(() => client.transport.createSubmitSoapEnvelope({ operatorRole: 'OPERATOR' })).to.throw('submitDds requires request.statement');
  });
});
