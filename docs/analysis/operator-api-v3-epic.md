# Epic: Migrate EUDR Operator API client to V3

## Description
New documentation in [docs/eudr_docs 1.5/EUDR Operator API Reference v1.0.md](e:/DEVGIT/eudr-api-client/docs/eudr_docs%201.5/EUDR%20Operator%20API%20Reference%20v1.0.md) introduces EUDR Operator API V3 as a new, incompatible contract that replaces the existing V1/V2 DDS flows. V3 merges the previous submission and retrieval operations into a single unified DDS service, introduces a new Simplified Declaration service, and changes endpoints, namespaces, operations, request/response types, and some business rules.

This epic defines the work plan for implementing V3 support in the library without directly changing code in this phase. The goal of this document is to serve as a specification for building the code, tests, and documentation.

## Goal
Introduce complete and clearly separated support for EUDR Operator API V3, while keeping the existing V1/V2 clients during the transition, so that library users can use:
- DDS V3 submission/amend/withdraw operations
- DDS V3 retrieval operations from the unified service
- the new Simplified Declaration V3 service
- updated endpoints, namespaces, and response models
- a documented migration path from V1/V2 to V3

## Background and summary of confirmed changes
Based on [docs/eudr_docs 1.5/EUDR Operator API Reference v1.0.md](e:/DEVGIT/eudr-api-client/docs/eudr_docs%201.5/EUDR%20Operator%20API%20Reference%20v1.0.md), the following has been confirmed:

1. V3 introduces a new DDS endpoint `/tracesnt/ws/EUDRDueDiligenceStatementServiceV3` and a new SD endpoint `/tracesnt/ws/EUDRSimplifiedDeclarationServiceV3`.
2. DDS submission and retrieval are no longer separate services; retrieval is merged into the DDS V3 service.
3. `retractDds` has been renamed to `withdrawDds`.
4. Retrieval operations have been renamed:
- `getDdsInfo` -> `getDds`
- `getDdsInfoByInternalReferenceNumber` -> `getDdsByInternalReference`
- `getStatementByIdentifiers` -> `getDdsByIdentifiers`
5. V3 request/response models are not backward compatible with V1/V2.
6. `operatorType` has been replaced by `operatorRole` and the set of allowed values has changed.
7. DDS amend/withdraw responses no longer return only a status string, but `uuid` and a lifecycle `status`.
8. The V2-only `getReferencedDds` no longer exists in V3.
9. A new Simplified Declaration (SD) service has been introduced with its own operations and data model.
10. Part of the DDS model has changed: grouped declarations, new status fields, a new shared V3 common schema, and additional lifecycle values.

## Why this is an epic and not a single story
This is not a single isolated change because it touches multiple layers at once:
- the library's public API in [index.js](e:/DEVGIT/eudr-api-client/index.js) and [services/index.js](e:/DEVGIT/eudr-api-client/services/index.js)
- endpoint and version metadata in [utils/endpoint-utils.js](e:/DEVGIT/eudr-api-client/utils/endpoint-utils.js)
- DDS submission/retrieval implementations in [services/submission-service.js](e:/DEVGIT/eudr-api-client/services/submission-service.js), [services/submission-service-v2.js](e:/DEVGIT/eudr-api-client/services/submission-service-v2.js), [services/retrieval-service.js](e:/DEVGIT/eudr-api-client/services/retrieval-service.js), and [services/retrieval-service-v2.js](e:/DEVGIT/eudr-api-client/services/retrieval-service-v2.js)
- scenarios and test inputs in [services/scenarios.js](e:/DEVGIT/eudr-api-client/services/scenarios.js) and [services/scenarios-v2.js](e:/DEVGIT/eudr-api-client/services/scenarios-v2.js)
- README and migration documentation in [README.md](e:/DEVGIT/eudr-api-client/README.md)
- service tests in [tests/services](e:/DEVGIT/eudr-api-client/tests/services)

## Epic Acceptance Criteria
- [x] The library has clearly exposed V3 clients for DDS and Simplified Declaration
- [x] V3 endpoint generation works for standard environments without a manual endpoint
- [x] DDS V3 supports submit, amend, withdraw, and retrieval operations from a unified service
- [x] Response models for V3 correctly parse `uuid`, lifecycle `status`, and V3 payload structures
- [x] V3 does not introduce regressions in the existing V1/V2 clients
- [x] README clearly distinguishes V1, V2, and V3 support and migration implications
- [x] Focused tests exist for endpoint routing, XML envelope generation, response parsing, and backward compatibility
- [x] Scope and constraints around SD, grouped declarations, and removed V2 methods are documented

