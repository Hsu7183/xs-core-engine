# Codex Handoff

Last updated: 2026-04-15

This file is the current cross-device handoff for `xs-core-engine`.
On another computer, ask Codex to read this file first, then continue work.

## What Changed Today

- Pulled useful assets out of the old `backup/01` tree into repo-owned locations:
  - `data/bundled/legacy-01/`
  - `references/legacy-01/`
  - `artifacts/11504130952/`
  - `artifacts/_imports/legacy-01/`
  - `artifacts/_memory/`
- Removed the runtime dependency on `backup/01`, then deleted the `backup/` tree from the repo worktree.
- Added local startup scripts:
  - `start-local-site.cmd`
  - `scripts/start-local-site.ps1`
- Changed the homepage unlock flow:
  - password first
  - slippage input second
  - then enter homepage
- Hid the noisy unlock copy and removed the back button from the gate flow.
- Updated homepage upload cards so the repo-bundled `M1 / D1` data and default strategy outputs show up as built-in sources.
- Renamed the upload label from `XQ交易明細` to `交易明細`.
- Hid the visible `本金 / 每點價值 / 每邊成本點數` controls from the homepage while still letting the runtime use them internally.
- Kept `02 新策略配對` as a real strategy variation path, not just a view switch.
- Added direct `XQ TXT / CSV` parsing support through:
  - `assets/xq-upload-helpers.js`
- Added a futures-style KPI engine through:
  - `assets/futures-kpi.js`
- Switched the top homepage KPI block to futures-style `theory / actual-with-slippage` logic instead of the old simplified block.

## Current Homepage Behavior

Homepage file:

- `index.html`

Main homepage logic:

- `assets/home-code-output.js`
- `assets/futures-kpi.js`
- `assets/xq-upload-helpers.js`
- `assets/bundled-data-ui.js`
- `assets/bundled-strategy-ui.js`
- `assets/gate-standalone.js`
- `assets/gate.css`

Current flow:

1. Open local site.
2. Enter password.
3. Enter single-side slippage.
4. Homepage unlocks.
5. Built-in `M1 / D1` plus default strategy output auto-run.
6. Homepage top KPI now shows:
   - theory net profit
   - actual net profit with slippage
   - trade count
7. The lower verification area still compares simulated events against uploaded `XQ TXT / CSV`.

## Verified Baseline

Verified on 2026-04-15 with the built-in `M1 / D1`, homepage default strategy, and login slippage `2`.

- Simulated events: `604`
- Simulated trades: `302`
- Theory net profit: `1,302,952`
- Actual net profit: `1,061,352`
- Theory return: `130.3%`
- Actual return: `106.1%`
- Max drawdown amount:
  - theory: `-118,622`
  - actual: `-133,137`
- Fee total: `-27,180`
- Tax total: `-51,468`
- Slippage total: `-241,600`

These values were verified with a headless browser against the actual rendered homepage DOM, not just by reading code.

## KPI Logic Now Used

The homepage top KPI is now futures-style.

Theory side:

- gross = points * pointValue * quantity
- fee = feePerSide * 2 * quantity
- tax = round(entryPrice * pointValue * taxRate * quantity) + round(exitPrice * pointValue * taxRate * quantity)
- theoryPnl = gross - fee - tax

Actual side:

- slipCost = slipPerSide * 2 * pointValue * quantity
- actualPnl = theoryPnl - slipCost

Important:

- `XQ CSV / TXT` is currently used mainly as a validation source.
- The homepage top KPI still displays the program-simulated futures KPI, not raw XQ KPI.

## Important Files To Read Next Time

Start with these files:

- `docs/CODEX_HANDOFF.md`
- `README.md`
- `index.html`
- `assets/home-code-output.js`
- `assets/futures-kpi.js`
- `assets/xq-upload-helpers.js`
- `assets/gate-standalone.js`

Reference / imported legacy materials:

- `data/bundled/legacy-01/`
- `references/legacy-01/`
- `artifacts/11504130952/`
- `artifacts/_imports/legacy-01/`
- `artifacts/_memory/`

## How To Run Locally

Use:

- `start-local-site.cmd`

Then open:

- `http://127.0.0.1:8765/index.html`

If the browser looks stale, do:

- `Ctrl+F5`

Do not use `file:///.../index.html` for normal testing because the browser will block bundled text-file fetches.

## Known Follow-Ups

- The lower XQ comparison panel still uses the older verification presentation and can be further aligned with the new futures KPI format.
- Some older docs in `docs/START_HERE.md` and `docs/PROJECT_STATE.md` show mojibake / encoding corruption and should be cleaned later.
- Some legacy source strings outside the visible current homepage path may still need encoding cleanup.

## Suggested Prompt On The Next Computer

Tell the next Codex session:

`Read docs/CODEX_HANDOFF.md first, then continue from the current homepage and futures KPI state.`
