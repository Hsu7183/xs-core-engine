# Codex Handoff

Last updated: 2026-04-18

This file is the current cross-device handoff for `xs-core-engine`.
On another computer, ask Codex to read this file first, then continue work.

## 2026-04-18 Data Refresh

- Accepted a new XQ market-data refresh after strict overlap verification and dedupe.
- Imported `M1` through `20260417 131200`, intentionally stopping at the current backtest cutoff instead of waiting for a full-session close.
- Imported `D1` through `20260416`.
- Current bundled snapshot:
  - `M1` rows: `456,328`
  - `D1` rows: `1,524`
- Revalidated the monthly bundle with:
  - `node scripts/validate_data_bundle.mjs --m1 data/bundled/legacy-01/m1 --d1 data/bundled/legacy-01/d1 --m1-format legacy --d1-format legacy --allow-daily-anchor-rebuild --json`
  - result: `ok=true`

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

## 2026-04-16 Data And Export Update

This section records the latest `M1 / D1` migration and export decisions.

### DA Export Decision

- The homepage and verification flow now treat `DA` as derived data.
- Export mode should only expose:
  - `M1`
  - `D1`
- `DA` is no longer needed as a user-facing export/upload artifact.
- Important:
  - internal `DA` derivation is still kept in runtime code through `D1 + M1`
  - do not remove the internal derivation helpers unless the whole verification path is redesigned

### Latest XQ Data Comparison Result

New source files used:

- `C:/XQ/data/M1.txt`
- `C:/XQ/data/D1_XQ_TRUE.txt`

Comparison outcome:

- `D1`
  - overlapping history matched the stored dataset after dedupe
  - safe action: append only the new tail rows
  - latest stored date is now `20260416`
- `M1`
  - overlapping history matched the stored dataset after dedupe
  - accepted import boundary was intentionally truncated to the active backtest cutoff
  - latest stored timestamp is now `20260417 131200`

Current summary:

- `D1` overlap matched and the new tail rows were appended
- `M1` overlap matched after dedupe and the new tail rows were appended through the backtest cutoff
- going forward, overlap mismatch must still stop the import and trigger manual review

### Monthly Split State

To improve persistence and future updates, stored market data was split by month.

Current monthly bundle roots:

- `data/bundled/legacy-01/m1/`
- `data/bundled/legacy-01/d1/`

The same monthly scheme was also propagated to:

- `C:/Users/User/Documents/mqquant/01/bundle/data/m1/`
- `C:/Users/User/Documents/mqquant/01/bundle/data/d1/`
- `C:/xs_optimizer_v1/data/m1/`
- `C:/xs_optimizer_v1/data/d1/`

Homepage bundled data loading now uses the per-dataset `manifest.json` files under those monthly roots, instead of hardcoding every month shard path inside `assets/bundled-data-config.js`.

### Current Latest Counts

After dedupe and migration:

- `M1`: `456,328`
- `D1`: `1,524`

Latest ends:

- `M1`: `20260417 131200`
- `D1`: `20260416`

### Validation Status

Validated after migration:

- `tests/data-validation.test.mjs`: pass
- `tests/trading-code-safety.test.mjs`: pass
- `scripts/validate_data_bundle.mjs` against monthly bundle: `ok=true`
- `mqquant/01` monthly loader: pass
- `mqquant/02` loader: not certified on this machine because its default external source root is missing

### 2026-04-16 Homepage Headless Recheck

Rechecked against the actual rendered homepage DOM with headless Edge after the monthly data migration, using:

- built-in `M1 / D1`
- current homepage default indicator / trading output
- gate slippage `2`
- one explicit `更新並比對` click after unlock

Observed on the rendered homepage:

- compare status: `已算出模擬TXT`
- simulated events: `622`
- top KPI card 1: `1,501,567`
- top KPI card 2: `1,252,767`
- top KPI card 3: `311`

Important:

- these values differ from the older `2026-04-15` verified baseline above
- likely inference: the later `M1` refresh from `202506+` changed replay output, but this has not yet been traced to a specific date slice
- the new lower `期貨 KPI 對照` table is confirmed to render correctly in the `no XQ uploaded yet` state
- a fully automated headless check of the populated `XQ TXT / CSV` path was blocked by browser file-input security, so that part still needs either:
  - a manual browser upload check
  - or a dedicated automation harness that can drive real file chooser behavior

### Important Reminder For The Next Session

If the user asks whether only `M1 / D1` are needed:

- answer: yes, user-facing flow only needs `M1 + D1`
- explain that `DA` is still derived internally and therefore is not a required upload/export target

If the user asks whether the new files matched the old files:

