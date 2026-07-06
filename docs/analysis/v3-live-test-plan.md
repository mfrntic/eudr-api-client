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
6. **`getDdsByIdentifiers` fails with `NotFoundException` ("Data not found.") for one specific real,
   pre-existing DDS** (`uuid: 5e5ad1ff-a735-4eec-8588-b164a79738d1`, `referenceNumber: 25HR3TXDB21346`,
   `verificationNumber: EIBEAESE`, submitted 2025-12-02), even though `getDds(uuid)` and
   `getDdsByInternalReference` both successfully return this exact same DDS with `status: AVAILABLE` and the
   exact same reference/verification numbers (byte-for-byte confirmed, no hidden whitespace/encoding issue).
   The generated request XML was independently confirmed well-formed and correct against the WSDL. Working
   hypothesis (per the repo owner, unconfirmed): this DDS predates the V3 rollout, and `getDdsByIdentifiers`
   may not work for pre-V3 legacy records the same way `getDds`/`getDdsByInternalReference` do. Needs
   cross-checking against a DDS created natively under V3 to confirm — blocked for now because every DDS
   this session's tests submitted-then-withdrew shows up in the TRACES NT portal UI as "Cancelled" status
   (the portal's display label for the API's `WITHDRAWN`, presumably — unconfirmed) rather than remaining in
   a queryable state. Deliberately left unresolved per the repo owner ("ostavi ovako" / leave as-is for now)
   — the `known existing DDS` test in `retrieval-service-v3.integration.test.js` is intentionally left
   failing on this one assertion so the anomaly stays visible rather than being silently softened.

## Out of scope (per agreement)

- A full ~30 minute poll to conclusively verify amend/grouping timing — the 15s pragmatic wait was chosen
  instead, with the explicit trade-off that these two areas remain only partially verified.
- Obtaining an MSPO-registered test account — outside this repo's control; tests are ready for when one
  exists.
- Changing the existing V1/V2 `*.integration.test.js` files, which fail because EUDR has discontinued V1/V2
  on the acceptance environment (documented separately in the epic, Story 8 notes, and the README).
