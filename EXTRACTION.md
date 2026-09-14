# Shared-loader extraction admission

`ores-web-loader` is a coordination boundary today, not a second implementation authority. The machine gate is `extraction-admission.json` and the current state is `not_admitted`.

Implementation may be extracted from the immutable OWLS counterpart only after every required evidence item is satisfied and reviewed. In particular, the behavior must be proven useful to at least two independent loader families, `prepare` must remain non-effectful, cold activation must remain available, release/asset identities must stay immutable, and framework adapters must remain outside the neutral core.

Before admission this repository intentionally has no `src/` implementation tree and no independent `contracts/` authority. CI rejects either one. TypeSpec and JSON Schema authority stays in `ores-wasm-loaders/owls-interfaces` until an explicit authority-migration decision is reviewed; copying schemas here to accelerate extraction is forbidden.

## Candidate ownership after admission

Manifest verification and preparation leases are reasonable neutral-core candidates once cross-family evidence exists. Browser/worker/SSR details remain adapter-specific until proven common. Framework adapters remain counterpart-owned. Release integrity remains contract-authority-owned.

## Admission procedure

1. Update the immutable source revision in both `counterparts.json` and `extraction-admission.json`.
2. Attach conformance evidence for every `required_evidence` item, including cross-runtime fixtures at immutable revisions.
3. Review contract-authority migration separately from implementation extraction.
4. Change `extraction_status` to `admitted` only in the same reviewed change that introduces the neutral implementation and tests.
5. Preserve cold-start activation so speculative preparation is always optional.

Run `node scripts/validate-extraction-admission.mjs` before proposing extraction.
