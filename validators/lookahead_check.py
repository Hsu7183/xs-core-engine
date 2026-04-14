from __future__ import annotations

from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
FILES = [
    ROOT / "templates" / "base_indicator.xs",
    ROOT / "templates" / "base_trading.xs",
]

SECTIONS = [
    (
        "//====================== C3.進場條件 ======================",
        "//====================== C4.出場條件 ======================",
    ),
    (
        "//====================== C4.出場條件 ======================",
        "//====================== C5.狀態更新 ======================",
    ),
]

FORBIDDEN_PRICE_TOKENS = [
    r"(?<!\[)\bClose\b(?!\s*\[)",
    r"(?<!\[)\bHigh\b(?!\s*\[)",
    r"(?<!\[)\bLow\b(?!\s*\[)",
    r"(?<!\[)\bVolume\b(?!\s*\[)",
]

FORBIDDEN_RAW_INDICATORS = [
    r"\bemaFast\b(?!_\d)",
    r"\bemaMid\b(?!_\d)",
    r"\bATRv\b(?!_\d)",
    r"\bvwap\b(?!_\d)",
    r"\bdonHi\b(?!_\d)",
    r"\bdonLo\b(?!_\d)",
    r"\bADXVal\b(?!_\d)",
    r"\bplusDI\b(?!_\d)",
    r"\bminusDI\b(?!_\d)",
    r"\bmacdDIFF\b(?!_\d)",
    r"\bmacdDEA\b(?!_\d)",
    r"\bmacdHist\b(?!_\d)",
    r"\bbbUp\b(?!_\d)",
    r"\bbbDn\b(?!_\d)",
    r"\bbbMid\b(?!_\d)",
    r"\bkcUp\b(?!_\d)",
    r"\bkcDn\b(?!_\d)",
    r"\bkcMid\b(?!_\d)",
]

ALLOWED_SUBSTRINGS = [
    "GetField(",
    "CheckField(",
    "RaiseRunTimeError",
    "raiseRunTimeError",
]


def slice_section(lines: list[str], start_marker: str, end_marker: str) -> list[tuple[int, str]]:
    start_index = next((i for i, line in enumerate(lines) if line.strip() == start_marker), None)
    end_index = next((i for i, line in enumerate(lines) if line.strip() == end_marker), None)

    if start_index is None or end_index is None or end_index <= start_index:
        raise ValueError(f"missing section markers: {start_marker} -> {end_marker}")

    return [(lineno, lines[lineno - 1]) for lineno in range(start_index + 2, end_index + 1)]


def is_comment_or_blank(line: str) -> bool:
    stripped = line.strip()
    return not stripped or stripped.startswith("//")


def has_forbidden_pattern(line: str) -> list[str]:
    if any(token in line for token in ALLOWED_SUBSTRINGS):
        return []

    hits: list[str] = []

    for pattern in FORBIDDEN_PRICE_TOKENS:
        if re.search(pattern, line):
            hits.append(pattern)

    for pattern in FORBIDDEN_RAW_INDICATORS:
        if re.search(pattern, line):
            hits.append(pattern)

    return hits


def main() -> int:
    errors: list[str] = []

    for path in FILES:
        lines = path.read_text(encoding="utf-8").replace("\r\n", "\n").splitlines()

        for start_marker, end_marker in SECTIONS:
            try:
                section_lines = slice_section(lines, start_marker, end_marker)
            except ValueError as exc:
                errors.append(f"{path}: {exc}")
                continue

            for lineno, line in section_lines:
                stripped = line.strip()
                if is_comment_or_blank(stripped):
                    continue

                hits = has_forbidden_pattern(stripped)
                if hits:
                    errors.append(f"{path}:{lineno}: 交易判斷區使用未定錨值 -> {stripped}")

    if errors:
        print("lookahead check failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("lookahead check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
