# EUDR API Client Tests

This directory contains comprehensive tests for the EUDR API Client library, including both unit tests and integration tests.

## Test Types

Every file matching `*.integration.test.js` makes real network calls; everything else runs offline.
`npm run test:unit` selects by test name (`--grep "Integration Tests" --invert`), not by filename.

### Integration Tests
Integration tests make real API calls to the EUDR acceptance environment. They require valid
credentials in `.env` and network connectivity.

**V3 (current API):**
- `services/submission-service-v3.integration.test.js` - `EudrSubmissionClientV3`: submit/amend/withdraw, grouped declarations
- `services/retrieval-service-v3.integration.test.js` - `EudrRetrievalClientV3`: getDds / getDdsByInternalReference / getDdsByIdentifiers
- `services/simplified-declaration-service-v3.integration.test.js` - `EudrSimplifiedDeclarationClientV3`: all 6 SD operations
- `services/verification-service-v3.integration.test.js` - `EudrVerifyDeclarationClientV3`: verifyDeclaration

See [../docs/analysis/v3-live-test-plan.md](../docs/analysis/v3-live-test-plan.md) for the coverage
matrix and the known limitations behind the tests that self-skip or fail by design.

**Echo:**
- `services/echo-service.integration.test.js` - Echo Service connectivity and WS-Security

**Legacy V1/V2 (reference only):**
- `services/submission-service.integration.test.js`, `services/submission-service-v2.integration.test.js`
- `services/retrieval-service.integration.test.js`, `services/retrieval-service-v2.integration.test.js`
- `services/units-of-measure-validation.integration.test.js`

> The V1/V2 blocks that make live calls are `describe.skip`-ped: the acceptance endpoint no longer
> accepts V1/V2 requests, so they could only ever fail. Their configuration/validation blocks still run.

### Unit Tests
Unit tests exercise envelope builders, parsers and helpers against hand-crafted XML fixtures - no
network, no credentials needed.

**Files:**
- `utils/error-handler.test.js` - SOAP fault classification, and the fault contract documented in the main README
- `utils/endpoint-utils.test.js` - endpoint generation and resolution
- `services/submission-service-v3.test.js`, `services/retrieval-service-v3.test.js` - V3 DDS envelopes and parsing
- `services/simplified-declaration-service-v3.test.js`, `services/verification-service-v3.test.js` - V3 SD and verification
- `services/*.endpoint.test.js` - per-client endpoint logic (V1/V2/echo)
- `services/units-of-measure-validation.test.js` - legacy V2 client-side units-of-measure rules
- `services/index.test.js`, `logger.test.js`, `integration.test.js` - package exports and logging

## Setup

### 1. Environment Configuration
Create a `.env` file in the project root with your EUDR API credentials:

```bash
# EUDR API Configuration
EUDR_TRACES_USERNAME=your_username_here
EUDR_TRACES_PASSWORD=your_password_here
EUDR_TRACES_BASE_URL=https://acceptance.eudr.webcloud.ec.europa.eu
EUDR_WEB_SERVICE_CLIENT_ID=eudr-test
EUDR_TRACES_TIMEOUT=30000

# Test Configuration
NODE_ENV=test

# Set to 1 to have the V3 submission suite withdraw the DDS records it created.
# Defaults to off, so test data stays inspectable in TRACES NT after a run.
EUDR_RUN_CLEANUP=0

# Integration Test Configuration (optional)
TEST_DDS_UUID=your_test_dds_uuid_here
TEST_REFERENCE_NUMBER=your_test_reference_number_here
TEST_VERIFICATION_NUMBER=your_test_verification_number_here
```

### 2. Install Dependencies
```bash
npm install
```

## Running Tests

### All Tests
Runs every file under `tests/`, unit and integration alike - so it needs credentials and network.
```bash
npm test
```

### Unit Tests Only
No credentials or network required. This is what CI runs before publishing.
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Specific Service Tests
```bash
# --- V3 (current API) ---
npm run test:submission:v3
npm run test:retrieval:v3
npm run test:sd:v3
npm run test:verification:v3

# --- Echo ---
npm run test:echo

# --- Legacy V1/V2 ---
npm run test:retrieval
npm run test:submission
npm run test:submission:v2
```

### Running without credentials

Every live suite gates itself on `EUDR_TRACES_USERNAME` / `EUDR_TRACES_PASSWORD` /
`EUDR_TRACES_BASE_URL` through `helpers/credentials.js`. When any of them is missing the suite is
marked **pending** and prints why - it does not fail. A missing `.env` is a missing prerequisite,
not a defect in the code under test, so CI and a fresh clone both stay green.

