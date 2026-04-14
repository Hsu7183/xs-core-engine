from __future__ import annotations

from pathlib import Path

from src.core.models import MinuteBar, DailyBar


def _clean_lines(path: str | Path) -> list[str]:
    p = Path(path)
    text = p.read_text(encoding="utf-8", errors="ignore")
    lines = [line.strip() for line in text.splitlines()]
    return [line for line in lines if line]


def load_m1(path: str | Path) -> list[MinuteBar]:
    rows: list[MinuteBar] = []

    for line in _clean_lines(path):
        parts = line.split()
        if len(parts) != 6:
            continue

        rows.append(
            MinuteBar(
                date=int(parts[0]),
                time=int(parts[1]),
                open=float(parts[2]),
                high=float(parts[3]),
                low=float(parts[4]),
                close=float(parts[5]),
            )
        )

    return rows


def load_d1(path: str | Path) -> list[DailyBar]:
    rows: list[DailyBar] = []

    for line in _clean_lines(path):
        parts = line.split()
        if len(parts) != 5:
            continue

        rows.append(
            DailyBar(
                date=int(parts[0]),
                open=float(parts[1]),
                high=float(parts[2]),
                low=float(parts[3]),
                close=float(parts[4]),
            )
        )

    return rows