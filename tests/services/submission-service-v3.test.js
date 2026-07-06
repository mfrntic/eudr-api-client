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

  it('should include percentageEstimationOrDeviation in goodsMeasure (regression: was silently dropped)', function() {
    const client = new EudrSubmissionClientV3(baseConfig);
    const soapEnvelope = client.transport.createSubmitSoapEnvelope({
      operatorRole: 'OPERATOR',
      statement: {
        internalReferenceNumber: 'INT-REF-1',
        activityType: 'DOMESTIC',
        commodities: [{
          descriptors: {
            descriptionOfGoods: 'Test goods',
            goodsMeasure: { netWeight: 100, percentageEstimationOrDeviation: 10 }
          },
          hsHeading: '1801'
        }],
        geoLocationConfidential: false
      }
    });

    expect(soapEnvelope).to.include('<eudrCommon:percentageEstimationOrDeviation>10</eudrCommon:percentageEstimationOrDeviation>');
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

  it('should parse submit response and extract uuid (not ddsIdentifier)', async function() {
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
    expect(parsed.ddsIdentifier).to.be.undefined;
  });

  it('should return only httpStatus and uuid from submitDds, without a lifecycle status field', async function() {
    const client = new EudrSubmissionClientV3(baseConfig);
    client.transport.sendSoapRequest = async () => ({
      status: 200,
      data: `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:SubmitDdsResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3">
      <ns5:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</ns5:uuid>
    </ns5:SubmitDdsResponse>
  </S:Body>
</S:Envelope>`
    });

    const result = await client.submitDds({
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

    expect(result.httpStatus).to.equal(200);
    expect(result.uuid).to.equal('071874bd-8c62-4cac-8eb6-b2fbe003410c');
    expect(result).to.not.have.property('status');
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

  describe('V3 status enum round-trip', function() {
    const EUDR_STATUS_VALUES = [
      'SUBMITTED', 'AVAILABLE', 'REJECTED', 'WITHDRAWN',
      'ARCHIVED', 'SUSPENDED', 'UPDATED', 'GROUPED', 'OBSOLETE'
    ];

    EUDR_STATUS_VALUES.forEach((statusValue) => {
      it(`should pass through status '${statusValue}' unchanged from amend/withdraw response`, async function() {
        const client = new EudrSubmissionClientV3(baseConfig);
        const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:AmendDdsResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3">
      <ns5:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</ns5:uuid>
      <ns5:status>${statusValue}</ns5:status>
    </ns5:AmendDdsResponse>
  </S:Body>
</S:Envelope>`;

        const parsed = await client.transport.parseModificationResponse(xmlResponse, 'amend');
        expect(parsed.status).to.equal(statusValue);
      });
    });
  });

  describe('legacy input validation', function() {
    const validStatement = {
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
    };

    it('should reject legacy operatorType field on submitDds', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      try {
        client.transport.createSubmitSoapEnvelope({ operatorType: 'TRADER', statement: validStatement });
        expect.fail('Expected createSubmitSoapEnvelope to throw');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_LEGACY_OPERATOR_TYPE_FIELD');
        expect(error.eudrSpecific).to.be.true;
        expect(error.message).to.include('operatorRole');
      }
    });

    it('should reject an invalid operatorRole value', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      try {
        client.transport.createSubmitSoapEnvelope({ operatorRole: 'TRADER', statement: validStatement });
        expect.fail('Expected createSubmitSoapEnvelope to throw');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_OPERATOR_ROLE_INVALID');
        expect(error.eudrSpecific).to.be.true;
      }
    });

    it('should reject activityType TRADE on submitDds', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      try {
        client.transport.createSubmitSoapEnvelope({
          operatorRole: 'OPERATOR',
          statement: { ...validStatement, activityType: 'TRADE' }
        });
        expect.fail('Expected createSubmitSoapEnvelope to throw');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_ACTIVITY_TYPE_TRADE_NOT_SUPPORTED');
        expect(error.eudrSpecific).to.be.true;
      }
    });

    it('should reject activityType TRADE on amendDds', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      try {
        client.transport.createAmendSoapEnvelope('071874bd-8c62-4cac-8eb6-b2fbe003410c', {
          ...validStatement,
          activityType: 'TRADE'
        });
        expect.fail('Expected createAmendSoapEnvelope to throw');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_ACTIVITY_TYPE_TRADE_NOT_SUPPORTED');
      }
    });

    it('should reject an unknown activityType value', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      try {
        client.transport.createSubmitSoapEnvelope({
          operatorRole: 'OPERATOR',
          statement: { ...validStatement, activityType: 'BOGUS' }
        });
        expect.fail('Expected createSubmitSoapEnvelope to throw');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_ACTIVITY_TYPE_INVALID');
        expect(error.eudrSpecific).to.be.true;
      }
    });

    it('should reject legacy associatedStatements field', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      try {
        client.transport.createSubmitSoapEnvelope({
          operatorRole: 'OPERATOR',
          statement: {
            ...validStatement,
            associatedStatements: [{ referenceNumber: 'REF-1', verificationNumber: 'VER-1' }]
          }
        });
        expect.fail('Expected createSubmitSoapEnvelope to throw');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_LEGACY_ASSOCIATED_STATEMENTS_FIELD');
        expect(error.eudrSpecific).to.be.true;
        expect(error.message).to.include('groupedDeclarations');
      }
    });

    it('should still accept a valid V3 request with groupedDeclarations', function() {
      const client = new EudrSubmissionClientV3(baseConfig);
      const soapEnvelope = client.transport.createSubmitSoapEnvelope({
        operatorRole: 'OPERATOR',
        statement: {
          ...validStatement,
          groupedDeclarations: [{ groupedDeclaration: '26FRYUI34JTQKB' }]
        }
      });

      expect(soapEnvelope).to.include('<eudrCommon:groupedDeclaration>26FRYUI34JTQKB</eudrCommon:groupedDeclaration>');
    });
  });

  describe('SOAPAction', function() {
    it('should build operation-specific SOAPAction values per the WSDL', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      expect(client.transport.soapActionFor('submitDds')).to.equal(
        'http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3/submitDds'
      );
      expect(client.transport.soapActionFor('amendDds')).to.equal(
        'http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3/amendDds'
      );
      expect(client.transport.soapActionFor('withdrawDds')).to.equal(
        'http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3/withdrawDds'
      );
    });
  });
});
