# V3 Live Test Plan (DDS + Simplified Declaration)

## Purpose

This document covers **only real, no-mock tests** for the V3 DDS and Simplified Declaration (SD) clients —
tests that make actual SOAP calls to the real EUDR acceptance environment. Mocked unit tests
(`tests/services/submission-service-v3.test.js`, `retrieval-service-v3.test.js`,
`simplified-declaration-service-v3.test.js`) are out of scope here: they feed hand-crafted XML fixtures
directly into envelope-builder/parser methods and never touch the network. This document exists so the two
kinds of test never get confused with each other.

## File layout and how to run

| File | What it exercises | npm script |
|---|---|---|
| `tests/services/submission-service-v3.integration.test.js` | `EudrSubmissionClientV3`: submit/amend/withdraw, business-rule regression, grouped declarations | `npm run test:submission:v3` |
| `tests/services/retrieval-service-v3.integration.test.js` | `EudrRetrievalClientV3`: getDds/getDdsByInternalReference/getDdsByIdentifiers | `npm run test:retrieval:v3` |
| `tests/services/simplified-declaration-service-v3.integration.test.js` | `EudrSimplifiedDeclarationClientV3`: all 6 operations | `npm run test:sd:v3` |
| `tests/services/verification-service-v3.integration.test.js` | `EudrVerifyDeclarationClientV3`: verifyDeclaration (only operation) | `npm run test:verification:v3` |
| `tests/helpers/wait.js` | Shared `delay()` / `pollUntil()` helpers for async-processing timing | (not a test file) |

All three are also picked up automatically by the existing glob-based `npm run test:integration`, alongside
the pre-existing (and currently failing — see Known Limitations) V1/V2 integration tests.

Requires real credentials in `.env` at the repo root (`EUDR_TRACES_USERNAME`, `EUDR_TRACES_PASSWORD`,
`EUDR_WEB_SERVICE_CLIENT_ID=eudr-test`, `EUDR_TRACES_BASE_URL`) pointing at the acceptance environment. See
`.claude/skills/verify/SKILL.md` for the general live-testing playbook this plan follows.

## Coverage matrix

