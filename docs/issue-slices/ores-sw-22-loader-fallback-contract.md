# browser loader worker fallback

Driver: `ORESoftware/ores-sw.js#22`

This file defines a bounded, independently reviewable contract slice for the driver issue. It does not claim the full implementation is complete.

## Invariants

- Feature-detect SharedWorker before selecting the fallback; do not infer support from user agent strings.
- Keep one logical connection/session owner across loader consumers.
- Propagate ownership generation so stale tabs cannot publish after re-election.
- Bound startup/retry queues and surface terminal fallback failures to callers.

## Verification

- Exercise the exact PR head with the repository's relevant tests/checks.
- Include fail-closed negative cases for stale, malformed, or unsupported states.
- Keep generated/runtime authority boundaries explicit.
- Treat skipped or zero-step CI as missing evidence.

## Non-goals

No secrets, direct protected-branch mutations, or silent compatibility downgrades are introduced here.
