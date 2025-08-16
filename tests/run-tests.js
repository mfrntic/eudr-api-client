#!/usr/bin/env node

/**
 * EUDR API Client Test Runner
 * 
 * This script ensures that logger tests run first to validate the logging
 * infrastructure before running all other tests.
 * 
 * Usage:
 * - node tests/run-tests.js                    (Run all tests in correct order)
 * - node tests/run-tests.js --logger-only      (Run only logger tests)
 * - node tests/run-tests.js --skip-logger      (Skip logger tests)
 */

const { spawn } = require('child_process');
const path = require('path');

// Test file paths
const LOGGER_TEST = path.join(__dirname, 'logger.test.js');
const INTEGRATION_TESTS = path.join(__dirname, '**/*.integration.test.js');

// Parse command line arguments
const args = process.argv.slice(2);
const loggerOnly = args.includes('--logger-only');
const skipLogger = args.includes('--skip-logger');

async function runTests() {
  console.log('🧪 EUDR API Client Test Runner');
  console.log('================================');
  
  if (loggerOnly) {
    console.log('🔧 Running logger tests only...');
    await runLoggerTests();
    return;
  }
  
  if (skipLogger) {
    console.log('⏭️ Skipping logger tests...');
    await runIntegrationTests();
    return;
  }
  
  // Run tests in correct order: logger first, then integration
  console.log('🔧 Step 1: Running logger system tests...');
  const loggerSuccess = await runLoggerTests();
  
  if (!loggerSuccess) {
    console.error('❌ Logger tests failed. Stopping execution.');
    process.exit(1);
  }
  
  console.log('✅ Logger tests passed successfully!');
  console.log('');
  console.log('🌐 Step 2: Running integration tests...');
  
  const integrationSuccess = await runIntegrationTests();
  
  if (!integrationSuccess) {
    console.error('❌ Integration tests failed.');
    process.exit(1);
  }
  
  console.log('🎉 All tests passed successfully!');
}

async function runLoggerTests() {
  return new Promise((resolve) => {
    console.log('   Running: logger.test.js');
    
    const child = spawn('npx', ['mocha', LOGGER_TEST, '--timeout', '30000'], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      resolve(code === 0);
    });
    
    child.on('error', (error) => {
      console.error('Error running logger tests:', error);
      resolve(false);
    });
  });
}

async function runIntegrationTests() {
  return new Promise((resolve) => {
    console.log('   Running: integration tests');
    
    const child = spawn('npx', ['mocha', INTEGRATION_TESTS, '--timeout', '120000'], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      resolve(code === 0);
    });
    
    child.on('error', (error) => {
      console.error('Error running integration tests:', error);
      resolve(false);
    });
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test execution terminated');
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runTests().catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, runLoggerTests, runIntegrationTests };
