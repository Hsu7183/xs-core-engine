from __future__ import annotations

import argparse
import pathlib
import re
import sys


SECTION_MARKERS = [
    "C1",
    "C2",
    "C3",
    "C4",
    "C5",
    "C6",
]

REQUIRED_SNIPPETS = [
    'SetBackBar(2);',
    'SetBackBar(SysHistDBars, "D");',
    'SetTotalBar(SysHistMBars);',
    'if BarFreq <> "Min" or BarInterval <> 1 or BarAdjusted then',
    'RaiseRunTimeError("本腳本僅支援非還原 1 分鐘線");',
    'CheckField("Close", "D")',
    'GetFieldDate("Close", "D")',
    'GetField("Close", "D")[1]',
    'CurrentBar > WarmupBars',
    'dayInitDate = Date',
    'dayRefDate = Date',
    'dataReady = historyReady and dayInitOk and dayInitDate = Date and dailyFieldReady and crossFrequencyReady and indicatorsReady;'
]

EXECUTABLE_PRINT_PATTERN = re.compile(r"\bPrint\s*\(")
EXECUTABLE_PLOT_PATTERN = re.compile(r"\bPlot\d+\s*\(")
EXECUTABLE_SETPOSITION_PATTERN = re.compile(r"\bSetPosition\s*\(")


def read_text(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8").replace("\r\n", "\n")


def extract_sections(text: str) -> dict[str, str]:
    lines = text.splitlines()
    indices: dict[str, int] = {}

    for index, line in enumerate(lines):
        stripped = line.strip()
        for marker in SECTION_MARKERS:
            if stripped.startswith(f"// {marker} "):
                indices[marker] = index

    missing = [marker for marker in SECTION_MARKERS if marker not in indices]
    if missing:
        raise ValueError(f"missing section markers: {', '.join(missing)}")

    ordered = sorted(indices.items(), key=lambda item: item[1])
    sections: dict[str, str] = {}

    for offset, (marker, start) in enumerate(ordered):
        end = ordered[offset + 1][1] if offset + 1 < len(ordered) else len(lines)
        body = "\n".join(lines[start:end]).strip()
        sections[marker] = body

    return sections


def ensure_required_snippets(text: str) -> list[str]:
    return [snippet for snippet in REQUIRED_SNIPPETS if snippet not in text]


def executable_lines(text: str, pattern: re.Pattern[str]) -> list[int]:
    lines: list[int] = []
    for lineno, raw_line in enumerate(text.splitlines(), start=1):
        active = raw_line.split("//", 1)[0].strip()
        if active and pattern.search(active):
            lines.append(lineno)
    return lines


def compare_core(indicator_sections: dict[str, str], trading_sections: dict[str, str]) -> list[str]:
    problems: list[str] = []

    for marker in SECTION_MARKERS[:-1]:
        if indicator_sections[marker] != trading_sections[marker]:
            problems.append(f"{marker} differs between indicator and trading templates")

    return problems


def ensure_output_contract(indicator_c6: str, trading_c6: str) -> list[str]:
    problems: list[str] = []

    indicator_prints = executable_lines(indicator_c6, EXECUTABLE_PRINT_PATTERN)
    indicator_plots = executable_lines(indicator_c6, EXECUTABLE_PLOT_PATTERN)
    indicator_positions = executable_lines(indicator_c6, EXECUTABLE_SETPOSITION_PATTERN)
    trading_prints = executable_lines(trading_c6, EXECUTABLE_PRINT_PATTERN)
    trading_plots = executable_lines(trading_c6, EXECUTABLE_PLOT_PATTERN)
    trading_positions = executable_lines(trading_c6, EXECUTABLE_SETPOSITION_PATTERN)

    if not indicator_plots:
        problems.append("indicator C6 must contain Plot output")
    if not indicator_prints:
        problems.append("indicator C6 must contain Print(File(...), outStr) output")
    if indicator_positions:
        problems.append("indicator C6 must not contain SetPosition")

    if not trading_positions:
        problems.append("trading C6 must contain SetPosition(..., MARKET)")
    if trading_prints:
        problems.append("trading C6 must not contain executable Print(File(...), ...) output")
    if trading_plots:
        problems.append("trading C6 must not contain Plot output")

    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify XS indicator/trading template parity.")
    parser.add_argument("--indicator", required=True, type=pathlib.Path)
    parser.add_argument("--trading", required=True, type=pathlib.Path)
    args = parser.parse_args()

    indicator_text = read_text(args.indicator)
    trading_text = read_text(args.trading)

    problems: list[str] = []
    problems.extend(f"indicator missing required snippet: {item}" for item in ensure_required_snippets(indicator_text))
    problems.extend(f"trading missing required snippet: {item}" for item in ensure_required_snippets(trading_text))

    try:
        indicator_sections = extract_sections(indicator_text)
        trading_sections = extract_sections(trading_text)
    except ValueError as exc:
        print(f"verification failed: {exc}", file=sys.stderr)
        return 1

    problems.extend(compare_core(indicator_sections, trading_sections))
    problems.extend(ensure_output_contract(indicator_sections["C6"], trading_sections["C6"]))

    if problems:
        print("verification failed:", file=sys.stderr)
        for problem in problems:
            print(f"- {problem}", file=sys.stderr)
        return 1

    print("xs pair verification passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
