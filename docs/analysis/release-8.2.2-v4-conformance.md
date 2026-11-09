# Release 8.2.2 / API V4 — conformance audit

**Date:** 2026-11-09
**Trigger:** Commission e-mail "EU Deforestation Regulation updates — IT developments" announcing
Information System release 8.2.2 on ACCEPTANCE and PRODUCTION, a new **V4 API** (documentation v1.3)
for DDS, SD and Verify, improved error messages, user-information response headers and "Recommended
Business Behaviour for API".

**Sources compared**

1. Live WSDL/XSD for all three services, V3 and V4, fetched from acceptance and vendored in
   [`docs/eudr_docs 8.2.2/`](../eudr_docs%208.2.2/README.md).
2. The previous snapshot [`docs/eudr_docs 8.2.1/`](../eudr_docs%208.2.1/README.md).
3. `docs/eudr_docs_v4/EUDR Operator API Reference v1.3.pdf` (sections 1.2, 2.3–2.4, 4, 6, 7.1–7.2,
   8.1–8.2, 9.1) and `EUDR Downstream Operator and Trader API Reference v1.3.pdf` (Verify, section 7.1).
4. Live calls against acceptance with the `.env` test account (2026-11-09).

The live schema is treated as the authority; the PDFs are checked against it.

## Outcome

V4 is a small, mostly additive evolution of V3. The library now ships `EudrSubmissionClientV4`,
`EudrRetrievalClientV4`, `EudrSimplifiedDeclarationClientV4` and `EudrVerifyDeclarationClientV4` as
thin subclasses of the V3 clients with a V4 wire profile (`utils/eudr-api-versions.js`). V3 envelopes
are byte-identical to the previous release (verified by diffing every operation against `HEAD`,
ignoring the WS-Security block). All 13 V4 request envelopes validate against the vendored V4 XSD
with `lxml`.

## A. V3 → V4 wire changes

| # | Change (live XSD) | Docs v1.3 | Library |
|---|---|---|---|
| A1 | Namespaces `due-diligence-statement`, `simplified-declaration`, `eudr/common` and `body` move from `/v3` to `/v4`; endpoints `…ServiceV4`. Base header `.../sanco/tracesnt/base/v4` unchanged. | ✅ §7.1.1, §7.2.1 | Version profile; all envelopes and SOAPActions |
| A2 | Verify namespace **renamed** `verify-declaration/v3` → `verification/v4`; SOAPAction `…/verification/v4/verify-declaration`. | ✅ Downstream §7.1.1 | Version profile |
| A3 | SD `getSd`/`getSdByInternalReference`/`getSdByIdentifiers` SOAPActions now use the `simplified-declaration/v4` path (V3 used the DDS path). | ❌ not mentioned | V4 profile uses SD path; V3 keeps the quirk |
| A4 | SD `internalReferenceNumber`: `ReferenceNumberType` (max 14) → `InternalReferenceNumberType` (max 50). | ✅ §7.2.4 | `maxSdInternalReferenceLength` per version |
| A5 | `OverviewType.referenceNumberInfo` (optional string). | ✅ §7.1.4 | Parsed automatically by `mapOverviewItem`; tested |
| A6 | `EconomicOperatorIdentificationType.summaryAddress` (`SummaryAddressType`: optional `name` 1–200, optional `country`), between `operatorAddress` and `operatorEmail`. | ✅ §7.1.5 | Emitted on V4 requests when supplied; a V3 request carrying it is rejected (`EUDR_V3_SUMMARY_ADDRESS_NOT_SUPPORTED`) instead of silently dropped |
| A7 | `EudrStatusType` gains `CANCELLED` ("cancelled by the operator before availability"). | ⚠️ only in type tables; §7.3.5 contradicts itself | No response enum validation exists — passes through |
| A8 | `EudrUserMessageType` (max 2000) for an announcement **response header**. | ✅ §1.2.5, §7.1.6 | `userMessage` on every parsed response and on thrown errors (`utils/soap-response.js`) |
| A9 | `PermissionDeniedException` declared on submit/amend/withdraw (DDS and SD) and `get*ByIdentifiers`. | ⚠️ partly (§9.1.4) | Already mapped to 403 since 8.2.1 |
| A10 | `DdsProducerType.geometryGeojson` becomes `minOccurs=0`; new `geometryData` (message shown when geolocation is confidential). | ✅ type table only | No change — only relevant to the discontinued `getDdsByIdentifiers` response |
| A11 | Unused `SdReferenceType` removed. | ❌ | None |

Unchanged: operations (6 DDS, 6 SD, 1 Verify), request/response shapes, base header, error v01 schema,
UN/CEFACT schemas. The V4 common schema is byte-identical across the three services.

## B. Changes already live on V3 (live V3 vs. the 8.2.1 snapshot)

