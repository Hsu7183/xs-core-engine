# XS Core Engine Standard

This document is the normative standard for `xs-core-engine`.

## 1. Purpose

The engine exists to generate and audit XS / XScript strategies for TAIFEX 1-minute intraday day trading under a strict specification-first model.

The engine must guarantee:

- indicator output and trading output are behaviorally identical except for the output layer
- no future-value access
- no floating-value dependence
- no same-bar double execution
- no signal accumulation or delayed carry
- backtestability, live-tradability, and deterministic historical replay
- no `(1401)` due to missing or uninitialized data

## 2. Fixed operating scope

- Instrument: TAIFEX futures
- Bar frequency: 1-minute
- Bar adjustment: non-adjusted only
- Position style: day trade only
- Language target: pure XS / XScript

## 3. Required environment guard

Every generated output must enforce the following runtime guard:

```xs
if BarFreq <> "Min" or BarInterval <> 1 or BarAdjusted then
    RaiseRunTimeError("本腳本僅支援非還原 1 分鐘線");
```

## 4. Required execution model

The only valid execution model is:

- use completed data only
- decide at current bar open
- execute at current bar open

The following are mandatory:

- all trade decisions use `[1]` or older data only
- current-bar `Close`, `High`, `Low`, and `Volume` are not allowed in decision logic
- one execution pass per bar only
- exit logic must run before entry logic
- same-bar reversal is forbidden
- signals cannot accumulate across bars

## 5. Data safety contract

Before any entry or exit logic is allowed to run, `dataReady` must be true.

`dataReady` must require all of the following:

1. `CurrentBar > warmupBars`
2. previous-day initialization completed successfully
3. daily fields are readable via `CheckField`
4. `dayInitDate = Date`
5. cross-frequency data is complete
6. all indicator values are safe to read

If any condition is false:

- no entry decision
- no exit decision
- no position transition

## 6. `(1401)` failure definition

Any strategy that reads a non-existent or uninitialized value at runtime and causes XQ to emit `(1401)` is rejected as non-compliant.

## 7. Cross-frequency rules

Daily data access must be protected by:

```xs
CheckField("Close","D")
GetFieldDate("Close","D")
```

`GetField("Close","D")[1]` is only allowed when:

```xs
dayRefDate = Date
```

## 8. History loading rules

Every generated output must establish history depth with:

```xs
SetBackBar(2);
SetBackBar(SysHistDBars, "D");
SetTotalBar(SysHistMBars);
```

And the engine must guarantee:

- `SysHistDBars >= max daily requirement`
- `SysHistMBars >= minute-bar requirement`

## 9. Daily anchor rules

All daily indicators must be frozen once on day change and reused intraday without recalculation.

This applies to:

- MA / EMA
- Donchian
- ATR
- CDP / NH / NL

The engine must reject any design that recalculates a daily anchor intraday.

## 10. Output parity rules

Sections `C1` through `C5` must be exactly identical across indicator and trading outputs, including:

- parameters
- environment checks
- data access
- daily anchor initialization
- entry conditions
- exit conditions
- state machine

Only `C6` may differ.

Allowed `C6` content:

- indicator output: `Plot`, `Print(File(...), outStr)`
- trading output: `SetPosition(..., MARKET)`, `Print(File(...), outStr)`

Forbidden:

- indicator output missing a safety layer that trading output contains
- different initialization timing between outputs
- different warmup rules between outputs
- different entry or exit conditions between outputs

## 11. Position semantics

- `Position` means strategy target position
- `Filled` means actual account fill position

They must never be mixed.

## 12. TXT output rules

The first line may be written once only and must be a single CSV-like `key=value` line.

```text
key=value,key=value,...
```

Every following line must use:

```text
YYYYMMDDhhmmss price action
```

Required printing pattern:

```xs
outStr = "...";
Print(File(path), outStr);
```

Forbidden:

```xs
Print(File(...), a, b, c)
```

## 13. Mandatory strategy structure

All outputs must use the fixed section layout:

- `C1` Parameters
- `C2` Indicator Calculation
- `C3` Entry Conditions
- `C4` Exit Conditions
- `C5` State Update
- `C6` Output

## 14. Reference intent

The engine is designed to absorb:

- `0313_DailyMap_Formal_IND_V5` as the core structure reference
- `1150412106` trading output as the safety-layer reference

Until those files are imported into this repository, the current templates remain a safe bootstrap layer rather than the final canonical implementation.

## 15. Engineering formula

The engine architecture is fixed:

```text
strategy = core logic layer + safety layer + output layer
```

Rules:

- core logic layer must remain identical across both outputs
- safety layer must be shared across both outputs
- output layer is the only allowed difference
