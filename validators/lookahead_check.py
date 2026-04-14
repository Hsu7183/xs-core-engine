#!/usr/bin/env python3
"""Static checks for XScript templates under V2 policy."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
FILES = [ROOT / "templates" / "base_indicator.xs", ROOT / "templates" / "base_trading.xs"]

# Only inspect decision/trigger lines to avoid false positives in indicator calculations.
DECISION_PREFIX = ("if ", "else if ", "LongEntrySig =", "LongExitTrig =", "ForceExitTrig =")
FORBIDDEN_UNINDEXED = [r"\bClose\b", r"\bHigh\b", r"\bLow\b", r"\bVolume\b"]
ALLOWED_SNIPPETS = [
    "Close[",
    "High[",
    "Low[",
    "Volume[",
    "GetField(",
    "CheckField(",
    "RaiseRunTimeError",
]


def is_decision_line(line: str) -> bool:
    s = line.strip()
    return any(s.startswith(p) for p in DECISION_PREFIX)


def has_forbidden_token(line: str) -> bool:
    if any(x in line for x in ALLOWED_SNIPPETS):
        return False
    return any(re.search(pat, line) for pat in FORBIDDEN_UNINDEXED)


def main() -> int:
    errors = []
    for file in FILES:
        for lineno, line in enumerate(file.read_text(encoding="utf-8").splitlines(), start=1):
            s = line.strip()
            if not s or s.startswith("//"):
                continue
            if is_decision_line(s) and has_forbidden_token(s):
                errors.append(f"{file}:{lineno}: decision line uses unindexed OHLCV -> {s}")

    if errors:
        print("Lookahead check failed:")
        for e in errors:
            print(f"- {e}")
        return 1

    print("Lookahead check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