## Out of scope for the first implementation iteration
- Declaration grouping if the documentation or acceptance environment is not yet fully stable
- Versioning of Simplified Declaration entities if the official rollout is not yet available
- Downstream Operator and Trader API, which should be tracked as a separate epic
- Refactoring existing V1/V2 code that is not required for V3 integration

## Proposed implementation strategy

### Phase 1: V3 foundations
Set up shared V3 service metadata and routing without touching business logic more than necessary.

Outcomes:
- new V3 service path and namespace metadata
- new public exports for V3 clients
- tests for endpoint generation and version discovery

### Phase 2: DDS V3 client
Implement a new DDS V3 client as a separate class instead of forcibly extending the V1/V2 clients.

Reason:
- V3 is a new contract, not an incremental patch on V2
- submission and retrieval are merged into the same service
- the response and payload models differ enough that a shared implementation would carry too high a regression risk

### Phase 3: V3 model mapping and XML generation
Introduce a V3 request builder and parser for response/fault payloads.

Outcomes:
- mapping for `operatorRole`
- V3 DDS XML envelope and namespaces
- V3 amend/withdraw response parsing (`uuid`, lifecycle `status`)
- retrieval response parsing for the unified DDS service

### Phase 4: Simplified Declaration client
Implement a separate SD V3 client with its own request/response mapping.

### Phase 5: README and migration docs
Document the new clients, the differences from V1/V2, and the recommended migration.

## Stories

## Story 1: Lock down the public API compatibility baseline [DONE]
### Description
Before implementing V3, the library's current public API needs to be documented and locked down with tests,
so that later work on the adapter/facade layer doesn't break existing consumer systems.

Story 1 artifacts:
- [docs/analysis/public-api-inventory.md](docs/analysis/public-api-inventory.md)
- [docs/analysis/compatibility-contract-matrix.md](docs/analysis/compatibility-contract-matrix.md)
- [docs/analysis/contract-test-plan-v3-migration.md](docs/analysis/contract-test-plan-v3-migration.md)

### Files almost certainly affected when implementing Story 1 tests
- [tests/services/index.test.js](tests/services/index.test.js)
- [tests/services/submission-service.integration.test.js](tests/services/submission-service.integration.test.js)
- [tests/services/retrieval-service.integration.test.js](tests/services/retrieval-service.integration.test.js)
- a new `tests/contract/*` package

### Acceptance Criteria
- [x] All public exports from [index.js](index.js) and [services/index.js](services/index.js) are documented and locked down.
- [x] All public methods from `services/*.js` are inventoried and mapped to expected response shapes.
- [x] README-driven examples are mapped to the contract test plan.
- [x] A clear compatibility plan exists for high-risk cases (`retractDds/withdrawDds`, `getReferencedDds`, `TRADE`).
- [x] Story 1 delivers a test plan ready for implementation before V3 adapter development.

### Estimate
4-8 hours

---

## Story 2: Expose V3 facade clients through the public API [DONE]
### Description
Two public V3 clients need to be exposed:
- `EudrSubmissionClientV3`
- `EudrRetrievalClientV3`

Internally it is allowed to use a shared DDS V3 transport layer, but the public API must follow the existing pattern of separate submission/retrieval classes.

### Note
This story doesn't need to include all operations right away; it's enough to correctly set up the constructor, configuration, and a stable public entry point.

### Files
- [services/due-diligence-statement-service-v3.js](services/due-diligence-statement-service-v3.js)
- [services/submission-service-v3.js](services/submission-service-v3.js)
- [services/retrieval-service-v3.js](services/retrieval-service-v3.js)
- [services/index.js](services/index.js)
- [index.js](index.js)
- [utils/endpoint-utils.js](utils/endpoint-utils.js)

### Acceptance Criteria
- [x] New V3 facade clients (`EudrSubmissionClientV3`, `EudrRetrievalClientV3`) are publicly exported
- [x] The constructor supports the library's standard config schema
- [x] The submission and retrieval facades automatically use the V3 DDS endpoint when `endpoint` is not explicitly provided
- [x] Does not change the behavior of existing V1/V2 exports

### Estimate
2-3 hours

---

## Story 3: Implement DDS V3 submit/amend/withdraw operations
### Description
Add V3 DDS write operations with new names, namespaces, and response models.

