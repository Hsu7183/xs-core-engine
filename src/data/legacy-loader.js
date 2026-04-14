const LEGACY_M1_PARTS = 6;
const LEGACY_D1_PARTS = 5;

function cleanLines(text) {
    return String(text ?? "")
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
}

function safeNumber(raw) {
    const value = Number(String(raw ?? "").trim());
    return Number.isFinite(value) ? value : null;
}

function safeInteger(raw) {
    const value = safeNumber(raw);
    if (value === null) {
        return null;
    }
    return Number.isInteger(value) ? value : null;
}

function buildTs14(date, time) {
    return `${String(date).padStart(8, "0")}${String(time).padStart(6, "0")}`;
}

export function parseLegacyM1Text(text, { sourceFormat = "legacy_m1" } = {}) {
    const rows = [];
    const errors = [];

    cleanLines(text).forEach((line, index) => {
        const parts = line.split(/\s+/);
        if (parts.length !== LEGACY_M1_PARTS) {
            errors.push({
                code: "legacy_m1_bad_field_count",
                lineNumber: index + 1,
                message: `Legacy M1 line must have ${LEGACY_M1_PARTS} fields.`,
                raw: line,
            });
            return;
        }

        const [rawDate, rawTime, rawOpen, rawHigh, rawLow, rawClose] = parts;
        const date = safeInteger(rawDate);
        const time = safeInteger(rawTime);
        const open = safeNumber(rawOpen);
        const high = safeNumber(rawHigh);
        const low = safeNumber(rawLow);
        const close = safeNumber(rawClose);

        if ([date, time, open, high, low, close].some((value) => value === null)) {
            errors.push({
                code: "legacy_m1_parse_error",
                lineNumber: index + 1,
                message: "Legacy M1 line contains an invalid numeric field.",
                raw: line,
            });
            return;
        }

        rows.push({
            ts14: buildTs14(date, time),
            date,
            time,
            open,
            high,
            low,
            close,
            volume: null,
            source_format: sourceFormat,
            source_line: index + 1,
            raw: line,
        });
    });

    return { rows, errors };
}

export function parseLegacyD1Text(text, { sourceFormat = "legacy_d1" } = {}) {
    const rows = [];
    const errors = [];

    cleanLines(text).forEach((line, index) => {
        const parts = line.split(/\s+/);
        if (parts.length !== LEGACY_D1_PARTS) {
            errors.push({
                code: "legacy_d1_bad_field_count",
                lineNumber: index + 1,
                message: `Legacy D1 line must have ${LEGACY_D1_PARTS} fields.`,
                raw: line,
            });
            return;
        }

        const [rawDate, rawOpen, rawHigh, rawLow, rawClose] = parts;
        const date = safeInteger(rawDate);
        const open = safeNumber(rawOpen);
        const high = safeNumber(rawHigh);
        const low = safeNumber(rawLow);
        const close = safeNumber(rawClose);

        if ([date, open, high, low, close].some((value) => value === null)) {
            errors.push({
                code: "legacy_d1_parse_error",
                lineNumber: index + 1,
                message: "Legacy D1 line contains an invalid numeric field.",
                raw: line,
            });
            return;
        }

        rows.push({
            ts14: buildTs14(date, 0),
            date,
            time: 0,
            open,
            high,
            low,
            close,
            volume: null,
            source_format: sourceFormat,
            source_line: index + 1,
            raw: line,
        });
    });

    return { rows, errors };
}
