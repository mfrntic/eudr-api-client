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

  describe('representedOperator', function() {
    const baseStatement = {
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

    it('should generate the structured EconomicOperatorIdentificationType shape', function() {
      const client = new EudrSubmissionClientV3(baseConfig);
      const soapEnvelope = client.transport.createSubmitSoapEnvelope({
        operatorRole: 'REPRESENTATIVE_OPERATOR',
        statement: {
          ...baseStatement,
          representedOperator: {
            operatorReferenceNumber: { identifierType: 'vat', identifierValue: 'BE0123456789' },
            operatorAddress: { country: 'BE', street: 'Rue Test 1', postalCode: '1000', city: 'Brussels' },
            operatorEmail: 'operator@example.com',
            operatorPhone: '+32123456',
            operatorName: 'Test Operator'
          }
        }
      });

      expect(soapEnvelope).to.include('<dds:representedOperator>');
      expect(soapEnvelope).to.include(
        '<eudrCommon:operatorReferenceNumber><eudrCommon:identifierType>vat</eudrCommon:identifierType>' +
        '<eudrCommon:identifierValue>BE0123456789</eudrCommon:identifierValue></eudrCommon:operatorReferenceNumber>'
      );
      expect(soapEnvelope).to.include(
        '<eudrCommon:operatorAddress><eudrCommon:country>BE</eudrCommon:country>' +
        '<eudrCommon:street>Rue Test 1</eudrCommon:street><eudrCommon:postalCode>1000</eudrCommon:postalCode>' +
        '<eudrCommon:city>Brussels</eudrCommon:city></eudrCommon:operatorAddress>'
      );
      expect(soapEnvelope).to.include('<eudrCommon:operatorEmail>operator@example.com</eudrCommon:operatorEmail>');
      expect(soapEnvelope).to.include('<eudrCommon:operatorPhone>+32123456</eudrCommon:operatorPhone>');
      expect(soapEnvelope).to.include('<eudrCommon:operatorName>Test Operator</eudrCommon:operatorName>');
      expect(soapEnvelope).to.not.include('<eudrCommon:address>');
      expect(soapEnvelope).to.not.include('<eudrCommon:name>');
    });

    it('should require operatorName', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      expect(() => client.transport.createSubmitSoapEnvelope({
        operatorRole: 'REPRESENTATIVE_OPERATOR',
        statement: {
          ...baseStatement,
          representedOperator: { operatorEmail: 'operator@example.com' }
        }
      })).to.throw('representedOperator.operatorName is required');
    });

    it('should require identifierType and identifierValue on operatorReferenceNumber', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      expect(() => client.transport.createSubmitSoapEnvelope({
        operatorRole: 'REPRESENTATIVE_OPERATOR',
        statement: {
          ...baseStatement,
          representedOperator: {
            operatorName: 'Test Operator',
            operatorReferenceNumber: { identifierType: 'vat' }
          }
        }
      })).to.throw('representedOperator.operatorReferenceNumber requires identifierType and identifierValue');
    });

    it('should require country, street, postalCode and city on operatorAddress', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      expect(() => client.transport.createSubmitSoapEnvelope({
        operatorRole: 'REPRESENTATIVE_OPERATOR',
        statement: {
          ...baseStatement,
          representedOperator: {
            operatorName: 'Test Operator',
            operatorAddress: { country: 'BE' }
          }
        }
      })).to.throw('representedOperator.operatorAddress requires country, street, postalCode and city');
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

  describe('bodyIdentity header (multi-operator authentication, release 8.2.1)', function() {
    const baseStatement = {
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
    const submitRequest = { operatorRole: 'OPERATOR', statement: baseStatement };

    it('should omit the header entirely when no bodyIdentity is configured', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      expect(client.transport.createSubmitSoapEnvelope(submitRequest)).to.not.include('BodyIdentity');
      expect(client.transport.createWithdrawSoapEnvelope('uuid-1')).to.not.include('BodyIdentity');
    });

    it('should treat a plain string as OperatorAccessIdentifier', function() {
      const client = new EudrSubmissionClientV3({ ...baseConfig, bodyIdentity: 'OP12345' });
      const soapEnvelope = client.transport.createSubmitSoapEnvelope(submitRequest);

      expect(soapEnvelope).to.include('<body:BodyIdentity xmlns:body="http://ec.europa.eu/tracesnt/body/v3">');
      expect(soapEnvelope).to.include('<OperatorAccessIdentifier>OP12345</OperatorAccessIdentifier>');
      // The body/v3 schema has no elementFormDefault, so the child element stays unqualified.
      expect(soapEnvelope).to.not.include('<body:OperatorAccessIdentifier>');
    });

    it('should accept each identifier kind of the BodyIdentityType choice', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      expect(client.transport.createGetDdsSoapEnvelope('uuid-1', { authorityActivityAccessIdentifier: 'AA-1' }))
        .to.include('<AuthorityActivityAccessIdentifier>AA-1</AuthorityActivityAccessIdentifier>');
      expect(client.transport.createGetDdsSoapEnvelope('uuid-1', { organicControlBodyAccessIdentifier: 'OCB-1' }))
        .to.include('<OrganicControlBodyAccessIdentifier>OCB-1</OrganicControlBodyAccessIdentifier>');
      expect(client.transport.createGetDdsSoapEnvelope('uuid-1', { otherBodyAccessIdentifier: 'OTH-1' }))
        .to.include('<OtherBodyAccessIdentifier>OTH-1</OtherBodyAccessIdentifier>');
    });

    it('should let a per-call value override the configured one, and null suppress it', function() {
      const client = new EudrSubmissionClientV3({ ...baseConfig, bodyIdentity: 'CONFIGURED' });

      expect(client.transport.createGetDdsSoapEnvelope('uuid-1', 'PER-CALL'))
        .to.include('<OperatorAccessIdentifier>PER-CALL</OperatorAccessIdentifier>');
      expect(client.transport.createGetDdsSoapEnvelope('uuid-1', null)).to.not.include('BodyIdentity');
      expect(client.transport.createGetDdsSoapEnvelope('uuid-1'))
        .to.include('<OperatorAccessIdentifier>CONFIGURED</OperatorAccessIdentifier>');
    });

    it('should reject more than one identifier (BodyIdentityType is an XSD choice)', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      try {
        client.transport.createGetDdsSoapEnvelope('uuid-1', {
          operatorAccessIdentifier: 'OP1',
          otherBodyAccessIdentifier: 'OTH1'
        });
        throw new Error('Expected a validation error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_BODY_IDENTITY_INVALID');
        expect(error.eudrSpecific).to.be.true;
      }
    });

    it('should reject an identifier longer than 16 characters', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      try {
        client.transport.createGetDdsSoapEnvelope('uuid-1', 'A'.repeat(17));
        throw new Error('Expected a validation error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_BODY_IDENTITY_TOO_LONG');
        expect(error.eudrSpecific).to.be.true;
      }
    });

    it('should reject unknown identifier fields', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      try {
        client.transport.createGetDdsSoapEnvelope('uuid-1', { operatorIdentifier: 'OP1' });
        throw new Error('Expected a validation error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_BODY_IDENTITY_INVALID');
      }
    });
  });

  describe('operatorReferenceNumber cardinality', function() {
    const baseStatement = {
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

    function submitWithReferences(client, operatorReferenceNumber) {
      return client.transport.createSubmitSoapEnvelope({
        operatorRole: 'REPRESENTATIVE_OPERATOR',
        statement: {
          ...baseStatement,
          representedOperator: {
            operatorName: 'Test Operator',
            operatorReferenceNumber
          }
        }
      });
    }

    it('should emit one element per entry when given an array (XSD allows up to 12)', function() {
      const client = new EudrSubmissionClientV3(baseConfig);
      const soapEnvelope = submitWithReferences(client, [
        { identifierType: 'eori', identifierValue: 'BE1234567890' },
        { identifierType: 'vat', identifierValue: 'BE0123456789' }
      ]);

      expect(soapEnvelope.match(/<eudrCommon:operatorReferenceNumber>/g)).to.have.lengthOf(2);
      expect(soapEnvelope).to.include('<eudrCommon:identifierValue>BE1234567890</eudrCommon:identifierValue>');
      expect(soapEnvelope).to.include('<eudrCommon:identifierValue>BE0123456789</eudrCommon:identifierValue>');
    });

    it('should keep accepting a single object (backward compatible)', function() {
      const client = new EudrSubmissionClientV3(baseConfig);
      const soapEnvelope = submitWithReferences(client, { identifierType: 'vat', identifierValue: 'BE0123456789' });

      expect(soapEnvelope.match(/<eudrCommon:operatorReferenceNumber>/g)).to.have.lengthOf(1);
    });

    it('should reject more than 12 entries', function() {
      const client = new EudrSubmissionClientV3(baseConfig);
      const references = Array.from({ length: 13 }, function(_, index) {
        return { identifierType: 'vat', identifierValue: 'BE' + index };
      });

      try {
        submitWithReferences(client, references);
        throw new Error('Expected a validation error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_OPERATOR_REFERENCE_NUMBER_LIMIT');
      }
    });

    it('should reject an identifierType outside the V3 enum', function() {
      const client = new EudrSubmissionClientV3(baseConfig);

      try {
        submitWithReferences(client, { identifierType: 'ship_man_comp_imo', identifierValue: 'IMO123' });
        throw new Error('Expected a validation error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_IDENTIFIER_TYPE_INVALID');
        expect(error.message).to.include('eori');
      }
    });
  });

  describe('groupedDeclarations cardinality', function() {
    it('should reject more than 2000 grouped references', function() {
      const client = new EudrSubmissionClientV3(baseConfig);
      const groupedDeclarations = Array.from({ length: 2001 }, function(_, index) {
        return '25HR' + index;
      });

      try {
        client.transport.createSubmitSoapEnvelope({
          operatorRole: 'OPERATOR',
          statement: {
            activityType: 'IMPORT',
            commodities: [{
              descriptors: { descriptionOfGoods: 'Test goods', goodsMeasure: { netWeight: 100 } },
              hsHeading: '1801'
            }],
            geoLocationConfidential: false,
            groupedDeclarations
          }
        });
        throw new Error('Expected a validation error');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_GROUPED_DECLARATIONS_LIMIT');
      }
    });
  });
});
