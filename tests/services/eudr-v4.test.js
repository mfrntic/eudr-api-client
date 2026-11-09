/**
 * Unit tests for the EUDR API V4 clients (Information System release 8.2.2, API docs v1.3).
 *
 * V4 reuses the V3 implementation with a different wire profile, so these tests concentrate on
 * what differs: namespaces, SOAPActions, endpoints, the SD internal-reference length, the V4-only
 * summaryAddress / referenceNumberInfo / EudrUserMessage, and the deprecated get*ByIdentifiers.
 * Expected values come from the vendored live schemas in `docs/eudr_docs 8.2.2/V4`.
 */

const { expect } = require('chai');
const {
  EudrSubmissionClientV4,
  EudrRetrievalClientV4,
  EudrSimplifiedDeclarationClientV4,
  EudrVerifyDeclarationClientV4,
  EudrSubmissionClientV3,
  EudrSimplifiedDeclarationClientV3,
  EudrVerifyDeclarationClientV3
} = require('../../services');
const { extractUserMessage } = require('../../utils/soap-response');
const { getApiVersionProfile } = require('../../utils/eudr-api-versions');

const NS = {
  dds: 'http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v4',
  sd: 'http://ec.europa.eu/tracesnt/certificate/eudr/simplified-declaration/v4',
  verify: 'http://ec.europa.eu/tracesnt/certificate/eudr/verification/v4',
  common: 'http://ec.europa.eu/tracesnt/certificate/eudr/common/v4',
  body: 'http://ec.europa.eu/tracesnt/body/v4',
  base: 'http://ec.europa.eu/sanco/tracesnt/base/v4'
};

const baseConfig = {
  username: 'testuser',
  password: 'testpass',
  webServiceClientId: 'eudr-test'
};

const ACCEPTANCE = 'https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws';

