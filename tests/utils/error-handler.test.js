/**
 * Unit tests for EudrErrorHandler fault classification.
 */

const { expect } = require('chai');
const EudrErrorHandler = require('../../utils/error-handler');

const PERMISSION_DENIED_XML = `<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body><S:Fault><faultcode>S:Client</faultcode><faultstring>PermissionDeniedException</faultstring></S:Fault></S:Body>
</S:Envelope>`;

function axiosLikeError(status, xml) {
  return {
    message: `Request failed with status code ${status}`,
    response: {
      status,
      statusText: 'Error',
      data: xml
    }
  };
}

describe('EudrErrorHandler', function() {
  describe('NotFoundException fault (V3 get* operations, release 8.2.1)', function() {
    const notFoundFault = `<?xml version="1.0"?>
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body>
    <S:Fault>
      <faultcode>S:Server</faultcode>
      <faultstring>Data not found.</faultstring>
      <detail>
        <ns2:NotFoundException xmlns:ns2="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3"/>
      </detail>
    </S:Fault>
  </S:Body>
</S:Envelope>`;

    it('should classify a NotFoundException as 404 with a typed error code', function() {
      const error = EudrErrorHandler.handleError(axiosLikeError(500, notFoundFault));

      expect(error.httpStatus).to.equal(404);
      expect(error.notFound).to.be.true;
      expect(error.eudrSpecific).to.be.true;
      expect(error.eudrErrorCode).to.equal('EUDR_NOT_FOUND');
      expect(error.eudrErrors).to.have.lengthOf(1);
      expect(error.eudrErrors[0].code).to.equal('EUDR_NOT_FOUND');
    });

    it('should keep the server fault string as the message', function() {
      const error = EudrErrorHandler.handleError(axiosLikeError(500, notFoundFault));

      expect(error.eudrErrorMessage).to.equal('Data not found.');
      expect(error.details.soapFault.faultType).to.equal('NotFoundException');
    });

    it('should not flag unrelated faults as not-found', function() {
      const otherFault = `<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body><S:Fault><faultcode>S:Client</faultcode><faultstring>Something else went wrong</faultstring></S:Fault></S:Body>
</S:Envelope>`;
      const error = EudrErrorHandler.handleError(axiosLikeError(500, otherFault));

      expect(error.notFound).to.be.undefined;
      expect(error.httpStatus).to.equal(400);
      expect(error.details.soapFault.faultType).to.be.null;
    });
  });

  describe('authentication faults', function() {
    it('should normalize an UnauthenticatedException fault to 401', function() {
      // The server answers HTTP 500 with this fault when credentials are wrong, or when the
      // BodyIdentity header names an operator the account may not act as (confirmed live).
      const xml = `<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body><S:Fault><faultcode>env:Client</faultcode><faultstring>UnauthenticatedException</faultstring></S:Fault></S:Body>
</S:Envelope>`;
      const error = EudrErrorHandler.handleError(axiosLikeError(500, xml));

      expect(error.httpStatus).to.equal(401);
    });
  });

  describe('permission faults', function() {
    it('should classify a PermissionDeniedException as 403', function() {
      // Declared as a fault on every V3 operation. Its fault string carries none of the lowercase
      // 'permission'/'not authorized' wording the generic check looks for, so it needs its own match.
      const xml = PERMISSION_DENIED_XML;
      const error = EudrErrorHandler.handleError(axiosLikeError(500, xml));

      expect(error.httpStatus).to.equal(403);
    });
  });

  describe('business rule faults', function() {
    it('should still map known EUDR error codes from the <Error><ID> shape', function() {
      const xml = `<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body><S:Fault><faultcode>S:Client</faultcode><faultstring>Business rules validation</faultstring>
    <detail><ns2:BusinessRulesValidationException xmlns:ns2="http://ec.europa.eu/tracesnt/certificate/eudr/submission/v2">
      <ns3:Error xmlns:ns3="http://ec.europa.eu/sanco/tracesnt/error/v01">
        <ns3:ID>EUDR_API_NO_DDS</ns3:ID>
        <ns3:Message>No DDS corresponding to the provided UUID.</ns3:Message>
      </ns3:Error>
    </ns2:BusinessRulesValidationException></detail>
  </S:Fault></S:Body>
</S:Envelope>`;
      const error = EudrErrorHandler.handleError(axiosLikeError(500, xml));

      expect(error.eudrErrorCode).to.equal('EUDR_API_NO_DDS');
      expect(error.wellKnownError).to.be.true;
    });
  });

  // Every row of the "How server faults are surfaced" table in README.md is pinned below, so the
  // documented contract cannot drift away from the handler again.
  describe('README fault table contract', function() {
    function fault(faultCode, faultString, detail = '') {
      return `<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Body><S:Fault><faultcode>${faultCode}</faultcode><faultstring>${faultString}</faultstring>${detail}</S:Fault></S:Body>
</S:Envelope>`;
    }

    // The envelope prefix differs per V3 service, so none of the mappings may depend on it.
    const CLIENT_FAULTCODES = ['S:Client', 'soapenv:Client', 'env:Client', 'SOAP-ENV:Client'];

    describe('XSD validation (SAXParseException / cvc-*) => 400', function() {
      // The EUDR system wraps the SAX exception a varying number of times; both depths must parse.
      const NESTED = 'org.xml.sax.SAXParseException; org.xml.sax.SAXException: org.xml.sax.SAXParseException; cvc-complex-type.2.4.a: Invalid content was found starting with element foo.';
      const SINGLE = 'org.xml.sax.SAXParseException; cvc-minLength-valid: value has length 0.';

      CLIENT_FAULTCODES.forEach(function(faultCode) {
        [['nested', NESTED], ['single-level', SINGLE]].forEach(function([label, faultString]) {
          it(`maps a ${label} SAX fault with faultcode ${faultCode} to 400 + XML_VALIDATION_ERROR`, function() {
            const error = EudrErrorHandler.handleError(axiosLikeError(500, fault(faultCode, faultString)));

            expect(error.httpStatus).to.equal(400);
            expect(error.eudrErrors).to.have.lengthOf(1);
            expect(error.eudrErrors[0].code).to.equal('XML_VALIDATION_ERROR');
            expect(error.eudrErrorCode).to.equal('XML_VALIDATION_ERROR');
          });
        });
      });
    });

    describe('BusinessRulesValidationException => 400', function() {
      // The lowercase <errors><error><field>/<message> shape used by Verify Declaration V3.
      const DETAIL = '<detail><errors><error><field>statement.activityType</field><message>Invalid activity</message></error></errors></detail>';

      // Reported with a *Server* faultcode by the live system, so it must be matched by name.
      ['soapenv:Server', 'SOAP-ENV:Server', 'S:Client'].forEach(function(faultCode) {
        it(`maps faultcode ${faultCode} to 400 with a { code, message, field } triple`, function() {
          const error = EudrErrorHandler.handleError(
            axiosLikeError(500, fault(faultCode, 'BusinessRulesValidationException', DETAIL))
          );

          expect(error.httpStatus).to.equal(400);
          expect(error.eudrErrors).to.have.lengthOf(1);
          expect(error.eudrErrors[0]).to.deep.equal({
            code: null,
            message: 'Invalid activity',
            field: 'statement.activityType'
          });
        });
      });
    });

    describe('NotFoundException => 404', function() {
      it('does not treat a validation fault echoing "Data not found" as a 404', function() {
        // cvc-* faults quote the offending user value back, so the phrase can appear in a fault
        // that has nothing to do with a missing declaration.
        const faultString = "org.xml.sax.SAXParseException; cvc-datatype-valid.1.2.1: 'Data not found role' is not a valid value for 'integer'";
        const error = EudrErrorHandler.handleError(axiosLikeError(500, fault('S:Client', faultString)));

        expect(error.notFound).to.be.undefined;
        expect(error.httpStatus).to.equal(400);
        expect(error.eudrErrorCode).to.equal('EUDR_DATA_TYPE_VALIDATION_ERROR');
      });

      it('keeps httpStatus 404 and the EUDR_NOT_FOUND entry when the fault also carries error details', function() {
        // The status and eudrErrors reassignments further down handleError must not contradict
        // the notFound flag that callers are documented to branch on.
        const detail = `<detail>
          <ns2:NotFoundException xmlns:ns2="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3"/>
          <errors><error><field>role</field><message>role is not allowed</message></error></errors>
        </detail>`;
        const error = EudrErrorHandler.handleError(axiosLikeError(500, fault('S:Server', 'Data not found.', detail)));

        expect(error.notFound).to.be.true;
        expect(error.httpStatus).to.equal(404);
        expect(error.eudrErrors.map(e => e.code)).to.include('EUDR_NOT_FOUND');
      });

      it('does not duplicate entries when the fault carries several error details', function() {
        // The eudrErrors reassignment runs once per error detail, so it has to be idempotent.
        const detail = `<detail>
          <ns2:NotFoundException xmlns:ns2="http://ec.europa.eu/tracesnt/certificate/eudr/due-diligence-statement/v3"/>
          <errors>
            <error><field>a</field><message>first</message></error>
            <error><field>b</field><message>second</message></error>
            <error><field>c</field><message>third</message></error>
          </errors>
        </detail>`;
        const error = EudrErrorHandler.handleError(axiosLikeError(500, fault('S:Server', 'Data not found.', detail)));

        expect(error.eudrErrors).to.have.lengthOf(4);
        expect(error.eudrErrors[0].code).to.equal('EUDR_NOT_FOUND');
        expect(error.eudrErrors.slice(1).map(e => e.message)).to.deep.equal(['first', 'second', 'third']);
      });
    });
  });
});
