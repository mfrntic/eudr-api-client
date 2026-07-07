/**
 * Unit tests for EudrSimplifiedDeclarationClientV3.
 */

const { expect } = require('chai');
const EudrSimplifiedDeclarationClientV3 = require('../../services/simplified-declaration-service-v3');

describe('EudrSimplifiedDeclarationClientV3', function() {
  const baseConfig = {
    username: 'testuser',
    password: 'testpass',
    webServiceClientId: 'eudr-test'
  };

  const validStatement = {
    internalReferenceNumber: 'SD-REF-1',
    activityType: 'IMPORT',
    commodities: [{
      descriptors: {
        descriptionOfGoods: 'Test cocoa',
        goodsMeasure: { netWeight: 100 }
      },
      hsHeading: '1801',
      producers: [{
        producerCountry: 'FR',
        producerName: 'Producer Name',
        producerLocation: { geometryGeojson: 'BASE64_GEOJSON' }
      }]
    }],
    geoLocationConfidential: false
  };

  it('should initialize with automatic endpoint generation', function() {
    const client = new EudrSimplifiedDeclarationClientV3(baseConfig);

    expect(client.config.endpoint).to.equal('https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRSimplifiedDeclarationServiceV3');
    expect(client.config.webServiceClientId).to.equal('eudr-test');
  });

  it('should include percentageEstimationOrDeviation in goodsMeasure (regression: was silently dropped)', function() {
    const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
    const soapEnvelope = client.createSubmitSoapEnvelope({
      operatorRole: 'MICRO_OPERATOR',
      statement: {
        ...validStatement,
        commodities: [{
          descriptors: {
            descriptionOfGoods: 'Test cocoa',
            goodsMeasure: { netWeight: 100, percentageEstimationOrDeviation: 10 }
          },
          hsHeading: '1801',
          producers: validStatement.commodities[0].producers
        }]
      }
    });

    expect(soapEnvelope).to.include('<eudrCommon:percentageEstimationOrDeviation>10</eudrCommon:percentageEstimationOrDeviation>');
  });

  it('should expose all 6 SD methods', function() {
    const client = new EudrSimplifiedDeclarationClientV3(baseConfig);

    expect(client.submitSd).to.be.a('function');
    expect(client.updateSd).to.be.a('function');
    expect(client.withdrawSd).to.be.a('function');
    expect(client.getSd).to.be.a('function');
    expect(client.getSdByInternalReference).to.be.a('function');
    expect(client.getSdByIdentifiers).to.be.a('function');
  });

  describe('SOAPAction (WSDL quirk)', function() {
    it('should use the simplified-declaration namespace for write operations', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);

      expect(client.sdSoapActionFor('submitSd')).to.equal(
        'http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3/submitSd'
      );
      expect(client.sdSoapActionFor('updateSd')).to.equal(
        'http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3/updateSd'
      );
      expect(client.sdSoapActionFor('withdrawSd')).to.equal(
        'http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3/withdrawSd'
      );
    });

    it('should use the due-diligence-statement namespace for read operations (real WSDL quirk)', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);

      expect(client.sdSoapActionFor('getSd')).to.equal(
        'http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3/getSd'
      );
      expect(client.sdSoapActionFor('getSdByInternalReference')).to.equal(
        'http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3/getSdByInternalReference'
      );
      expect(client.sdSoapActionFor('getSdByIdentifiers')).to.equal(
        'http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3/getSdByIdentifiers'
      );
    });

    it('should throw for an unknown operation name', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      expect(() => client.sdSoapActionFor('bogus')).to.throw('Unknown SD V3 operation: bogus');
    });
  });

  describe('envelope generation', function() {
    it('should generate submit envelope with operatorRole and statement', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const soapEnvelope = client.createSubmitSoapEnvelope({
        operatorRole: 'MICRO_OPERATOR',
        statement: validStatement
      });

      expect(soapEnvelope).to.include('<sd:SubmitSdRequest>');
      expect(soapEnvelope).to.include('<sd:operatorRole>MICRO_OPERATOR</sd:operatorRole>');
      expect(soapEnvelope).to.include('<sd:internalReferenceNumber>SD-REF-1</sd:internalReferenceNumber>');
      expect(soapEnvelope).to.include('<sd:activityType>IMPORT</sd:activityType>');
      expect(soapEnvelope).to.include('<sd:hsHeading>1801</sd:hsHeading>');
      expect(soapEnvelope).to.include('<sd:producerCountry>FR</sd:producerCountry>');
      expect(soapEnvelope).to.include('<sd:producerLocation>');
      expect(soapEnvelope).to.include('<sd:geometryGeojson>BASE64_GEOJSON</sd:geometryGeojson>');
      expect(soapEnvelope).to.not.include('speciesInfo');
    });

    it('should generate update envelope using sdIdentifier (not uuid)', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const soapEnvelope = client.createUpdateSoapEnvelope('071874bd-8c62-4cac-8eb6-b2fbe003410c', validStatement);

      expect(soapEnvelope).to.include('<sd:UpdateSdRequest>');
      expect(soapEnvelope).to.include('<sd:sdIdentifier>071874bd-8c62-4cac-8eb6-b2fbe003410c</sd:sdIdentifier>');
    });

    it('should generate withdraw envelope using sdIdentifier', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const soapEnvelope = client.createWithdrawSoapEnvelope('071874bd-8c62-4cac-8eb6-b2fbe003410c');

      expect(soapEnvelope).to.include('<sd:WithdrawSdRequest>');
      expect(soapEnvelope).to.include('<sd:sdIdentifier>071874bd-8c62-4cac-8eb6-b2fbe003410c</sd:sdIdentifier>');
    });

    it('should generate getSd envelope with plain uuid string', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const soapEnvelope = client.createGetSdSoapEnvelope('071874bd-8c62-4cac-8eb6-b2fbe003410c');

      expect(soapEnvelope).to.include('<sd:GetSdRequest>');
      expect(soapEnvelope).to.include('<sd:uuidAndVersionNumberList><eudrCommon:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</eudrCommon:uuid></sd:uuidAndVersionNumberList>');
    });

    it('should generate getSd envelope with {uuid, version} objects and multiple entries', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const soapEnvelope = client.createGetSdSoapEnvelope([
        { uuid: 'uuid-1', version: 2 },
        'uuid-2'
      ]);

      expect(soapEnvelope).to.include('<eudrCommon:uuid>uuid-1</eudrCommon:uuid><eudrCommon:versionNumber>2</eudrCommon:versionNumber>');
      expect(soapEnvelope).to.include('<eudrCommon:uuid>uuid-2</eudrCommon:uuid></sd:uuidAndVersionNumberList>');
    });

    it('should reject more than 100 getSd entries', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const entries = new Array(101).fill('uuid');
      expect(() => client.createGetSdSoapEnvelope(entries)).to.throw('maximum of 100 uuids');
    });

    it('should generate getSdByInternalReference envelope', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const soapEnvelope = client.createGetSdByInternalReferenceSoapEnvelope('SD-REF-1');

      expect(soapEnvelope).to.include('<sd:GetSdByInternalReferenceRequest>');
      expect(soapEnvelope).to.include('<sd:internalReference>SD-REF-1</sd:internalReference>');
    });

    it('should generate getSdByIdentifiers envelope with referenceAndVerificationNumber wrapper', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const soapEnvelope = client.createGetSdByIdentifiersSoapEnvelope('S26BECB39D2GRX', 'H6ORMNTX');

      expect(soapEnvelope).to.include('<sd:GetSdByIdentifiersRequest>');
      expect(soapEnvelope).to.include('<sd:referenceAndVerificationNumber>');
      expect(soapEnvelope).to.include('<eudrCommon:referenceNumber>S26BECB39D2GRX</eudrCommon:referenceNumber>');
      expect(soapEnvelope).to.include('<eudrCommon:verificationNumber>H6ORMNTX</eudrCommon:verificationNumber>');
    });

    it('should generate producerLocation with postalAddress choice', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const soapEnvelope = client.createSubmitSoapEnvelope({
        operatorRole: 'MICRO_OPERATOR',
        statement: {
          ...validStatement,
          commodities: [{
            descriptors: validStatement.commodities[0].descriptors,
            hsHeading: '1801',
            producers: [{
              producerCountry: 'FR',
              producerLocation: {
                postalAddress: { producerPostalCode: '75001', producerCity: 'Paris' }
              }
            }]
          }]
        }
      });

      expect(soapEnvelope).to.include('<sd:postalAddress>');
      expect(soapEnvelope).to.include('<sd:producerPostalCode>75001</sd:producerPostalCode>');
      expect(soapEnvelope).to.include('<sd:producerCity>Paris</sd:producerCity>');
    });

    it('should generate producerLocation with cadastralIdentifier choice', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const soapEnvelope = client.createSubmitSoapEnvelope({
        operatorRole: 'MICRO_OPERATOR',
        statement: {
          ...validStatement,
          commodities: [{
            descriptors: validStatement.commodities[0].descriptors,
            hsHeading: '1801',
            producers: [{
              producerCountry: 'FR',
              producerLocation: { cadastralIdentifier: 'CAD-123' }
            }]
          }]
        }
      });

      expect(soapEnvelope).to.include('<sd:cadastralIdentifier>CAD-123</sd:cadastralIdentifier>');
    });

    it('should accept groupedDeclarations using the shared common type', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const soapEnvelope = client.createSubmitSoapEnvelope({
        operatorRole: 'MICRO_OPERATOR',
        statement: {
          ...validStatement,
          groupedDeclarations: [{ groupedDeclaration: '26FRYUI34JTQKB' }]
        }
      });

      expect(soapEnvelope).to.include('<eudrCommon:groupedDeclaration>26FRYUI34JTQKB</eudrCommon:groupedDeclaration>');
    });

    it('should generate the structured EconomicOperatorIdentificationType shape for representedOperator', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const soapEnvelope = client.createSubmitSoapEnvelope({
        operatorRole: 'REPRESENTATIVE_MSPO',
        statement: {
          ...validStatement,
          representedOperator: {
            operatorReferenceNumber: { identifierType: 'vat', identifierValue: 'BE0123456789' },
            operatorAddress: { country: 'BE', street: 'Rue Test 1', postalCode: '1000', city: 'Brussels' },
            operatorEmail: 'operator@example.com',
            operatorPhone: '+32123456',
            operatorName: 'Test Operator'
          }
        }
      });

      expect(soapEnvelope).to.include('<sd:representedOperator>');
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

    it('should require operatorName on representedOperator', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);

      expect(() => client.createSubmitSoapEnvelope({
        operatorRole: 'REPRESENTATIVE_MSPO',
        statement: {
          ...validStatement,
          representedOperator: { operatorEmail: 'operator@example.com' }
        }
      })).to.throw('representedOperator.operatorName is required');
    });

    it('should require country, street, postalCode and city on operatorAddress', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);

      expect(() => client.createSubmitSoapEnvelope({
        operatorRole: 'REPRESENTATIVE_MSPO',
        statement: {
          ...validStatement,
          representedOperator: {
            operatorName: 'Test Operator',
            operatorAddress: { country: 'BE' }
          }
        }
      })).to.throw('representedOperator.operatorAddress requires country, street, postalCode and city');
    });
  });

  describe('validation', function() {
    it('should require operatorRole on submitSd', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      expect(() => client.createSubmitSoapEnvelope({ statement: validStatement })).to.throw('submitSd requires operatorRole (V3 SD)');
    });

    it('should reject an invalid operatorRole', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      try {
        client.createSubmitSoapEnvelope({ operatorRole: 'OPERATOR', statement: validStatement });
        expect.fail('Expected to throw');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_SD_OPERATOR_ROLE_INVALID');
        expect(error.eudrSpecific).to.be.true;
      }
    });

    it('should accept all three valid operatorRole values', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      ['MICRO_OPERATOR', 'REPRESENTATIVE_MSPO', 'MEMBER_STATE'].forEach((role) => {
        expect(() => client.createSubmitSoapEnvelope({ operatorRole: role, statement: validStatement })).to.not.throw();
      });
    });

    it('should require internalReferenceNumber (unlike DDS where it is optional)', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const { internalReferenceNumber, ...statementWithoutRef } = validStatement;
      try {
        client.createSubmitSoapEnvelope({ operatorRole: 'MICRO_OPERATOR', statement: statementWithoutRef });
        expect.fail('Expected to throw');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_SD_INTERNAL_REFERENCE_REQUIRED');
        expect(error.eudrSpecific).to.be.true;
      }
    });

    it('should reject an invalid activityType', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      try {
        client.createSubmitSoapEnvelope({
          operatorRole: 'MICRO_OPERATOR',
          statement: { ...validStatement, activityType: 'TRADE' }
        });
        expect.fail('Expected to throw');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_SD_ACTIVITY_TYPE_INVALID');
      }
    });

    it('should require commodity.descriptors', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      expect(() => client.createSubmitSoapEnvelope({
        operatorRole: 'MICRO_OPERATOR',
        statement: { ...validStatement, commodities: [{ hsHeading: '1801' }] }
      })).to.throw('commodity.descriptors is required');
    });

    it('should require commodity.hsHeading', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      expect(() => client.createSubmitSoapEnvelope({
        operatorRole: 'MICRO_OPERATOR',
        statement: { ...validStatement, commodities: [{ descriptors: validStatement.commodities[0].descriptors }] }
      })).to.throw('commodity.hsHeading is required');
    });

    it('should require producer.producerCountry', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      try {
        client.createSubmitSoapEnvelope({
          operatorRole: 'MICRO_OPERATOR',
          statement: {
            ...validStatement,
            commodities: [{
              descriptors: validStatement.commodities[0].descriptors,
              hsHeading: '1801',
              producers: [{ producerLocation: { geometryGeojson: 'X' } }]
            }]
          }
        });
        expect.fail('Expected to throw');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_SD_PRODUCER_COUNTRY_REQUIRED');
      }
    });

    it('should reject producerLocation with no choice provided', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      try {
        client.createSubmitSoapEnvelope({
          operatorRole: 'MICRO_OPERATOR',
          statement: {
            ...validStatement,
            commodities: [{
              descriptors: validStatement.commodities[0].descriptors,
              hsHeading: '1801',
              producers: [{ producerCountry: 'FR', producerLocation: {} }]
            }]
          }
        });
        expect.fail('Expected to throw');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_SD_PRODUCER_LOCATION_INVALID');
      }
    });

    it('should reject producerLocation with more than one choice provided', function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      try {
        client.createSubmitSoapEnvelope({
          operatorRole: 'MICRO_OPERATOR',
          statement: {
            ...validStatement,
            commodities: [{
              descriptors: validStatement.commodities[0].descriptors,
              hsHeading: '1801',
              producers: [{
                producerCountry: 'FR',
                producerLocation: { geometryGeojson: 'X', cadastralIdentifier: 'CAD-1' }
              }]
            }]
          }
        });
        expect.fail('Expected to throw');
      } catch (error) {
        expect(error.eudrErrorCode).to.equal('EUDR_V3_SD_PRODUCER_LOCATION_INVALID');
      }
    });
  });

  describe('response parsing', function() {
    it('should parse submitSd response and extract sdIdentifier (not uuid)', async function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:SubmitSdResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3">
      <ns5:sdIdentifier>e3b3206d-6625-47a0-b2ef-b8a7b9da1217</ns5:sdIdentifier>
    </ns5:SubmitSdResponse>
  </S:Body>
</S:Envelope>`;

      const parsed = await client.parseSubmitSdResponse(xmlResponse);
      expect(parsed.sdIdentifier).to.equal('e3b3206d-6625-47a0-b2ef-b8a7b9da1217');
      expect(parsed.uuid).to.be.undefined;
    });

    it('should parse update response and extract uuid, version and status', async function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:UpdateSdResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3">
      <ns5:uuid>e3b3206d-6625-47a0-b2ef-b8a7b9da1217</ns5:uuid>
      <ns5:version>2</ns5:version>
      <ns5:status>AVAILABLE</ns5:status>
    </ns5:UpdateSdResponse>
  </S:Body>
</S:Envelope>`;

      const parsed = await client.parseSdModificationResponse(xmlResponse, 'update');
      expect(parsed.uuid).to.equal('e3b3206d-6625-47a0-b2ef-b8a7b9da1217');
      expect(parsed.version).to.equal('2');
      expect(parsed.status).to.equal('AVAILABLE');
    });

    it('should parse withdraw response', async function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:WithdrawSdResponse xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3">
      <ns5:uuid>e3b3206d-6625-47a0-b2ef-b8a7b9da1217</ns5:uuid>
      <ns5:status>WITHDRAWN</ns5:status>
    </ns5:WithdrawSdResponse>
  </S:Body>
</S:Envelope>`;

      const parsed = await client.parseSdModificationResponse(xmlResponse, 'withdraw');
      expect(parsed.status).to.equal('WITHDRAWN');
    });

    it('should parse getSd response and normalize sdOverviewList as an array', async function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:GetSdResponse xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3" xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3">
      <ns5:sdOverviewList>
        <ns3:uuid>e3b3206d-6625-47a0-b2ef-b8a7b9da1217</ns3:uuid>
        <ns3:internalReferenceNumber>REF-0001000087</ns3:internalReferenceNumber>
        <ns3:referenceNumber>S26BECB39D2GRX</ns3:referenceNumber>
        <ns3:verificationNumber>H6ORMNTX</ns3:verificationNumber>
        <ns3:status>AVAILABLE</ns3:status>
        <ns3:date>2026-05-20T10:20:01.000Z</ns3:date>
        <ns3:updatedBy>User25 User25</ns3:updatedBy>
      </ns5:sdOverviewList>
    </ns5:GetSdResponse>
  </S:Body>
</S:Envelope>`;

      const parsed = await client.parseSdOverviewResponse(xmlResponse, 'GetSdResponse');
      expect(parsed.sdInfo).to.be.an('array').with.lengthOf(1);
      expect(parsed.sdInfo[0]).to.deep.include({
        uuid: 'e3b3206d-6625-47a0-b2ef-b8a7b9da1217',
        referenceNumber: 'S26BECB39D2GRX',
        verificationNumber: 'H6ORMNTX',
        status: 'AVAILABLE'
      });
    });

    it('should parse getSdByIdentifiers response and return the full statement without speciesInfo', async function() {
      const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
      const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:GetSdByIdentifiersResponse xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3" xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v3">
      <ns5:statement>
        <ns5:internalReferenceNumber>REF-0001000087</ns5:internalReferenceNumber>
        <ns5:activityType>IMPORT</ns5:activityType>
        <ns5:commodities>
          <ns5:descriptors>
            <ns3:descriptionOfGoods>Cocoa beans</ns3:descriptionOfGoods>
          </ns5:descriptors>
          <ns5:hsHeading>1801</ns5:hsHeading>
          <ns5:producers>
            <ns5:producerCountry>FR</ns5:producerCountry>
          </ns5:producers>
        </ns5:commodities>
        <ns5:geoLocationConfidential>false</ns5:geoLocationConfidential>
      </ns5:statement>
    </ns5:GetSdByIdentifiersResponse>
  </S:Body>
</S:Envelope>`;

      const parsed = await client.parseSdStatementResponse(xmlResponse);
      expect(parsed.statement.activityType).to.equal('IMPORT');
      expect(parsed.statement.commodities).to.be.an('array').with.lengthOf(1);
      expect(parsed.statement.commodities[0].producers).to.be.an('array').with.lengthOf(1);
      expect(parsed.statement.commodities[0].producers[0].producerCountry).to.equal('FR');
      expect(parsed.statement.commodities[0].speciesInfo).to.be.undefined;
    });
  });
});
