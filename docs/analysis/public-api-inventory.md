# Story 1 Artifact: Public API Inventory

## Svrha
Ovaj dokument zakljucava trenutni javni API biblioteke prije V3 migracije.
Koristi se kao baseline za compatibility contract testove.

## Izvori
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
Iz [index.js](index.js):

| Export | Tip | Napomena |
|---|---|---|
| EudrEchoClient | class | javni klijent |
| EudrRetrievalClient | class | javni klijent |
| EudrRetrievalClientV2 | class | javni klijent |
| EudrSubmissionClient | class | javni klijent |
| EudrSubmissionClientV2 | class | javni klijent |
| EudrSubmissionClientV3 | class | javni V3 facade klijent |
| EudrRetrievalClientV3 | class | javni V3 facade klijent |
| EudrErrorHandler | utility | javni helper |
| logger | utility | javni logger |
| createLogger | utility | javni logger factory |
| createChildLogger | utility | javni logger helper |
| config | object | endpoint/config API (endpointUtils) |

## Service-level exports
Iz [services/index.js](services/index.js):

| Export | Tip |
|---|---|
| EudrEchoClient | class |
| EudrRetrievalClient | class |
| EudrRetrievalClientV2 | class |
| EudrSubmissionClient | class |
| EudrSubmissionClientV2 | class |
| EudrSubmissionClientV3 | class |
| EudrRetrievalClientV3 | class |
| config | object |

## Javne metode po klasi

### EudrEchoClient
Definicija: [services/echo-service.js](services/echo-service.js)

| Metoda | Potpis |
|---|---|
| echo | async echo(message, options = {}) |

### EudrSubmissionClient
Definicija: [services/submission-service.js](services/submission-service.js)

| Metoda | Potpis |
|---|---|
| submitDds | async submitDds(request, options = {}) |
| amendDds | async amendDds(ddsIdentifier, statement, options = {}) |
| retractDds | async retractDds(ddsIdentifier, options = {}) |

### EudrSubmissionClientV2
Definicija: [services/submission-service-v2.js](services/submission-service-v2.js)

| Metoda | Potpis |
|---|---|
| submitDds | async submitDds(request, options = {}) |
| amendDds | async amendDds(ddsIdentifier, statement, options = {}) |
| retractDds | async retractDds(ddsIdentifier, options = {}) |

### EudrRetrievalClient
Definicija: [services/retrieval-service.js](services/retrieval-service.js)

| Metoda | Potpis |
|---|---|
| getDdsInfo | async getDdsInfo(uuids, options = {}) |
| getDdsInfoByInternalReferenceNumber | async getDdsInfoByInternalReferenceNumber(internalReferenceNumber, options = {}) |
| getStatementByIdentifiers | async getStatementByIdentifiers(referenceNumber, verificationNumber, options = {}) |

### EudrRetrievalClientV2
Definicija: [services/retrieval-service-v2.js](services/retrieval-service-v2.js)

| Metoda | Potpis |
|---|---|
| getDdsInfo | async getDdsInfo(uuids, options = {}) |
| getDdsInfoByInternalReferenceNumber | async getDdsInfoByInternalReferenceNumber(internalReferenceNumber, options = {}) |
| getStatementByIdentifiers | async getStatementByIdentifiers(referenceNumber, verificationNumber, options = {}) |
| getReferencedDds | async getReferencedDds(referenceNumber, securityNumber, options = {}) |

### EudrSubmissionClientV3
Definicija: [services/submission-service-v3.js](services/submission-service-v3.js)

| Metoda | Potpis |
|---|---|
| submitDds | async submitDds(request, options = {}) |
| amendDds | async amendDds(uuid, statement, options = {}) |
| withdrawDds | async withdrawDds(uuid, options = {}) |

### EudrRetrievalClientV3
Definicija: [services/retrieval-service-v3.js](services/retrieval-service-v3.js)

| Metoda | Potpis |
|---|---|
| getDds | async getDds(uuid, options = {}) |
| getDdsByInternalReference | async getDdsByInternalReference(internalReferenceNumber, options = {}) |
| getDdsByIdentifiers | async getDdsByIdentifiers(referenceNumber, verificationNumber, options = {}) |

## Config contract (config export)
Definicija: [utils/endpoint-utils.js](utils/endpoint-utils.js)

| API | Tip |
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

## Dokumentirani response baseline (README-driven)
Dokumentirano u [README.md](README.md):

| Operacija | Ocekivani baseline shape |
|---|---|
| submitDds | httpStatus, status, ddsIdentifier, raw? |
| amendDds | httpStatus, status, success, message |
| retractDds | httpStatus, status, success, message |
| getDdsInfo | httpStatus, status, ddsInfo[] |
| getDdsInfoByInternalReferenceNumber | httpStatus, status, ddsInfo[] |
| getStatementByIdentifiers | httpStatus, status, ddsInfo[] |
| getReferencedDds (V2) | httpStatus, status, ddsInfo[] ili ekvivalent retrieval payload |
| echo | status/response payload za connectivity check |

## Kriticne tocke za kompatibilnost
1. retractDds mora ostati javna metoda iako V3 koristi withdrawDds.
2. getReferencedDds je V2-only i nema V3 ekvivalent; treba controlled error policy.
3. operatorType i TRADE scenariji su rizicni u V3.
4. ddsIdentifier mora ostati prema van gdje ga danas koriste korisnici.
5. V3 javni API mora ostati podijeljen na submission i retrieval facade klijente.

## Story 1 izlaz
- Inventory je zakljucan u ovom dokumentu.
- Ovaj dokument je ulaz za [docs/analysis/compatibility-contract-matrix.md](docs/analysis/compatibility-contract-matrix.md).
- Ovaj dokument je ulaz za [docs/analysis/contract-test-plan-v3-migration.md](docs/analysis/contract-test-plan-v3-migration.md).
