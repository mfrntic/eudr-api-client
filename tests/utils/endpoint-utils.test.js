/**
 * Tests for endpoint-utils.js
 */

const { expect } = require('chai');
const endpointUtils = require('../../utils/endpoint-utils');

describe('Endpoint Utils', function() {
  describe('isStandardClientId', function() {
    it('should return true for standard client IDs', function() {
      expect(endpointUtils.isStandardClientId('eudr')).to.be.true;
      expect(endpointUtils.isStandardClientId('eudr-test')).to.be.true;
    });

    it('should return false for custom client IDs', function() {
      expect(endpointUtils.isStandardClientId('custom-client')).to.be.false;
      expect(endpointUtils.isStandardClientId('my-company')).to.be.false;
      expect(endpointUtils.isStandardClientId('')).to.be.false;
    });
  });

  describe('getBaseUrl', function() {
    it('should return correct base URLs for standard client IDs', function() {
      expect(endpointUtils.getBaseUrl('eudr')).to.equal('https://eudr.webcloud.ec.europa.eu');
      expect(endpointUtils.getBaseUrl('eudr-test')).to.equal('https://acceptance.eudr.webcloud.ec.europa.eu');
    });

    it('should throw error for non-standard client IDs', function() {
      expect(() => endpointUtils.getBaseUrl('custom-client')).to.throw(
        'Automatic endpoint generation not supported for webServiceClientId: custom-client. Please provide endpoint manually.'
      );
    });
  });

  describe('getServicePath', function() {
    it('should return correct service paths for echo service', function() {
      expect(endpointUtils.getServicePath('echo', 'v1')).to.equal('/EudrEchoService');
      expect(endpointUtils.getServicePath('echo', 'v2')).to.equal('/EudrEchoService');
    });

    it('should return correct service paths for retrieval service', function() {
      expect(endpointUtils.getServicePath('retrieval', 'v1')).to.equal('/EUDRRetrievalServiceV1');
      expect(endpointUtils.getServicePath('retrieval', 'v2')).to.equal('/EUDRRetrievalServiceV1');
    });

    it('should return correct service paths for submission service', function() {
      expect(endpointUtils.getServicePath('submission', 'v1')).to.equal('/EUDRSubmissionServiceV1');
      expect(endpointUtils.getServicePath('submission', 'v2')).to.equal('/EUDRSubmissionServiceV2');
    });

    it('should throw error for unknown service', function() {
      expect(() => endpointUtils.getServicePath('unknown', 'v1')).to.throw(
        'Unknown service: unknown. Supported services: echo, retrieval, submission'
      );
    });

    it('should throw error for unknown version', function() {
      expect(() => endpointUtils.getServicePath('echo', 'v3')).to.throw(
        'Version v3 not supported for service echo. Supported versions: v1, v2'
      );
    });
  });
 
  describe('generateEndpoint', function() {
    it('should generate correct endpoints for echo service', function() {
      expect(endpointUtils.generateEndpoint('echo', 'v1', 'eudr')).to.equal(
        'https://eudr.webcloud.ec.europa.eu/tracesnt/ws/EudrEchoService'
      );
      expect(endpointUtils.generateEndpoint('echo', 'v1', 'eudr-test')).to.equal(
        'https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EudrEchoService'
      );
    });

    it('should generate correct endpoints for submission service V2', function() {
      expect(endpointUtils.generateEndpoint('submission', 'v2', 'eudr')).to.equal(
        'https://eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRSubmissionServiceV2'
      );
      expect(endpointUtils.generateEndpoint('submission', 'v2', 'eudr-test')).to.equal(
        'https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRSubmissionServiceV2'
      );
    });
  });

  describe('validateAndGenerateEndpoint', function() {
    it('should use provided endpoint when available', function() {
      const config = {
        endpoint: 'https://custom-endpoint.com/ws/service',
        username: 'user',
        password: 'pass',
        webServiceClientId: 'custom-client'
      };

      const result = endpointUtils.validateAndGenerateEndpoint(config, 'echo', 'v1');
      
      expect(result.endpoint).to.equal('https://custom-endpoint.com/ws/service'); 
    });

    it('should generate endpoint for standard client ID when no endpoint provided', function() {
      const config = {
        username: 'user',
        password: 'pass',
        webServiceClientId: 'eudr-test'
      };

      const result = endpointUtils.validateAndGenerateEndpoint(config, 'submission', 'v2');
      
      expect(result.endpoint).to.equal('https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRSubmissionServiceV2');
 
    });

    it('should throw error when no endpoint and no webServiceClientId', function() {
      const config = {
        username: 'user',
        password: 'pass'
      };

      expect(() => endpointUtils.validateAndGenerateEndpoint(config, 'echo', 'v1')).to.throw(
        'webServiceClientId is required when endpoint is not provided'
      );
    });

    it('should throw error when no endpoint and non-standard webServiceClientId', function() {
      const config = {
        username: 'user',
        password: 'pass',
        webServiceClientId: 'custom-client'
      };

      expect(() => endpointUtils.validateAndGenerateEndpoint(config, 'echo', 'v1')).to.throw(
        'webServiceClientId "custom-client" does not support automatic endpoint generation. Please provide endpoint manually or use one of: eudr, eudr-test'
      );
    });
  });

  describe('getSupportedClientIds', function() {
    it('should return all supported client IDs', function() {
      const supported = endpointUtils.getSupportedClientIds();
      expect(supported).to.deep.equal(['eudr', 'eudr-test']);
    });
  });

  describe('getSupportedServices', function() {
    it('should return all supported services', function() {
      const supported = endpointUtils.getSupportedServices();
      expect(supported).to.deep.equal(['echo', 'retrieval', 'submission']);
    });
  });

  describe('getSupportedVersions', function() {
    it('should return supported versions for echo service', function() {
      const versions = endpointUtils.getSupportedVersions('echo');
      expect(versions).to.deep.equal(['v1', 'v2']);
    });

    it('should return supported versions for submission service', function() {
      const versions = endpointUtils.getSupportedVersions('submission');
      expect(versions).to.deep.equal(['v1', 'v2']);
    });

    it('should return empty array for unknown service', function() {
      const versions = endpointUtils.getSupportedVersions('unknown');
      expect(versions).to.deep.equal([]);
    });
  });

  describe('Constants', function() {
    it('should export STANDARD_CLIENT_IDS', function() {
      expect(endpointUtils.STANDARD_CLIENT_IDS).to.deep.equal(['eudr', 'eudr-test']);
    });

    it('should export BASE_URLS', function() {
      expect(endpointUtils.BASE_URLS).to.deep.equal({
        'eudr': 'https://eudr.webcloud.ec.europa.eu',
        'eudr-test': 'https://acceptance.eudr.webcloud.ec.europa.eu'
      });
    });

    it('should export SERVICE_PATHS', function() {
      expect(endpointUtils.SERVICE_PATHS).to.have.property('echo');
      expect(endpointUtils.SERVICE_PATHS).to.have.property('retrieval');
      expect(endpointUtils.SERVICE_PATHS).to.have.property('submission');
    });

    it('should export SOAP_ACTIONS', function() {
      expect(endpointUtils.SOAP_ACTIONS).to.have.property('echo');
      expect(endpointUtils.SOAP_ACTIONS).to.have.property('retrieval');
      expect(endpointUtils.SOAP_ACTIONS).to.have.property('submission');
    });
  });
});
