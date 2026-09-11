# ores-web-loader — agent notes

This repository is the fleet-facing coordination boundary for browser/WASM loader counterparts.

- Preserve **prepare != activate**. Preparation must not execute application code, authenticate, subscribe, mutate product state, or instantiate a runtime.
- Do not copy an implementation from a counterpart merely to make this repository non-empty. Shared code should move here only through a reviewed extraction that leaves one implementation authority for the extracted behavior.
- Counterpart revisions in `counterparts.json` are immutable 40-character Git commits. Moving branches/tags are not admission evidence.
- Release/manifest contracts remain owned by their declared interface repositories and, when cross-runtime, by independent human-authored TypeSpec + JSON Schema peer authorities admitted with TJSV.
- Keep framework-generated glue release-owned. The shared loader coordinates lifecycle rather than replacing Flutter/wasm-bindgen/Leptos/Dioxus generated artifacts.
- No React/JSX or webview dependency in this boundary.
- Merge semantic changes; never rebase, stash, reset, force-push, or weaken a gate.

Also follow the canonical fleet policy in `ORESoftware/my-ai/AGENTS.md` and `SHARED.md`.
