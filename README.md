# xs-core-engine

Specification-first engine for TAIFEX 1-minute intraday XS / XScript strategy generation and auditing.

This repository is not a generic code generator. It is a contract-driven engine with one non-negotiable goal:

- one strategy spec
- one shared core logic layer
- two outputs with identical C1-C5 behavior
- zero tolerance for future data, floating values, same-bar double execution, signal carry, or unsafe reads

## Core contract

- Market: TAIFEX futures
- Frequency: non-adjusted 1-minute bars only
- Trading style: intraday day trade only
- Decision model: use completed data only, decide at current bar open, execute at current bar open
- Allowed decision inputs: `[1]` or older data only
- Exit priority: exit before entry
- Same-bar reversal: forbidden
- Signal carry: forbidden
- Daily anchors: frozen once on day change, never recalculated intraday
- Indicator and trading outputs: identical in C1-C5, different in C6 only

## Repository layout

```text
.
|-- assets/
|   |-- home.css
|   `-- home.js
|-- .github/workflows/spec-guard.yml
|-- docs/
|   |-- ARCHITECTURE.md
|   `-- ENGINE_STANDARD.md
|-- index.html
|-- references/
|   `-- README.md
|-- src/
|   |-- artifacts/
|   |   |-- index.js
|   |   |-- naming.js
|   |   `-- store.js
|   `-- data/
|       |-- csv-loader.js
|       |-- index.js
|       |-- legacy-loader.js
|       `-- normalize.js
|-- specs/
|   |-- examples/txf-open-exec.example.json
|   `-- strategy-spec.schema.json
|-- templates/
|   |-- base_indicator.xs
|   |-- base_trading.xs
|   `-- xs/
|       |-- indicator.template.xs
|       `-- trading.template.xs
|-- validators/
|   |-- data_ready_check.py
|   `-- lookahead_check.py
`-- scripts/
    `-- verify_xs_pair.py
```

## Bootstrap contents

- `docs/START_HERE.md` is the first document future Codex sessions should read before continuing work.
- `index.html` is the static workspace homepage for choosing which version or workflow to work on next.
- `docs/HIGHEST_SPEC_V2.md` is the canonical highest spec and supersedes older strategy habits.
- `docs/PROJECT_STATE.md` records the current project status and recommended next milestone.
- `docs/DATA_CONTRACT.md` defines the minimum data contract before optimization or XS generation.
- `docs/ARTIFACT_SCHEMA.md` defines the persisted artifact structure for cross-device GitHub memory.
- `docs/JS_RUNTIME_STATUS.md` records the current JavaScript runtime direction and what is already implemented.
- `docs/ENGINE_STANDARD.md` is the repository source of truth for runtime and safety rules.
- `docs/ARCHITECTURE.md` describes the contract between spec, safety layer, core logic layer, and output layer.
- `docs/DATA_PIPELINE.md` describes how XQ-exported data should flow into the project.
- `docs/BACKUP_01_INTEGRATION.md` explains how `backup/01` should be absorbed as reference rather than law.
- `specs/strategy-spec.schema.json` defines the machine-readable strategy contract.
- `templates/base_indicator.xs` and `templates/base_trading.xs` are the current canonical paired templates.
- `templates/exporters/*.xs` are XQ-side data export scripts for M1, D1, and daily anchor data.
- `src/data/*.js` is the JavaScript data compatibility layer for legacy `01` inputs and new XQ CSV exports.
- `src/artifacts/*.js` is the JavaScript artifact memory layer for artifact ids, file naming, summaries, best params, and leaderboard snapshots.
- `validators/lookahead_check.py` checks that trading logic does not use unsafe current-bar OHLCV references.
- `validators/data_ready_check.py` checks required guardrails and enforces `C1~C5` parity.
- `.github/workflows/spec-guard.yml` runs the new validators on every push and pull request.
- `templates/xs/*.template.xs` and `scripts/verify_xs_pair.py` remain in the repo as earlier bootstrap scaffolding.

## Current assumptions

- The reference source files `0313_DailyMap_Formal_IND_V5` and `1150412106` are not yet in this workspace.
- The templates are intentionally safe bootstrap shells: they default to flat position and require strategy-specific conditions to be filled from a spec.
- The repository is ready for the next phase: importing the reference scripts, extracting canonical safety patterns, and wiring a real renderer.

## First build target

The first engine milestone is:

- consume a single spec
- render paired indicator and trading XS outputs
- prove C1-C5 equality automatically
- block forbidden runtime patterns before a script is accepted

## JS runtime direction

- The formal product path is `HTML/CSS/JS + XS + GitHub artifacts`.
- Python remains only as earlier bootstrap tooling and should not be expanded for new optimization or persistence work.
- New runtime modules should prefer browser-safe JavaScript so future Codex sessions on any machine can continue from the GitHub repo alone.
