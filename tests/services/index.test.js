/**
 * Tests for main services/index.js integration
 */

const { expect } = require('chai');
const services = require('../../services');

describe('Services Index Integration', function() {
  describe('Service Clients Export', function() {
    it('should export all service clients', function() {
      expect(services).to.have.property('EudrEchoClient');
      expect(services).to.have.property('EudrRetrievalClient');
      expect(services).to.have.property('EudrSubmissionClient');
      expect(services).to.have.property('EudrSubmissionClientV2');
    });

    it('should export service clients as classes', function() {
      expect(services.EudrEchoClient).to.be.a('function');
      expect(services.EudrRetrievalClient).to.be.a('function');
      expect(services.EudrSubmissionClient).to.be.a('function');
      expect(services.EudrSubmissionClientV2).to.be.a('function');
    });
  });

  describe('Configuration Export', function() {
    it('should export config object', function() {
      expect(services).to.have.property('config');
      expect(services.config).to.be.an('object');
    });

    it('should export configuration functions', function() {
      expect(services.config).to.have.property('getSupportedClientIds');
      expect(services.config).to.have.property('getSupportedServices');
      expect(services.config).to.have.property('getSupportedVersions');
      expect(services.config).to.have.property('generateEndpoint');
      expect(services.config).to.have.property('isStandardClientId');
    });

    it('should export configuration functions as functions', function() {
      expect(services.config.getSupportedClientIds).to.be.a('function');
      expect(services.config.getSupportedServices).to.be.a('function');
      expect(services.config.getSupportedVersions).to.be.a('function');
      expect(services.config.generateEndpoint).to.be.a('function');
      expect(services.config.isStandardClientId).to.be.a('function');
    });
  });

  describe('Configuration Functionality', function() {
    it('should identify standard client IDs correctly', function() {
      expect(services.config.isStandardClientId('eudr')).to.be.true;
      expect(services.config.isStandardClientId('eudr-test')).to.be.true;
      expect(services.config.isStandardClientId('custom-client')).to.be.false;
    });

    it('should return supported client IDs', function() {
      const supported = services.config.getSupportedClientIds();
      expect(supported).to.deep.equal(['eudr', 'eudr-test']);
    });

    it('should return supported services', function() {
      const supported = services.config.getSupportedServices();
      expect(supported).to.deep.equal(['echo', 'retrieval', 'submission']);
    });

    it('should return supported versions for services', function() {
      const echoVersions = services.config.getSupportedVersions('echo');
      const submissionVersions = services.config.getSupportedVersions('submission');
      
      expect(echoVersions).to.deep.equal(['v1', 'v2']);
      expect(submissionVersions).to.deep.equal(['v1', 'v2']);
    });

    it('should generate endpoints correctly', function() {
      const echoEndpoint = services.config.generateEndpoint('echo', 'v1', 'eudr-test');
      const submissionEndpoint = services.config.generateEndpoint('submission', 'v2', 'eudr');
      
      expect(echoEndpoint).to.equal('https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EudrEchoService');
      expect(submissionEndpoint).to.equal('https://eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRSubmissionServiceV2');
    });
  });

  describe('Service Integration with Configuration', function() {
    it('should create Echo Client with automatic endpoint generation', function() {
      const client = new services.EudrEchoClient({
        username: 'testuser',
        password: 'testpass',
        webServiceClientId: 'eudr-test'
      });

      expect(client.config.endpoint).to.equal('https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EudrEchoService');
      expect(client.config.webServiceClientId).to.equal('eudr-test');
    });

    it('should create Retrieval Client with automatic endpoint generation', function() {
      const client = new services.EudrRetrievalClient({
        username: 'testuser',
        password: 'testpass',
        webServiceClientId: 'eudr'
      });

      expect(client.config.endpoint).to.equal('https://eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRRetrievalServiceV1');
      expect(client.config.webServiceClientId).to.equal('eudr');
    });

    it('should create Submission Client V1 with automatic endpoint generation', function() {
      const client = new services.EudrSubmissionClient({
        username: 'testuser',
        password: 'testpass',
        webServiceClientId: 'eudr-test'
      });

      expect(client.config.endpoint).to.equal('https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRSubmissionServiceV1');
      expect(client.config.webServiceClientId).to.equal('eudr-test');
    });

    it('should create Submission Client V2 with automatic endpoint generation', function() {
      const client = new services.EudrSubmissionClientV2({
        username: 'testuser',
        password: 'testpass',
        webServiceClientId: 'eudr'
      });

      expect(client.config.endpoint).to.equal('https://eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRSubmissionServiceV2');
      expect(client.config.webServiceClientId).to.equal('eudr');
    });
  });
});