| Operation | Status before this work | New live test | Result when last run |
|---|---|---|---|
| `submitDds` | Confirmed working (manual script, prior session) | `submission-service-v3.integration.test.js` — DOMESTIC + IMPORT | ✅ Pass |
| `submitDds` business rule (`percentageEstimationOrDeviation`) | Bug found & fixed (prior session) | Regression guard test | ✅ Pass (server still rejects if missing, as expected) |
| `amendDds` | Attempted, blocked by status, never succeeded | 15s-wait test | ⚠️ Still fails with `EUDR_API_AMEND_NOT_ALLOWED_FOR_STATUS` — 15s is not enough (see Known Limitations) |
| `withdrawDds` | Confirmed working | Immediate-withdraw test | ✅ Pass |
| `getDds` (single) | Returned empty immediately after submit | Immediate + not-found tests | ✅ Pass (empty result is the expected/documented outcome, not a failure) |
| `getDds` (batch) | Never tested | Batch test (2 real uuids) | ✅ Pass (result contents vary run-to-run — see Known Limitations) |
| `getDdsByInternalReference` | Returned empty immediately after submit | Immediate test | ✅ Pass (empty is expected this soon after submit) |
| `getDdsByIdentifiers` | Never tested | Not-found test + known-DDS test | ✅ Pass (not-found case) / ⚠️ Fails for one specific real, pre-existing DDS (see Known Limitations #6) |
| Grouped declarations (DDS A referenced by DDS B, A → `GROUPED`) | Never tested at all | Full lifecycle test | ⚠️ Self-skips: DDS A's `referenceNumber` did not appear within 20s, so grouping could not be attempted (see Known Limitations) |
| `getDds`/`getDdsByInternalReference` against a real, pre-existing DDS | Never tested with genuinely populated data | "known existing DDS" test group in `retrieval-service-v3.integration.test.js` | ✅ Pass — first confirmed case of a fully populated, matching result (`status: AVAILABLE`, matching reference/verification/internal-reference numbers) |
| `submitSd` | Blocked by account role | Permission-check test (no MSPO required) | ✅ Pass — cleanly surfaces `EUDR_WEBSERVICE_USER_ACTIVITY_NOT_ALLOWED` |
| `submitSd`/`updateSd`/`withdrawSd`/`getSd*` success paths | Never tested (blocked) | Skip-gated write-lifecycle tests | ⏸ Skipped — test account has no MICRO_OPERATOR/MSPO role in TRACES NT (see Known Limitations) |
| `getSd`/`getSdByInternalReference`/`getSdByIdentifiers` not-found paths | Never tested | Not-found tests (no MSPO role required) | ✅ Pass |
| `verifyDeclaration` — known AVAILABLE DDS | Never tested | Stable known-DDS test (same reference/verification used as `KNOWN_DDS` in retrieval-v3 suite) | ✅ Pass — `EXISTING_USABLE` / `AVAILABLE` |
| `verifyDeclaration` — bogus reference/verification pair | Never tested | Not-found test | ✅ Pass — confirms **HTTP 200 + `NON_EXISTENT`**, not a fault (see Known Limitations #7) |
| `verifyDeclaration` — schema-length violations (`referenceNumber` >14 chars, `verificationNumber` <5 chars) | Never tested | Two schema-validation tests | ✅ Pass — confirms real server behavior differs from the docs' fault sample (see Known Limitations #8) |
| `verifyDeclaration` — freshly submitted DDS | Never tested | Poll + self-skip test | ⚠️ Self-skips: reference/verification numbers did not appear within 30s (same timing limitation as #3) |
| `verifyDeclaration` — withdrawn DDS | Never tested | Poll + self-skip test | ⚠️ Self-skips — and surfaced a new server-side bug in `getDds` while polling (see Known Limitations #9) |

## Units-of-measure business rules on V3 (server-enforced, not client-validated)

V3's DDS/SD transports do **not** pre-validate units-of-measure combinations client-side (unlike V1/V2's
`validateUnitsOfMeasure`) — Story 5 only added validation for `operatorRole`/`activityType`/legacy fields.
These rules are confirmed live to still be enforced server-side:

- **DOMESTIC/TRADE**: `netWeight` + at least one of `percentageEstimationOrDeviation` or
  `supplementaryUnit`+`supplementaryUnitQualifier`. Missing both → server rejects with
  `EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_MISSING` (covered by the regression-guard test).
- **IMPORT/EXPORT**: `netWeight` required; `supplementaryUnit`+`supplementaryUnitQualifier` required only if
  the HS heading is in Appendix I (e.g. `4410`) — confirmed via the IMPORT submit test.

If this behavior should ever be pre-validated client-side (matching V1/V2's UX of failing fast before a
network call), that would be new work, not covered by this plan.

## Known limitations / open items

1. **`amendDds` has never succeeded live.** Both the original manual test and the new 15s-wait test hit
   `EUDR_API_AMEND_NOT_ALLOWED_FOR_STATUS`. Meanwhile `withdrawDds` succeeds immediately after submit, even
   though the docs describe the same "must be AVAILABLE" precondition for both operations. Empirical
   conclusion so far: either withdraw is less strict than documented, or the DDS actually was already
   AVAILABLE and amend has a stricter/different rule. Not yet resolved — would need a longer wait (docs
   suggest up to ~30 minutes) to confirm a true amend success path. This was a deliberate trade-off: the
   15-second wait was chosen pragmatically over a full long-running poll.
2. **Grouped declarations could not be exercised.** DDS A's `referenceNumber` did not appear via `getDds`
   within the 20-second poll window used by the test, so the test self-skips rather than asserting a false
   failure. The grouping flow (submit B referencing A's reference number, confirm A → `GROUPED`, confirm
   withdraw of A is blocked, withdraw B, re-check A) is fully written and ready — it just needs
   `referenceNumber` to become available, which apparently takes longer than 20s in this environment.
3. **`getDds` immediate-availability is inconsistent, not a fixed rule.** In one run, a batch `getDds` call
   right after two fresh submissions returned real data (`status: "SUBMITTED"`) within ~700ms; in another
   run, an equivalent immediate call returned an empty array. Don't assume either a fixed "always empty
   immediately" or "always available immediately" rule — the server's indexing/timing is not fully
   predictable at short delays.
4. **SD write lifecycle (`submitSd` success, `updateSd`, `withdrawSd`, `getSd*` with real data) is entirely
   untested live**, because the `.env` test account (`n00ihxdy`) is not registered as MICRO_OPERATOR/MSPO in
   TRACES NT — confirmed via `EUDR_WEBSERVICE_USER_ACTIVITY_NOT_ALLOWED`. The tests are written and will run
   automatically the moment an MSPO-registered account is available (the suite probes capability once in
   `before` and skips the write-lifecycle `describe` block otherwise — no env flag to configure).
5. **`getDdsByIdentifiers`/`getSdByIdentifiers` with a bogus reference/verification pair return a generic
   `Request failed with status code 500`**, not a distinctly-typed `NotFoundException` in the parsed error
   object. The raw SOAP fault is still captured in `error.details.soapFault` for inspection; this is a
   pre-existing characteristic of `EudrErrorHandler`'s generic fault parsing, not something introduced by
   this test plan.
6. **`getDdsByIdentifiers` fails with `NotFoundException` ("Data not found.") for real, pre-existing DDS
   records, even when reference/verification numbers are confirmed correct** — and the "pre-V3 legacy
   record" hypothesis below is now disproven by a second data point on a natively-V3 record:
   - First observed on `uuid: 5e5ad1ff-a735-4eec-8588-b164a79738d1`, `referenceNumber: 25HR3TXDB21346`,
     `verificationNumber: EIBEAESE`, submitted 2025-12-02.
   - **Update (2026-07-07):** reproduced again on a different, much more recent DDS —
     `uuid: c138d609-11b2-4e14-ba8b-bbf7a6173b2e`, `referenceNumber: 26HRWQZJPVEUPV`,
     `verificationNumber: VUXHBASA`, submitted 2026-07-06 (`internalReferenceNumber:
     V3-VERIFY-1783371470850`) — i.e. a native V3 record, not a legacy pre-V3 one. This is the DDS
     currently hardcoded as `KNOWN_DDS` in `retrieval-service-v3.integration.test.js`. Diagnostic script
     called `getDdsByIdentifiers` with `{ rawResponse: true }`-style inspection of `error.details.soapFault`
     and confirmed the exact same fault: `faultcode: S:Client`, `faultstring: "Data not found."`. Also
     re-confirmed via `getDds(uuid)` that the server's own `referenceNumber`/`verificationNumber` for this
     record match byte-for-byte what's passed to `getDdsByIdentifiers`.
   - In both cases `getDds(uuid)` and `getDdsByInternalReference` succeed and return `status: AVAILABLE`
     with the exact same reference/verification numbers that `getDdsByIdentifiers` rejects as not found.
     The generated request XML was independently confirmed well-formed and correct against the live WSDL/XSD
     (`?xsd=2`/`?xsd=3` from the acceptance server): namespaces, `SOAPAction`, and the
     `referenceAndVerificationNumber` wrapper all match the schema exactly.
   - Since the hypothesis "only affects pre-V3 legacy records" is now falsified by the second (native V3)
     data point, the more likely explanation is a genuine server-side quirk/bug in `getDdsByIdentifiers` on
     the acceptance environment, unrelated to record age. Deliberately left unresolved per the repo owner
     ("ostavi ovako" / leave as-is for now) — the `known existing DDS` test in
     `retrieval-service-v3.integration.test.js` is intentionally left failing on this one assertion so the
     anomaly stays visible rather than being silently softened.
7. **`verifyDeclaration` returns a normal HTTP 200 with `result: NON_EXISTENT` for a bogus
   reference/verification pair — it does not throw a fault.** This is a meaningful behavioral
   difference from `getDdsByIdentifiers`/`getSdByIdentifiers`, which throw a `NotFoundException`
   (surfaced as a generic HTTP 500) for the same kind of unmatched pair. Confirmed live and matches
   the docs (`EUDR Downstream Operator and Trader API Reference v1.0.md` §5.1.4) exactly. Also
   notable: calling `verifyDeclaration` with the exact reference/verification pair from Known
   Limitation #6 above (the DDS that `getDdsByIdentifiers` insists is "Data not found.") correctly
   returns `EXISTING_USABLE` / `AVAILABLE` — independent confirmation that #6 is isolated to
   `getDdsByIdentifiers` itself, not a problem with those reference/verification numbers or this
   account's data.
8. **`verifyDeclaration` does not pre-validate `referenceNumber`/`verificationNumber` length
   client-side** (only presence, matching the rest of the V3 clients' philosophy of leaning on the
   server for business/schema rules). Confirmed live: violating the server's XSD constraints
   (`ReferenceNumberType` maxLength 14, `VerificationNumberType` minLength 5/maxLength 35) returns a
   raw JAX-WS `SAXParseException` fault (`cvc-minLength-valid`/`cvc-maxLength-valid`), which
   `EudrErrorHandler` maps to `eudrErrors[0].code === 'XML_VALIDATION_ERROR'` with `httpStatus 400`.
   This is a different fault shape than the `BusinessRulesValidationException` sample shown in the
   docs (§5.1.5, `<errors><error><field>/<message></error></errors>`) — that sample appears to be a
   generic example shared across services rather than what this operation actually returns for
   length violations. The client's existing `cvc-` handling in `error-handler.js` already covers
   this correctly; no code change was needed, just live confirmation.
9. **New: `getDds(uuid)` can throw a raw `InternalSystemException` (HTTP 500, `faultCode:
   env:Server`) for a DDS that was just withdrawn, instead of either an empty array or a
   `WITHDRAWN` overview.** Discovered while writing the `verifyDeclaration` withdrawn-DDS test
   (`verification-service-v3.integration.test.js`). Reproduced twice independently:
   - Submit → `withdrawDds` (confirmed to return `httpStatus: 200`/`status: WITHDRAWN`
     immediately, consistent with existing `withdrawDds` tests) → `getDds(uuid)` returns `[]` on
     the very next call, then starts throwing `InternalSystemException` on subsequent calls.
   - This is **not a brief blip**: in one diagnostic run it persisted continuously across ~15
     polling attempts spanning roughly 3 minutes (some at 3s, some at 15s intervals) with no
     recovery observed in that window. A separate uuid from an earlier failed test run was
     re-checked several minutes later (well outside the test's own polling window) and was still
     throwing the same fault.
   - Impact: any consumer that withdraws a DDS and then immediately checks its status via `getDds`
     — e.g. to confirm the withdrawal took effect, or to build a `verifyDeclaration`-style flow
     manually via retrieval instead of the dedicated verification service — can hit a hard 500
     instead of a clean `WITHDRAWN` overview. `verifyDeclaration` itself only reads risk-profiled
     projections (see #7) so it isn't directly affected, but retrieval-based status checks are.
   - The withdrawn-DDS integration test treats a thrown `getDds` error as "not ready yet" during
     polling (rather than crashing) and self-skips its final assertion if the record never
     stabilizes within 30s, consistent with the self-skip convention used elsewhere in this suite
     for timing-dependent assertions. The anomaly is still logged loudly on every occurrence so it
     stays visible.

## Out of scope (per agreement)

- A full ~30 minute poll to conclusively verify amend/grouping timing — the 15s pragmatic wait was chosen
  instead, with the explicit trade-off that these two areas remain only partially verified.
- Obtaining an MSPO-registered test account — outside this repo's control; tests are ready for when one
  exists.
- Changing the existing V1/V2 `*.integration.test.js` files, which fail because EUDR has discontinued V1/V2
  on the acceptance environment (documented separately in the epic, Story 8 notes, and the README).
