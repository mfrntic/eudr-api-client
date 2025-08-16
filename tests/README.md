# EUDR API Client Tests

This directory contains comprehensive tests for the EUDR API Client library, including both unit tests and integration tests.

## Test Types

### Integration Tests
Integration tests make real API calls to the EUDR system and test actual functionality. These tests require valid credentials and network connectivity.

**Files:**
- `echo-service.integration.test.js` - Tests the Echo Service with real API calls
- `retrieval-service.integration.test.js` - Tests the Retrieval Service with real API calls
- `submission-service.integration.test.js` - Tests the Submission Service V1 with real API calls
- `submission-service-v2.integration.test.js` - Tests the Submission Service V2 with real API calls

### Unit Tests
Unit tests test individual components in isolation without external dependencies.

**Files:**
- Currently no unit tests (all tests are integration tests)

## Setup

### 1. Environment Configuration
Create a `.env` file in the project root with your EUDR API credentials:

```bash
# EUDR API Configuration
EUDR_WEB_CLIENT_ID=acceptance
EUDR_TRACES_USERNAME=your_username_here
EUDR_TRACES_PASSWORD=your_password_here
EUDR_TRACES_TIMEOUT=30000
EUDR_TRACES_BASE_URL=https://acceptance.eudr.webcloud.ec.europa.eu
EUDR_WEB_SERVICE_CLIENT_ID=eudr-test

# Test Configuration
NODE_ENV=test

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
```bash
npm test
```

### Integration Tests Only
```bash
npm run test:integration
```

### Unit Tests Only
```bash
npm run test:unit
```

### Specific Service Tests
```bash
# Echo Service tests
npm run test:echo

# Retrieval Service tests
npm run test:retrieval

# Submission Service V1 tests
npm run test:submission

# Submission Service V2 tests
npm run test:submission:v2
```

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
- **Retrieval Service**: 60 seconds  
- **Submission Service V1**: 120 seconds (longer due to complex operations)
- **Submission Service V2**: 120 seconds (longer due to complex operations)

## Expected Behavior

### Echo Service
- Should successfully echo messages
- Should handle special characters and Unicode
- Should return both parsed and raw XML responses
- Should respect timeout configurations

### Retrieval Service
- Should handle invalid reference numbers gracefully
- Should validate UUID formats
- Should process verification numbers correctly
- Should return proper error responses for invalid data

### Submission Service V1
- Should validate submission data structure
- Should handle missing required fields
- Should validate country codes and HS headings
- Should process commodity information correctly

### Submission Service V2
- Should validate V2 specific data structures
- Should handle V2 address format (street, city, postalCode, country)
- Should process V2 goods measure (without volume field)
- Should use V2 namespaces and SOAP actions
- Should validate V2 specific business rules

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```
   ❌ Missing required environment variables:
      - EUDR_TRACES_USERNAME
      - EUDR_TRACES_PASSWORD
      - EUDR_TRACES_BASE_URL
   ```
   **Solution**: Create `.env` file with valid credentials

2. **Authentication Failures**
   ```
   ✅ Properly handled invalid credentials
   ```
   **Solution**: Verify username/password in `.env` file

3. **Network Timeouts**
   ```
   ⚠️ API call failed (attempt 1/3), retrying in 1000ms...
   ```
   **Solution**: Check network connectivity and API endpoint availability

4. **Test Data Validation Errors**
   ```
   ✅ Properly handled invalid submission data
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
