# References

This folder is reserved for upstream reference scripts that define the intended canonical shape of the engine.

Imported references:

- `legacy-01/`
  - curated assets copied out of `backup/01` so the repo keeps the useful strategy, preset, and parser history without depending on the backup tree

Core reference scripts now available inside `legacy-01/strategies/`:

- `0313plus.xs`
  - indicator-side structural reference
- `1150412106.xs`
  - trading-side safety-layer reference

Recommended next action:

- continue mapping any useful safety or structure rules back into `docs/ENGINE_STANDARD.md`
- keep new runtime logic in repo-native JavaScript unless a legacy reference is needed for comparison

The templates in `templates/xs/` should still be treated as safe bootstrap scaffolding rather than final production outputs.
