# EUDR V3 schema snapshot — Information System release 8.2.1

Verbatim copies of the WSDL and XSD files served by the **acceptance** environment, fetched on
2026-09-04 while auditing the release 8.2.1 release notes
(`docs/eudr_docs 1.4/EUDR_Release_Notes_821_596uh5f79EC8oA3TmKzHOQwcP8_132197.pdf`).

They are vendored because the published PDF reference docs lag behind the deployed contract:
`docs/eudr_docs 1.5/` predates 8.2.1 and misses the `BodyIdentity` header and the
`NotFoundException` faults entirely, and it contains no XSDs at all. With this snapshot in git,
the next release note is a `diff` instead of an investigation.

Nothing here is loaded at runtime — the clients build SOAP envelopes as strings. These files are
the reference used to verify what the clients generate.

## Layout

Files are named after the query parameter they came from, plus the target namespace they define.

| Namespace | What it holds |
|---|---|
| `http://ec.europa.eu/sanco/tracesnt/base/v4` | `WebServiceClientId`, `LanguageCode`, `Attributes` headers |
| `http://ec.europa.eu/tracesnt/body/v3` | **`BodyIdentity` header (new in 8.2.1)** |
| `.../eudr/common/v3` | shared EUDR types: `OverviewType`, `EudrStatusType`, `IdentifierTypeType`, `GroupedDeclarationsType`, … |
| `.../eudr/due-diligence-statement/v3` | DDS requests/responses |
| `.../eudr/simplified-declaration/v3` | SD requests/responses |
| `.../eudr/verify-declaration/v3` | `verifyDeclaration` and `VerifyResultType` |
| `http://ec.europa.eu/sanco/tracesnt/error/v01` | fault payload types |
| `urn:un:unece:…` (in `shared/`) | UN/CEFACT language codes and unqualified data types, byte-identical across all three services |

## Re-fetching

```bash
BASE="https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws"
for s in EUDRDueDiligenceStatementServiceV3 EUDRSimplifiedDeclarationServiceV3 EUDRVerifyDeclarationServiceV3; do
  curl -sk -o "$s.wsdl" "$BASE/$s?wsdl"
  for i in 1 2; do curl -sk -o "${s}_wsdl${i}.wsdl" "$BASE/$s?wsdl=$i"; done
  for i in 1 2 3 4 5 6 7; do curl -sk -o "${s}_xsd${i}.xsd" "$BASE/$s?xsd=$i"; done
done
```

The `?xsd=N` numbering is assigned by JAX-WS per service and **is not stable across services** —
for DDS and SD, `xsd=3` is the EUDR common schema, while for Verify it is `xsd=2`. Always check
`targetNamespace` after fetching rather than trusting the number.

Production serves the same services at `https://eudr.webcloud.ec.europa.eu/tracesnt/ws/…`.

## What changed in 8.2.1

See `docs/analysis/release-8.2.1-conformance.md` for the full item-by-item audit. On the wire:

1. An optional `<soap:header message="body:BodyIdentityHeader" part="bodyIdentity">` on all six DDS
   and all six SD operations (multi-operator authentication). Not present on Verify Declaration.
2. `NotFoundException` declared as an explicit fault on the `get*` operations.
3. A `getDdsByIdentifiers` documentation note stating the operation is available only to non-SME
   operators.

Grouping, SD versioning and the verification result values were **not** changed on the wire — the
release notes describe them in GUI vocabulary.
