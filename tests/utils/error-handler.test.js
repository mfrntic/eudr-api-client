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
});
