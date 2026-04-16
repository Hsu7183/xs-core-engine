# START HERE

Last updated: 2026-04-16

This file is the clean entry point for future Codex sessions.
Read it first when resuming work in this repository.

## Read Order

1. `docs/CODEX_HANDOFF.md`
2. `README.md`
3. `index.html`
4. `docs/HIGHEST_SPEC_V2.md`
5. `docs/ENGINE_STANDARD.md`

Then branch based on the task:

- Homepage / verification work:
  - `assets/home-code-output.js`
  - `assets/futures-kpi.js`
  - `assets/bundled-data-ui.js`
  - `assets/xq-upload-helpers.js`
- Data refresh / bundle work:
  - `docs/DATA_CONTRACT.md`
  - `src/data/normalize.js`
  - `scripts/validate_data_bundle.mjs`
  - `scripts/migrate_monthly_market_data.py`
- XS generation / renderer work:
  - `templates/base_indicator.xs`
  - `templates/base_trading.xs`
  - `docs/ARCHITECTURE.md`
  - `docs/ARTIFACT_SCHEMA.md`

## Current Reality

- The product path is browser-first:
  - HTML / CSS / JS homepage
  - XS outputs
  - Git-backed artifacts and repo memory
- User-facing data flow now needs only `M1 + D1`.
- `DA` remains an internal derived layer and is not a required upload/export target.
- Built-in market data is stored as monthly shards under:
  - `data/bundled/legacy-01/m1/`
  - `data/bundled/legacy-01/d1/`
- Homepage bundle loading now resolves shard files from each dataset's `manifest.json` instead of hardcoding every month path.

## Current Data Snapshot

- `M1` rows: `455,759`
- `M1` latest timestamp: `20260415 132800`
- `D1` rows: `1,522`
- `D1` latest date: `20260414`

Important historical note:

- `D1` overlap matched and was safely appended.
- `M1` was not a pure append from `202506` onward, so later months were safely refreshed.

## Homepage Status

- Unlock flow is:
  1. password
  2. single-side slippage
  3. homepage unlock
- Built-in `M1 / D1` plus the default strategy auto-run after unlock.
- The top KPI block uses futures-style theory vs actual-with-slippage calculations.
- The lower comparison area now includes a futures KPI comparison table for simulation vs XQ-derived metrics.

## How To Run

Use:

- `start-local-site.cmd`

Then open:

- `http://127.0.0.1:8765/index.html`

Do not use `file:///.../index.html` for normal testing because bundled text fetches will be blocked by the browser.

## Practical Reminders

- Prefer JavaScript for new runtime logic. Do not expand Python for new product-side workflow unless it is clearly tooling-only.
- Do not answer "M1 and D1 fully matched" for the latest refresh.
- If asked whether only `M1 / D1` are needed, answer yes for the user-facing flow and explain that `DA` is still derived internally.
- Check for existing uncommitted changes before making assumptions about the worktree.

## Recommended Next Step

If no more specific user request is given, continue from one of these:

1. Manual browser verification of the populated `XQ TXT / CSV` upload path.
2. Automation for real file-input upload checks.
3. Resume spec-first paired XS renderer work on top of the now-stable monthly data path.
