# Conformance audit — EUDR Information System release 8.2.1

**Source:** `docs/eudr_docs 1.4/EUDR_Release_Notes_821_596uh5f79EC8oA3TmKzHOQwcP8_132197.pdf`
(EUDR Information System Release Notes 8.2.1, release date August 2026, document version 1.0).

**Method:** every release-note item was compared against the **live acceptance WSDL/XSD**, not
against the vendored PDF reference docs. `docs/eudr_docs 1.5/` predates 8.2.1, holds no XSDs and no
SD WSDL at all, so it cannot answer conformance questions on its own. The schemas as deployed are
now vendored in `docs/eudr_docs 8.2.1/`.

**Audit date:** 2026-09-04.

## Item-by-item

### Grouping (Group Head DDS & SD) — no wire change, already implemented

"Group Head" is GUI vocabulary for what the API calls a grouping declaration: a DDS or SD carrying
`groupedDeclarations` references to previously submitted declarations, which then move to `GROUPED`
status. The element already exists in the V3 schema and is implemented in both clients
(`generateStatementXml` / `generateSdStatementXml`).

Verified against `DueDiligenceStatementBaseType`: the XML shape we emit is correct — one
`<groupedDeclarations>` wrapper per reference, since `GroupedDeclarationsType` contains exactly one
`groupedDeclaration` and the wrapper repeats (`maxOccurs="2000"`).

Two documentation-only mismatches worth knowing:

- The release notes say "up to 1000 DDS/SD members per group submission"; the XSD allows 2000. The
  client validates against the schema limit (`EUDR_V3_GROUPED_DECLARATIONS_LIMIT`), because that is
  the constraint whose violation produces an unhelpful `SAXParseException`. The 1000 business limit,
  if enforced, will come back as a normal business-rule fault.
- The DDS XSD documentation says each grouped reference "includes a reference number and
  verification number", but `GroupedDeclarationsType` carries a reference number only. We follow the
  type, not the prose.

### Simplified Declaration versioning — no wire change, already supported

The live `UpdateSdRequestType` and `WithdrawSdRequestType` still take a bare `sdIdentifier`; there is
no version input on submit, update, withdraw, or `getSdByIdentifiers`. Versioning is carried by:

- `getSd`, via `uuidAndVersionNumberList` with an optional `versionNumber` — implemented
  (`createGetSdSoapEnvelope` accepts `{uuid, version}` entries);
- responses, via the optional `version` field on `SdModificationResponseType` and `OverviewType` —
  `updateSd`/`withdrawSd` parse it explicitly, and the overview mappers (`mapOverviewItem`) copy
  every returned field through, so `version` already appears in `sdInfo` / `ddsInfo` entries.

`getDds` has **no** version parameter in the live schema (`GetDdsRequestType` is a bare `uuidList`),
despite the v1.5 reference doc change log claiming otherwise. DDS versioning is not implementable
client-side.

### Removed operator identifiers (IMO management, IMO owner, TRACES Number, NIRMS) — already aligned

Live `eudrCommon:IdentifierTypeType` is exactly:
`eori, vat, gln, tin, cbr, cin, duns, comp_num, comp_reg, oni`.

The IMO-based identifiers (`ship_man_comp_imo`, `ship_reg_owner_imo`) and `remos` exist only in the
V1/V2 schemas (`docs/eudr_docs 1.4/.../EUDRSubmissionServiceV2.xsd`). The library never had them.

Previously the V3 clients passed `identifierType` through unvalidated; the enum is now enforced
client-side (`EUDR_V3_IDENTIFIER_TYPE_INVALID`), so a leftover V1/V2 value fails with a readable
error instead of a schema-validation fault from the server.

### Multi-Operator API Authentication — new, implemented in this change

This is the only genuinely new API capability in 8.2.1. The live WSDL adds an optional

```xml
<soap:header message="body:BodyIdentityHeader" part="bodyIdentity" use="literal"/>
```

to **all six DDS V3 operations and all six SD V3 operations**. It is **not** declared on
`EUDRVerifyDeclarationServiceV3`, whose WSDL is byte-identical to the pre-8.2.1 copy.

Contract (`http://ec.europa.eu/tracesnt/body/v3`, no `elementFormDefault`, so the child element is
unqualified):

```xml
<body:BodyIdentity xmlns:body="http://ec.europa.eu/tracesnt/body/v3">
    <OperatorAccessIdentifier>ABC123</OperatorAccessIdentifier>
</body:BodyIdentity>
```

