#!/usr/bin/env node

/**
 * EUDR API Client Test Runner
 * 
 * This script ensures that tests run in the correct order:
 * 1. Logger tests (infrastructure validation)
 * 2. Submission service tests (V1)
 * 3. Submission service tests (V2)
 * 4. Retrieval service tests
 * 5. Echo service tests
 * 
 * Usage:
 * - node tests/run-tests.js                    (Run all tests in correct order)
 * - node tests/run-tests.js --logger-only      (Run only logger tests)
 * - node tests/run-tests.js --skip-logger      (Skip logger tests)
 */

const { spawn } = require('child_process');
const path = require('path');

// Test file paths in specific order
const LOGGER_TEST = path.join(__dirname, 'logger.test.js');
const SUBMISSION_TEST = path.join(__dirname, 'services/submission-service.integration.test.js');
const SUBMISSION_V2_TEST = path.join(__dirname, 'services/submission-service-v2.integration.test.js');
const RETRIEVAL_TEST = path.join(__dirname, 'services/retrieval-service.integration.test.js');
const ECHO_TEST = path.join(__dirname, 'services/echo-service.integration.test.js');

// Parse command line arguments
const args = process.argv.slice(2);
const loggerOnly = args.includes('--logger-only');
const skipLogger = args.includes('--skip-logger');

async function runTests() {
  if (loggerOnly) {
    await runLoggerTests();
    return;
  }

  if (skipLogger) {
    await runAllServiceTests();
    return;
  }

  // Run tests in correct order: logger first, then services in specific order
  const loggerSuccess = await runLoggerTests();

  if (!loggerSuccess) {
    process.exit(1);
  }

  // Run service tests in specific order
  await runAllServiceTests();
}

async function runAllServiceTests() {


  // 1. Echo Service
  const echoSuccess = await runSpecificTest(ECHO_TEST, 'Echo Service');

  if (!echoSuccess) {
    process.exit(1);
  }

  // 2. Submission Service (V1)
  const submissionSuccess = await runSpecificTest(SUBMISSION_TEST, 'Submission Service V1');

  if (!submissionSuccess) {
    process.exit(1);
  }

  // 3. Submission Service (V2)
  const submissionV2Success = await runSpecificTest(SUBMISSION_V2_TEST, 'Submission Service V2');

  if (!submissionV2Success) {
    process.exit(1);
  }

  // 4. Retrieval Service
  const retrievalSuccess = await runSpecificTest(RETRIEVAL_TEST, 'Retrieval Service');

  if (!retrievalSuccess) {
    process.exit(1);
  }

}

async function runLoggerTests() {
  return new Promise((resolve) => {
    const child = spawn('npx', ['mocha', LOGGER_TEST, '--timeout', '30000'], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', (error) => {
      resolve(false);
    });
  });
}

async function runSpecificTest(testPath, testName) {
  return new Promise((resolve) => {
    const child = spawn('npx', ['mocha', testPath, '--timeout', '120000'], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', (error) => {
      resolve(false);
    });
  });
}

// Handle process termination
process.on('SIGINT', () => {
  process.exit(1);
});

process.on('SIGTERM', () => {
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runTests().catch((error) => {
    process.exit(1);
  });
}

module.exports = { runTests, runLoggerTests, runAllServiceTests };
