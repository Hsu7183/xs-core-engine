const EXECUTABLE_TRADING_OUTPUT_PATTERN = /\b(?:print|plot\d+)\s*\(/i;

export function findExecutableTradingPrintLines(code) {
    const lines = String(code || "").replace(/\r\n/g, "\n").split("\n");
    const found = [];
    let inMetaBlock = false;

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
            return;
        }
        if (!inMetaBlock && trimmed.startsWith("{*")) {
            inMetaBlock = !trimmed.includes("*}");
            return;
        }
        if (inMetaBlock) {
            if (trimmed.includes("*}")) {
                inMetaBlock = false;
            }
            return;
        }
        if (trimmed.startsWith("//")) {
            return;
        }
        if (EXECUTABLE_TRADING_OUTPUT_PATTERN.test(trimmed)) {
            found.push(index + 1);
        }
    });

    return found;
}

export function stripExecutableTradingPrints(code) {
    const lines = String(code || "").replace(/\r\n/g, "\n").split("\n");
    const removedLines = [];
    let inMetaBlock = false;

    const safeLines = lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
            return line;
        }
        if (!inMetaBlock && trimmed.startsWith("{*")) {
            inMetaBlock = !trimmed.includes("*}");
            return line;
        }
        if (inMetaBlock) {
            if (trimmed.includes("*}")) {
                inMetaBlock = false;
            }
            return line;
        }
        if (trimmed.startsWith("//")) {
            return line;
        }
        if (EXECUTABLE_TRADING_OUTPUT_PATTERN.test(trimmed)) {
            removedLines.push(index + 1);
            return line.replace(/^(\s*)/, "$1// ");
        }
        return line;
    });

    return {
        code: safeLines.join("\n"),
        removedLines,
    };
}

export function assertTradingCodeSafe(code, fileName = "trading.xs") {
    const offending = findExecutableTradingPrintLines(code);
    if (offending.length) {
        throw new Error(fileName + " contains executable Print/Plot lines at " + offending.join(", "));
    }
}
