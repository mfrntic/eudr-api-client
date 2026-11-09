# EUDR V3 + V4 schema snapshot — Information System release 8.2.2

Verbatim copies of the WSDL and XSD files served by the **acceptance** environment, fetched on
2026-11-09 after the Commission announced release 8.2.2 and the new **V4 API** (API documentation
v1.3, `docs/eudr_docs_v4/`).

- `V4/` — the new `EUDRDueDiligenceStatementServiceV4`, `EUDRSimplifiedDeclarationServiceV4`,
  `EUDRVerifyDeclarationServiceV4`.
- `V3/` — the V3 services as they are served **after** 8.2.2. They differ from
  `docs/eudr_docs 8.2.1/` (documentation changes, HS code pattern widened to 2–10 digits, ...),
  so this is the current V3 reference; the 8.2.1 folder is kept as history.
- `shared/` — UN/CEFACT language-code and unqualified-data-type schemas, byte-identical across all
  six services and both versions.

Nothing here is loaded at runtime — the clients build SOAP envelopes as strings. These files are the
reference used to verify what the clients generate. The full audit is in
`docs/analysis/release-8.2.2-v4-conformance.md`.

## Layout

Files are named after the query parameter they came from plus the target namespace they define.

| Namespace | V3 | V4 |
|---|---|---|
| base header | `http://ec.europa.eu/sanco/tracesnt/base/v4` | same (unchanged) |
| body header (`BodyIdentity`) | `http://ec.europa.eu/tracesnt/body/v3` | `http://ec.europa.eu/tracesnt/body/v4` |
| EUDR common | `.../certificate/eudr/common/v3` | `.../certificate/eudr/common/v4` |
| DDS | `.../certificate/eudr/due-diligence-statement/v3` | `.../due-diligence-statement/v4` |
| SD | `.../certificate/eudr/simplified-declaration/v3` | `.../simplified-declaration/v4` |
| Verify | `.../certificate/eudr/verify-declaration/v3` | `.../certificate/eudr/verification/v4` (**renamed**) |
| faults | `http://ec.europa.eu/sanco/tracesnt/error/v01` | same |

## `?xsd=N` numbering (as of 8.2.2)

The numbering is assigned per service by JAX-WS and **is not stable** — always check
`targetNamespace` after fetching.

| Service | `1` | `2` | `3` | `4` | `5` | `6` | `7` |
|---|---|---|---|---|---|---|---|
| DDS / SD (V3 and V4) | base v4 | body vN | common vN | service | error v01 | UN/CEFACT language | UN/CEFACT data type |
| Verify (V3 and V4) | base v4 | common vN | verify / verification | error v01 | UN/CEFACT language | UN/CEFACT data type | — |

`?wsdl=1` is the base header WSDL, `?wsdl=2` the body header WSDL (DDS/SD only).

## Re-fetching

```bash
BASE="https://acceptance.eudr.webcloud.ec.europa.eu/tracesnt/ws"
for v in 3 4; do
  for s in EUDRDueDiligenceStatementService EUDRSimplifiedDeclarationService EUDRVerifyDeclarationService; do
    n="$s"V$v
    curl -sk -o "$n.wsdl" "$BASE/$n?wsdl"
    for i in 1 2; do curl -sk -o "${n}_wsdl${i}.wsdl" "$BASE/$n?wsdl=$i"; done
    for i in 1 2 3 4 5 6 7; do curl -sk -o "${n}_xsd${i}.xsd" "$BASE/$n?xsd=$i"; done
  done
done
```

Compare ignoring line endings and the JAX-WS banner (`diff --strip-trailing-cr -wB`); the 8.2.2
deployment also bumped the banner from `JAX-WS RI 2.3.5` to `JAX-WS RI 3.0.2`, which touches the
first line of every file without changing the contract. To compare V3 with V4, normalize the
version segments first (`sed -E 's#(eudr/[a-z-]+)/v[34]#\1/vX#g; s#body/v[34]#body/vX#g'`).

Production serves the same services at `https://eudr.webcloud.ec.europa.eu/tracesnt/ws/…`.
