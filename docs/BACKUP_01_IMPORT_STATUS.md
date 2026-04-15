# BACKUP 01 Import Status

This document records what has already been absorbed from `backup/01` into first-class repo paths.

## Imported runtime assets

- `data/bundled/legacy-01/M1.txt`
- `data/bundled/legacy-01/D1_XQ_TRUE.txt`

These are the bundled legacy data files that the homepage may use directly. The current project should load them from `data/`, not from `backup/`.

## Imported reference logic

- `references/legacy-01/strategies/0313plus.xs`
- `references/legacy-01/strategies/1150412106.xs`
- `references/legacy-01/param-presets/0313plus.txt`
- `references/legacy-01/python/`

The Python files under `references/legacy-01/python/` are preserved as historical reference material only. They are useful for tracing loader behavior, backtest math, XS parsing, and old rendering rules, but they are not the current runtime.

## Imported historical outputs

- canonical imported artifact:
  - `artifacts/11504130952/`
- current repo memory snapshot seeded from that legacy export:
  - `artifacts/_memory/best_params.json`
  - `artifacts/_memory/latest_memory.json`
  - `artifacts/_memory/top10.json`
  - `artifacts/_memory/top10.csv`
- raw legacy optimization snapshots:
  - `artifacts/_imports/legacy-01/optimization/`
- raw legacy export folder:
  - `artifacts/_imports/legacy-01/exports/20260413_095218_0313_DailyMap_Formal_IND_V5_c02eb130/`

Notes:

- the original legacy export `summary.json` is malformed because one encoded string is broken
- a normalized repo-safe copy is stored as `summary.normalized.json` in the imported export folder

## Intentionally not imported as active dependencies

- `backup/01/mq01/` full UI and worker runtime
- legacy job-store files in `bundle/run_history/mq01_jobs/`
- `__pycache__` files
- absolute-path wrappers that point outside this repo

## Cleanup rule

After these imports, deleting `backup/` should not break the current homepage, bundled data loading, or artifact memory flow.

If future work still needs something from the old backup tree, it should be copied into a formal repo path first, not read in place from `backup/`.
