export const TS14_PATTERN = /^\d{14}$/;

function toTs14(value) {
    return String(value ?? "").trim();
}

function compareTs14(left, right) {
    const a = toTs14(left);
    const b = toTs14(right);
    if (a === b) {
        return 0;
    }
    return a < b ? -1 : 1;
}

function buildBarKey(row) {
    return [
        row.ts14,
        row.open,
        row.high,
        row.low,
        row.close,
        row.volume ?? "",
        row.source_format ?? "",
    ].join("|");
}

function buildDailyAnchorKey(row) {
    return [
        row.ts14,
        row.prev_high,
        row.prev_low,
        row.prev_close,
        row.day_range,
        row.pp,
        row.r1,
        row.s1,
        row.r2,
        row.s2,
        row.source_format ?? "",
    ].join("|");
}

function normalizeTsFields(row) {
    const ts14 = toTs14(row.ts14);
    return {
        ...row,
        ts14,
        date: Number(ts14.slice(0, 8)),
        time: Number(ts14.slice(8)),
    };
}

function sortByTs14(rows) {
    return [...rows].sort((left, right) => compareTs14(left.ts14, right.ts14));
}

function dedupeRows(rows, keyBuilder) {
    const seen = new Set();
    const deduped = [];
    const duplicates = [];

    rows.forEach((row) => {
        const key = keyBuilder(row);
        if (seen.has(key)) {
            duplicates.push(row);
            return;
        }

        seen.add(key);
        deduped.push(row);
    });

    return { rows: deduped, duplicates };
}

