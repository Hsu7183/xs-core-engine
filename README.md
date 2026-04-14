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
|-- .github/workflows/spec-guard.yml
|-- docs/
|   |-- ARCHITECTURE.md
|   `-- ENGINE_STANDARD.md
|-- references/
|   `-- README.md
|-- scripts/
|   `-- verify_xs_pair.py
|-- specs/
|   |-- examples/txf-open-exec.example.json
|   `-- strategy-spec.schema.json
`-- templates/xs/
    |-- indicator.template.xs
    `-- trading.template.xs
```

## Bootstrap contents

- `docs/ENGINE_STANDARD.md` is the repository source of truth for runtime and safety rules.
- `docs/ARCHITECTURE.md` describes the contract between spec, safety layer, core logic layer, and output layer.
- `specs/strategy-spec.schema.json` defines the machine-readable strategy contract.
- `templates/xs/*.template.xs` provide paired indicator and trading shells with identical C1-C5 sections.
- `scripts/verify_xs_pair.py` enforces the pair contract and checks required safety snippets.
- `.github/workflows/spec-guard.yml` runs the verifier on every push and pull request.

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