| # | Change | Library |
|---|---|---|
| B1 | **`getDdsByIdentifiers` / `getSdByIdentifiers` discontinued** on V3 and V4: every call returns a NotFoundException. | Kept (still in the WSDL) but `@deprecated` with a one-time warning; fault mapped to `EUDR_DETAIL_RETRIEVAL_UNSUPPORTED` (404, `notFound: true`, `detailRetrievalUnsupported: true`) |
| B2 | Amend window (72 h) now starts when the DDS becomes **AVAILABLE**; afterwards `PermissionDeniedException` `EUDR_API_AMEND_DEADLINE_ELAPSED`. Docs §2.3.3: the reference number may take ≥1 hour. | Error code added (403) |
| B3 | Grouping can only be set on the initial submission: `EUDR-GROUPING-NOT-ALLOWED-ON-AMEND`. | Error code added (normalized to `EUDR_GROUPING_NOT_ALLOWED_ON_AMEND`, forced to 400 so the "not allowed" 403 heuristic does not misclassify it) |
| B4 | Retrieval does not reveal existence: `EUDR_WEBSERVICE_DDS_NOT_FOUND_OR_NO_ACCESS` / `…_SD_…`. | Codes added and treated as not found |
| B5 | HS code pattern `[0-9]{2,6}` → `[0-9]{2,10}`. | No client validation of HS codes — nothing to change |
| B6 | Customs-lock wording removed from amend/withdraw; Verify `status` documented as absent for `NON_EXISTENT`; supplementary-unit rules documented on `GoodsMeasureType`. | Documentation only |

B1 and B2 explain two long-standing open items from the V3 live tests: `getDdsByIdentifiers` failing
for a known AVAILABLE DDS (it was never a pre-V3 data problem), and `amendDds` never succeeding right
after submit (the window does not open until AVAILABLE).

## C. Documentation vs. schema vs. live server

1. §8.2.1 presents SD `operatorRole` `MEMBER_STATE` as new in V4 — it is already in the V3 XSD.
2. §9.1.3 says SD `producerStreet` is "now mandatory" — it is mandatory in both the V3 and V4 XSD.
3. `EudrUserMessage`: the docs show `<eudr:EudrUserMessage xmlns:eudr=".../eudr/common/v4">` in the
   SOAP header, but the XSD only defines the simple type (no global element) and the WSDL declares
   no output header. Generated bindings will not see it, so the library matches it by local name
   inside `Header`. No announcement was present on acceptance on 2026-11-09, so the real element
   could not be observed yet.
4. The change log is silent on A3, A7, A9, A10 and A11.
5. The V4 SD XSD dropped the "grouping cannot be changed on update" note that the V3 SD and V4 DDS
   XSDs still carry. Unclear whether `updateSd` V4 relaxed the rule; not verifiable with the current
   test account (no MSPO role).
6. §1.2.4: only `OperatorAccessIdentifier` is accepted on EUDR endpoints; the other three
   `BodyIdentity` identifier kinds are rejected with `UnauthenticatedException`.
7. **Live fault wording differs from the docs.** The DDS detail-retrieval fault reads
   *"Statement details can only be accessed through the UI"* (docs: *"Statement detail access is
   possible only over UI"*); the SD one matches the docs (*"Declaration detail access is possible only
   over UI"*). The handler matches both forms. The fault code is `Client`, not `Server` as in the
   samples.
8. **`*_NOT_FOUND_OR_NO_ACCESS` codes were not observed on the wire**: unknown UUIDs return a bare
   `NotFoundException` with *"Statement not found."* / *"Declaration not found."* and an empty
   detail. The codes are mapped anyway in case they appear.
9. `referenceNumberInfo` live text differs from the docs' labels ("Under system analysis" /
   "Assigned"): observed *"The submission is currently under analysis by the system"* (SUBMITTED) and
   *"Use this as the reference number to demonstrate compliance"* (AVAILABLE). Treat it as free text.

## D. Client gaps found during the audit

| Gap | Status |
|---|---|
| SD postal address emitted `producerStreet` only when present, although the XSD requires it (V3 and V4). | Fixed — clear client error `postalAddress.producerStreet is required` |
| DDS producers: the client did not enforce the XSD-mandatory `country` (and, on V3, `geometryGeojson`); the server rejects such requests. | **Fixed** for `country`: missing → `EUDR_V3_PRODUCER_COUNTRY_REQUIRED`, not two letters → `EUDR_V3_PRODUCER_COUNTRY_INVALID` (V3 and V4). `geometryGeojson` left as is (optional in V4) |

## E. Live verification (acceptance, 2026-11-09)

| Call | V3 | V4 |
|---|---|---|
| `getDds` / `getDdsByInternalReference` (known AVAILABLE DDS) | ✅ no `referenceNumberInfo` | ✅ with `referenceNumberInfo` |
| `getDdsByIdentifiers` (known DDS) | ✅ `EUDR_DETAIL_RETRIEVAL_UNSUPPORTED` | ✅ same |
| `getSdByIdentifiers` (bogus) | ✅ `EUDR_DETAIL_RETRIEVAL_UNSUPPORTED` | ✅ same |
| `verifyDeclaration` known / bogus | ✅ `EXISTING_USABLE` / `NON_EXISTENT` (no status) | ✅ same |
| `submitDds` → `getDds` → `withdrawDds` | (existing suite) | ✅ `SUBMITTED` + "under analysis" info, then `WITHDRAWN` |
| `amendDds` right after submit | — | `EUDR_API_AMEND_NOT_ALLOWED_FOR_STATUS` (expected, B2) |
| `EudrUserMessage` header | never present | not present at the time of testing |

The permanent live suites (`tests/services/*-service-v3.integration.test.js`) now run every case for
both V3 and V4 (`describe` names `Eudr…ClientV3 - Integration Tests` and `Eudr…ClientV4 - Integration Tests`).

## Recommended business behaviour (docs §2.3–2.4)

Not enforced by the library, documented in the README: 5 requests/second per IP and 10,000/minute
globally, at most 100 UUIDs per `getDds`/`getSd` call (enforced), wait at least one hour after
submission before polling for the reference number, and cache instead of re-requesting.
