---
name: verify
description: How to manually verify changes to the eudr-api-client library end-to-end against the real EUDR acceptance environment
---

# Verifying eudr-api-client changes

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
cardinality — more reliable than the vendored reference PDF/MD in `docs/eudr_docs 1.5/`. Fetch directly:
- `https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRDueDiligenceStatementServiceV3?wsdl` (+ `?xsd=2` common, `?xsd=3` DDS-specific)
- `https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws/EUDRSimplifiedDeclarationServiceV3?wsdl` (+ `?xsd=2`, `?xsd=3`)

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
