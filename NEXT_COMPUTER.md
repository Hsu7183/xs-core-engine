# NEXT COMPUTER

Last updated: 2026-04-16

This folder can be copied directly to a new Windows machine.

## Copy Rule

Copy the entire folder:

- `C:\Users\user\Documents\xs-core-engine`

Important:

- keep hidden files, especially `.git`
- keep local-only monthly shard files under:
  - `data/bundled/legacy-01/m1/`
  - `data/bundled/legacy-01/d1/`
  - `data/bundled/legacy-01/migration-summary.json`

Those monthly shard files are intentionally still local-only and were not pushed to GitHub.

## Current Git State

- local `HEAD`: `af973c3`
- `origin/main`: `af973c3`
- repo sync status: synced

## Read Order On The New Computer

1. `NEXT_COMPUTER.md`
2. `docs/CODEX_HANDOFF.md`
3. `docs/START_HERE.md`
4. `README.md`

## What Is Already Verified

- homepage runtime package is already on GitHub
- Node-based validation was rerun successfully on 2026-04-16
- strict monthly overlap protection is implemented in:
  - `scripts/migrate_monthly_market_data.py`

## First Checks On The New Computer

Open `cmd` and run:

```cmd
cd /d C:\Users\user\Documents\xs-core-engine
git status
node -v
npm -v
```

Expected:

- `git status` should show the repo on `main`
- `node` and `npm` should both print versions

## How To Open The Homepage

Use:

```cmd
cd /d C:\Users\user\Documents\xs-core-engine
start-local-site.cmd
```

Then open:

- `http://127.0.0.1:8765/index.html`

Do not use `file:///.../index.html`.

## Important Strategy Notes

- `xs-core-engine` is not yet a confirmed full clone of legacy `mqquant/01` runtime logic
- it is still a spec-first paired renderer / safety shell
- real entry / exit conditions in `templates/base_indicator.xs` and `templates/base_trading.xs` are still bootstrap placeholders

## Data Refresh Rule

If new market data is imported later:

- overlap with old stored data must match exactly
- if overlap differs, stop and do not write
- only new tail rows may be appended after exact overlap verification

## If A New Codex Session Starts Here

Tell it:

`Read NEXT_COMPUTER.md first, then docs/CODEX_HANDOFF.md, then continue from the current homepage and monthly-data validation state.`
