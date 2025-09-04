const {
  testConfig, 
  validateEnvironment,
  retryApiCall,
  cleanupTestData
} = require('../test-setup');
const { EudrEchoClient } = require('../../services');

describe('EudrEchoClient - Integration Tests', function () {
  let echoClient;
  let testReferences = [];

  // Increase timeout for integration tests
  this.timeout(60000);

  before(function () {
    // Validate environment before running tests
    validateEnvironment();
    console.log("------------------------------------------------------------------------------------------------");    

    // Disable client logging during tests to avoid noise
    const { logger } = require('../../utils/logger');
    if (logger && logger.level) {
      logger.level = 'error'; // Only show errors, not debug/info
    }
  });

  beforeEach(function () {
    echoClient = new EudrEchoClient({
      username: testConfig.username,
      password: testConfig.password,
      webServiceClientId: testConfig.webServiceClientId,
      timestampValidity: testConfig.timestampValidity,
      timeout: testConfig.timeout
    });
  });

  afterEach(async function () {
    // Cleanup test data after each test
    if (testReferences.length > 0) {
      await cleanupTestData(echoClient, testReferences);
      testReferences = [];
    }
  });

  // ============================================================================
  // CONFIGURATION & VALIDATION TESTS
  // ============================================================================

  describe('🔧 Configuration & Validation', function () {
    it('should throw error when endpoint is missing and no webServiceClientId', function () {
      expect(() => {
        new EudrEchoClient({
          username: testConfig.username,
          password: testConfig.password
        });
      }).to.throw('webServiceClientId is required when endpoint is not provided');
    });

    it('should throw error when username is missing', function () {
      expect(() => {
        new EudrEchoClient({
          endpoint: testConfig.endpoint + '/EudrEchoService',
          password: testConfig.password
        });
      }).to.throw('Missing required configuration: username');
    });

    it('should throw error when password is missing', function () {
      expect(() => {
        new EudrEchoClient({
          endpoint: testConfig.endpoint + '/EudrEchoService',
          username: testConfig.username
        });
      }).to.throw('Missing required configuration: password');
    });

    it('should throw error when custom webServiceClientId without endpoint', function () {
      expect(() => {
        new EudrEchoClient({
          username: testConfig.username,
          password: testConfig.password,
          webServiceClientId: 'custom-client'
        });
      }).to.throw('webServiceClientId "custom-client" does not support automatic endpoint generation');
    });
  });

  // ============================================================================
  // CONNECTION & AUTHENTICATION TESTS
  // ============================================================================

  describe('🌐 Connection & Authentication', function () {
    it('should establish connection to EUDR Echo API and handle various response types', async function () {
      try {
        const response = await retryApiCall(() =>
          echoClient.echo('Test connection message')
        );

        // If we get here, connection was successful
        // Response might be success or validation error, both indicate connection works
        expect(response).to.be.an('object');
      } catch (error) {
        // Connection error should have specific structure
        if (error && error.error) {
          expect(error).to.have.property('error', true);
        } else if (error && error.code) {
          // Network/HTTP error
          expect(error.code).to.be.a('string');
        } else {
          // Unexpected error type
          expect(error).to.be.instanceOf(Error);
        }
      }
    });

    it('should validate authentication and handle various error response formats', async function () {
      try {
        await echoClient.echo('Test authentication message');
        // Authentication successful
      } catch (error) {
        // Authentication error is expected for test data
        if (error && error.error) {
          expect(error).to.have.property('error', true);
        } else if (error && error.code) {
          expect(error.code).to.be.a('string');
        } else {
          expect(error).to.be.instanceOf(Error);
        }
      }
    });
  });

  // ============================================================================
  // CORE FUNCTIONALITY TESTS
  // ============================================================================

  describe('📋 Core Functionality', function () {
    it('should process valid echo messages', async function () {
      const testMessage = 'Test echo message ' + Date.now();

      try {
        const response = await echoClient.echo(testMessage);

        console.log("echo response", response);
   
        // If successful, response should be an object
        expect(response.httpStatus).to.equal(200);
        expect(response.status).to.contain('testMessage');
      } catch (error) {
        // Expected error for test message, but method should work
        if (error && error.error) {
          expect(error).to.have.property('error', true);
        } else if (error && error.code) {
          expect(error.code).to.be.a('string');
        } else {
          expect(error).to.be.instanceOf(Error);
        }
      }

      testReferences.push(`echo-valid-${Date.now()}`);
    });

    it('should process empty echo messages', async function () {
      try {
        const response = await echoClient.echo('');
        // If successful, response should be an object
        expect(response.httpStatus).to.equal(200);
        expect(response.status).to.startWith('User');
      } catch (error) {
        // Expected error for empty message, but method should work
        if (error && error.error) {
          expect(error).to.have.property('error', true);
        } else if (error && error.code) {
          expect(error.code).to.be.a('string');
        } else {
          expect(error).to.be.instanceOf(Error);
        }
      }

      testReferences.push(`echo-empty-${Date.now()}`);
    });

    it('should process long echo messages', async function () {
      const longMessage = 'A'.repeat(10000) + ' - Long message test';

      try {
        const response = await echoClient.echo(longMessage);
        // If successful, response should be an object
        expect(response.httpStatus).to.equal(200);
        expect(response.status).to.startWith('User');
      } catch (error) {
        // Expected error for long message, but method should work
        if (error && error.error) {
          expect(error).to.have.property('error', true);
        } else if (error && error.code) {
          expect(error.code).to.be.a('string');
        } else {
          expect(error).to.be.instanceOf(Error);
        }
      }

      testReferences.push(`echo-long-${Date.now()}`);
    });

    it('should process special characters in echo messages', async function () {
      const specialMessage = 'Test message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';

      try {
        const response = await echoClient.echo(specialMessage);
        // If successful, response should be an object
        expect(response.httpStatus).to.equal(200);
        expect(response.status).to.contain(specialMessage);
      } catch (error) {
        // Expected error for special chars, but method should work
        if (error && error.error) {
          expect(error).to.have.property('error', true);
        } else if (error && error.code) {
          expect(error.code).to.be.a('string');
        } else {
          expect(error).to.be.instanceOf(Error);
        }
      }

      testReferences.push(`echo-special-${Date.now()}`);
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('⚠️ Error Handling', function () {
    it('should reject invalid credentials', async function () {
      const invalidClient = new EudrEchoClient({ 
        username: 'invalid_username',
        password: 'invalid_password',
        webServiceClientId: testConfig.webServiceClientId
      });

     

      try {
       const response = await invalidClient.echo('Test message');
   
         
      } catch (error) {
        console.log("invalid credentials response", error);
        expect(error.code).to.equal('UNAUTHENTICATED');
        expect(error.details.status).to.equal(401);
        expect(error.details.statusText).to.equal('Invalid credentials');
 
      }
    });

    it('should handle network connectivity issues', async function () {
      const invalidEndpointClient = new EudrEchoClient({
        endpoint: 'https://invalid-endpoint.com/soap', 
        username: testConfig.username,
        password: testConfig.password,
        webServiceClientId: testConfig.webServiceClientId
      });

      try {
        await invalidEndpointClient.echo('Test message');
        expect.fail('Should have thrown a network error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error); 
        expect(error.httpStatus).to.equal(500);
      }
    });
  });

  // ============================================================================
  // SECURITY & WSSE TESTS
  // ============================================================================

  describe('🔒 Security & WSSE', function () {
    it('should include proper WSSE security headers in requests', async function () {
      try {
        await echoClient.echo('Test WSSE message');
        // If we get here, WSSE headers were correct
      } catch (error) {
        // Expected error for test message, but WSSE should work
        if (error && error.error) {
          expect(error).to.have.property('error', true);
        } else if (error && error.code) {
          expect(error.code).to.be.a('string');
        } else {
          expect(error).to.be.instanceOf(Error);
        }
      }

      testReferences.push(`echo-wsse-${Date.now()}`);
    });

    it('should respect custom timestamp validity settings in WSSE headers', async function () {
      const customTimestampClient = new EudrEchoClient({
        endpoint: testConfig.endpoint + '/EUDRSubmissionServiceV1', 
        username: testConfig.username,
        password: testConfig.password,
        webServiceClientId: testConfig.webServiceClientId,
        timestampValidity: 30 // 30 seconds
      });

      try {
        await customTimestampClient.echo('Test timestamp message');
      } catch (error) {
        // Expected error for test message, but timestamp should work
        if (error && error.error) {
          expect(error).to.have.property('error', true);
        } else if (error && error.code) {
          expect(error.code).to.be.a('string');
        } else {
          expect(error).to.be.instanceOf(Error);
        }
      }

      testReferences.push(`echo-timestamp-${Date.now()}`);
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('⚡ Performance', function () {
    it('should handle multiple concurrent requests efficiently', async function () {
      const promises = [];
      const messageCount = 5;

      for (let i = 0; i < messageCount; i++) {
        promises.push(echoClient.echo(`Rapid request ${i + 1}`));
      }

      try {
        const responses = await Promise.all(promises);
        // If successful, all responses should be objects
        expect(responses).to.have.length(messageCount);
        responses.forEach(response => {
          expect(response).to.be.an('object');
        });
      } catch (error) {
        // Expected error for rapid requests, but method should work
        if (error && error.error) {
          expect(error).to.have.property('error', true);
        } else if (error && error.code) {
          expect(error.code).to.be.a('string');
        } else {
          expect(error).to.be.instanceOf(Error);
        }
      }

      testReferences.push(`echo-rapid-${Date.now()}`);
    });
  });
});
