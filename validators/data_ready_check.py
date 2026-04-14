#!/usr/bin/env python3
"""Check required guardrails for data readiness and output format."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
FILES = [ROOT / "templates" / "base_indicator.xs", ROOT / "templates" / "base_trading.xs"]

COMMON_REQUIRED = [
    'if barfreq <> "Min" then',
    'raiseRunTimeError("本腳本僅支援分鐘線")',
    'SetBackBar(2);',
    'SetBackBar(SysHistDBars, "D");',
    'SetTotalBar(SysHistMBars);',
    'dayRefDate = GetFieldDate("Close", "D");',
    'dataReady = (dayInitDate = Date)',
    'if dataReady and (lastMarkBar <> CurrentBar) then begin',
]

INDICATOR_REQUIRED = [
    'outStr = "DonLen="',
    'Print(File(OutputPath), outStr);',
    'RightStr("000000" + NumToStr(Time, 0), 6)',
]


def check_file(path: Path, required: list[str]) -> list[str]:
    text = path.read_text(encoding="utf-8")
    return [r for r in required if r not in text]


def main() -> int:
    failed = False
    for path in FILES:
        required = COMMON_REQUIRED.copy()
        if path.name == "base_indicator.xs":
            required += INDICATOR_REQUIRED
        missing = check_file(path, required)
        if missing:
            failed = True
            print(f"{path} missing {len(missing)} snippets:")
            for item in missing:
                print(f"- {item}")
        else:
            print(f"{path}: guardrails passed.")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
