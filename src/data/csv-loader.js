function stripBom(text) {
    return String(text ?? "").replace(/^\uFEFF/, "");
}

function splitCsvLine(line) {
    const cells = [];
    let current = "";
    let insideQuote = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"') {
            if (insideQuote && nextChar === '"') {
                current += '"';
                index += 1;
            } else {
                insideQuote = !insideQuote;
            }
            continue;
        }

        if (char === "," && !insideQuote) {
            cells.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    cells.push(current.trim());
    return cells;
}

function parseCsvText(text) {
    const lines = stripBom(text)
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return { header: [], rows: [] };
    }

    const [headerLine, ...bodyLines] = lines;
    return {
        header: splitCsvLine(headerLine),
        rows: bodyLines.map((line, index) => ({
            lineNumber: index + 2,
            values: splitCsvLine(line),
            raw: line,
        })),
    };
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

function parseTs14(raw) {
    const text = String(raw ?? "").trim();
    if (!/^\d{14}$/.test(text)) {
        return null;
    }

    return {
        ts14: text,
        date: safeInteger(text.slice(0, 8)),
        time: safeInteger(text.slice(8)),
    };
}

function headerMatches(actualHeader, expectedHeader) {
    if (actualHeader.length !== expectedHeader.length) {
        return false;
    }

    return expectedHeader.every((name, index) => actualHeader[index] === name);
}

function parseBarCsv(text, expectedHeader, { sourceFormat }) {
    const parsed = parseCsvText(text);
    const rows = [];
    const errors = [];

    if (!headerMatches(parsed.header, expectedHeader)) {
        errors.push({
            code: "csv_header_mismatch",
            lineNumber: 1,
            message: `CSV header must be ${expectedHeader.join(",")}.`,
            raw: parsed.header.join(","),
        });
        return { rows, errors };
    }

    parsed.rows.forEach((row) => {
        if (row.values.length !== expectedHeader.length) {
            errors.push({
                code: "csv_bad_field_count",
                lineNumber: row.lineNumber,
                message: `CSV row must have ${expectedHeader.length} fields.`,
                raw: row.raw,
            });
            return;
        }

        const [rawTs14, rawOpen, rawHigh, rawLow, rawClose, rawVolume] = row.values;
        const tsInfo = parseTs14(rawTs14);
        const open = safeNumber(rawOpen);
        const high = safeNumber(rawHigh);
        const low = safeNumber(rawLow);
        const close = safeNumber(rawClose);
        const volume = safeNumber(rawVolume);

        if (!tsInfo || [open, high, low, close, volume].some((value) => value === null)) {
            errors.push({
                code: "csv_parse_error",
                lineNumber: row.lineNumber,
                message: "CSV row contains an invalid ts14 or numeric field.",
                raw: row.raw,
            });
            return;
        }

        rows.push({
            ts14: tsInfo.ts14,
            date: tsInfo.date,
            time: tsInfo.time,
            open,
            high,
            low,
            close,
            volume,
            source_format: sourceFormat,
            source_line: row.lineNumber,
            raw: row.raw,
        });
    });

    return { rows, errors };
}

export function parseCsvM1Text(text, { sourceFormat = "xq_m1_csv" } = {}) {
    return parseBarCsv(text, ["ts14", "open", "high", "low", "close", "volume"], { sourceFormat });
}

export function parseCsvD1Text(text, { sourceFormat = "xq_d1_csv" } = {}) {
    return parseBarCsv(text, ["ts14", "open", "high", "low", "close", "volume"], { sourceFormat });
}

export function parseCsvDailyAnchorText(text, { sourceFormat = "xq_daily_anchor_csv" } = {}) {
    const expectedHeader = ["ts14", "prev_high", "prev_low", "prev_close", "day_range", "pp", "r1", "s1", "r2", "s2"];
    const parsed = parseCsvText(text);
    const rows = [];
    const errors = [];

    if (!headerMatches(parsed.header, expectedHeader)) {
        errors.push({
            code: "daily_anchor_header_mismatch",
            lineNumber: 1,
            message: `DailyAnchor CSV header must be ${expectedHeader.join(",")}.`,
            raw: parsed.header.join(","),
        });
        return { rows, errors };
    }

    parsed.rows.forEach((row) => {
        if (row.values.length !== expectedHeader.length) {
            errors.push({
                code: "daily_anchor_bad_field_count",
                lineNumber: row.lineNumber,
                message: `DailyAnchor row must have ${expectedHeader.length} fields.`,
                raw: row.raw,
            });
            return;
        }

        const [rawTs14, rawPrevHigh, rawPrevLow, rawPrevClose, rawDayRange, rawPP, rawR1, rawS1, rawR2, rawS2] = row.values;
        const tsInfo = parseTs14(rawTs14);
        const prev_high = safeNumber(rawPrevHigh);
        const prev_low = safeNumber(rawPrevLow);
        const prev_close = safeNumber(rawPrevClose);
        const day_range = safeNumber(rawDayRange);
        const pp = safeNumber(rawPP);
        const r1 = safeNumber(rawR1);
        const s1 = safeNumber(rawS1);
        const r2 = safeNumber(rawR2);
        const s2 = safeNumber(rawS2);

        if (
            !tsInfo
            || [prev_high, prev_low, prev_close, day_range, pp, r1, s1, r2, s2].some((value) => value === null)
        ) {
            errors.push({
                code: "daily_anchor_parse_error",
                lineNumber: row.lineNumber,
                message: "DailyAnchor row contains an invalid ts14 or numeric field.",
                raw: row.raw,
            });
            return;
        }

        rows.push({
            ts14: tsInfo.ts14,
            date: tsInfo.date,
            time: tsInfo.time,
            prev_high,
            prev_low,
            prev_close,
            day_range,
            pp,
            r1,
            s1,
            r2,
            s2,
            source_format: sourceFormat,
            source_line: row.lineNumber,
            raw: row.raw,
        });
    });

    return { rows, errors };
}
