# JS Runtime Status

This document records the formal JavaScript runtime direction for `xs-core-engine`.

## Why this exists

The long-term product path is:

- XQ-side XS exporters
- browser-safe JavaScript runtime
- GitHub-hosted docs and artifact memory
- V2-compliant indicator and trading XS generation

Python may remain in the repository as earlier bootstrap tooling, but new runtime features should prefer JavaScript so future Codex sessions on any machine can continue directly from the GitHub repo.

## Implemented modules

### Data compatibility

- `src/data/legacy-loader.js`
- `src/data/csv-loader.js`
- `src/data/normalize.js`
- `src/data/index.js`

Current responsibilities:

- read legacy `backup/01` whitespace M1 and D1 formats
- read new XQ CSV exports for M1, D1, and daily anchors
- dedupe repeated rows
- normalize `ts14`
- validate basic price and timestamp integrity
- build deterministic `data_signature`

### Artifact memory

- `src/artifacts/naming.js`
- `src/artifacts/store.js`
- `src/artifacts/index.js`
- `src/artifacts/browser-store.js`
- `src/artifacts/repo-store.js`

Current responsibilities:

- build ROC-year artifact ids such as `11504141455`
- build canonical artifact filenames and artifact directory paths
- build canonical repo-backed memory paths under `artifacts/_memory`
- serialize `params.txt` header lines as `key=value,key=value`
- build `summary.json`
- build `artifact_meta.json`
- build `best_params`, `latest_memory`, and `top10` rows
- persist browser-side staging memory for `best_params`, `latest_memory`, and `top10`
- persist bundle snapshots into repo-backed artifact files and formal memory files

## Current gaps

- homepage wiring exists for browser-side data validation, artifact preview, browser-side memory staging, downloaded bundle snapshots, and a local password gate
- no end-to-end renderer yet
- no direct browser-to-GitHub push path yet; current bridge is browser snapshot download plus repo-side persist script
- no browser E2E tests in this workspace

## Immediate next step

Wire the homepage and future generator UI to:

1. keep the homepage validator aligned with `src/data`
2. keep browser-side memory staging aligned with `src/artifacts`
3. connect staged memory to commit/push workflow for GitHub-backed artifact persistence
4. prepare the data needed for the V2 renderer
