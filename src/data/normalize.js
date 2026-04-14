export const TS14_PATTERN = /^\d{14}$/;

const EPSILON = 1e-9;
const KNOWN_SOURCE_FORMATS = {
    m1: new Set(["legacy_m1", "xq_m1_csv"]),
    d1: new Set(["legacy_d1", "xq_d1_csv"]),
    daily_anchor: new Set(["xq_daily_anchor_csv", "derived_daily_anchor"]),
};

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

function encodeUtf8(text) {
    const input = String(text ?? "");
    if (typeof TextEncoder !== "undefined") {
        return new TextEncoder().encode(input);
    }

    const encoded = unescape(encodeURIComponent(input));
    return Uint8Array.from(encoded, (char) => char.charCodeAt(0));
}

function rotateLeft32(value, shift) {
    return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function sha1Hex(text) {
    const bytes = encodeUtf8(text);
    const bitLength = bytes.length * 8;
    const paddedLength = (((bytes.length + 9 + 63) >> 6) << 6);
    const padded = new Uint8Array(paddedLength);
    const schedule = new Uint32Array(80);

    padded.set(bytes);
    padded[bytes.length] = 0x80;

    let remainingBits = bitLength;
    for (let index = 0; index < 8; index += 1) {
        padded[padded.length - 1 - index] = remainingBits & 0xff;
        remainingBits = Math.floor(remainingBits / 0x100);
    }

    let h0 = 0x67452301;
    let h1 = 0xefcdab89;
    let h2 = 0x98badcfe;
    let h3 = 0x10325476;
    let h4 = 0xc3d2e1f0;

    for (let offset = 0; offset < padded.length; offset += 64) {
        for (let index = 0; index < 16; index += 1) {
            const base = offset + index * 4;
            schedule[index] = (
                (padded[base] << 24)
                | (padded[base + 1] << 16)
                | (padded[base + 2] << 8)
                | padded[base + 3]
            ) >>> 0;
        }

        for (let index = 16; index < 80; index += 1) {
            schedule[index] = rotateLeft32(
                schedule[index - 3] ^ schedule[index - 8] ^ schedule[index - 14] ^ schedule[index - 16],
                1,
            );
        }

        let a = h0;
        let b = h1;
        let c = h2;
        let d = h3;
        let e = h4;

        for (let index = 0; index < 80; index += 1) {
            let f = 0;
            let k = 0;

            if (index < 20) {
                f = (b & c) | ((~b) & d);
                k = 0x5a827999;
            } else if (index < 40) {
                f = b ^ c ^ d;
                k = 0x6ed9eba1;
            } else if (index < 60) {
                f = (b & c) | (b & d) | (c & d);
                k = 0x8f1bbcdc;
            } else {
                f = b ^ c ^ d;
                k = 0xca62c1d6;
            }

            const temp = (rotateLeft32(a, 5) + f + e + k + schedule[index]) >>> 0;
            e = d;
            d = c;
            c = rotateLeft32(b, 30);
            b = a;
            a = temp;
        }

        h0 = (h0 + a) >>> 0;
        h1 = (h1 + b) >>> 0;
        h2 = (h2 + c) >>> 0;
        h3 = (h3 + d) >>> 0;
        h4 = (h4 + e) >>> 0;
    }

    return [h0, h1, h2, h3, h4]
        .map((value) => value.toString(16).padStart(8, "0"))
        .join("");
}

function parseTs14Parts(value) {
    const ts14 = toTs14(value);
    if (!TS14_PATTERN.test(ts14)) {
        return null;
    }

    const year = Number(ts14.slice(0, 4));
    const month = Number(ts14.slice(4, 6));
    const day = Number(ts14.slice(6, 8));
    const hour = Number(ts14.slice(8, 10));
    const minute = Number(ts14.slice(10, 12));
    const second = Number(ts14.slice(12, 14));

    if ([year, month, day, hour, minute, second].some((part) => !Number.isInteger(part))) {
        return null;
    }

    if (
        month < 1 || month > 12
        || day < 1 || day > 31
        || hour < 0 || hour > 23
        || minute < 0 || minute > 59
        || second < 0 || second > 59
    ) {
        return null;
    }

    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    if (
        date.getUTCFullYear() !== year
        || date.getUTCMonth() + 1 !== month
        || date.getUTCDate() !== day
        || date.getUTCHours() !== hour
        || date.getUTCMinutes() !== minute
        || date.getUTCSeconds() !== second
    ) {
        return null;
    }

    return {
        ts14,
        year,
        month,
        day,
        hour,
        minute,
        second,
        dateValue: Number(ts14.slice(0, 8)),
        timeValue: Number(ts14.slice(8)),
    };
}

function normalizeTsFields(row) {
    const ts14 = toTs14(row.ts14);
    const parsed = parseTs14Parts(ts14);

    return {
        ...row,
        ts14,
        date: parsed ? parsed.dateValue : Number(ts14.slice(0, 8)),
        time: parsed ? parsed.timeValue : Number(ts14.slice(8)),
    };
}

function sortByTs14(rows) {
    return [...rows].sort((left, right) => compareTs14(left.ts14, right.ts14));
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

function stableJson(value) {
    if (Array.isArray(value)) {
        return `[${value.map(stableJson).join(",")}]`;
    }

    if (value && typeof value === "object") {
        return `{${Object.keys(value)
            .sort()
            .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
            .join(",")}}`;
    }

    return JSON.stringify(value);
}

function buildSourceFormatLabel(rows) {
    const labels = [...new Set(
        rows
            .map((row) => String(row.source_format ?? "").trim())
            .filter(Boolean),
    )].sort();

    if (labels.length === 0) {
        return "unknown";
    }

    if (labels.length === 1) {
        return labels[0];
    }

    return `mixed(${labels.join("+")})`;
}

function isFiniteNumber(value) {
    return Number.isFinite(Number(value));
}

function almostEqual(left, right, epsilon = EPSILON) {
    return Math.abs(Number(left) - Number(right)) <= epsilon;
}

function validateTs14(row, index, entityName) {
    const issues = [];
    const parsed = parseTs14Parts(row.ts14);

    if (!parsed) {
        issues.push({
            code: `${entityName}_invalid_ts14`,
            severity: "error",
            index,
            ts14: row.ts14,
            message: `${entityName} row has invalid ts14.`,
        });
        return issues;
    }

    if (Number(row.date) !== parsed.dateValue || Number(row.time ?? 0) !== parsed.timeValue) {
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

function validateSourceFormat(row, index, entityName, allowedSourceFormats) {
    const issues = [];
    const sourceFormat = String(row.source_format ?? "").trim();

    if (!sourceFormat) {
        issues.push({
            code: `${entityName}_missing_source_format`,
            severity: "error",
            index,
            ts14: row.ts14,
            message: `${entityName} row is missing source_format.`,
        });
        return issues;
    }

    if (!allowedSourceFormats.has(sourceFormat)) {
        issues.push({
            code: `${entityName}_unknown_source_format`,
            severity: "error",
            index,
            ts14: row.ts14,
            message: `${entityName} row has unsupported source_format "${sourceFormat}".`,
        });
    }

    return issues;
}

function validateTimestampGranularity(row, index, entityName, { requireZeroTime = false, requireMinuteBar = false } = {}) {
    const issues = [];
    const parsed = parseTs14Parts(row.ts14);

    if (!parsed) {
        return issues;
    }

    if (requireZeroTime && parsed.timeValue !== 0) {
        issues.push({
            code: `${entityName}_non_zero_time`,
            severity: "error",
            index,
            ts14: row.ts14,
            message: `${entityName} row must use 000000 time.`,
        });
    }

    if (requireMinuteBar && parsed.second !== 0) {
        issues.push({
            code: `${entityName}_non_zero_second`,
            severity: "error",
            index,
            ts14: row.ts14,
            message: `${entityName} row must align to a minute bar with ss=00.`,
        });
    }

    return issues;
}

function validateBarPrices(row, index, entityName, { requireVolume, allowedSourceFormats, requireZeroTime = false, requireMinuteBar = false }) {
    const issues = [];
    const priceFields = ["open", "high", "low", "close"];

    issues.push(...validateSourceFormat(row, index, entityName, allowedSourceFormats));
    issues.push(...validateTimestampGranularity(row, index, entityName, { requireZeroTime, requireMinuteBar }));

    priceFields.forEach((field) => {
        if (!isFiniteNumber(row[field])) {
            issues.push({
                code: `${entityName}_missing_${field}`,
                severity: "error",
                index,
                ts14: row.ts14,
                message: `${entityName} row is missing ${field}.`,
            });
            return;
        }

        if (Number(row[field]) < 0) {
            issues.push({
                code: `${entityName}_negative_${field}`,
                severity: "error",
                index,
                ts14: row.ts14,
                message: `${entityName} row has negative ${field}.`,
            });
        }
    });

    if (
        isFiniteNumber(row.open)
        && isFiniteNumber(row.high)
        && isFiniteNumber(row.low)
        && isFiniteNumber(row.close)
    ) {
        if (Number(row.high) < Number(row.low)) {
            issues.push({
                code: `${entityName}_high_below_low`,
                severity: "error",
                index,
                ts14: row.ts14,
                message: `${entityName} row has high lower than low.`,
            });
        }

        if (Number(row.high) < Math.max(Number(row.open), Number(row.close))) {
            issues.push({
                code: `${entityName}_high_below_body`,
                severity: "error",
                index,
                ts14: row.ts14,
                message: `${entityName} row high is below open/close.`,
            });
        }

        if (Number(row.low) > Math.min(Number(row.open), Number(row.close))) {
            issues.push({
                code: `${entityName}_low_above_body`,
                severity: "error",
                index,
                ts14: row.ts14,
                message: `${entityName} row low is above open/close.`,
            });
        }
    }

    const sourceFormat = String(row.source_format ?? "").trim();
    const volumeRequired = requireVolume || sourceFormat.startsWith("xq_");
    if (volumeRequired && !isFiniteNumber(row.volume)) {
        issues.push({
            code: `${entityName}_missing_volume`,
            severity: "error",
            index,
            ts14: row.ts14,
            message: `${entityName} row is missing volume.`,
        });
    }

    if (isFiniteNumber(row.volume) && Number(row.volume) < 0) {
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

function validateDailyAnchorValues(row, index) {
    const issues = [];
    const numericFields = ["prev_high", "prev_low", "prev_close", "day_range", "pp", "r1", "s1", "r2", "s2"];

    numericFields.forEach((field) => {
        if (!isFiniteNumber(row[field])) {
            issues.push({
                code: `daily_anchor_missing_${field}`,
                severity: "error",
                index,
                ts14: row.ts14,
                message: `daily_anchor row is missing ${field}.`,
            });
        }
    });

    if (isFiniteNumber(row.prev_high) && isFiniteNumber(row.prev_low) && Number(row.prev_high) < Number(row.prev_low)) {
        issues.push({
            code: "daily_anchor_prev_high_below_prev_low",
            severity: "error",
            index,
            ts14: row.ts14,
            message: "daily_anchor row has prev_high lower than prev_low.",
        });
    }

    if (isFiniteNumber(row.prev_close) && Number(row.prev_close) < 0) {
        issues.push({
            code: "daily_anchor_negative_prev_close",
            severity: "error",
            index,
            ts14: row.ts14,
            message: "daily_anchor row has negative prev_close.",
        });
    }

    if (isFiniteNumber(row.day_range) && Number(row.day_range) < 0) {
        issues.push({
            code: "daily_anchor_negative_day_range",
            severity: "error",
            index,
            ts14: row.ts14,
            message: "daily_anchor row has negative day_range.",
        });
    }

    if (
        isFiniteNumber(row.prev_high)
        && isFiniteNumber(row.prev_low)
        && isFiniteNumber(row.day_range)
        && !almostEqual(Number(row.day_range), Number(row.prev_high) - Number(row.prev_low))
    ) {
        issues.push({
            code: "daily_anchor_bad_day_range",
            severity: "error",
            index,
            ts14: row.ts14,
            message: "daily_anchor row day_range does not equal prev_high - prev_low.",
        });
    }

    return issues;
}

function validateMonotonicOrder(rows, entityName) {
    const issues = [];
    let previous = null;

    rows.forEach((row, index) => {
        if (!previous) {
            previous = row;
            return;
        }

        const order = compareTs14(previous.ts14, row.ts14);
        if (order === 0) {
            issues.push({
                code: `${entityName}_duplicate_ts14`,
                severity: "error",
                index,
                ts14: row.ts14,
                message: `${entityName} rows contain duplicate ts14 after dedupe.`,
            });
        } else if (order > 0) {
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

function validateUniqueDates(rows, entityName) {
    const issues = [];
    const firstIndexByDate = new Map();

    rows.forEach((row, index) => {
        const date = Number(row.date);
        if (!Number.isInteger(date)) {
            return;
        }

        if (firstIndexByDate.has(date)) {
            issues.push({
                code: `${entityName}_duplicate_date`,
                severity: "error",
                index,
                ts14: row.ts14,
                message: `${entityName} rows contain multiple rows for date ${date}.`,
            });
            return;
        }

        firstIndexByDate.set(date, index);
    });

    return issues;
}

function mapPreviousD1Rows(d1Bars) {
    return sortByTs14(d1Bars).map(normalizeTsFields);
}

function findPreviousD1Row(sortedD1Rows, targetDate) {
    let previous = null;

    for (const row of sortedD1Rows) {
        if (Number(row.date) >= Number(targetDate)) {
            break;
        }
        previous = row;
    }

    return previous;
}

function getUniqueSortedDates(rows) {
    return [...new Set(
        rows
            .map((row) => Number(row.date))
            .filter((date) => Number.isInteger(date)),
    )].sort((left, right) => left - right);
}

function buildDateCountMap(rows) {
    return rows.reduce((map, row) => {
        const date = Number(row.date);
        if (!Number.isInteger(date)) {
            return map;
        }

        map.set(date, (map.get(date) ?? 0) + 1);
        return map;
    }, new Map());
}

function summarizeDuplicateIssues(entityName, duplicates) {
    if (duplicates.length === 0) {
        return [];
    }

    const firstTs14 = duplicates[0]?.ts14 ?? "";
    const lastTs14 = duplicates[duplicates.length - 1]?.ts14 ?? firstTs14;

    return [{
        code: `${entityName}_duplicates_removed`,
        severity: "warning",
        count: duplicates.length,
        first_ts14: firstTs14,
        last_ts14: lastTs14,
        message: `${entityName} dedupe removed ${duplicates.length} duplicated row(s).`,
    }];
}

function hasPreviousDate(sortedDates, targetDate) {
    for (const date of sortedDates) {
        if (date < targetDate) {
            return true;
        }

        if (date >= targetDate) {
            return false;
        }
    }

    return false;
}

function buildBundleSignature(signatures) {
    const payload = Object.keys(signatures)
        .sort()
        .map((key) => `${key}=${signatures[key]}`)
        .join("\n");

    return `bundle|sha1:${sha1Hex(payload)}`;
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
        issues.push(...validateBarPrices(row, index, "m1", {
            requireVolume,
            allowedSourceFormats: KNOWN_SOURCE_FORMATS.m1,
            requireMinuteBar: true,
        }));
    });

    issues.push(...validateMonotonicOrder(normalized, "m1"));
    return { rows: normalized, issues };
}

export function validateD1Bars(rows, { requireVolume = false } = {}) {
    const normalized = sortByTs14(rows).map(normalizeTsFields);
    const issues = [];

    normalized.forEach((row, index) => {
        issues.push(...validateTs14(row, index, "d1"));
        issues.push(...validateBarPrices(row, index, "d1", {
            requireVolume,
            allowedSourceFormats: KNOWN_SOURCE_FORMATS.d1,
            requireZeroTime: true,
        }));
    });

    issues.push(...validateMonotonicOrder(normalized, "d1"));
    issues.push(...validateUniqueDates(normalized, "d1"));
    return { rows: normalized, issues };
}

export function validateDailyAnchors(rows, { d1Bars = [] } = {}) {
    const normalized = sortByTs14(rows).map(normalizeTsFields);
    const issues = [];
    const sortedD1 = mapPreviousD1Rows(d1Bars);

    normalized.forEach((row, index) => {
        issues.push(...validateTs14(row, index, "daily_anchor"));
        issues.push(...validateSourceFormat(row, index, "daily_anchor", KNOWN_SOURCE_FORMATS.daily_anchor));
        issues.push(...validateTimestampGranularity(row, index, "daily_anchor", { requireMinuteBar: true }));
        issues.push(...validateDailyAnchorValues(row, index));

        const previousD1 = findPreviousD1Row(sortedD1, row.date);
        if (!previousD1) {
            issues.push({
                code: "daily_anchor_missing_previous_d1",
                severity: "error",
                index,
                ts14: row.ts14,
                message: "daily_anchor row does not have a previous D1 row to anchor against.",
            });
            return;
        }

        if (
            !almostEqual(Number(previousD1.high), Number(row.prev_high))
            || !almostEqual(Number(previousD1.low), Number(row.prev_low))
            || !almostEqual(Number(previousD1.close), Number(row.prev_close))
        ) {
            issues.push({
                code: "daily_anchor_d1_mismatch",
                severity: "error",
                index,
                ts14: row.ts14,
                message: "daily_anchor row does not match previous D1 values.",
            });
        }
    });

    issues.push(...validateMonotonicOrder(normalized, "daily_anchor"));
    issues.push(...validateUniqueDates(normalized, "daily_anchor"));
    return { rows: normalized, issues };
}

export function buildDataSignature(rows, { label = "dataset" } = {}) {
    const normalized = sortByTs14(rows).map(normalizeTsFields);
    const first = normalized[0]?.ts14 ?? "";
    const last = normalized.length > 0 ? normalized[normalized.length - 1].ts14 : "";
    const sourceFormat = buildSourceFormatLabel(normalized);
    const payload = normalized.map((row) => stableJson(row)).join("\n");
    const hash = sha1Hex(payload);
    return `${label}|${sourceFormat}|${normalized.length}|${first}|${last}|sha1:${hash}`;
}

function buildBundleIssues(
    { m1Rows = [], d1Rows = [], dailyAnchorRows = [], m1Duplicates = [], d1Duplicates = [], dailyAnchorDuplicates = [] },
    { requireM1 = true, requireD1 = true, requireDailyAnchors = true, allowDailyAnchorRebuild = false } = {},
) {
    const issues = [];
    const m1Dates = getUniqueSortedDates(m1Rows);
    const d1Dates = getUniqueSortedDates(d1Rows);
    const dailyAnchorDateCounts = buildDateCountMap(dailyAnchorRows);
    const dailyAnchorDates = [...dailyAnchorDateCounts.keys()].sort((left, right) => left - right);
    const m1DateSet = new Set(m1Dates);

    if (requireM1 && m1Rows.length === 0) {
        issues.push({
            code: "bundle_missing_m1",
            severity: "error",
            message: "Data bundle is missing M1 rows.",
        });
    }

    if (requireD1 && d1Rows.length === 0) {
        issues.push({
            code: "bundle_missing_d1",
            severity: "error",
            message: "Data bundle is missing D1 rows.",
        });
    }

    if (dailyAnchorRows.length === 0) {
        if (requireDailyAnchors) {
            issues.push({
                code: allowDailyAnchorRebuild ? "bundle_missing_daily_anchors_rebuild_required" : "bundle_missing_daily_anchors",
                severity: allowDailyAnchorRebuild ? "warning" : "error",
                message: allowDailyAnchorRebuild
                    ? "Data bundle is missing DailyAnchor rows; rebuild from D1 is required before generation."
                    : "Data bundle is missing DailyAnchor rows.",
            });
        }
    }

    issues.push(...summarizeDuplicateIssues("m1", m1Duplicates));
    issues.push(...summarizeDuplicateIssues("d1", d1Duplicates));
    issues.push(...summarizeDuplicateIssues("daily_anchor", dailyAnchorDuplicates));

    if (requireD1 || d1Rows.length > 0) {
        m1Dates.forEach((date) => {
            if (!hasPreviousDate(d1Dates, date)) {
                issues.push({
                    code: "bundle_m1_missing_previous_d1",
                    severity: "error",
                    date,
                    message: `M1 trading date ${date} does not have a previous D1 row for day initialization.`,
                });
            }
        });
    }

    if (dailyAnchorRows.length > 0) {
        m1Dates.forEach((date) => {
            if (!hasPreviousDate(d1Dates, date)) {
                return;
            }

            const anchorCount = dailyAnchorDateCounts.get(date) ?? 0;
            if (anchorCount === 0) {
                issues.push({
                    code: "bundle_missing_daily_anchor_for_m1_date",
                    severity: "error",
                    date,
                    message: `Trading date ${date} is missing a DailyAnchor row.`,
                });
            } else if (anchorCount > 1) {
                issues.push({
                    code: "bundle_duplicate_daily_anchor_for_date",
                    severity: "error",
                    date,
                    count: anchorCount,
                    message: `Trading date ${date} has ${anchorCount} DailyAnchor rows.`,
                });
            }
        });

        dailyAnchorDates.forEach((date) => {
            if (!m1DateSet.has(date)) {
                issues.push({
                    code: "bundle_orphan_daily_anchor_date",
                    severity: "warning",
                    date,
                    message: `DailyAnchor date ${date} does not have matching M1 rows.`,
                });
            }
        });
    }

    return issues;
}

export function validateDataBundle(
    { m1Bars = [], d1Bars = [], dailyAnchors = [] },
    {
        requireVolume = false,
        requireM1 = true,
        requireD1 = true,
        requireDailyAnchors = true,
        allowDailyAnchorRebuild = false,
    } = {},
) {
    const dedupedM1 = dedupeM1Bars(m1Bars);
    const dedupedD1 = dedupeD1Bars(d1Bars);
    const dedupedAnchors = dedupeDailyAnchors(dailyAnchors);

    const validatedM1 = validateM1Bars(dedupedM1.rows, { requireVolume });
    const validatedD1 = validateD1Bars(dedupedD1.rows, { requireVolume });
    const validatedAnchors = validateDailyAnchors(dedupedAnchors.rows, { d1Bars: validatedD1.rows });

    const signatures = {
        m1: buildDataSignature(validatedM1.rows, { label: "m1" }),
        d1: buildDataSignature(validatedD1.rows, { label: "d1" }),
        daily_anchor: buildDataSignature(validatedAnchors.rows, { label: "daily_anchor" }),
    };

    const bundleIssues = buildBundleIssues(
        {
            m1Rows: validatedM1.rows,
            d1Rows: validatedD1.rows,
            dailyAnchorRows: validatedAnchors.rows,
            m1Duplicates: dedupedM1.duplicates,
            d1Duplicates: dedupedD1.duplicates,
            dailyAnchorDuplicates: dedupedAnchors.duplicates,
        },
        { requireM1, requireD1, requireDailyAnchors, allowDailyAnchorRebuild },
    );

    const allIssues = [
        ...validatedM1.issues,
        ...validatedD1.issues,
        ...validatedAnchors.issues,
        ...bundleIssues,
    ];

    const errorCount = allIssues.filter((issue) => issue.severity === "error").length;
    const warningCount = allIssues.filter((issue) => issue.severity === "warning").length;

    signatures.bundle = buildBundleSignature(signatures);

    return {
        ok: errorCount === 0,
        errorCount,
        warningCount,
        issues: allIssues,
        signatures,
        bundle: {
            signature: signatures.bundle,
            issues: bundleIssues,
        },
        m1: {
            rows: validatedM1.rows,
            duplicates: dedupedM1.duplicates,
            duplicates_removed: dedupedM1.duplicates.length,
            issues: validatedM1.issues,
            signature: signatures.m1,
        },
        d1: {
            rows: validatedD1.rows,
            duplicates: dedupedD1.duplicates,
            duplicates_removed: dedupedD1.duplicates.length,
            issues: validatedD1.issues,
            signature: signatures.d1,
        },
        dailyAnchors: {
            rows: validatedAnchors.rows,
            duplicates: dedupedAnchors.duplicates,
            duplicates_removed: dedupedAnchors.duplicates.length,
            issues: validatedAnchors.issues,
            signature: signatures.daily_anchor,
        },
    };
}
