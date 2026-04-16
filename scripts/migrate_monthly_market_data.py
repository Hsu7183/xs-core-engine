from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path


def read_non_empty_lines(path: Path) -> list[str]:
    if path.is_dir():
        lines: list[str] = []
        part_paths = sorted(
            child
            for child in path.iterdir()
            if child.is_file()
            and child.suffix.lower() in {".txt", ".csv"}
            and child.name.lower() != "manifest.json"
        )
        for part_path in part_paths:
            lines.extend(read_non_empty_lines(part_path))
        return lines
    return [line.strip() for line in path.read_text(encoding="utf-8", errors="ignore").splitlines() if line.strip()]


def dedupe_lines(lines: list[str]) -> tuple[list[str], int]:
    seen: set[str] = set()
    deduped: list[str] = []
    duplicates_removed = 0

    for line in lines:
        if line in seen:
            duplicates_removed += 1
            continue
        seen.add(line)
        deduped.append(line)

    return deduped, duplicates_removed


def detect_kind(lines: list[str]) -> str:
    if not lines:
        raise ValueError("dataset is empty")
    field_count = len(lines[0].split())
    if field_count == 6:
        return "m1"
    if field_count == 5:
        return "d1"
    raise ValueError(f"unsupported field count: {field_count}")


def month_key(line: str) -> str:
    return line.split()[0][:6]


def first_mismatch_index(old_lines: list[str], new_lines: list[str]) -> int | None:
    overlap = min(len(old_lines), len(new_lines))
    for index in range(overlap):
        if old_lines[index] != new_lines[index]:
            return index
    return None


def merge_lines(old_lines: list[str], new_lines: list[str]) -> dict[str, object]:
    mismatch_index = first_mismatch_index(old_lines, new_lines)
    overlap = min(len(old_lines), len(new_lines))

    if mismatch_index is not None:
        old_line = old_lines[mismatch_index]
        new_line = new_lines[mismatch_index]
        raise ValueError(
            "overlap mismatch detected at row "
            f"{mismatch_index} (month {month_key(old_line)}); "
            "refusing to write new data because the overlapping history does not exactly match. "
            f"stored='{old_line}' new='{new_line}'"
        )

    if mismatch_index is None:
        if len(new_lines) < len(old_lines):
            raise ValueError("new dataset is shorter than stored dataset without mismatch; refusing to truncate")
        merged = old_lines + new_lines[len(old_lines):]
        return {
            "mode": "initialize" if len(old_lines) == 0 else ("append" if len(new_lines) > len(old_lines) else "unchanged"),
            "first_mismatch_index": None,
            "replace_from_month": None,
            "overlap_rows": overlap,
            "merged_lines": merged,
        }
    raise AssertionError("unreachable")


def split_monthly(lines: list[str]) -> dict[str, list[str]]:
    monthly: dict[str, list[str]] = defaultdict(list)
    for line in lines:
        monthly[month_key(line)].append(line)
    return dict(sorted(monthly.items()))


def clean_target_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)
    for child in path.iterdir():
        if child.is_file() and child.suffix.lower() in {".txt", ".json"}:
            child.unlink()


def dataset_range(lines: list[str], kind: str) -> dict[str, object]:
    first = lines[0].split()
    last = lines[-1].split()
    if kind == "m1":
        return {
            "startDate": first[0],
            "startTime": first[1],
            "endDate": last[0],
            "endTime": last[1],
        }
    return {
        "startDate": first[0],
        "endDate": last[0],
    }


