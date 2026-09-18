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

<!-- BEGIN ores-agents-pointer: managed by ORESoftware/my-ai; edit there, not here -->

## Canonical agent instructions

Before doing anything else in this repository, also read:

    .ores/agents/AGENTS.md

That path is a symlink to `~/codes/oresoftware/my-ai/AGENTS.md`, whose canonical copy is
<https://github.com/ORESoftware/my-ai/blob/main/AGENTS.md>.

It exists at a fixed path *inside* the repository because some agents cannot walk up past
the repository root, so machine-wide instructions one or more directories above are
invisible to them. This pointer plus that path make the same file reachable from a working
directory anywhere in the tree.

The symlink is deliberately **not committed**: it names an absolute path that is only valid
on a machine with `~/codes/oresoftware/my-ai` checked out, so committing it would produce a
broken link for everyone else and for CI. `.ores/` is git-ignored for that reason. If
`.ores/agents/AGENTS.md` is missing on your machine, create it with:

    mkdir -p .ores/agents
    ln -sfn "$HOME/codes/oresoftware/my-ai/AGENTS.md" .ores/agents/AGENTS.md

or run `~/codes/oresoftware/my-ai/scripts/link-repo-agents.sh` once to do it for every git
repository under `~/codes`, and `--check` to verify them.

A missing `.ores/agents/AGENTS.md` is a setup gap on the reader's machine, never a reason to
skip the canonical instructions: fetch them from the URL above instead.

<!-- END ores-agents-pointer -->
