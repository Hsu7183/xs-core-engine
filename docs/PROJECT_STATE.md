# PROJECT STATE

Last updated: 2026-04-18

## Summary

`xs-core-engine` is a specification-first repository for generating and auditing paired XS outputs against a strict shared-core contract.

The current working repository is no longer dependent on the old `backup/01` tree at runtime.
Useful legacy materials have already been imported into repo-owned locations.

## What Is Stable Now

- Browser-first homepage workflow is active in `index.html`.
- Built-in `M1 / D1` market data is bundled inside the repo.
- Bundled market data is stored by month, not as single giant flat files.
- Homepage bundle loading is manifest-driven:
  - `data/bundled/legacy-01/m1/manifest.json`
  - `data/bundled/legacy-01/d1/manifest.json`
- Homepage top KPI uses futures-style theory and actual-with-slippage calculations.
- Lower comparison UI includes a futures KPI comparison table for simulation vs XQ-derived results.
- User-facing export flow now exposes only `M1` and `D1`.
- Internal `DA` derivation still exists and should not be removed casually.

## Data State

- `M1`
  - rows: `456,328`
  - latest timestamp: `20260417 131200`
  - accepted import boundary: truncated to the active backtest cutoff instead of a full-session close
  - refresh behavior: future writes must pass strict overlap verification before appending any new tail rows
- `D1`
  - rows: `1,524`
  - latest date: `20260416`
  - refresh behavior: overlap must match exactly, then append only the new tail rows

## Audit Note Before Computer Switch

- `xs-core-engine` local repo is currently ahead of `origin/main` by 2 commits:
  - `bc23955` `Document monthly bundle workflow and validator updates`
  - `086bf73` `Enforce strict overlap checks for monthly data migration`
- the deployed homepage still corresponds to the last pushed homepage package on `origin/main`
- those local-only commits do not change the current homepage runtime bundle; they change docs, validation, normalization, and monthly migration tooling
- `mqquant/01` and `mqquant/02` should not be described as identical strategy lines:
  - `mqquant/01` is the fixed legacy 0313plus optimizer / exporter line
  - `mqquant/02` is the modular research line with template mutation enabled
- `xs-core-engine` should not yet be described as fully logic-identical to `mqquant/01`
  - it is still a spec-first paired renderer shell whose base templates keep real entry / exit conditions commented until a spec fills them

## Main Files To Trust

- `docs/CODEX_HANDOFF.md`
- `README.md`
- `docs/HIGHEST_SPEC_V2.md`
- `docs/ENGINE_STANDARD.md`
- `docs/DATA_CONTRACT.md`
- `assets/home-code-output.js`
- `assets/bundled-data-ui.js`
- `src/data/normalize.js`

## Known Gaps

1. The populated `XQ TXT / CSV` upload path still needs a reliable end-to-end browser verification pass.
2. A fully automated file-input harness is still desirable if we want repeatable homepage verification.
3. Some legacy strings outside the current visible homepage path may still deserve cleanup.
4. `mqquant/02` depends on an external source root and could not be fully certified on this machine because its default `C:\xs_optimizer_v1` path is absent.
5. DailyAnchor rows are still rebuilt separately; the current monthly `M1 + D1` bundle is valid, but anchor regeneration remains an explicit follow-up step after refresh.

## Recommended Next Milestone

Finish confidence on the data and verification side before expanding renderer scope further.

The best next milestone is:

1. Confirm the real upload workflow with actual `XQ TXT / CSV` files in a browser session.
2. Keep the `M1 + D1` monthly bundle flow as the only user-facing market-data path.
3. Decide whether to push the two local-only audit / validator commits to GitHub.
4. Continue paired XS renderer and artifact work only after the verification path is considered stable.

## Non-Negotiable Rules

- Use completed data only.
- Decide at bar open and execute at bar open.
- Exit before entry.
- No same-bar reversal.
- No signal carry.
- Daily anchors are frozen on day change and never recalculated intraday.
- C1-C5 behavior must match between indicator and trading outputs.
