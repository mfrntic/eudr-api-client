/**
 * Tests for Echo Service endpoint logic
 */

const { expect } = require('chai');
const EudrEchoClient = require('../../services/echo-service');

describe('Echo Client Endpoint Logic', function() {
  describe('Automatic endpoint generation', function() {
    it('should generate endpoint for eudr-test webServiceClientId', function() {
      const client = new EudrEchoClient({
        username: 'testuser',
        password: 'testpass',
        webServiceClientId: 'eudr-test'
      });

      expect(client.config.endpoint).to.equal('https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EudrEchoService');
      expect(client.config.webServiceClientId).to.equal('eudr-test');
    });

    it('should generate endpoint for eudr webServiceClientId', function() {
      const client = new EudrEchoClient({
        username: 'testuser',
        password: 'testpass',
        webServiceClientId: 'eudr-repository'
      });

      expect(client.config.endpoint).to.equal('https://eudr.webcloud.ec.europa.eu/tracesnt/ws/EudrEchoService');
        expect(client.config.webServiceClientId).to.equal('eudr-repository');
    });
  });

  describe('Manual endpoint override', function() {
    it('should use provided endpoint when available', function() {
      const client = new EudrEchoClient({
        endpoint: 'https://custom-endpoint.com/ws/service',
        username: 'testuser',
        password: 'testpass',
        webServiceClientId: 'custom-client'
      });

      expect(client.config.endpoint).to.equal('https://custom-endpoint.com/ws/service');
      expect(client.config.webServiceClientId).to.equal('custom-client');
    });

    it('should override auto-generated endpoint when provided', function() {
      const client = new EudrEchoClient({
        endpoint: 'https://override-endpoint.com/ws/service',
        username: 'testuser',
        password: 'testpass',
        webServiceClientId: 'eudr-test'
      });

      expect(client.config.endpoint).to.equal('https://override-endpoint.com/ws/service');
      expect(client.config.webServiceClientId).to.equal('eudr-test');
    });
  });

  describe('Error handling', function() {
    it('should throw error when no endpoint and no webServiceClientId', function() {
      expect(() => {
        new EudrEchoClient({
          username: 'testuser',
          password: 'testpass'
        });
      }).to.throw('webServiceClientId is required when endpoint is not provided');
    });

    it('should throw error when no endpoint and non-standard webServiceClientId', function() {
      expect(() => {
        new EudrEchoClient({
          username: 'testuser',
          password: 'testpass',
          webServiceClientId: 'custom-client'
        });
      }).to.throw('webServiceClientId "custom-client" does not support automatic endpoint generation');
    });

    it('should throw error when username is missing', function() {
      expect(() => {
        new EudrEchoClient({
          password: 'testpass',
          webServiceClientId: 'eudr-test'
        });
      }).to.throw('Missing required configuration: username');
    });

    it('should throw error when password is missing', function() {
      expect(() => {
        new EudrEchoClient({
          username: 'testuser',
          webServiceClientId: 'eudr-test'
        });
      }).to.throw('Missing required configuration: password');
    });
  });

  describe('Configuration validation', function() {
    it('should set default values for optional parameters', function() {
      const client = new EudrEchoClient({
        username: 'testuser',
        password: 'testpass',
        webServiceClientId: 'eudr-test'
      });

      expect(client.config.timestampValidity).to.equal(60);
      expect(client.config.timeout).to.equal(10000);
    });

    it('should override default values when provided', function() {
      const client = new EudrEchoClient({
        username: 'testuser',
        password: 'testpass',
        webServiceClientId: 'eudr-test',
        timestampValidity: 120,
        timeout: 15000
      });

      expect(client.config.timestampValidity).to.equal(120);
      expect(client.config.timeout).to.equal(15000);
    });
  });
});