### Key changes from the specification
- `submitDds` stays, but uses the V3 payload
- `amendDds` stays, but uses `uuid`
- `retractDds` is replaced by `withdrawDds`
- the amend/withdraw response returns `uuid` and a lifecycle `status`

### Acceptance Criteria
- [x] `submitDds()` generates a valid V3 XML envelope
- [x] `amendDds()` uses the V3 request shape and `uuid`
- [x] `withdrawDds()` exists as a new operation
- [x] Response parsing returns a consistent library object with V3 data
- [x] SOAP fault handling works with V3 namespaces

### Estimate
1-2 days

---

## Story 4: Implement DDS V3 retrieval operations through the V3 retrieval facade
### Description
The V3 DDS service still combines retrieval operations on the backend, but the public API exposes them through the `EudrRetrievalClientV3` facade for consistency with the library's existing pattern.

### Operations
- `getDds()`
- `getDdsByInternalReference()`
- `getDdsByIdentifiers()`

### Acceptance Criteria
- [x] Retrieval operations work through `EudrRetrievalClientV3`
- [x] Response parsing covers summary (`ddsOverviewList`, `getDds`/`getDdsByInternalReference`) and full-content (`statement`, `getDdsByIdentifiers`) responses
- [x] `getReferencedDds()` is not introduced in V3 since the specification removes it
- [x] The public API name and documentation clearly distinguish the V2 and V3 retrieval models (README checked, additional migration guide left for Story 7)

### Implementation note
Implemented and confirmed by comparing against the real WSDL ([docs/eudr_docs 1.5/EUDRDueDiligenceStatementServiceV3.xml](../eudr_docs%201.5/EUDRDueDiligenceStatementServiceV3.xml)) and the live XSD schema fetched from the acceptance endpoint (`?xsd=2`, `?xsd=3`). Along the way, a bug found by that comparison was also fixed: the SOAPAction for `submitDds`/`amendDds`/`withdrawDds` didn't match the WSDL (missing the operation suffix, or using `#` instead of `/`) — now all V3 operations use a `soapActionFor(operationName)` helper that builds `.../v3/{operationName}` for all 6 operations.

### Estimate
1-2 days

---

## Story 5: Introduce V3 payload mapping and domain-difference validation
### Description
The library's existing input model needs to be translated to the V3 model wherever safe to do so, and documented, while inputs that are no longer allowed must be clearly rejected or specifically validated.

### Confirmed differences to handle
- `operatorType` -> `operatorRole`
- `TRADE` removed for DDS V3
- `associatedStatements` -> `groupedDeclarations`
- new/common V3 namespace split
- additional lifecycle values (`GROUPED`, `OBSOLETE`, etc.)
- response field rename `ddsIdentifier` -> `uuid`

### Acceptance Criteria
- [x] The library either translates old inputs where safe or throws a clear validation error
- [x] Forbidden/removed V1/V2 concepts have a clear error and documentation
- [x] V3 status values are mapped and tested

### Implementation note
Decision (agreed with the user): legacy fields (`operatorType`, `associatedStatements`) are **never silently translated** — `EudrDueDiligenceStatementServiceV3Transport` throws a clear error (`error.eudrErrorCode` + `error.eudrSpecific = true`, the same pattern as `validateImportExportUnits` in [services/submission-service-v2.js](../../services/submission-service-v2.js)) as soon as it detects an old field name, instead of guessing a mapping. Explicit enum checks were also added for `operatorRole` (`OPERATOR`/`REPRESENTATIVE_OPERATOR`) and `activityType` (`DOMESTIC`/`IMPORT`/`EXPORT`, with a dedicated message for `TRADE`), confirmed against the live XSD. The response field rename (`uuid` instead of `ddsIdentifier`) and all 9 `EudrStatusType` values are covered by tests in [tests/services/submission-service-v3.test.js](../../tests/services/submission-service-v3.test.js).

### Estimate
1-2 days

---

## Story 6: Implement the Simplified Declaration V3 client
### Description
Add a separate client for the new `EUDRSimplifiedDeclarationServiceV3` with its operations.

### Operations
- `submitSd`
- `updateSd`
- `withdrawSd`
- `getSd`
- `getSdByInternalReference`
- `getSdByIdentifiers`

### Acceptance Criteria
- [x] SD V3 has a separate client and separate endpoint routing
- [x] The XML builder and parser cover all 6 operations from the specification
- [x] DDS and SD payloads are not mixed in the same implementation
- [x] README documents when to use DDS vs. the SD service