`BodyIdentityType` is a choice of exactly one of `AuthorityActivityAccessIdentifier`,
`OperatorAccessIdentifier`, `OrganicControlBodyAccessIdentifier`, `OtherBodyAccessIdentifier`, each
an `xs:token` of at most 16 characters.

Note that this contradicts the vendored v1.5 reference doc, which states twice that "Web Service
users cannot belong to more than one Operator entity" — that restriction is what 8.2.1 lifts.

Implemented as an optional `config.bodyIdentity` plus a per-call `options.bodyIdentity` override in
`utils/body-identity.js`, wired into the DDS transport and the SD client. When absent, the generated
envelope is byte-identical to the pre-8.2.1 output (verified by generating every envelope from both
the previous and the current implementation and comparing, ignoring the deliberately volatile
WS-Security nonce/timestamp/digest).

**Live probe against acceptance.** A `getDds` call on a known real DDS was issued twice: without the
header it returns HTTP 200 with the expected overview; with a syntactically valid but bogus
`OperatorAccessIdentifier` the server answers `UnauthenticatedException`. The server therefore parses
and enforces the header rather than ignoring an unknown one — which also confirms the element name,
namespace and unqualified child element we emit are accepted at the schema level.

That fault arrives as HTTP 500 with an `UnauthenticatedException` fault string. The V1/V2 clients
already normalized this to 401 themselves; `EudrErrorHandler` now does the same, so the V3 clients no
longer report a confusing 500 for what is an authentication problem.

### Verification response (VALID / NOT VALID / NOT FOUND) — no wire change, already implemented

The Verify Declaration WSDL and XSD are unchanged. `VerifyResultType` remains:

| GUI wording (release notes) | Wire value | Meaning |
|---|---|---|
| VALID | `EXISTING_USABLE` | exists and is in a usable status |
| NOT VALID | `EXISTING_NON_USABLE` | exists but is archived or not available; `status` is then set |
| NOT FOUND | `NON_EXISTENT` | no declaration matches the reference + verification number |

`EudrVerifyDeclarationClientV3.verifyDeclaration` passes `result`, `status` and `dateTime` through
unchanged. `NON_EXISTENT` arrives as HTTP 200, not as a fault.

### Full Declaration Content View for non-SME downstream operators — operations already implemented

There is no new operation. Full content comes from the existing `getDdsByIdentifiers` /
`getSdByIdentifiers`, keyed on the same reference + verification number pair as verification. The
WSDL gained a documentation note on `getDdsByIdentifiers`: "This operation is available only to
non-SME operators (standard operators and authorised representatives). SME downstream operators do
not have access to this operation."

What did change: `NotFoundException` is now a declared fault on all three DDS `get*` operations and
all three SD `get*` operations. `EudrErrorHandler` now recognises it and produces
`httpStatus: 404`, `notFound: true`, `eudrErrorCode: 'EUDR_NOT_FOUND'` instead of falling through to
a generic 500.

Documenting that mapping exposed two neighbouring gaps in the same handler, both fixed here: the V3
clients reported `UnauthenticatedException` as a generic 500 (the V1/V2 clients already normalized it
to 401 locally), and `PermissionDeniedException` — a declared fault on every V3 operation — fell
through to 400, because its fault string carries none of the lowercase "permission" / "not
authorized" wording the existing 403 check looks for. The full mapping is now documented in the
README under *Business Rules & Validation → How server faults are surfaced*.

### Operator registration & profiles, PDF generation, group-head badges, search filters — not applicable

GUI-only features (registration workflows, role selection, PDF export, search grids, visual cues).
No API surface.

## Deviations found that predate 8.2.1

- `EconomicOperatorIdentificationType.operatorReferenceNumber` is `minOccurs="0" maxOccurs="12"`,
  but the clients emitted at most one and the README claimed an operator "now has exactly one
  reference number". Both clients now accept an array of up to 12 entries (a single object still
  works), and the README claim is corrected.
- The vendored WSDL in `docs/eudr_docs 1.5/` was stale, with no SD WSDL and no XSDs, so schema drift
  was invisible to `git diff`. Fixed by vendoring the full snapshot in `docs/eudr_docs 8.2.1/`.

## Still open

- **Live multi-operator verification.** No Web Service Identifier is available for the acceptance
  account, so what is verified live is that the server parses and rejects an unknown identity — not
  that a real identity switches operator context. Tracked in `docs/analysis/v3-live-test-plan.md`.
- The pre-existing `getDdsByIdentifiers` "Data not found." anomaly on a known-good pre-V3 DDS is
  unchanged; it now surfaces as a typed 404 rather than a generic 500, but the underlying
  server-side behaviour was not investigated further in this pass.
