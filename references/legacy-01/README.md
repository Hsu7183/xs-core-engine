# Legacy 01 References

This folder preserves the high-signal parts of `backup/01` that are still useful after the backup tree is deleted.

Included here:

- `strategies/0313plus.xs`
  - legacy indicator-side strategy reference
- `strategies/1150412106.xs`
  - legacy trading-side structure and safety-layer reference
- `param-presets/0313plus.txt`
  - optimization search range snapshot
- `python/data/*.py`
  - legacy Python loader and dedupe logic for comparison against the current JavaScript data layer
- `python/backtest/*.py`
  - legacy trade-compare and performance report helpers
- `python/strategy/*.py`
  - legacy Python backtest logic for `0313plus`
- `python/research/*.py`
  - legacy parameter-space, XS rendering, and policy helper references
- `python/xs/xs_input_parser.py`
  - legacy XS input parser
- `python/mq01/xs_variants.py`
  - legacy indicator/trading XS output helper
- `python/latest_run_memory.py`
  - legacy optimization memory snapshot helper

Not imported as active runtime:

- `backup/01/mq01/` full UI, worker, and job-store stack
- full legacy research loop as an execution dependency
- any `__pycache__` output

Usage rule:

- treat everything here as historical reference material
- do not wire new product runtime code to these Python modules directly
- prefer the current repo-native JavaScript runtime under `src/`, `assets/`, and `artifacts/`