const ddsStatement = {
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

const sdStatement = {
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

function namespacesOf(envelope) {
  const result = {};
  for (const match of envelope.matchAll(/xmlns:(\w+)="([^"]*)"/g)) {
    result[match[1]] = match[2];
  }
  return result;
}

function stubSend(client, data, captured = {}) {
  const target = client.transport || client;
  target.sendSoapRequest = async (envelope, soapAction) => {
    captured.envelope = envelope;
    captured.soapAction = soapAction;
    return { status: 200, data };
  };
  return captured;
}

function faultError(xml, status = 500) {
  const error = new Error('Request failed');
  error.response = { status, statusText: 'Internal Server Error', data: xml };
  return error;
}

describe('EudrSubmissionClientV4', function() {
  it('targets the V4 DDS endpoint', function() {
    const client = new EudrSubmissionClientV4(baseConfig);
    expect(client.endpoint).to.equal(`${ACCEPTANCE}/EUDRDueDiligenceStatementServiceV4`);
    expect(client.apiVersion).to.equal('v4');
    expect(EudrSubmissionClientV4.createEndpointFromBaseUrl('https://example.org'))
      .to.equal('https://example.org/tracesnt/ws/EUDRDueDiligenceStatementServiceV4');
  });

  it('is a V3 subclass, so existing V3 instanceof checks keep working', function() {
    expect(new EudrSubmissionClientV4(baseConfig)).to.be.instanceOf(EudrSubmissionClientV3);
  });

  it('builds the submit envelope with V4 namespaces', function() {
    const client = new EudrSubmissionClientV4(baseConfig);
    const envelope = client.transport.createSubmitSoapEnvelope({ operatorRole: 'OPERATOR', statement: ddsStatement });
    const ns = namespacesOf(envelope);

    expect(ns.dds).to.equal(NS.dds);
    expect(ns.eudrCommon).to.equal(NS.common);
    expect(ns.v4).to.equal(NS.base);
    expect(envelope).to.not.include('/v3');
    expect(envelope).to.include('<dds:SubmitDdsRequest>');
  });

  it('uses .../due-diligence-statement/v4/<operation> SOAPActions', async function() {
    const client = new EudrSubmissionClientV4(baseConfig);
    const captured = stubSend(client, '<S:Envelope xmlns:S="x"><S:Body><ns5:SubmitDdsResponse xmlns:ns5="y"><ns5:uuid>u-1</ns5:uuid></ns5:SubmitDdsResponse></S:Body></S:Envelope>');

    const result = await client.submitDds({ operatorRole: 'OPERATOR', statement: ddsStatement });
    expect(captured.soapAction).to.equal(`${NS.dds}/submitDds`);
    expect(result.uuid).to.equal('u-1');
    expect(result.userMessage).to.equal(null);

    for (const operation of ['amendDds', 'withdrawDds']) {
      expect(client.transport.soapActionFor(operation)).to.equal(`${NS.dds}/${operation}`);
    }
  });

  it('puts BodyIdentity in the body/v4 namespace', function() {
    const client = new EudrSubmissionClientV4({ ...baseConfig, bodyIdentity: 'OPERATOR12345' });
    const envelope = client.transport.createWithdrawSoapEnvelope('071874bd-8c62-4cac-8eb6-b2fbe003410c');

    expect(envelope).to.include(`<body:BodyIdentity xmlns:body="${NS.body}">`);
    expect(envelope).to.include('<OperatorAccessIdentifier>OPERATOR12345</OperatorAccessIdentifier>');
  });

  it('keeps V3 BodyIdentity in the body/v3 namespace', function() {
    const client = new EudrSubmissionClientV3({ ...baseConfig, bodyIdentity: 'OPERATOR12345' });
    const envelope = client.transport.createWithdrawSoapEnvelope('071874bd-8c62-4cac-8eb6-b2fbe003410c');

    expect(envelope).to.include('<body:BodyIdentity xmlns:body="http://ec.europa.eu/tracesnt/body/v3">');
  });

  it('emits summaryAddress between operatorAddress and operatorEmail (XSD order)', function() {
    const client = new EudrSubmissionClientV4(baseConfig);
    const envelope = client.transport.createSubmitSoapEnvelope({
      operatorRole: 'REPRESENTATIVE_OPERATOR',
      statement: {
        ...ddsStatement,
        representedOperator: {
          operatorName: 'Represented Ltd',
          operatorAddress: { country: 'HR', street: 'Ilica 1', postalCode: '10000', city: 'Zagreb' },
          summaryAddress: { name: 'Represented Ltd', country: 'HR' },
          operatorEmail: 'ops@example.org'
        }
      }
    });

    expect(envelope).to.include(
      '<eudrCommon:summaryAddress><eudrCommon:name>Represented Ltd</eudrCommon:name><eudrCommon:country>HR</eudrCommon:country></eudrCommon:summaryAddress>'
    );
    const addressAt = envelope.indexOf('</eudrCommon:operatorAddress>');
    const summaryAt = envelope.indexOf('<eudrCommon:summaryAddress>');
    const emailAt = envelope.indexOf('<eudrCommon:operatorEmail>');
    expect(addressAt).to.be.lessThan(summaryAt);
    expect(summaryAt).to.be.lessThan(emailAt);
  });

  it('validates summaryAddress.country', function() {
    const client = new EudrSubmissionClientV4(baseConfig);
    expect(() => client.transport.createSubmitSoapEnvelope({
      operatorRole: 'REPRESENTATIVE_OPERATOR',
      statement: { ...ddsStatement, representedOperator: { operatorName: 'X', summaryAddress: { country: 'CRO' } } }
    })).to.throw(/ISO 3166-1 alpha-2/).with.property('eudrErrorCode', 'EUDR_V4_SUMMARY_ADDRESS_INVALID');
  });

  it('rejects summaryAddress on V3 instead of silently dropping it', function() {
    const client = new EudrSubmissionClientV3(baseConfig);
    expect(() => client.transport.createSubmitSoapEnvelope({
      operatorRole: 'REPRESENTATIVE_OPERATOR',
      statement: { ...ddsStatement, representedOperator: { operatorName: 'X', summaryAddress: { country: 'HR' } } }
    })).to.throw(/V4 field/).with.property('eudrErrorCode', 'EUDR_V3_SUMMARY_ADDRESS_NOT_SUPPORTED');
  });

  it('surfaces the V4 EudrUserMessage header on parsed responses', async function() {
    const client = new EudrSubmissionClientV4(baseConfig);
    stubSend(client, `<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
      <S:Header><eudr:EudrUserMessage xmlns:eudr="${NS.common}">Example EUDR announcement.</eudr:EudrUserMessage></S:Header>
      <S:Body><ns5:WithdrawDdsResponse xmlns:ns5="${NS.dds}"><ns5:uuid>u-1</ns5:uuid><ns5:status>WITHDRAWN</ns5:status></ns5:WithdrawDdsResponse></S:Body>
    </S:Envelope>`);

    const result = await client.withdrawDds('u-1');
    expect(result.httpStatus).to.equal(200);
    expect(result.status).to.equal('WITHDRAWN');
    expect(result.userMessage).to.equal('Example EUDR announcement.');
  });

  it('maps EUDR_API_AMEND_DEADLINE_ELAPSED (PermissionDeniedException) to 403', async function() {
    const client = new EudrSubmissionClientV4(baseConfig);
    client.transport.sendSoapRequest = async () => {
      throw faultError(`<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><S:Fault>
        <faultcode>S:Server</faultcode><faultstring>PermissionDeniedException</faultstring>
        <detail><ns5:PermissionDeniedException xmlns:ns5="${NS.dds}" xmlns:ns4="http://ec.europa.eu/sanco/tracesnt/error/v01">
          <ns4:Error><ns4:ID>EUDR_API_AMEND_DEADLINE_ELAPSED</ns4:ID><ns4:Message languageID="en">Amendment deadline elapsed</ns4:Message></ns4:Error>
        </ns5:PermissionDeniedException></detail></S:Fault></S:Body></S:Envelope>`);
    };

    try {
      await client.amendDds('071874bd-8c62-4cac-8eb6-b2fbe003410c', ddsStatement);
      expect.fail('amendDds should have thrown');
    } catch (error) {
      expect(error.httpStatus).to.equal(403);
      expect(error.eudrErrorCode).to.equal('EUDR_API_AMEND_DEADLINE_ELAPSED');
    }
  });

  it('maps EUDR-GROUPING-NOT-ALLOWED-ON-AMEND to a known 400 error', async function() {
    const client = new EudrSubmissionClientV4(baseConfig);
    client.transport.sendSoapRequest = async () => {
      throw faultError(`<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><S:Fault>
        <faultcode>S:Server</faultcode><faultstring>BusinessRulesValidationException</faultstring>
        <detail><ns5:BusinessRulesValidationException xmlns:ns5="${NS.dds}" xmlns:ns4="http://ec.europa.eu/sanco/tracesnt/error/v01">
          <ns4:Error><ns4:ID>EUDR-GROUPING-NOT-ALLOWED-ON-AMEND</ns4:ID><ns4:Message languageID="en">Grouping not allowed</ns4:Message></ns4:Error>
        </ns5:BusinessRulesValidationException></detail></S:Fault></S:Body></S:Envelope>`);
    };

    try {
      await client.amendDds('071874bd-8c62-4cac-8eb6-b2fbe003410c', ddsStatement);
      expect.fail('amendDds should have thrown');
    } catch (error) {
      expect(error.httpStatus).to.equal(400);
      expect(error.eudrErrorCode).to.equal('EUDR_GROUPING_NOT_ALLOWED_ON_AMEND');
      expect(error.wellKnownError).to.equal(true);
    }
  });
});

describe('EudrRetrievalClientV4', function() {
  const overviewResponse = `<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body>
    <ns5:GetDdsResponse xmlns:ns3="${NS.common}" xmlns:ns5="${NS.dds}">
      <ns5:ddsOverviewList>
        <ns3:uuid>u-1</ns3:uuid>
        <ns3:internalReferenceNumber>INT-REF-1</ns3:internalReferenceNumber>
        <ns3:referenceNumberInfo>Under system analysis</ns3:referenceNumberInfo>
        <ns3:status>SUBMITTED</ns3:status>
      </ns5:ddsOverviewList>
      <ns5:ddsOverviewList>
        <ns3:uuid>u-2</ns3:uuid>
        <ns3:internalReferenceNumber>INT-REF-2</ns3:internalReferenceNumber>
        <ns3:status>CANCELLED</ns3:status>
      </ns5:ddsOverviewList>
    </ns5:GetDdsResponse></S:Body></S:Envelope>`;

  it('targets the V4 DDS endpoint', function() {
    const client = new EudrRetrievalClientV4(baseConfig);
    expect(client.endpoint).to.equal(`${ACCEPTANCE}/EUDRDueDiligenceStatementServiceV4`);
  });

  it('parses referenceNumberInfo and the new CANCELLED status from overviews', async function() {
    const client = new EudrRetrievalClientV4(baseConfig);
    const captured = stubSend(client, overviewResponse);

    const result = await client.getDds(['u-1', 'u-2']);
    expect(captured.soapAction).to.equal(`${NS.dds}/getDds`);
    expect(namespacesOf(captured.envelope).dds).to.equal(NS.dds);
    expect(result.ddsInfo).to.have.length(2);
    expect(result.ddsInfo[0].referenceNumberInfo).to.equal('Under system analysis');
    expect(result.ddsInfo[1].status).to.equal('CANCELLED');
  });

  it('uses the V4 SOAPAction for getDdsByInternalReference', async function() {
    const client = new EudrRetrievalClientV4(baseConfig);
    const captured = stubSend(client, overviewResponse.replace(/GetDdsResponse/g, 'GetDdsByInternalReferenceResponse'));

    const result = await client.getDdsByInternalReference('INT-REF-1');
    expect(captured.soapAction).to.equal(`${NS.dds}/getDdsByInternalReference`);
    expect(result.ddsInfo[0].uuid).to.equal('u-1');
  });

  it('maps the discontinued getDdsByIdentifiers fault to EUDR_DETAIL_RETRIEVAL_UNSUPPORTED', async function() {
    const client = new EudrRetrievalClientV4(baseConfig);
    let soapAction;
    client.transport.sendSoapRequest = async (envelope, action) => {
      soapAction = action;
      // Verbatim shape of the sample in Operator API Reference v1.3, section 6.1.
      throw faultError(`<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><S:Fault>
        <faultcode>S:Server</faultcode>
        <faultstring>Statement detail access is possible only over UI</faultstring>
        <detail><ns5:NotFoundException xmlns:ns5="${NS.dds}"><ns5:message>Statement detail access is possible only over UI</ns5:message></ns5:NotFoundException></detail>
      </S:Fault></S:Body></S:Envelope>`);
    };

    try {
      await client.getDdsByIdentifiers('25HR3TXDB21346', 'EIBEAESE');
      expect.fail('getDdsByIdentifiers should have thrown');
    } catch (error) {
      expect(soapAction).to.equal(`${NS.dds}/getDdsByIdentifiers`);
      expect(error.httpStatus).to.equal(404);
      expect(error.notFound).to.equal(true);
      expect(error.detailRetrievalUnsupported).to.equal(true);
      expect(error.eudrErrorCode).to.equal('EUDR_DETAIL_RETRIEVAL_UNSUPPORTED');
    }
  });

  it('recognises the live DDS wording of the detail-retrieval fault', async function() {
    const client = new EudrRetrievalClientV4(baseConfig);
    client.transport.sendSoapRequest = async () => {
      // Captured from acceptance on 2026-11-09 (namespace declarations trimmed).
      throw faultError(`<?xml version='1.0' encoding='UTF-8'?><S:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><env:Header/><S:Body><ns0:Fault xmlns:ns0="http://schemas.xmlsoap.org/soap/envelope/"><faultcode>ns0:Client</faultcode><faultstring>Statement details can only be accessed through the UI</faultstring><detail><ns5:NotFoundException xmlns:ns5="${NS.dds}"/></detail></ns0:Fault></S:Body></S:Envelope>`);
    };

    try {
      await client.getDdsByIdentifiers('25HR3TXDB21346', 'EIBEAESE');
      expect.fail('getDdsByIdentifiers should have thrown');
    } catch (error) {
      expect(error.httpStatus).to.equal(404);
      expect(error.eudrErrorCode).to.equal('EUDR_DETAIL_RETRIEVAL_UNSUPPORTED');
    }
  });

  it('keeps a plain "Statement not found." NotFoundException as EUDR_NOT_FOUND', async function() {
    const client = new EudrRetrievalClientV4(baseConfig);
    client.transport.sendSoapRequest = async () => {
      throw faultError(`<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns0:Fault xmlns:ns0="http://schemas.xmlsoap.org/soap/envelope/"><faultcode>ns0:Client</faultcode><faultstring>Statement not found.</faultstring><detail><ns5:NotFoundException xmlns:ns5="${NS.dds}"/></detail></ns0:Fault></S:Body></S:Envelope>`);
    };

    try {
      await client.getDds('11111111-2222-3333-4444-555555555555');
      expect.fail('getDds should have thrown');
    } catch (error) {
      expect(error.httpStatus).to.equal(404);
      expect(error.eudrErrorCode).to.equal('EUDR_NOT_FOUND');
      expect(error.detailRetrievalUnsupported).to.equal(undefined);
    }
  });

  it('treats EUDR_WEBSERVICE_DDS_NOT_FOUND_OR_NO_ACCESS as not found', async function() {
    const client = new EudrRetrievalClientV4(baseConfig);
    client.transport.sendSoapRequest = async () => {
      throw faultError(`<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><S:Fault>
        <faultcode>S:Server</faultcode><faultstring>Not found</faultstring>
        <detail><ns5:Fault xmlns:ns5="${NS.dds}" xmlns:ns4="http://ec.europa.eu/sanco/tracesnt/error/v01">
          <ns4:Error><ns4:ID>EUDR_WEBSERVICE_DDS_NOT_FOUND_OR_NO_ACCESS</ns4:ID><ns4:Message>Not found</ns4:Message></ns4:Error>
        </ns5:Fault></detail></S:Fault></S:Body></S:Envelope>`);
    };

    try {
      await client.getDds('u-unknown');
      expect.fail('getDds should have thrown');
    } catch (error) {
      expect(error.httpStatus).to.equal(404);
      expect(error.notFound).to.equal(true);
      expect(error.eudrErrors.map((entry) => entry.code)).to.include('EUDR_WEBSERVICE_DDS_NOT_FOUND_OR_NO_ACCESS');
    }
  });
});

describe('EudrSimplifiedDeclarationClientV4', function() {
  it('targets the V4 SD endpoint with V4 namespaces', function() {
    const client = new EudrSimplifiedDeclarationClientV4(baseConfig);
    expect(client.endpoint).to.equal(`${ACCEPTANCE}/EUDRSimplifiedDeclarationServiceV4`);
    expect(client).to.be.instanceOf(EudrSimplifiedDeclarationClientV3);

    const ns = namespacesOf(client.createSubmitSoapEnvelope({ operatorRole: 'MICRO_OPERATOR', statement: sdStatement }));
    expect(ns.sd).to.equal(NS.sd);
    expect(ns.eudrCommon).to.equal(NS.common);
  });

  it('uses the simplified-declaration/v4 namespace for all six SOAPActions (the V3 quirk is fixed)', function() {
    const client = new EudrSimplifiedDeclarationClientV4(baseConfig);
    for (const operation of ['submitSd', 'updateSd', 'withdrawSd', 'getSd', 'getSdByInternalReference', 'getSdByIdentifiers']) {
      expect(client.sdSoapActionFor(operation)).to.equal(`${NS.sd}/${operation}`);
    }
  });

  it('keeps the V3 getSd* SOAPAction quirk on the V3 client', function() {
    const client = new EudrSimplifiedDeclarationClientV3(baseConfig);
    expect(client.sdSoapActionFor('getSd'))
      .to.equal('http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3/getSd');
  });

  it('accepts an internalReferenceNumber of up to 50 characters (V3: 14)', function() {
    const v4 = new EudrSimplifiedDeclarationClientV4(baseConfig);
    const v3 = new EudrSimplifiedDeclarationClientV3(baseConfig);
    const fifty = 'R'.repeat(50);

    expect(v4.createSubmitSoapEnvelope({ operatorRole: 'MICRO_OPERATOR', statement: { ...sdStatement, internalReferenceNumber: fifty } }))
      .to.include(`<sd:internalReferenceNumber>${fifty}</sd:internalReferenceNumber>`);
    expect(() => v4.createSubmitSoapEnvelope({ operatorRole: 'MICRO_OPERATOR', statement: { ...sdStatement, internalReferenceNumber: `${fifty}X` } }))
      .to.throw(/maximum of 50/).with.property('eudrErrorCode', 'EUDR_V3_SD_INTERNAL_REFERENCE_TOO_LONG');
    expect(() => v3.createSubmitSoapEnvelope({ operatorRole: 'MICRO_OPERATOR', statement: { ...sdStatement, internalReferenceNumber: 'R'.repeat(15) } }))
      .to.throw(/maximum of 14/);
  });

  it('accepts operatorRole MEMBER_STATE', function() {
    const client = new EudrSimplifiedDeclarationClientV4(baseConfig);
    expect(client.createSubmitSoapEnvelope({ operatorRole: 'MEMBER_STATE', statement: sdStatement }))
      .to.include('<sd:operatorRole>MEMBER_STATE</sd:operatorRole>');
  });

  it('requires producerStreet in a postal address (mandatory in the XSD)', function() {
    const client = new EudrSimplifiedDeclarationClientV4(baseConfig);
    const withAddress = (postalAddress) => ({
      operatorRole: 'MICRO_OPERATOR',
      statement: {
        ...sdStatement,
        commodities: [{ ...sdStatement.commodities[0], producers: [{ producerCountry: 'FR', producerLocation: { postalAddress } }] }]
      }
    });

    expect(() => client.createSubmitSoapEnvelope(withAddress({ producerPostalCode: '75001', producerCity: 'Paris' })))
      .to.throw('postalAddress.producerStreet is required');
    expect(client.createSubmitSoapEnvelope(withAddress({ producerStreet: 'Rue De Geneve 4', producerPostalCode: '75001', producerCity: 'Paris' })))
      .to.include('<sd:producerStreet>Rue De Geneve 4</sd:producerStreet>');
  });

  it('sends getSd with the V4 SOAPAction and parses the overview', async function() {
    const client = new EudrSimplifiedDeclarationClientV4(baseConfig);
    const captured = stubSend(client, `<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
      <S:Header><EudrUserMessage>Maintenance on Sunday</EudrUserMessage></S:Header>
      <S:Body><ns5:GetSdResponse xmlns:ns3="${NS.common}" xmlns:ns5="${NS.sd}"><ns5:sdOverviewList>
        <ns3:uuid>u-1</ns3:uuid><ns3:internalReferenceNumber>SD-REF-1</ns3:internalReferenceNumber>
        <ns3:referenceNumberInfo>Assigned</ns3:referenceNumberInfo><ns3:status>AVAILABLE</ns3:status>
      </ns5:sdOverviewList></ns5:GetSdResponse></S:Body></S:Envelope>`);

    const result = await client.getSd('u-1');
    expect(captured.soapAction).to.equal(`${NS.sd}/getSd`);
    expect(result.userMessage).to.equal('Maintenance on Sunday');
    expect(JSON.stringify(result)).to.include('Assigned');
  });
});

describe('EudrVerifyDeclarationClientV4', function() {
  it('targets the V4 Verify endpoint', function() {
    const client = new EudrVerifyDeclarationClientV4(baseConfig);
    expect(client.endpoint).to.equal(`${ACCEPTANCE}/EUDRVerifyDeclarationServiceV4`);
    expect(client).to.be.instanceOf(EudrVerifyDeclarationClientV3);
  });

  it('uses the renamed verification/v4 namespace (not verify-declaration/v4)', function() {
    const client = new EudrVerifyDeclarationClientV4(baseConfig);
    const envelope = client.createVerifyDeclarationSoapEnvelope('25HR3TXDB21346', 'EIBEAESE');
    const ns = namespacesOf(envelope);

    expect(ns.verify).to.equal(NS.verify);
    expect(ns.eudrCommon).to.equal(NS.common);
    expect(envelope).to.not.include('verify-declaration');
    expect(client.soapActionFor('verifyDeclaration')).to.equal(`${NS.verify}/verify-declaration`);
  });

  it('keeps the V3 namespaces on the V3 client', function() {
    const client = new EudrVerifyDeclarationClientV3(baseConfig);
    const ns = namespacesOf(client.createVerifyDeclarationSoapEnvelope('A', 'B'));
    expect(ns.verify).to.equal('http://ec.europa.eu/tracesnt/certificate/eudr/verify-declaration/v3');
    expect(client.soapActionFor('verifyDeclaration'))
      .to.equal('http://ec.europa.eu/tracesnt/certificate/eudr/verification/v3/verify-declaration');
  });

  it('parses a V4 verifyDeclaration response', async function() {
    const client = new EudrVerifyDeclarationClientV4(baseConfig);
    const captured = stubSend(client, `<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body>
      <ns5:VerifyDeclarationResponse xmlns:ns5="${NS.verify}">
        <ns5:result>EXISTING_USABLE</ns5:result><ns5:status>AVAILABLE</ns5:status><ns5:dateTime>2026-11-09T10:00:00Z</ns5:dateTime>
      </ns5:VerifyDeclarationResponse></S:Body></S:Envelope>`);

    const result = await client.verifyDeclaration('25HR3TXDB21346', 'EIBEAESE');
    expect(captured.soapAction).to.equal(`${NS.verify}/verify-declaration`);
    expect(result.result).to.equal('EXISTING_USABLE');
    expect(result.status).to.equal('AVAILABLE');
    expect(result.userMessage).to.equal(null);
  });
});

describe('EudrUserMessageHeaderV4', function() {
  it('reads the documented prefixed form and decodes entities', function() {
    expect(extractUserMessage(
      `<soapenv:Envelope xmlns:soapenv="s"><soapenv:Header><eudr:EudrUserMessage xmlns:eudr="${NS.common}">A &amp; B &lt;soon&gt;</eudr:EudrUserMessage></soapenv:Header><soapenv:Body/></soapenv:Envelope>`
    )).to.equal('A & B <soon>');
  });

  it('returns null when absent, empty, self-closing or only in the body', function() {
    expect(extractUserMessage(undefined)).to.equal(null);
    expect(extractUserMessage('<S:Envelope><S:Body><x/></S:Body></S:Envelope>')).to.equal(null);
    expect(extractUserMessage('<S:Envelope><S:Header><EudrUserMessage>  </EudrUserMessage></S:Header></S:Envelope>')).to.equal(null);
    expect(extractUserMessage('<S:Envelope><S:Header><EudrUserMessage/></S:Header></S:Envelope>')).to.equal(null);
    expect(extractUserMessage('<S:Envelope><S:Body><EudrUserMessage>user text</EudrUserMessage></S:Body></S:Envelope>')).to.equal(null);
  });

  it('exposes the version profiles', function() {
    expect(getApiVersionProfile('v4').bodyNamespace).to.equal(NS.body);
    expect(getApiVersionProfile().version).to.equal('v3');
    expect(() => getApiVersionProfile('v5')).to.throw(/Unsupported EUDR API version/);
  });
});
