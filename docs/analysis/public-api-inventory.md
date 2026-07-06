# Story 1 Artifact: Public API Inventory

## Purpose
This document locks down the library's current public API before the V3 migration.
It is used as the baseline for compatibility contract tests.

## Sources
- [README.md](README.md)
- [index.js](index.js)
- [services/index.js](services/index.js)
- [services/echo-service.js](services/echo-service.js)
- [services/submission-service.js](services/submission-service.js)
- [services/submission-service-v2.js](services/submission-service-v2.js)
- [services/submission-service-v3.js](services/submission-service-v3.js)
- [services/retrieval-service.js](services/retrieval-service.js)
- [services/retrieval-service-v2.js](services/retrieval-service-v2.js)
- [services/retrieval-service-v3.js](services/retrieval-service-v3.js)
- [utils/endpoint-utils.js](utils/endpoint-utils.js)
- [tests/services/index.test.js](tests/services/index.test.js)

## Top-level exports
From [index.js](index.js):

| Export | Type | Note |
|---|---|---|
| EudrEchoClient | class | public client |
| EudrRetrievalClient | class | public client |
| EudrRetrievalClientV2 | class | public client |
| EudrSubmissionClient | class | public client |
| EudrSubmissionClientV2 | class | public client |
| EudrSubmissionClientV3 | class | public V3 facade client |
| EudrRetrievalClientV3 | class | public V3 facade client |
| EudrSimplifiedDeclarationClientV3 | class | public V3 SD client (unified, no submission/retrieval split) |
| EudrErrorHandler | utility | public helper |
| logger | utility | public logger |
| createLogger | utility | public logger factory |
| createChildLogger | utility | public logger helper |
| config | object | endpoint/config API (endpointUtils) |

## Service-level exports
From [services/index.js](services/index.js):

| Export | Type |
|---|---|
| EudrEchoClient | class |
| EudrRetrievalClient | class |
| EudrRetrievalClientV2 | class |
| EudrSubmissionClient | class |
| EudrSubmissionClientV2 | class |
| EudrSubmissionClientV3 | class |
| EudrRetrievalClientV3 | class |
| EudrSimplifiedDeclarationClientV3 | class |
| config | object |

## Public methods per class

### EudrEchoClient
Definition: [services/echo-service.js](services/echo-service.js)

| Method | Signature |
|---|---|
| echo | async echo(message, options = {}) |

### EudrSubmissionClient
Definition: [services/submission-service.js](services/submission-service.js)

| Method | Signature |
|---|---|
| submitDds | async submitDds(request, options = {}) |
| amendDds | async amendDds(ddsIdentifier, statement, options = {}) |
| retractDds | async retractDds(ddsIdentifier, options = {}) |

### EudrSubmissionClientV2
Definition: [services/submission-service-v2.js](services/submission-service-v2.js)

| Method | Signature |
|---|---|
| submitDds | async submitDds(request, options = {}) |
| amendDds | async amendDds(ddsIdentifier, statement, options = {}) |
| retractDds | async retractDds(ddsIdentifier, options = {}) |

### EudrRetrievalClient
Definition: [services/retrieval-service.js](services/retrieval-service.js)

| Method | Signature |
|---|---|
| getDdsInfo | async getDdsInfo(uuids, options = {}) |
| getDdsInfoByInternalReferenceNumber | async getDdsInfoByInternalReferenceNumber(internalReferenceNumber, options = {}) |
| getStatementByIdentifiers | async getStatementByIdentifiers(referenceNumber, verificationNumber, options = {}) |

### EudrRetrievalClientV2
Definition: [services/retrieval-service-v2.js](services/retrieval-service-v2.js)

| Method | Signature |
|---|---|
| getDdsInfo | async getDdsInfo(uuids, options = {}) |
| getDdsInfoByInternalReferenceNumber | async getDdsInfoByInternalReferenceNumber(internalReferenceNumber, options = {}) |
| getStatementByIdentifiers | async getStatementByIdentifiers(referenceNumber, verificationNumber, options = {}) |
| getReferencedDds | async getReferencedDds(referenceNumber, securityNumber, options = {}) |

### EudrSubmissionClientV3
Definition: [services/submission-service-v3.js](services/submission-service-v3.js)

| Method | Signature |
|---|---|
| submitDds | async submitDds(request, options = {}) |
| amendDds | async amendDds(uuid, statement, options = {}) |
| withdrawDds | async withdrawDds(uuid, options = {}) |

### EudrRetrievalClientV3
Definition: [services/retrieval-service-v3.js](services/retrieval-service-v3.js)

| Method | Signature |
|---|---|
| getDds | async getDds(uuid, options = {}) |
| getDdsByInternalReference | async getDdsByInternalReference(internalReferenceNumber, options = {}) |
| getDdsByIdentifiers | async getDdsByIdentifiers(referenceNumber, verificationNumber, options = {}) |

### EudrSimplifiedDeclarationClientV3
Definition: [services/simplified-declaration-service-v3.js](services/simplified-declaration-service-v3.js)

New V3-only service (no V1/V2 precedent), a single unified client with no submission/retrieval split.

| Method | Signature |
|---|---|
| submitSd | async submitSd(request, options = {}) |
| updateSd | async updateSd(sdIdentifier, statement, options = {}) |
| withdrawSd | async withdrawSd(sdIdentifier, options = {}) |
| getSd | async getSd(uuids, options = {}) |
| getSdByInternalReference | async getSdByInternalReference(internalReferenceNumber, options = {}) |
| getSdByIdentifiers | async getSdByIdentifiers(referenceNumber, verificationNumber, options = {}) |

## Config contract (config export)
Definition: [utils/endpoint-utils.js](utils/endpoint-utils.js)

| API | Type |
|---|---|
| getSupportedClientIds | function |
| getSupportedServices | function |
| getSupportedVersions | function |
| generateEndpoint | function |
| isStandardClientId | function |
| STANDARD_CLIENT_IDS | const export |
| BASE_URLS | const export |
| SERVICE_PATHS | const export |
| SOAP_ACTIONS | const export |

## Documented response baseline (README-driven)
Documented in [README.md](README.md):

| Operation | Expected baseline shape |
|---|---|
| submitDds | httpStatus, status, ddsIdentifier, raw? |
| amendDds | httpStatus, status, success, message |
| retractDds | httpStatus, status, success, message |
| getDdsInfo | httpStatus, status, ddsInfo[] |
| getDdsInfoByInternalReferenceNumber | httpStatus, status, ddsInfo[] |
| getStatementByIdentifiers | httpStatus, status, ddsInfo[] |
| getReferencedDds (V2) | httpStatus, status, ddsInfo[] or equivalent retrieval payload |
| echo | status/response payload for connectivity check |

## Critical points for compatibility
1. retractDds must remain a public method even though V3 uses withdrawDds.
2. getReferencedDds is V2-only and has no V3 equivalent; needs a controlled error policy.
3. operatorType and TRADE scenarios are risky in V3.
4. ddsIdentifier must remain exposed wherever users currently rely on it.
5. The V3 public API must remain split into submission and retrieval facade clients.

## Story 1 output
- The inventory is locked down in this document.
- This document is an input for [docs/analysis/compatibility-contract-matrix.md](docs/analysis/compatibility-contract-matrix.md).
- This document is an input for [docs/analysis/contract-test-plan-v3-migration.md](docs/analysis/contract-test-plan-v3-migration.md).
