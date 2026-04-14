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

Current responsibilities:

- build ROC-year artifact ids such as `11504141455`
- build canonical artifact filenames and artifact directory paths
- serialize `params.txt` header lines as `key=value,key=value`
- build `summary.json`
- build `artifact_meta.json`
- build `best_params`, `latest_memory`, and `top10` rows

## Current gaps

- no browser UI wiring yet
- no end-to-end renderer yet
- no formal persistence adapter yet
- no browser runtime tests in this workspace

## Immediate next step

Wire the homepage and future generator UI to:

1. parse uploaded legacy or XQ-exported data
2. validate and dedupe before generation
3. create artifact ids and summary records
4. prepare the data needed for the V2 renderer
