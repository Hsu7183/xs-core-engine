# Architecture

`xs-core-engine` is a specification-first repository. The repository contract is:

```text
spec -> shared core -> paired XS outputs -> audit
```

## Design principles

- One spec describes one strategy.
- The engine renders two artifacts from the same core contract:
  - indicator output
  - trading output
- The two artifacts must be identical in `C1` to `C5`.
- `C6` is the only layer allowed to differ.

## Layers

### 1. Spec layer

The spec layer describes:

- instrument and timeframe constraints
- history requirements
- daily anchor requirements
- entry conditions
- exit conditions
- output requirements

The machine-readable contract lives in `specs/strategy-spec.schema.json`.

### 2. Safety layer

The safety layer is shared by both outputs and owns:

- environment validation
- history loading
- cross-frequency gating
- previous-day initialization
- `dataReady` gating
- single-execution-per-bar gating
- state transition restrictions

### 3. Core logic layer

The core logic layer owns:

- frozen daily anchors
- minute-level calculations using `[1]` or older data
- entry rules
- exit rules
- state transitions

This layer must remain byte-identical between paired outputs.

### 4. Output layer

The output layer is the only allowed divergence:

- indicator output uses plotting and file logging
- trading output uses `SetPosition(..., MARKET)` and file logging

## Audit strategy

The first repository audit step is structural.

`scripts/verify_xs_pair.py` currently verifies:

- both XS templates contain `C1` through `C6`
- `C1` through `C5` are identical
- required runtime guard snippets exist
- required cross-frequency snippets exist
- indicator `C6` contains plot output
- trading `C6` contains position output

Later phases should add:

- forbidden-token scanning for unsafe current-bar reads
- rendered strategy pair checks across generated outputs
- spec-to-output traceability reports
- compile-time smoke tests where possible

## Planned next steps

1. Import the two reference scripts into `references/`.
2. Extract canonical safety-layer code into a renderer input model.
3. Replace placeholder strategy conditions with spec-driven rendering.
4. Expand the audit script from structural checks to semantic checks.
