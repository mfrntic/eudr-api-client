# Story 1 Artifact: Contract Test Plan for V3 Migration

## Svrha
Definirati test plan koji stiti postojeci javni API tijekom prelaska na V3 internu implementaciju.

## Test ciljevi
1. Otkriti breaking promjene na export i method razini.
2. Otkriti breaking promjene na response shape razini.
3. Otkriti regresije u endpoint/config contractu.
4. Osigurati controlled error ponasanje za nepodrzane V3 scenarije.

## Predlozeni novi test paket
- tests/contract/public-api.exports.contract.test.js
- tests/contract/public-api.methods.contract.test.js
- tests/contract/public-api.responses.contract.test.js
- tests/contract/public-api.config.contract.test.js
- tests/contract/public-api.compatibility-errors.contract.test.js

## Test grupa A: Export contract
Izvori: [index.js](index.js), [services/index.js](services/index.js), [tests/services/index.test.js](tests/services/index.test.js)

### A1
Provjera da svi top-level exports postoje:
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
Provjera da su client exporti funkcije/klase.

### A3
Provjera da config export i dalje ima:
- getSupportedClientIds
- getSupportedServices
- getSupportedVersions
- generateEndpoint
- isStandardClientId

## Test grupa B: Method contract
Izvor: [docs/analysis/public-api-inventory.md](docs/analysis/public-api-inventory.md)

### B1 EudrSubmissionClient
- submitDds postoji
- amendDds postoji
- retractDds postoji

### B2 EudrSubmissionClientV2
- submitDds postoji
- amendDds postoji
- retractDds postoji

### B3 EudrRetrievalClient
- getDdsInfo postoji
- getDdsInfoByInternalReferenceNumber postoji
- getStatementByIdentifiers postoji

### B4 EudrRetrievalClientV2
- getDdsInfo postoji
- getDdsInfoByInternalReferenceNumber postoji
- getStatementByIdentifiers postoji
- getReferencedDds postoji

### B5 EudrEchoClient
- echo postoji

### B6 EudrSubmissionClientV3
- submitDds postoji
- amendDds postoji
- withdrawDds postoji

### B7 EudrRetrievalClientV3
- getDds postoji
- getDdsByInternalReference postoji
- getDdsByIdentifiers postoji

## Test grupa C: Response shape contract
Izvori: [README.md](README.md), integration testovi u tests/services

### C1 submitDds shape
Minimalno ocekivana polja:
- httpStatus
- status
- ddsIdentifier

### C2 amendDds shape
Minimalno ocekivana polja:
- httpStatus
- status
- success
- message

### C3 retractDds shape
Minimalno ocekivana polja:
- httpStatus
- status
- success
- message

### C4 retrieval shape
Minimalno ocekivana polja:
- httpStatus
- status
- ddsInfo (array)

### C5 echo shape
Minimalno ocekivana polja:
- status ili response (prema postojecem parseru)

## Test grupa D: Config/endpoint contract
Izvor: [utils/endpoint-utils.js](utils/endpoint-utils.js)

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
- acceptance endpointovi tocan format
- production endpointovi tocan format

## Test grupa E: Compatibility error contract
Izvor: [docs/analysis/compatibility-contract-matrix.md](docs/analysis/compatibility-contract-matrix.md)

### E1
getReferencedDds mora baciti controlled error kada backend capability nije dostupna.

### E2
Nepodrzani TRADE DDS tok na V3 mora vratiti jasnu validacijsku gresku, ne tihi fallback.

### E3
Nemapabilni legacy input mora vratiti compatibility/business error s jasnom porukom.

## Acceptance kriteriji za Story 1 (test perspektiva)
1. Svaki element iz public API inventory ima test coverage plan.
2. Svaki high-risk element iz compatibility matrice ima test ili planned controlled error test.
3. Postojeci testovi u [tests/services](tests/services) ostaju baseline referenca i ne smiju se oslabiti.
4. Story 1 zavrsava kada je test plan spreman za implementaciju bez dodatne analize.

## Napomena o implementaciji Story 2+
Ovaj plan ne implementira V3. Ovaj plan stiti javni API prije V3 implementacije.
