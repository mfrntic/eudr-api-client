/**
 * EUDR API Client Test Setup
 * 
 * This file configures the test environment for all EUDR API Client tests.
 * It sets up logging, validates environment variables, and provides test utilities.
 * 
 * IMPORTANT: Logger tests (tests/logger.test.js) should run FIRST to ensure
 * the logging infrastructure is working correctly before running other tests.
 * 
 * To run specific service tests:
 * - npm run test:logger      (Logger system tests - RUN FIRST)
 * - npm run test:echo        (11 Echo service tests)
 * - npm run test:retrieval   (17 Retrieval service tests)
 * - npm run test:submission  (V1 submission tests)
 * - npm run test:submission:v2 (V2 submission tests)
 * 
 * Each command uses --grep flag to ensure only specified tests run.
 */

require('dotenv').config();
const chai = require('chai');
const { logger } = require('../utils/logger');

// Configure Chai
global.expect = chai.expect;
global.assert = chai.assert;
global.should = chai.should();

// Set logger level to error for tests to reduce noise
// This can be overridden by setting EUDR_LOG_LEVEL environment variable
if (logger && logger.level) {
  const testLogLevel = process.env.EUDR_LOG_LEVEL || 'warn';
  logger.level = testLogLevel;
  
  // Only log logger level changes when explicitly set via environment
  if (process.env.EUDR_LOG_LEVEL) {
    logger.info(`Logger level set to: ${testLogLevel}`);
  }
}

// Note: During tests, you'll see:
// - Clean Pino-formatted logs from the client
// - Logger output from client at the configured level
// - This gives clean test output while preserving important client information
// 
// To see more client logs during debugging:
// EUDR_LOG_LEVEL=debug npm test
// 
// To see only errors:
// EUDR_LOG_LEVEL=error npm test
// 
// To see normal development logs:
// EUDR_LOG_LEVEL=info npm test
// 
// Remember: The default 'warn' level is perfect for most testing scenarios
// as it shows important issues without cluttering the test output
// 
// Test Counts by Service:
// - Logger System: 20+ tests (logging infrastructure, fallback, configuration)
// - Echo Service: 11 tests (connection, auth, functionality, performance, errors, security)
// - Retrieval Service: 16 tests (DDS retrieval, supply chain, all methods tested)
// - Submission Service V1: Multiple tests (DDS submission, amendment, retraction)
// - Submission Service V2: Multiple tests (V2 structure, activity-specific rules)

// Real EUDR API configuration from environment variables
const testConfig = {
  username: process.env.EUDR_TRACES_USERNAME,
  password: process.env.EUDR_TRACES_PASSWORD,
  webServiceClientId: process.env.EUDR_WEB_SERVICE_CLIENT_ID || 'eudr-test',
  timestampValidity: 60,
  timeout: parseInt(process.env.EUDR_TRACES_TIMEOUT) || 30000,
  endpoint: process.env.EUDR_TRACES_BASE_URL + '/tracesnt/ws', 
};

// Validate required environment variables
function validateEnvironment() {
  const required = ['EUDR_TRACES_USERNAME', 'EUDR_TRACES_PASSWORD', 'EUDR_TRACES_BASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('⚠️ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('');
    console.error('📝 Please create a .env file based on env.example and fill in your credentials');
    console.error('🔐 You can get your credentials from the EUDR acceptance system');
    process.exit(1);
  }
  
  console.log('✅ Environment variables loaded successfully');
  console.log(`🌐 Using EUDR API: ${process.env.EUDR_TRACES_BASE_URL}`);
  console.log(`👤 Username: ${process.env.EUDR_TRACES_USERNAME}`);
  console.log(`🔑 Web Service Client ID: ${process.env.EUDR_WEB_SERVICE_CLIENT_ID}`);
  console.log('');
}

// Test data for real API calls
const testData = {
  // Test UUIDs (these should be real DDS identifiers from your system)
  testUuid: process.env.TEST_DDS_UUID || '123e4567-e89b-12d3-a456-426614174000',
  testReferenceNumber: process.env.TEST_REFERENCE_NUMBER || '25HRCEFR3I1042',
  testVerificationNumber: process.env.TEST_VERIFICATION_NUMBER || 'VER123456',
  
  // Test scenarios for submission
  testImportRequest: {
    operatorType: 'OPERATOR',
    statement: {
      internalReferenceNumber: `TEST-IMPORT-${Date.now()}`,
      activityType: 'IMPORT',
      countryOfActivity: 'HR',
      borderCrossCountry: 'HR',
      comment: 'Test import submission from integration tests',
      commodities: [{
        descriptors: {
          descriptionOfGoods: 'Test wood products for integration testing',
          goodsMeasure: {
            netWeight: 100.0,
            volume: 2.0,
            supplementaryUnit: 1,
            supplementaryUnitQualifier: 'MTQ'
          }
        },
        hsHeading: '4407',
        speciesInfo: {
          scientificName: 'Quercus robur',
          commonName: 'English Oak'
        },
        producers: [{
          country: 'HR',
          name: 'Test Producer for Integration Tests',
          geometryGeojson: '{"type":"Point","coordinates":[15.9665,45.8150]}'
        }]
      }],
      geoLocationConfidential: false
    }
  },
  
  testDomesticRequest: {
    operatorType: 'OPERATOR',
    statement: {
      internalReferenceNumber: `TEST-DOMESTIC-${Date.now()}`,
      activityType: 'DOMESTIC',
      countryOfActivity: 'HR',
      comment: 'Test domestic production from integration tests',
      commodities: [{
        descriptors: {
          descriptionOfGoods: 'Test domestic wood products',
          goodsMeasure: {
            netWeight: 50.0,
            volume: 1.0,
            supplementaryUnit: 0.5,
            supplementaryUnitQualifier: 'MTQ'
          }
        },
        hsHeading: '4407',
        speciesInfo: {
          scientificName: 'Fagus sylvatica',
          commonName: 'European Beech'
        },
        producers: [{
          country: 'HR',
          name: 'Test Domestic Producer',
          geometryGeojson: '{"type":"Point","coordinates":[15.9665,45.8150]}'
        }]
      }],
      geoLocationConfidential: false
    }
  }
};

// Helper functions for real API testing
function generateUniqueReference() {
  return `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function updateTestRequest(request, referenceNumber) {
  return {
    ...request,
    statement: {
      ...request.statement,
      internalReferenceNumber: referenceNumber
    }
  };
}

// Retry logic for unstable API calls
async function retryApiCall(apiCall, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Silently retry without logging to avoid cluttering test output
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

// Cleanup function for test data
async function cleanupTestData(echoClient, referenceNumbers) {
  // Cleanup test data silently
  
  for (const ref of referenceNumbers) {
    try {
      // Echo service doesn't create persistent data, so just log cleanup
      // Cleaned up test reference silently
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup test reference ${ref}:`, error.message);
    }
  }
}

// Export for use in tests
module.exports = {
  testConfig,
  testData,
  validateEnvironment,
  generateUniqueReference,
  updateTestRequest,
  retryApiCall,
  cleanupTestData
};
