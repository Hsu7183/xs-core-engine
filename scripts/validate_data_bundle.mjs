import fs from "node:fs/promises";
import path from "node:path";

import {
    parseLegacyM1Text,
    parseLegacyD1Text,
    parseCsvM1Text,
    parseCsvD1Text,
    parseCsvDailyAnchorText,
    validateDataBundle,
} from "../src/data/index.js";

const HELP_TEXT = `
Usage:
  node scripts/validate_data_bundle.mjs --m1 <path> --d1 <path> [--anchors <path>] [options]

Options:
  --m1-format <auto|legacy|csv>       M1 input format. Default: auto
  --d1-format <auto|legacy|csv>       D1 input format. Default: auto
  --require-volume                    Require volume for every row
  --allow-daily-anchor-rebuild        Downgrade missing DailyAnchor rows to a warning
  --json                              Print the full result as JSON
  --help                              Show this help text
`;

function normalizeNewlines(text) {
    return String(text ?? "").replace(/\r\n/g, "\n");
}

function firstMeaningfulLine(text) {
    return normalizeNewlines(text)
        .split("\n")
        .map((line) => line.trim())
        .find(Boolean) ?? "";
}

function detectBarFormat(text, expectedFieldCount) {
    const firstLine = firstMeaningfulLine(text);

    if (firstLine.startsWith("ts14,")) {
        return "csv";
    }

    const parts = firstLine.split(/\s+/).filter(Boolean);
    if (parts.length === expectedFieldCount) {
        return "legacy";
    }

    return null;
}

function parseArgs(argv) {
    const args = {
        requireVolume: false,
        allowDailyAnchorRebuild: false,
        json: false,
        m1Format: "auto",
        d1Format: "auto",
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        switch (arg) {
        case "--m1":
            args.m1Path = argv[index + 1];
            index += 1;
            break;
        case "--d1":
            args.d1Path = argv[index + 1];
            index += 1;
            break;
        case "--anchors":
            args.anchorsPath = argv[index + 1];
            index += 1;
            break;
        case "--m1-format":
            args.m1Format = argv[index + 1];
            index += 1;
            break;
        case "--d1-format":
            args.d1Format = argv[index + 1];
            index += 1;
            break;
        case "--require-volume":
            args.requireVolume = true;
            break;
        case "--allow-daily-anchor-rebuild":
            args.allowDailyAnchorRebuild = true;
            break;
        case "--json":
            args.json = true;
            break;
        case "--help":
        case "-h":
            args.help = true;
            break;
        default:
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return args;
}

function ensureSupportedFormat(label, format) {
    if (!["auto", "legacy", "csv"].includes(format)) {
        throw new Error(`${label} format must be one of: auto, legacy, csv`);
    }
}

function toParseIssue(fileLabel, error) {
    return {
        ...error,
        severity: "error",
        scope: "parse",
        file: fileLabel,
    };
}

function parseBars(text, { label, preferredFormat, legacyParser, csvParser, expectedLegacyFieldCount }) {
    const resolvedFormat = preferredFormat === "auto"
        ? detectBarFormat(text, expectedLegacyFieldCount)
        : preferredFormat;

    if (!resolvedFormat) {
        return {
            rows: [],
            issues: [{
                code: `${label}_unknown_format`,
                severity: "error",
                scope: "parse",
                file: label,
                message: `${label} file format could not be detected.`,
            }],
        };
    }

    const parsed = resolvedFormat === "legacy"
        ? legacyParser(text)
        : csvParser(text);

    return {
        rows: parsed.rows,
        issues: parsed.errors.map((error) => toParseIssue(label, error)),
    };
}

function formatIssue(issue) {
    const location = [
        issue.file ? `file=${issue.file}` : "",
        issue.lineNumber ? `line=${issue.lineNumber}` : "",
        issue.ts14 ? `ts14=${issue.ts14}` : "",
        issue.date ? `date=${issue.date}` : "",
    ].filter(Boolean).join(" ");

    return `${issue.severity.toUpperCase()} ${issue.code}${location ? ` (${location})` : ""}: ${issue.message}`;
}

function buildOutput(args, parseIssues, result) {
    return {
        ok: parseIssues.length === 0 && result.ok,
        parseErrorCount: parseIssues.length,
        errorCount: result.errorCount + parseIssues.length,
        warningCount: result.warningCount,
        files: {
            m1: args.m1Path ?? null,
            d1: args.d1Path ?? null,
            daily_anchors: args.anchorsPath ?? null,
        },
        signatures: result.signatures,
        issues: [...parseIssues, ...result.issues],
    };
}

async function main() {
    let args;
    try {
        args = parseArgs(process.argv.slice(2));
    } catch (error) {
        console.error(String(error.message ?? error));
        console.error(HELP_TEXT.trim());
        process.exitCode = 1;
        return;
    }

    if (args.help) {
        console.log(HELP_TEXT.trim());
        return;
    }

    if (!args.m1Path || !args.d1Path) {
        console.error("Both --m1 and --d1 are required.");
        console.error(HELP_TEXT.trim());
        process.exitCode = 1;
        return;
    }

    try {
        ensureSupportedFormat("M1", args.m1Format);
        ensureSupportedFormat("D1", args.d1Format);
    } catch (error) {
        console.error(String(error.message ?? error));
        process.exitCode = 1;
        return;
    }

    const m1Text = await fs.readFile(args.m1Path, "utf8");
    const d1Text = await fs.readFile(args.d1Path, "utf8");
    const anchorsText = args.anchorsPath ? await fs.readFile(args.anchorsPath, "utf8") : "";

    const m1Parsed = parseBars(m1Text, {
        label: path.basename(args.m1Path),
        preferredFormat: args.m1Format,
        legacyParser: parseLegacyM1Text,
        csvParser: parseCsvM1Text,
        expectedLegacyFieldCount: 6,
    });

    const d1Parsed = parseBars(d1Text, {
        label: path.basename(args.d1Path),
        preferredFormat: args.d1Format,
        legacyParser: parseLegacyD1Text,
        csvParser: parseCsvD1Text,
        expectedLegacyFieldCount: 5,
    });

    const anchorParsed = args.anchorsPath
        ? (() => {
            const parsed = parseCsvDailyAnchorText(anchorsText);
            return {
                rows: parsed.rows,
                issues: parsed.errors.map((error) => toParseIssue(path.basename(args.anchorsPath), error)),
            };
        })()
        : { rows: [], issues: [] };

    const parseIssues = [...m1Parsed.issues, ...d1Parsed.issues, ...anchorParsed.issues];

    const result = validateDataBundle(
        {
            m1Bars: m1Parsed.rows,
            d1Bars: d1Parsed.rows,
            dailyAnchors: anchorParsed.rows,
        },
        {
            requireVolume: args.requireVolume,
            requireDailyAnchors: true,
            allowDailyAnchorRebuild: args.allowDailyAnchorRebuild,
        },
    );

    const output = buildOutput(args, parseIssues, result);

    if (args.json) {
        console.log(JSON.stringify(output, null, 2));
    } else {
        console.log(`ok=${output.ok}`);
        console.log(`parse_errors=${output.parseErrorCount}`);
        console.log(`errors=${output.errorCount}`);
        console.log(`warnings=${output.warningCount}`);
        console.log(`bundle_signature=${output.signatures.bundle}`);
        if (output.issues.length > 0) {
            console.log("issues:");
            output.issues.forEach((issue) => {
                console.log(`- ${formatIssue(issue)}`);
            });
        }
    }

    if (!output.ok) {
        process.exitCode = 1;
    }
}

await main();
