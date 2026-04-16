# PROJECT STATE

Last updated: 2026-04-16

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
  - rows: `455,759`
  - latest timestamp: `20260415 132800`
  - refresh behavior: safe replacement from `202506+`
- `D1`
  - rows: `1,522`
  - latest date: `20260414`
  - refresh behavior: overlap matched, safe append

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
4. JS tests and Node-based validation could not be rerun on machines that do not have `node` available on PATH.

## Recommended Next Milestone

Finish confidence on the data and verification side before expanding renderer scope further.

The best next milestone is:

1. Confirm the real upload workflow with actual `XQ TXT / CSV` files in a browser session.
2. Keep the `M1 + D1` monthly bundle flow as the only user-facing market-data path.
3. Continue paired XS renderer and artifact work only after the verification path is considered stable.

## Non-Negotiable Rules

- Use completed data only.
- Decide at bar open and execute at bar open.
- Exit before entry.
- No same-bar reversal.
- No signal carry.
- Daily anchors are frozen on day change and never recalculated intraday.
- C1-C5 behavior must match between indicator and trading outputs.
