# Story 1 Artifact: Compatibility Contract Matrix

## Svrha
Matrica definira sto mora ostati stabilno prema van, sto se moze mapirati interno i gdje moramo vratiti controlled error.

## Pravilo
Public API stabilnost ima prednost nad internim namingom V3 operacija.

## Matrica

| Public klasa/metoda | Danasnji contract | V3 interno mapiranje | Kompatibilnost cilj | Rizik |
|---|---|---|---|---|
| EudrSubmissionClient.submitDds | Prima postojeci request shape, vraca ddsIdentifier | submitDds (V3 DDS servis) | Isti ulaz i isti izlaz shape prema korisniku | operatorType -> operatorRole, TRADE ogranicenje |
| EudrSubmissionClient.amendDds | Prima ddsIdentifier + statement | amendDds(uuid, statement) | Zadrzati potpis i response semantiku | ddsIdentifier -> uuid |
| EudrSubmissionClient.retractDds | Prima ddsIdentifier | withdrawDds(uuid) | Zadrzati naziv metode retractDds | rename operacije u V3 |
| EudrSubmissionClientV2.submitDds | V2 shape + validacije | submitDds (V3) kroz adapter | Zadrzati V2 contract prema korisniku | razlike modela i fieldova |
| EudrSubmissionClientV2.amendDds | V2 amend contract | amendDds (V3) | Zadrzati V2 shape | response normalizacija |
| EudrSubmissionClientV2.retractDds | V2 retract contract | withdrawDds (V3) | Zadrzati V2 API | lifecycle status razlike |
| EudrRetrievalClient.getDdsInfo | UUID retrieval contract | getDds | Zadrzati izlaz ddsInfo[] | summary field razlike |
| EudrRetrievalClient.getDdsInfoByInternalReferenceNumber | internal ref retrieval contract | getDdsByInternalReference | Zadrzati izlaz ddsInfo[] | field rename |
| EudrRetrievalClient.getStatementByIdentifiers | full DDS retrieval | getDdsByIdentifiers | Zadrzati izlazni model koliko je moguce | payload struktura razlike |
| EudrRetrievalClientV2.getReferencedDds | V2 supply-chain traversal | Nema V3 ekvivalenta | Controlled error + dokumentirana alternativa | visoki rizik |
| EudrSubmissionClientV3.submitDds | V3 write facade contract | submitDds (V3 DDS servis) | Jasan V3 write entry-point bez mijesanja retrieval metoda | response shape razlike u V3 |
| EudrSubmissionClientV3.amendDds | V3 write facade contract | amendDds (V3 DDS servis) | Koristi V3 uuid semantics | ddsIdentifier -> uuid |
| EudrSubmissionClientV3.withdrawDds | V3 write facade contract | withdrawDds (V3 DDS servis) | Jasan V3 naziv i semantics | razlika prema starom retract nazivu |
| EudrRetrievalClientV3.getDds | V3 retrieval facade contract | getDds (V3 DDS servis) | Jasan V3 retrieval entry-point | summary field razlike |
| EudrRetrievalClientV3.getDdsByInternalReference | V3 retrieval facade contract | getDdsByInternalReference (V3 DDS servis) | Jasan retrieval contract na V3 | field rename |
| EudrRetrievalClientV3.getDdsByIdentifiers | V3 retrieval facade contract | getDdsByIdentifiers (V3 DDS servis) | Full payload retrieval na V3 | payload struktura razlike |
| EudrEchoClient.echo | Connectivity contract | Echo ostaje | Bez promjene | nizak rizik |
| config.generateEndpoint/service metadata | v1/v2 endpoint generation | prosiriti na v3 kroz submission/retrieval kljuceve | Backward kompatibilno prosirenje | pogresno rutiranje |

## Controlled error kandidati

| Scenarij | Razlog | Ocekivano ponasanje |
|---|---|---|
| getReferencedDds na V3 backendu | V3 uklanja operaciju | Jasna greska: unsupported in V3 |
| TRADE DDS submission na V3 | V3 DDS ne podrzava taj tok kao prije | Jasna validacijska greska |
| Nemapabilni stari input fieldovi | Razlika contracta | Jasna business/compatibility greska |

## Must-not-break lista
1. Export imena iz [index.js](index.js).
2. Export imena iz [services/index.js](services/index.js).
3. Postojanje metoda navedenih u [docs/analysis/public-api-inventory.md](docs/analysis/public-api-inventory.md).
4. README dokumentirani primjeri i shapeovi iz [README.md](README.md).

## Story 1 acceptance map
1. Svaki red u matrici mora imati test plan referencu u [docs/analysis/contract-test-plan-v3-migration.md](docs/analysis/contract-test-plan-v3-migration.md).
2. Svaki high-risk red mora imati explicitnu strategiju (adapter ili controlled error).
3. Nijedan must-not-break element ne smije ostati bez coverage plana.