That is what makes `npm run test:unit` safe to run anywhere: with credentials it runs ~326 tests,
without them ~265, and the remainder report as pending.

### Watch Mode
```bash
npm run test:watch
```

## Test Features

### Retry Logic
Integration tests include automatic retry logic for unstable API calls:
- Maximum 3 retries
- Exponential backoff (1s, 2s, 4s delays)
- Automatic retry on network failures

### Test Data Management
- Unique reference numbers for each test
- Automatic cleanup after tests
- Test data isolation between test runs

### Error Handling
Tests validate proper error handling for:
- Invalid credentials
- Network connectivity issues
- Invalid data formats
- API validation errors

### Security Validation
Tests verify WSSE security implementation:
- Username/password authentication
- Timestamp validity
- SOAP security headers

## Test Timeouts

- **Echo Service**: 60 seconds
- **All V3 suites**: 120 seconds (submissions and the polling helpers need the headroom)
- **Legacy V1/V2 retrieval**: 60 seconds
- **Legacy V1/V2 submission**: 120 seconds

## Expected Behavior

### Echo Service
- Should successfully echo messages
- Should handle special characters and Unicode
- Should return both parsed and raw XML responses
- Should respect timeout configurations

### V3 DDS (submission + retrieval)
- Should submit DOMESTIC and IMPORT declarations and return a uuid
- Should surface server business-rule violations as typed `EUDR_*` errors
- Should tolerate the async-indexing window after a write: a retrieval issued immediately after
  `submitDds` may answer with an empty overview array **or** a `NotFoundException` - both are correct
- Should reject V1/V2 field names (`operatorType`, `associatedStatements`, `activityType: 'TRADE'`)

### V3 Simplified Declaration
- Should cleanly surface `EUDR_WEBSERVICE_USER_ACTIVITY_NOT_ALLOWED` when the account has no MSPO role
- Write-lifecycle tests self-skip unless the account is registered as MICRO_OPERATOR/MSPO

### V3 Verify Declaration
- Should return HTTP 200 with a `result` value (including `NON_EXISTENT`) rather than throwing a fault
- Should not send a `BodyIdentity` header - the Verify WSDL does not declare one

### Retrieval Service (legacy V1/V2)
- Should handle invalid reference numbers gracefully
- Should validate UUID formats
- Should process verification numbers correctly
- Should return proper error responses for invalid data

### Submission Service V1 (legacy)
- Should validate submission data structure
- Should handle missing required fields
- Should validate country codes and HS headings
- Should process commodity information correctly

### Submission Service V2 (legacy)
- Should validate V2 specific data structures
- Should handle V2 address format (street, city, postalCode, country)
- Should process V2 goods measure (without volume field)
- Should use V2 namespaces and SOAP actions
- Should validate V2 specific business rules

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```
   [ERROR] Missing required environment variables:
      - EUDR_TRACES_USERNAME
      - EUDR_TRACES_PASSWORD
      - EUDR_TRACES_BASE_URL
   ```
   **Solution**: Create `.env` file with valid credentials

2. **Authentication Failures**
   ```
   [OK] Properly handled invalid credentials
   ```
   **Solution**: Verify username/password in `.env` file

3. **Network Timeouts**
   ```
   ⚠️ API call failed (attempt 1/3), retrying in 1000ms...
   ```
   **Solution**: Check network connectivity and API endpoint availability

4. **Test Data Validation Errors**
   ```
   [OK] Properly handled invalid submission data
   ```
   **Expected**: Tests use invalid data to verify error handling

### Debug Mode
For detailed logging, set environment variable:
```bash
DEBUG=* npm run test:integration
```

## Contributing

When adding new tests:

1. **Use descriptive test names** that explain what is being tested
2. **Include proper error handling** for expected failures
3. **Add cleanup logic** to remove test data
4. **Use retry logic** for API calls that might fail
5. **Validate both success and error scenarios**
6. **Add appropriate timeouts** for long-running operations

## Test Data

Test data is automatically generated with:
- Unique timestamps
- Random identifiers
- Valid EUDR data structures
- Proper country codes and HS headings

This ensures tests are isolated and don't interfere with each other or production data.

## V2 Specific Features

The V2 submission service includes several enhancements over V1:

- **Updated namespaces** to v2
- **New operator address structure** with separate fields (street, city, postalCode, country)
- **Removed volume field** from goodsMeasure
- **Support for new fields** like fullAddress
- **Enhanced validation** for V2 specific business rules

V2 tests specifically validate these differences and ensure backward compatibility where appropriate.
