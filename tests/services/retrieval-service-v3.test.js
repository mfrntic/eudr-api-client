/**
 * Unit tests for EudrRetrievalClientV3 facade.
 */

const { expect } = require('chai');
const EudrRetrievalClientV3 = require('../../services/retrieval-service-v3');

describe('EudrRetrievalClientV3', function() {
  const baseConfig = {
    username: 'testuser',
    password: 'testpass',
    webServiceClientId: 'eudr-repository'
  };

  it('should initialize with automatic endpoint generation', function() {
    const client = new EudrRetrievalClientV3(baseConfig);

    expect(client.config.endpoint).to.equal('https://eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRDueDiligenceStatementServiceV3');
    expect(client.config.webServiceClientId).to.equal('eudr-repository');
  });

  it('should expose retrieval methods', function() {
    const client = new EudrRetrievalClientV3(baseConfig);

    expect(client.getDds).to.be.a('function');
    expect(client.getDdsByInternalReference).to.be.a('function');
    expect(client.getDdsByIdentifiers).to.be.a('function');
  });

  describe('envelope generation', function() {
    it('should generate getDds envelope with a single uuid', function() {
      const client = new EudrRetrievalClientV3(baseConfig);
      const soapEnvelope = client.transport.createGetDdsSoapEnvelope('071874bd-8c62-4cac-8eb6-b2fbe003410c');

      expect(soapEnvelope).to.include('<dds:GetDdsRequest>');
      expect(soapEnvelope).to.include('<dds:uuidList>071874bd-8c62-4cac-8eb6-b2fbe003410c</dds:uuidList>');
    });

    it('should generate getDds envelope with multiple uuids', function() {
      const client = new EudrRetrievalClientV3(baseConfig);
      const soapEnvelope = client.transport.createGetDdsSoapEnvelope(['uuid-1', 'uuid-2']);

      expect(soapEnvelope).to.include('<dds:uuidList>uuid-1</dds:uuidList>');
      expect(soapEnvelope).to.include('<dds:uuidList>uuid-2</dds:uuidList>');
    });

    it('should reject more than 100 uuids for getDds', function() {
      const client = new EudrRetrievalClientV3(baseConfig);
      const uuids = new Array(101).fill('uuid');

      expect(() => client.transport.createGetDdsSoapEnvelope(uuids)).to.throw('maximum of 100 uuids');
    });

    it('should reject empty uuid input for getDds', function() {
      const client = new EudrRetrievalClientV3(baseConfig);

      expect(() => client.transport.createGetDdsSoapEnvelope()).to.throw('getDds requires at least one uuid');
    });

    it('should generate getDdsByInternalReference envelope', function() {
      const client = new EudrRetrievalClientV3(baseConfig);
      const soapEnvelope = client.transport.createGetDdsByInternalReferenceSoapEnvelope('26BEDWNW9JD1TN');

      expect(soapEnvelope).to.include('<dds:GetDdsByInternalReferenceRequest>');
      expect(soapEnvelope).to.include('<dds:internalReference>26BEDWNW9JD1TN</dds:internalReference>');
    });

    it('should generate getDdsByIdentifiers envelope with referenceAndVerificationNumber wrapper', function() {
      const client = new EudrRetrievalClientV3(baseConfig);
      const soapEnvelope = client.transport.createGetDdsByIdentifiersSoapEnvelope('26BE7XTVCZAQ2S', 'SFFCB4Y3');

      expect(soapEnvelope).to.include('<dds:GetDdsByIdentifiersRequest>');
      expect(soapEnvelope).to.include('<dds:referenceAndVerificationNumber>');
      expect(soapEnvelope).to.include('<eudrCommon:referenceNumber>26BE7XTVCZAQ2S</eudrCommon:referenceNumber>');
      expect(soapEnvelope).to.include('<eudrCommon:verificationNumber>SFFCB4Y3</eudrCommon:verificationNumber>');
    });

    it('should reject missing referenceNumber/verificationNumber for getDdsByIdentifiers', function() {
      const client = new EudrRetrievalClientV3(baseConfig);

      expect(() => client.transport.createGetDdsByIdentifiersSoapEnvelope('REF', undefined))
        .to.throw('getDdsByIdentifiers requires referenceNumber and verificationNumber');
    });
  });

  describe('SOAPAction', function() {
    it('should build operation-specific SOAPAction values per the WSDL', function() {
      const client = new EudrRetrievalClientV3(baseConfig);

      expect(client.transport.soapActionFor('getDds')).to.equal(
        'http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3/getDds'
      );
      expect(client.transport.soapActionFor('getDdsByInternalReference')).to.equal(
        'http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3/getDdsByInternalReference'
      );
      expect(client.transport.soapActionFor('getDdsByIdentifiers')).to.equal(
        'http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3/getDdsByIdentifiers'
      );
    });
  });

  describe('response parsing', function() {
    it('should parse getDds response and normalize ddsOverviewList as an array', async function() {
      const client = new EudrRetrievalClientV3(baseConfig);
      const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:GetDdsResponse xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3" xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3">
      <ns5:ddsOverviewList>
        <ns3:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</ns3:uuid>
        <ns3:internalReferenceNumber>26BEDWNW9JD1TN</ns3:internalReferenceNumber>
        <ns3:referenceNumber>26BE7XTVCZAQ2S</ns3:referenceNumber>
        <ns3:verificationNumber>SFFCB4Y3</ns3:verificationNumber>
        <ns3:status>AVAILABLE</ns3:status>
        <ns3:date>2026-05-20T09:55:01.000Z</ns3:date>
        <ns3:updatedBy>User3 User3</ns3:updatedBy>
        <ns3:version>1</ns3:version>
      </ns5:ddsOverviewList>
    </ns5:GetDdsResponse>
  </S:Body>
</S:Envelope>`;

      const parsed = await client.transport.parseOverviewResponse(xmlResponse, 'GetDdsResponse');
      expect(parsed.ddsInfo).to.be.an('array').with.lengthOf(1);
      expect(parsed.ddsInfo[0]).to.deep.include({
        uuid: '071874bd-8c62-4cac-8eb6-b2fbe003410c',
        internalReferenceNumber: '26BEDWNW9JD1TN',
        referenceNumber: '26BE7XTVCZAQ2S',
        verificationNumber: 'SFFCB4Y3',
        status: 'AVAILABLE',
        updatedBy: 'User3 User3',
        version: '1'
      });
    });

    it('should normalize a single ddsOverviewList entry from getDdsByInternalReference as an array', async function() {
      const client = new EudrRetrievalClientV3(baseConfig);
      const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:GetDdsByInternalReferenceResponse xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3" xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3">
      <ns5:ddsOverviewList>
        <ns3:uuid>071874bd-8c62-4cac-8eb6-b2fbe003410c</ns3:uuid>
        <ns3:internalReferenceNumber>26BEDWNW9JD1TN</ns3:internalReferenceNumber>
        <ns3:status>AVAILABLE</ns3:status>
      </ns5:ddsOverviewList>
    </ns5:GetDdsByInternalReferenceResponse>
  </S:Body>
</S:Envelope>`;

      const parsed = await client.transport.parseOverviewResponse(xmlResponse, 'GetDdsByInternalReferenceResponse');
      expect(parsed.ddsInfo).to.be.an('array').with.lengthOf(1);
      expect(parsed.ddsInfo[0].status).to.equal('AVAILABLE');
    });

    it('should parse getDdsByIdentifiers response and return the full statement', async function() {
      const client = new EudrRetrievalClientV3(baseConfig);
      const xmlResponse = `
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <ns5:GetDdsByIdentifiersResponse xmlns:ns3="http://ec.europa.eu/tracesnt/certificate/eudr/common/v3" xmlns:ns5="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3">
      <ns5:statement>
        <ns5:activityType>IMPORT</ns5:activityType>
        <ns5:commodities>
          <ns5:position>1</ns5:position>
          <ns5:descriptors>
            <ns3:descriptionOfGoods>Test wood product amended</ns3:descriptionOfGoods>
            <ns3:goodsMeasure>
              <ns3:netWeight>300.000000</ns3:netWeight>
            </ns3:goodsMeasure>
          </ns5:descriptors>
          <ns5:hsHeading>4410</ns5:hsHeading>
          <ns5:producers>
            <ns5:country>FR</ns5:country>
            <ns5:geometryGeojson>BASE64_ENCODED_GEOJSON</ns5:geometryGeojson>
          </ns5:producers>
        </ns5:commodities>
        <ns5:geoLocationConfidential>false</ns5:geoLocationConfidential>
      </ns5:statement>
    </ns5:GetDdsByIdentifiersResponse>
  </S:Body>
</S:Envelope>`;

      const parsed = await client.transport.parseStatementResponse(xmlResponse);
      expect(parsed.statement.activityType).to.equal('IMPORT');
      expect(parsed.statement.commodities).to.be.an('array').with.lengthOf(1);
      expect(parsed.statement.commodities[0].hsHeading).to.equal('4410');
      expect(parsed.statement.commodities[0].producers).to.be.an('array').with.lengthOf(1);
      expect(parsed.statement.commodities[0].producers[0].country).to.equal('FR');
    });
  });
});
