# Story 1 Artifact: Contract Test Plan for V3 Migration

## Purpose
Define a test plan that protects the existing public API during the transition to the internal V3 implementation.

## Test goals
1. Detect breaking changes at the export and method level.
2. Detect breaking changes at the response shape level.
3. Detect regressions in the endpoint/config contract.
4. Ensure controlled error behavior for unsupported V3 scenarios.

## Proposed new test package
- tests/contract/public-api.exports.contract.test.js
- tests/contract/public-api.methods.contract.test.js
- tests/contract/public-api.responses.contract.test.js
- tests/contract/public-api.config.contract.test.js
- tests/contract/public-api.compatibility-errors.contract.test.js

## Test group A: Export contract
Sources: [index.js](index.js), [services/index.js](services/index.js), [tests/services/index.test.js](tests/services/index.test.js)

### A1
Verify that all top-level exports exist:
- EudrEchoClient
- EudrRetrievalClient
- EudrRetrievalClientV2
- EudrSubmissionClient
- EudrSubmissionClientV2
- EudrSubmissionClientV3
- EudrRetrievalClientV3
- EudrErrorHandler
- logger
- createLogger
- createChildLogger
- config

### A2
Verify that the client exports are functions/classes.

### A3
Verify that the config export still has:
- getSupportedClientIds
- getSupportedServices
- getSupportedVersions
- generateEndpoint
- isStandardClientId

## Test group B: Method contract
Source: [docs/analysis/public-api-inventory.md](docs/analysis/public-api-inventory.md)

### B1 EudrSubmissionClient
- submitDds exists
- amendDds exists
- retractDds exists

### B2 EudrSubmissionClientV2
- submitDds exists
- amendDds exists
- retractDds exists

### B3 EudrRetrievalClient
- getDdsInfo exists
- getDdsInfoByInternalReferenceNumber exists
- getStatementByIdentifiers exists

### B4 EudrRetrievalClientV2
- getDdsInfo exists
- getDdsInfoByInternalReferenceNumber exists
- getStatementByIdentifiers exists
- getReferencedDds exists

### B5 EudrEchoClient
- echo exists

### B6 EudrSubmissionClientV3
- submitDds exists
- amendDds exists
- withdrawDds exists

### B7 EudrRetrievalClientV3
- getDds exists
- getDdsByInternalReference exists
- getDdsByIdentifiers exists

## Test group C: Response shape contract
Sources: [README.md](README.md), integration tests in tests/services

### C1 submitDds shape
Minimum expected fields:
- httpStatus
- status
- ddsIdentifier

### C2 amendDds shape
Minimum expected fields:
- httpStatus
- status
- success
- message

### C3 retractDds shape
Minimum expected fields:
- httpStatus
- status
- success
- message

### C4 retrieval shape
Minimum expected fields:
- httpStatus
- status
- ddsInfo (array)

### C5 echo shape
Minimum expected fields:
- status or response (per the existing parser)

## Test group D: Config/endpoint contract
Source: [utils/endpoint-utils.js](utils/endpoint-utils.js)

### D1 standard client IDs
- eudr-repository
- eudr-test

### D2 supported services baseline
- echo
- retrieval
- submission

### D3 version baseline
- echo: v1, v2
- submission: v1, v2, v3
- retrieval: v1, v2, v3

### D4 endpoint generation baseline
- acceptance endpoints have the correct format
- production endpoints have the correct format

## Test group E: Compatibility error contract
Source: [docs/analysis/compatibility-contract-matrix.md](docs/analysis/compatibility-contract-matrix.md)

### E1
getReferencedDds must throw a controlled error when the backend capability is not available.

### E2
An unsupported TRADE DDS flow on V3 must return a clear validation error, not a silent fallback.

### E3
Unmappable legacy input must return a compatibility/business error with a clear message.

## Acceptance criteria for Story 1 (test perspective)
1. Every element from the public API inventory has a test coverage plan.
2. Every high-risk element from the compatibility matrix has a test or a planned controlled-error test.
3. Existing tests in [tests/services](tests/services) remain the baseline reference and must not be weakened.
4. Story 1 is complete when the test plan is ready for implementation without further analysis.

## Note on implementing Story 2+
This plan does not implement V3. This plan protects the public API before V3 is implemented.
