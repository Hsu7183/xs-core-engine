# Bundled Data

This directory holds repo-native bundled datasets that the current homepage and validation flow may load directly.

Canonical bundled legacy snapshot:

- `data/bundled/legacy-01/M1.txt`
- `data/bundled/legacy-01/D1_XQ_TRUE.txt`

These files were copied out of the old `backup/01/bundle/data/` tree so the project can continue running after `backup/` is removed.

Related preserved references:

- strategy and parser references: `references/legacy-01/`
- imported legacy optimization snapshots: `artifacts/_imports/legacy-01/`

Runtime rule:

- current code should read bundled data from `data/`
- current code should not depend on `backup/` as an execution-time source