- do not answer "both fully matched"
- answer:
  - `D1` overlap matched
  - `M1` did not remain a pure append from `202506` onward
  - under the current rule, any overlap mismatch must block the write until the source is manually confirmed

## Suggested Prompt On The Next Computer

Tell the next Codex session:

`Read docs/CODEX_HANDOFF.md first, then continue from the current homepage and futures KPI state.`

## 2026-04-16 Cross-Project Audit Before Computer Switch

This audit covered:

- deployed homepage target: `https://hsu7183.github.io/xs-core-engine/`
- local repo: `C:\Users\user\Documents\xs-core-engine`
- sibling projects: `C:\Users\user\Documents\mqquant\01` and `C:\Users\user\Documents\mqquant\02`

### xs-core-engine Sync Status

- local `HEAD`: `086bf73`
- remote `origin/main`: `a3ad44f`
- current state: local branch is `ahead 2`, so the repo is not fully synced to GitHub yet
- the two local-only commits are:
  - `bc23955` `Document monthly bundle workflow and validator updates`
  - `086bf73` `Enforce strict overlap checks for monthly data migration`
- `git diff --name-only origin/main..HEAD` shows only docs / validator / tooling changes:
  - `.gitignore`
  - `assets/workspace-actions.js`
  - `docs/CODEX_HANDOFF.md`
  - `docs/PROJECT_STATE.md`
  - `docs/START_HERE.md`
  - `scripts/migrate_monthly_market_data.py`
  - `scripts/validate_data_bundle.mjs`
  - `src/data/normalize.js`
  - `tests/data-validation.test.mjs`

### Deployed Homepage Reality

`origin/main:index.html` currently references:

- `assets/gate.css?v=20260416p`
- `assets/futures-kpi.js?v=20260416m`
- `assets/home-code-output.js?v=20260416q`

That means the public homepage matches the last pushed homepage package, not the two local-only audit commits above.

### Strategy Logic Comparison

#### xs-core-engine

- this repo is still a spec-first renderer / safety shell, not a confirmed full clone of the legacy `0313plus` runtime
- evidence:
  - `README.md` states the repo targets `two outputs with identical C1-C5 behavior`
  - `README.md` also states the templates are `safe bootstrap shells`
  - `templates/base_indicator.xs` still keeps the real entry / exit rules commented out in `C3` and `C4`
- conclusion:
  - indicator / trading parity inside `xs-core-engine` is a contract goal
  - but its current strategy logic is not the same as the live legacy `01` strategy logic yet

#### mqquant/01

- `mq01/xs_variants.py` is the paired renderer used to derive indicator and trading scripts from the same base XS
- `mq01/services.py` runs `run_0313plus_backtest` and renders trading output with `render_trade_xs`
- `mq01/config.py` points to `strategy/1150415.xs`
- the bundled Python core `bundle/src/strategy/strategy_0313plus.py` hash matches `xs-core-engine/references/legacy-01/python/strategy/strategy_0313plus.py`
- conclusion:
  - `mqquant/01` is the fixed legacy-style 0313plus line
  - its indicator and trading outputs come from the same base logic, with trading only adding execution commands

#### mqquant/02

- `mq02/xs_variants.py` hash matches `mq01/xs_variants.py`, so the indicator / trading rendering layer is the same
- but `mq02/config.py` enables:
  - `allow_template_mutation = True`
  - `exploration_mode = "modular_loop"`
- `mq02/services.py` imports `src.research.modular_0313plus`
- `mq02/bootstrap.py` defaults to `C:\xs_optimizer_v1`
- on this machine, `C:\xs_optimizer_v1` does not exist
- conclusion:
  - `mqquant/02` is not the same fixed strategy line as `mqquant/01`
  - it is a modular research path
  - because its default source root is missing on this machine, full runtime parity with `01` could not be certified today

### Validation Completed Today

- user installed:
  - `node v24.14.1`
  - `npm 11.11.0`
- rerun results:
  - `tests/data-validation.test.mjs`: pass
  - `tests/trading-code-safety.test.mjs`: pass
  - `scripts/validate_data_bundle.mjs --m1 ... --d1 ... --allow-daily-anchor-rebuild`: `ok=true`
- strict overlap tooling:
  - `scripts/migrate_monthly_market_data.py` now rejects any overlap mismatch and refuses to write new data

### Do Not Lose This On The Next Computer

1. `xs-core-engine` local repo is ahead of GitHub by 2 commits and still needs an explicit push decision.
2. Do not push the untracked monthly shard directories until a real XQ export passes strict overlap verification.
3. `mqquant/02` needs a valid source root on the next machine:
   - either restore `C:\xs_optimizer_v1`
   - or set `MQQUANT_SOURCE_ROOT` to a compatible source tree before using `run.cmd`
