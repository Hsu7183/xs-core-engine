export const DEFAULT_ARTIFACT_DIR = "artifacts";

function pad(value, length) {
    return String(value ?? "").padStart(length, "0");
}

function getTaipeiDateParts(dateLike, timeZone = "Asia/Taipei") {
    const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    const parts = Object.fromEntries(
        formatter.formatToParts(date)
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value]),
    );

    return {
        year: Number(parts.year),
        month: Number(parts.month),
        day: Number(parts.day),
        hour: Number(parts.hour),
        minute: Number(parts.minute),
        second: Number(parts.second),
    };
}

export function buildArtifactId(dateLike = new Date(), { timeZone = "Asia/Taipei", sequence = null } = {}) {
    const parts = getTaipeiDateParts(dateLike, timeZone);
    const rocYear = parts.year - 1911;
    const baseId = `${pad(rocYear, 3)}${pad(parts.month, 2)}${pad(parts.day, 2)}${pad(parts.hour, 2)}${pad(parts.minute, 2)}`;

    if (sequence === null || sequence === undefined) {
        return baseId;
    }

    return `${baseId}_${pad(sequence, 2)}`;
}

export function buildArtifactFileNames(artifactId) {
    return {
        indicator: `${artifactId}_indicator.xs`,
        trading: `${artifactId}_trading.xs`,
        params: `${artifactId}_params.txt`,
        summary: `${artifactId}_summary.json`,
        artifactMeta: `${artifactId}_artifact_meta.json`,
        top10Json: `${artifactId}_top10.json`,
        top10Csv: `${artifactId}_top10.csv`,
        tradeLines: `${artifactId}_trade_lines.txt`,
    };
}

export function buildArtifactPaths(artifactId, { baseDir = DEFAULT_ARTIFACT_DIR } = {}) {
    const files = buildArtifactFileNames(artifactId);
    const directory = `${baseDir}/${artifactId}`;

    return {
        directory,
        indicatorXsPath: `${directory}/${files.indicator}`,
        tradingXsPath: `${directory}/${files.trading}`,
        paramsTxtPath: `${directory}/${files.params}`,
        summaryPath: `${directory}/${files.summary}`,
        artifactMetaPath: `${directory}/${files.artifactMeta}`,
        top10JsonPath: `${directory}/${files.top10Json}`,
        top10CsvPath: `${directory}/${files.top10Csv}`,
        tradeLinesPath: `${directory}/${files.tradeLines}`,
    };
}
