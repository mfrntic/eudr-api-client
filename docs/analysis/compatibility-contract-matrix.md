# Story 1 Artifact: Compatibility Contract Matrix

## Purpose
This matrix defines what must remain stable externally, what can be mapped internally, and where we must return a controlled error.

## Rule
Public API stability takes priority over the internal naming of V3 operations.

## Matrix

| Public class/method | Current contract | V3 internal mapping | Compatibility goal | Risk |
|---|---|---|---|---|
| EudrSubmissionClient.submitDds | Accepts the existing request shape, returns ddsIdentifier | submitDds (V3 DDS service) | Same input and same output shape for the user | operatorType -> operatorRole, TRADE restriction |
| EudrSubmissionClient.amendDds | Accepts ddsIdentifier + statement | amendDds(uuid, statement) | Keep the signature and response semantics | ddsIdentifier -> uuid |
| EudrSubmissionClient.retractDds | Accepts ddsIdentifier | withdrawDds(uuid) | Keep the retractDds method name | operation renamed in V3 |
| EudrSubmissionClientV2.submitDds | V2 shape + validations | submitDds (V3) via adapter | Keep the V2 contract for the user | model and field differences |
| EudrSubmissionClientV2.amendDds | V2 amend contract | amendDds (V3) | Keep the V2 shape | response normalization |
| EudrSubmissionClientV2.retractDds | V2 retract contract | withdrawDds (V3) | Keep the V2 API | lifecycle status differences |
| EudrRetrievalClient.getDdsInfo | UUID retrieval contract | getDds | Keep the ddsInfo[] output | summary field differences |
| EudrRetrievalClient.getDdsInfoByInternalReferenceNumber | internal ref retrieval contract | getDdsByInternalReference | Keep the ddsInfo[] output | field rename |
| EudrRetrievalClient.getStatementByIdentifiers | full DDS retrieval | getDdsByIdentifiers | Keep the output model as much as possible | payload structure differences |
| EudrRetrievalClientV2.getReferencedDds | V2 supply-chain traversal | No V3 equivalent | Controlled error + documented alternative | high risk |
| EudrSubmissionClientV3.submitDds | V3 write facade contract | submitDds (V3 DDS service) | Clear V3 write entry point without mixing in retrieval methods | response shape differences in V3 |
| EudrSubmissionClientV3.amendDds | V3 write facade contract | amendDds (V3 DDS service) | Uses V3 uuid semantics | ddsIdentifier -> uuid |
| EudrSubmissionClientV3.withdrawDds | V3 write facade contract | withdrawDds (V3 DDS service) | Clear V3 name and semantics | difference from the old retract name |
| EudrRetrievalClientV3.getDds | V3 retrieval facade contract | getDds (V3 DDS service) | Clear V3 retrieval entry point | summary field differences |
| EudrRetrievalClientV3.getDdsByInternalReference | V3 retrieval facade contract | getDdsByInternalReference (V3 DDS service) | Clear retrieval contract on V3 | field rename |
| EudrRetrievalClientV3.getDdsByIdentifiers | V3 retrieval facade contract | getDdsByIdentifiers (V3 DDS service) | Full payload retrieval on V3 | payload structure differences |
| EudrEchoClient.echo | Connectivity contract | Echo stays as-is | No change | low risk |
| config.generateEndpoint/service metadata | v1/v2 endpoint generation | extend to v3 via submission/retrieval keys | Backward-compatible extension | incorrect routing |

## Controlled error candidates

| Scenario | Reason | Expected behavior |
|---|---|---|
| getReferencedDds on the V3 backend | V3 removes the operation | Clear error: unsupported in V3 |
| TRADE DDS submission on V3 | V3 DDS no longer supports that flow | Clear validation error |
| Unmappable old input fields | Contract difference | Clear business/compatibility error |

## Must-not-break list
1. Export names from [index.js](index.js).
2. Export names from [services/index.js](services/index.js).
3. Existence of the methods listed in [docs/analysis/public-api-inventory.md](docs/analysis/public-api-inventory.md).
4. README-documented examples and shapes from [README.md](README.md).

## Story 1 acceptance map
1. Every row in the matrix must have a test plan reference in [docs/analysis/contract-test-plan-v3-migration.md](docs/analysis/contract-test-plan-v3-migration.md).
2. Every high-risk row must have an explicit strategy (adapter or controlled error).
3. No must-not-break element may be left without coverage plan.
