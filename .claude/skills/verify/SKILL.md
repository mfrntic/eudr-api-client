---
name: verify
description: How to manually verify changes to the eudr-api-client library end-to-end against the real EUDR acceptance environment
---

# Verifying eudr-api-client changes

**A permanent live (no-mock) test suite now exists** — prefer it over a new throwaway script:
`tests/services/{submission,retrieval,simplified-declaration}-service-v3.integration.test.js`
(`npm run test:submission:v3` / `test:retrieval:v3` / `test:sd:v3`). See
[docs/analysis/v3-live-test-plan.md](../../../docs/analysis/v3-live-test-plan.md) for the coverage matrix
and known limitations (amend never succeeds live yet, grouped declarations can't complete within the 20s
poll window, SD write lifecycle is skip-gated pending an MSPO test account). Only write a new throwaway
script (as described below) for something these don't already cover.

This is a library with no CLI/server/UI of its own. The surface is the **package boundary** — require the
public entry point the way a real consumer would, and drive it against the real EUDR acceptance (training)
environment. Real, working credentials for that environment are already in `.env` at the repo root
(`EUDR_TRACES_USERNAME`, `EUDR_TRACES_PASSWORD`, `EUDR_WEB_SERVICE_CLIENT_ID=eudr-test`). Acceptance
submissions have no legal value — it's the sandbox EUDR provides for exactly this kind of testing.

## How to run a live check

1. Write a throwaway script **at the repo root** (not in the OS temp/scratchpad dir) and delete it when done.
   Node resolves `node_modules` relative to the script's own location, so a script outside the repo can't
   `require('dotenv')` or the package itself — that's the #1 gotcha here.
2. Require the public entry point: `const { EudrSubmissionClientV3, EudrRetrievalClientV3, EudrSimplifiedDeclarationClientV3, EudrEchoClient } = require('./index.js');` — not a deep path into `services/`.
3. Load env with `require('dotenv').config()` before building the client config.
4. Start with `EudrEchoClient.echo()` — safe, non-mutating, confirms WS-Security/auth/connectivity before
   trying anything that writes data.
5. Then exercise the real flow: `submitDds`/`submitSd` → `getDds`/`getSd` → `amendDds`/`updateSd` →
   `withdrawDds`/`withdrawSd`. Print the full result/error object (`error.details.soapFault`,
   `error.eudrErrorCode`) — the server's own fault messages are the ground truth for whether a business
   rule was violated vs. a real bug in this library.
6. Delete the script when done: `rm .manual-verify-*.tmp.js` (or whatever name was used). Don't commit it.

## Known real-server behaviors (not bugs) to expect

- **`getDds`/`getDdsByInternalReference` right after `submitDds` return an empty `ddsInfo: []`.** EUDR
  processes submissions asynchronously (risk profiling etc.) — the README already tells consumers to wait
  ~30 minutes before polling. Don't mistake this for a parsing bug.
- **`amendDds` fails with `EUDR_API_AMEND_NOT_ALLOWED_FOR_STATUS`** if attempted right after submit — the
  DDS is still in `SUBMITTED` status, not yet `AVAILABLE`. Expected.
- **`submitSd` fails with `EUDR_WEBSERVICE_USER_ACTIVITY_NOT_ALLOWED`** unless the account is actually
  registered in TRACES NT with the claimed `operatorRole` (e.g. `MICRO_OPERATOR` for SD). The test account
  in `.env` is a generic operator account, not MSPO-registered, so SD `submitSd` will likely always fail
  this way here — that's an account/role limitation, not a library bug. DDS `submitDds` with
  `operatorRole: 'OPERATOR'` works fine with this account.
- The server does strict XSD validation (`cvc-maxLength-valid` SAXParseException etc.) — e.g. SD's
  `internalReferenceNumber` is `ReferenceNumberType` (max 14 chars), much shorter than DDS's
  `InternalReferenceNumberType` (max 35 chars). If a live call fails with a `SAXParseException`/`cvc-*`
  message, check field length/enum against the live XSD (see below) before assuming it's a parsing bug.

## Re-fetching the authoritative schema

The WSDL/XSD served by the acceptance environment is the ground truth for field names, types, and
cardinality — more reliable than the vendored reference PDF/MD in `docs/eudr_docs 1.5/`.

A full snapshot fetched on 2026-09-04 (Information System release 8.2.1) is vendored in
[docs/eudr_docs 8.2.1/](../../../docs/eudr_docs%208.2.1/README.md), including the re-fetch recipe —
check that first, and re-fetch when you need to know whether the contract has moved since.

**The `?xsd=N` numbering is assigned per service and shifts when the Commission adds a schema** — it
already changed once, when release 8.2.1 inserted the `body/v3` schema (the `BodyIdentity` header) as
`?xsd=2` and pushed the EUDR common schema from `?xsd=2` to `?xsd=3`. Never trust the number; fetch and
check `targetNamespace`. As of the 8.2.1 snapshot:
- `EUDRDueDiligenceStatementServiceV3` / `EUDRSimplifiedDeclarationServiceV3`: `?xsd=1` base v4,
  `?xsd=2` body v3, `?xsd=3` EUDR common v3, `?xsd=4` service-specific, `?xsd=5` error v01
- `EUDRVerifyDeclarationServiceV3`: `?xsd=1` base v4, `?xsd=2` EUDR common v3, `?xsd=3` verify-declaration
  v3, `?xsd=4` error v01 (no body v3 — this service does not accept the `BodyIdentity` header)

## What live testing already caught once

A real round-trip against the acceptance server caught a bug that 100+ passing unit tests (mocked XML)
never would have: `generateCommodityXml`/`generateSdCommodityXml` in
`services/due-diligence-statement-service-v3.js` and `services/simplified-declaration-service-v3.js` were
silently dropping `goodsMeasure.percentageEstimationOrDeviation` from the generated XML. The server
rejected DOMESTIC/TRADE submissions with `EUDR_COMMODITIES_DESCRIPTOR_PERCENTAGE_ESTIMATION_MISSING` even
though the caller had supplied the field — unit tests never exercised that exact field because none of them
asserted its presence in the output XML. Lesson: when adding/changing XML-generation code, a live
submission against acceptance is the only thing that proves the full field set actually reaches the wire in
the order/shape the server's XSD expects.