### Implementation note
Implemented as a single unified client `EudrSimplifiedDeclarationClientV3` in [services/simplified-declaration-service-v3.js](../../services/simplified-declaration-service-v3.js) (no submission/retrieval split — there is no V1/V2 precedent that would justify one). The schema was confirmed against the live acceptance WSDL/XSD (`?wsdl`, `?xsd=2`, `?xsd=3` on `EUDRSimplifiedDeclarationServiceV3`), which revealed a real WSDL quirk: `getSd`/`getSdByInternalReference`/`getSdByIdentifiers` use the `due-diligence-statement` namespace in their SOAPAction instead of `simplified-declaration`, replicated exactly in the code with a comment. Structural differences from DDS were confirmed and implemented: `internalReferenceNumber` is mandatory, the `operatorRole` enum is `MICRO_OPERATOR`/`REPRESENTATIVE_MSPO`/`MEMBER_STATE`, `SdCommodityType` has no `speciesInfo`, `producerLocation` is a choice (`geometryGeojson`/`postalAddress`/`cadastralIdentifier`), and the submit response field is `sdIdentifier` while the update/withdraw response field is `uuid`. Covered by 31 unit tests in [tests/services/simplified-declaration-service-v3.test.js](../../tests/services/simplified-declaration-service-v3.test.js).

### Estimate
2-4 days

---

## Story 7: Update README and migration documentation
### Description
[README.md](e:/DEVGIT/eudr-api-client/README.md) needs to be updated so users clearly understand what V3 is, what remains from V1/V2, and how to migrate.

### Acceptance Criteria
- [x] README describes the V3 DDS and SD services
- [x] New operation names and response differences are documented
- [x] It is clearly stated that V3 is a new contract, not just a "V2.1"
- [x] Minimal V1/V2 -> V3 migration examples exist

### Estimate
4-8 hours

---

## Story 8: Cover V3 with tests and a regression net
### Description
A focused test set needs to be put in place for V3 without breaking the existing V1/V2 packages.

### Acceptance Criteria
- [x] New tests cover endpoint generation for V3 (incl. the `simplified-declaration` service key)
- [x] New tests cover XML envelope generation for DDS and SD
- [x] New tests cover response parsing for the V3 response shape
- [x] Existing V1/V2 tests either stay green or are knowingly adjusted with a documented reason

### Note on the known state of V1/V2 integration tests
The live acceptance V1/V2 endpoints currently return a SOAP fault: `"This API version has been discontinued. Please use the V3 API endpoints."` (confirmed by running the existing integration test suite against the acceptance environment). This is an external, environment-driven fact — EUDR has already shut down V1/V2 on the acceptance side — not a regression caused by changes in this library. We deliberately did not change the V1/V2 integration test assertions to "pass": that would mask the server's real state. Instead, this is documented here and visibly called out in the README (a warning in the Services Overview section).

### Estimate
1-2 days

## Proposed implementation order
1. Story 1
2. Story 2
3. Story 3
4. Story 4
5. Story 5
6. Story 8
7. Story 6
8. Story 7

Note: Story 6 can be moved ahead of Story 8 if business priority requires SD before the full test net, but it is technically safer to stabilize the DDS V3 foundation first.

## Risks
- The V3 documentation explicitly states that part of the contract may still evolve before full rollout
- Sharing too much code with V1/V2 could increase regression risk
- Grouped declarations and lifecycle states may need further clarification once WSDL/XSD artifacts appear in the production/acceptance environment
- SD and DDS have similar but not identical models; merging their builders too early could complicate maintenance

## Open questions
- Should the V3 clients be exposed as entirely new classes, or should the existing names be kept as aliases after a deprecation period?
- Do we want to offer an adapter layer in the library that helps migrate the V1/V2 request shape to the V3 shape, or is it better to keep strictly separate models?
- Should `withdrawDds()` also have a compatible `retractDds()` alias with a deprecation warning, or do we want to strictly follow V3 naming?
- How will we handle declaration grouping in the first iteration if the endpoint becomes available before final regulatory lock-in?

## Success Metrics
- [x] The epic is broken down into actionable stories with clear acceptance criteria
- [x] Each story has a clear set of affected files and expected outcome
- [x] Implementation can proceed iteratively without ambiguity about scope
- [x] Library users can understand the transition from V1/V2 to V3 without reading the entire official documentation
