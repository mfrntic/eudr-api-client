const { validateEnvironment } = require('./test-setup');

describe('EUDR API Client - Integration Test Suite', function() {
  // Increase timeout for full integration test suite
  this.timeout(300000); // 5 minutes total
  
  before(function() {   
    // Validate environment before running any tests
    validateEnvironment();
  });
  
  after(function() {
    console.log('');
    console.log('✅ Integration test suite completed');
    console.log('📊 All tests have been executed against the real EUDR API');
    console.log('🔍 Check individual test results for detailed information');
  });

  // describe('Test Suite Overview', function() {
  //   it('should have all required environment variables', function() {
  //     // This test validates that the environment is properly configured
  //     expect(process.env.EUDR_TRACES_USERNAME).to.be.a('string').that.is.not.empty;
  //     expect(process.env.EUDR_TRACES_PASSWORD).to.be.a('string').that.is.not.empty;
  //     expect(process.env.EUDR_TRACES_BASE_URL).to.be.a('string').that.is.not.empty;
      
  //     console.log('✅ Environment configuration validated');
  //   });

  //   it('should be able to connect to EUDR API endpoints', function() {
  //     const baseUrl = process.env.EUDR_TRACES_BASE_URL;
  //     expect(baseUrl).to.include('https://');
  //     expect(baseUrl).to.include('eudr.webcloud.ec.europa.eu');
      
  //     console.log(`✅ EUDR API endpoint validated: ${baseUrl}`);
  //   });
  // });
});

// Import all integration tests
require('./services/echo-service.integration.test');
require('./services/retrieval-service.integration.test');
require('./services/submission-service.integration.test');
require('./services/submission-service-v2.integration.test');