def write_monthly_dataset(target_root: Path, kind: str, lines: list[str]) -> dict[str, object]:
    target_dir = target_root / kind
    clean_target_dir(target_dir)
    monthly = split_monthly(lines)
    parts: list[dict[str, object]] = []

    for month, month_lines in monthly.items():
        file_name = f"{month}.txt"
        (target_dir / file_name).write_text("\n".join(month_lines) + "\n", encoding="utf-8")
        parts.append({
            "month": month,
            "file": f"{kind}/{file_name}",
            "rows": len(month_lines),
        })

    manifest = {
        "kind": kind,
        "rows": len(lines),
        "range": dataset_range(lines, kind),
        "parts": parts,
    }
    (target_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


def maybe_write_flat(path_value: str | None, lines: list[str]) -> None:
    if not path_value:
        return
    path = Path(path_value)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Append new XQ M1/D1 data into stored monthly shards only after strict overlap verification."
    )
    parser.add_argument("--old-m1", required=True)
    parser.add_argument("--old-d1", required=True)
    parser.add_argument("--new-m1", required=True)
    parser.add_argument("--new-d1", required=True)
    parser.add_argument("--target-root", required=True)
    parser.add_argument("--write-flat-m1")
    parser.add_argument("--write-flat-d1")
    parser.add_argument("--summary-out")
    args = parser.parse_args()

    old_m1_lines_raw = read_non_empty_lines(Path(args.old_m1))
    old_d1_lines_raw = read_non_empty_lines(Path(args.old_d1))
    new_m1_lines_raw = read_non_empty_lines(Path(args.new_m1))
    new_d1_lines_raw = read_non_empty_lines(Path(args.new_d1))

    old_m1_lines, old_m1_duplicates_removed = dedupe_lines(old_m1_lines_raw)
    old_d1_lines, old_d1_duplicates_removed = dedupe_lines(old_d1_lines_raw)
    new_m1_lines, new_m1_duplicates_removed = dedupe_lines(new_m1_lines_raw)
    new_d1_lines, new_d1_duplicates_removed = dedupe_lines(new_d1_lines_raw)

    if detect_kind(old_m1_lines) != "m1" or detect_kind(new_m1_lines) != "m1":
        raise ValueError("M1 inputs are not minute-bar datasets")
    if detect_kind(old_d1_lines) != "d1" or detect_kind(new_d1_lines) != "d1":
        raise ValueError("D1 inputs are not daily-bar datasets")

    m1_merge = merge_lines(old_m1_lines, new_m1_lines)
    d1_merge = merge_lines(old_d1_lines, new_d1_lines)

    target_root = Path(args.target_root)
    target_root.mkdir(parents=True, exist_ok=True)
    m1_manifest = write_monthly_dataset(target_root, "m1", list(m1_merge["merged_lines"]))
    d1_manifest = write_monthly_dataset(target_root, "d1", list(d1_merge["merged_lines"]))

    maybe_write_flat(args.write_flat_m1, list(m1_merge["merged_lines"]))
    maybe_write_flat(args.write_flat_d1, list(d1_merge["merged_lines"]))

    summary = {
        "target_root": str(target_root),
        "m1": {
            "input": {
                "oldRows": len(old_m1_lines_raw),
                "newRows": len(new_m1_lines_raw),
                "oldDuplicatesRemoved": old_m1_duplicates_removed,
                "newDuplicatesRemoved": new_m1_duplicates_removed,
            },
            "merge": {
                "mode": m1_merge["mode"],
                "firstMismatchIndex": m1_merge["first_mismatch_index"],
                "replaceFromMonth": m1_merge["replace_from_month"],
                "overlapRows": m1_merge["overlap_rows"],
            },
            **m1_manifest,
        },
        "d1": {
            "input": {
                "oldRows": len(old_d1_lines_raw),
                "newRows": len(new_d1_lines_raw),
                "oldDuplicatesRemoved": old_d1_duplicates_removed,
                "newDuplicatesRemoved": new_d1_duplicates_removed,
            },
            "merge": {
                "mode": d1_merge["mode"],
                "firstMismatchIndex": d1_merge["first_mismatch_index"],
                "replaceFromMonth": d1_merge["replace_from_month"],
                "overlapRows": d1_merge["overlap_rows"],
            },
            **d1_manifest,
        },
    }

    if args.summary_out:
        summary_path = Path(args.summary_out)
        summary_path.parent.mkdir(parents=True, exist_ok=True)
        summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
