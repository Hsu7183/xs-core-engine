from __future__ import annotations

from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
INDICATOR = ROOT / "templates" / "base_indicator.xs"
TRADING = ROOT / "templates" / "base_trading.xs"

COMMON_REQUIRED = [
    'if barfreq <> "Min" then',
    'raiseRunTimeError("本腳本僅支援分鐘線");',
    'if BarFreq <> "Min" or BarInterval <> 1 or BarAdjusted then',
    'RaiseRunTimeError("本腳本僅支援非還原 1 分鐘線");',
    'SetBackBar(2);',
    'SetBackBar(SysHistDBars, "D");',
    'SetTotalBar(SysHistMBars);',
    'dailyFieldReady = CheckField("High","D") and CheckField("Low","D") and CheckField("Close","D");',
    'dayRefDate = GetFieldDate("Close","D");',
    'historyReady = CurrentBar > WarmupBars;',
    'crossFrequencyReady = dailyFieldReady and (dayRefDate = Date);',
    'dataReady = calcSession and historyReady and dayInitOk and (dayInitDate = Date) and crossFrequencyReady and indicatorsReady;',
    'if Date <> Date[1] then begin',
    'if (Date <> dayInitDate) and (dayRefDate = Date) then begin',
]

INDICATOR_REQUIRED = [
    'if not headerWritten and TxtPath <> "" then begin',
    'Print(File(TxtPath), outStr);',
    'ts14 = NumToStr(Date, 0) + RightStr("000000" + NumToStr(Time, 0), 6);',
    'Plot1(IFF(currentAction = "新買", Open, 0), "新買");',
    'Plot2(IFF(currentAction = "新賣", Open, 0), "新賣");',
    'Plot3(IFF((currentAction = "平賣") or (currentAction = "平買") or (currentAction = "強制平倉"), Open, 0), "出場");',
]

TRADING_REQUIRED = [
    'Print(File(TxtPath), outStr);',
    'Plot1(IFF(currentAction = "新買", Open, 0), "新買");',
    'SetPosition(0, MARKET);',
    'SetPosition(1, MARKET);',
    'SetPosition(-1, MARKET);',
]

C6_MARKER = "//====================== C6."
MULTI_PRINT_PATTERN = re.compile(r"Print\s*\(\s*File\([^)]*\)\s*,\s*[^,)]+\s*,")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8").replace("\r\n", "\n")


def extract_core(text: str) -> str:
    marker_index = text.find(C6_MARKER)
    if marker_index < 0:
        raise ValueError("C6 marker not found")
    return text[:marker_index].strip()


def missing_required(text: str, required: list[str]) -> list[str]:
    return [item for item in required if item not in text]


def find_multi_prints(text: str) -> list[str]:
    issues: list[str] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("//"):
            continue
        if MULTI_PRINT_PATTERN.search(stripped):
            issues.append(f"line {lineno}: forbidden multi-argument Print(File(...), ...)")
    return issues


def main() -> int:
    errors: list[str] = []

    indicator_text = read_text(INDICATOR)
    trading_text = read_text(TRADING)

    errors.extend(f"{INDICATOR}: missing snippet -> {item}" for item in missing_required(indicator_text, COMMON_REQUIRED + INDICATOR_REQUIRED))
    errors.extend(f"{TRADING}: missing snippet -> {item}" for item in missing_required(trading_text, COMMON_REQUIRED + TRADING_REQUIRED))

    try:
        if extract_core(indicator_text) != extract_core(trading_text):
            errors.append("C1~C5 mismatch between templates/base_indicator.xs and templates/base_trading.xs")
    except ValueError as exc:
        errors.append(str(exc))

    errors.extend(f"{INDICATOR}: {item}" for item in find_multi_prints(indicator_text))
    errors.extend(f"{TRADING}: {item}" for item in find_multi_prints(trading_text))

    if errors:
        print("data-ready check failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("data-ready check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