function fnv1aHash(text) {
    let hash = 0x811c9dc5;
    for (const char of String(text)) {
        hash ^= char.codePointAt(0);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
}

function validateTs14(row, index, entityName) {
    const issues = [];
    if (!TS14_PATTERN.test(toTs14(row.ts14))) {
        issues.push({
            code: `${entityName}_invalid_ts14`,
            severity: "error",
            index,
            ts14: row.ts14,
            message: `${entityName} row has invalid ts14.`,
        });
        return issues;
    }

    const derivedDate = Number(String(row.ts14).slice(0, 8));
    const derivedTime = Number(String(row.ts14).slice(8));

    if (Number(row.date) !== derivedDate || Number(row.time ?? 0) !== derivedTime) {
        issues.push({
            code: `${entityName}_date_time_mismatch`,
            severity: "error",
            index,
            ts14: row.ts14,
            message: `${entityName} row date/time does not match ts14.`,
        });
    }

    return issues;
}

function validateBarPrices(row, index, entityName, { requireVolume }) {
    const issues = [];
    const priceFields = ["open", "high", "low", "close"];

    priceFields.forEach((field) => {
        if (!Number.isFinite(Number(row[field]))) {
            issues.push({
                code: `${entityName}_missing_${field}`,
                severity: "error",
                index,
                ts14: row.ts14,
                message: `${entityName} row is missing ${field}.`,
            });
        }
    });

    if (Number(row.high) < Number(row.low)) {
        issues.push({
            code: `${entityName}_high_below_low`,
            severity: "error",
            index,
            ts14: row.ts14,
            message: `${entityName} row has high lower than low.`,
        });
    }

    if (requireVolume && !Number.isFinite(Number(row.volume))) {
        issues.push({
            code: `${entityName}_missing_volume`,
            severity: "error",
            index,
            ts14: row.ts14,
            message: `${entityName} row is missing volume.`,
        });
    }

    if (Number.isFinite(Number(row.volume)) && Number(row.volume) < 0) {
        issues.push({
            code: `${entityName}_negative_volume`,
            severity: "error",
            index,
            ts14: row.ts14,
            message: `${entityName} row has negative volume.`,
        });
    }

    return issues;
}

function validateMonotonicOrder(rows, entityName) {
    const issues = [];
    let previous = null;

    rows.forEach((row, index) => {
        if (previous && compareTs14(previous.ts14, row.ts14) >= 0) {
            issues.push({
                code: `${entityName}_non_monotonic_order`,
                severity: "error",
                index,
                ts14: row.ts14,
                message: `${entityName} rows are not strictly ascending by ts14.`,
            });
        }
        previous = row;
    });

    return issues;
}

function mapPreviousD1Rows(d1Bars) {
    const sorted = sortByTs14(d1Bars).map(normalizeTsFields);
    return sorted;
}

export function dedupeM1Bars(rows) {
    return dedupeRows(sortByTs14(rows).map(normalizeTsFields), buildBarKey);
}

export function dedupeD1Bars(rows) {
    return dedupeRows(sortByTs14(rows).map(normalizeTsFields), buildBarKey);
}

export function dedupeDailyAnchors(rows) {
    return dedupeRows(sortByTs14(rows).map(normalizeTsFields), buildDailyAnchorKey);
}

export function validateM1Bars(rows, { requireVolume = false } = {}) {
    const normalized = sortByTs14(rows).map(normalizeTsFields);
    const issues = [];

    normalized.forEach((row, index) => {
        issues.push(...validateTs14(row, index, "m1"));
        issues.push(...validateBarPrices(row, index, "m1", { requireVolume }));
    });

    issues.push(...validateMonotonicOrder(normalized, "m1"));
    return { rows: normalized, issues };
}

export function validateD1Bars(rows, { requireVolume = false } = {}) {
    const normalized = sortByTs14(rows).map(normalizeTsFields);
    const issues = [];

    normalized.forEach((row, index) => {
        issues.push(...validateTs14(row, index, "d1"));
        issues.push(...validateBarPrices(row, index, "d1", { requireVolume }));
    });

    issues.push(...validateMonotonicOrder(normalized, "d1"));
    return { rows: normalized, issues };
}

export function validateDailyAnchors(rows, { d1Bars = [] } = {}) {
    const normalized = sortByTs14(rows).map(normalizeTsFields);
    const issues = [];
    const sortedD1 = mapPreviousD1Rows(d1Bars);

    normalized.forEach((row, index) => {
        issues.push(...validateTs14(row, index, "daily_anchor"));

        if (Number(row.day_range) !== Number(row.prev_high) - Number(row.prev_low)) {
            issues.push({
                code: "daily_anchor_bad_day_range",
                severity: "error",
                index,
                ts14: row.ts14,
                message: "daily_anchor row day_range does not equal prev_high - prev_low.",
            });
        }

        const previousD1 = [...sortedD1].reverse().find((bar) => Number(bar.date) < Number(row.date));
        if (previousD1) {
            if (
                Number(previousD1.high) !== Number(row.prev_high)
                || Number(previousD1.low) !== Number(row.prev_low)
                || Number(previousD1.close) !== Number(row.prev_close)
            ) {
                issues.push({
                    code: "daily_anchor_d1_mismatch",
                    severity: "error",
                    index,
                    ts14: row.ts14,
                    message: "daily_anchor row does not match previous D1 values.",
                });
            }
        }
    });

    issues.push(...validateMonotonicOrder(normalized, "daily_anchor"));
    return { rows: normalized, issues };
}

export function buildDataSignature(rows, { label = "dataset" } = {}) {
    const normalized = sortByTs14(rows).map(normalizeTsFields);
    const first = normalized[0]?.ts14 ?? "";
    const last = normalized.at(-1)?.ts14 ?? "";
    const sourceFormat = normalized[0]?.source_format ?? "unknown";
    const payload = normalized.map((row) => JSON.stringify(row)).join("\n");
    const hash = fnv1aHash(payload);
    return `${label}|${sourceFormat}|${normalized.length}|${first}|${last}|${hash}`;
}

export function validateDataBundle(
    { m1Bars = [], d1Bars = [], dailyAnchors = [] },
    { requireVolume = false } = {},
) {
    const dedupedM1 = dedupeM1Bars(m1Bars);
    const dedupedD1 = dedupeD1Bars(d1Bars);
    const dedupedAnchors = dedupeDailyAnchors(dailyAnchors);

    const validatedM1 = validateM1Bars(dedupedM1.rows, { requireVolume });
    const validatedD1 = validateD1Bars(dedupedD1.rows, { requireVolume });
    const validatedAnchors = validateDailyAnchors(dedupedAnchors.rows, { d1Bars: validatedD1.rows });

    return {
        m1: {
            rows: validatedM1.rows,
            duplicates: dedupedM1.duplicates,
            issues: validatedM1.issues,
            signature: buildDataSignature(validatedM1.rows, { label: "m1" }),
        },
        d1: {
            rows: validatedD1.rows,
            duplicates: dedupedD1.duplicates,
            issues: validatedD1.issues,
            signature: buildDataSignature(validatedD1.rows, { label: "d1" }),
        },
        dailyAnchors: {
            rows: validatedAnchors.rows,
            duplicates: dedupedAnchors.duplicates,
            issues: validatedAnchors.issues,
            signature: buildDataSignature(validatedAnchors.rows, { label: "daily_anchor" }),
        },
    };
}
