# ores-web-loader

Fleet-facing coordination boundary for ORE browser/WASM loaders.

The shared invariant is simple and non-negotiable: **prepare is not activate**.
Preparation may fetch, verify, cache, and return bounded receipts; it must never execute application code, authenticate, subscribe, mutate product state, or start a runtime. Activation is the explicit effectful transition.

## Current implementation counterpart

The first production implementation remains [`ores-wasm-loaders/owls-web-loader`](https://github.com/ores-wasm-loaders/owls-web-loader), pinned in `counterparts.json` to a reviewed immutable commit. It already provides the coordinator, preparation leases, browser/worker/SSR behavior, Raw Wasm / bindgen / Leptos / Dioxus / Flutter adapters, same-origin navigation warming, and release-manifest integrity checks.

This repository does **not** copy that implementation. Until shared code is deliberately extracted, OWLS remains the implementation authority for its runtime and `owls-interfaces` remains the independently authored TypeSpec + JSON Schema release-contract authority.

## Purpose of this repository

- keep a stable registry of loader-family counterparts and reviewed source revisions;
- define fleet-wide invariants that every counterpart must satisfy;
- document consumers and migration status without creating a second schema authority;
- provide the future neutral package boundary when common implementation can be extracted without semantic duplication;
- coordinate validation through `ORESoftware/typespec-json-schema-validator` when this repository begins owning cross-runtime contracts.

## Fleet invariants

1. `prepare` / `prefetch` never activate application code.
2. `activate` is explicit and idempotent for one document/runtime identity.
3. release ids and asset digests are immutable; conflicting reuse fails closed.
4. fetched assets are bounded, credentialless by default, redirect-aware/fail-closed, and integrity checked.
5. framework-generated glue stays release-owned; the loader coordinates lifecycle rather than replacing framework glue.
6. no React/JSX or webview dependency is introduced into the loader boundary.
7. generated comparison schemas or IR are evidence, never a third editable authority.
8. consumer rollouts use immutable counterpart revisions and retain a cold-start fallback when speculative preparation is skipped or fails.

See `counterparts.json` for the currently admitted implementation canary.
