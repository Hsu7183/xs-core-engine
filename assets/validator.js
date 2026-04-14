import {
    parseLegacyM1Text,
    parseLegacyD1Text,
    parseCsvM1Text,
    parseCsvD1Text,
    parseCsvDailyAnchorText,
    validateDataBundle,
} from "../src/data/index.js";

const FILE_PARSERS = {
    m1: {
        detectLegacyFieldCount: 6,
        legacyParser: parseLegacyM1Text,
        csvParser: parseCsvM1Text,
    },
    d1: {
        detectLegacyFieldCount: 5,
        legacyParser: parseLegacyD1Text,
        csvParser: parseCsvD1Text,
    },
};

function setStatusMessage(element, message, tone = "info") {
    element.textContent = message;
    element.classList.remove("is-success", "is-warning", "is-error");

    if (tone === "success") {
        element.classList.add("is-success");
    } else if (tone === "warning") {
        element.classList.add("is-warning");
    } else if (tone === "error") {
        element.classList.add("is-error");
    }
}

function firstMeaningfulLine(text) {
    return String(text ?? "")
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .find(Boolean) ?? "";
}

function detectBarFormat(text, expectedLegacyFieldCount) {
    const line = firstMeaningfulLine(text);

    if (line.startsWith("ts14,")) {
        return "csv";
    }

    const parts = line.split(/\s+/).filter(Boolean);
    if (parts.length === expectedLegacyFieldCount) {
        return "legacy";
    }

    return null;
}

function normalizeParseIssue(fileName, error) {
    return {
        ...error,
        severity: "error",
        file: fileName,
        scope: "parse",
    };
}

async function parseBarFile(file, kind) {
    const text = await file.text();
    const parserConfig = FILE_PARSERS[kind];
    const detected = detectBarFormat(text, parserConfig.detectLegacyFieldCount);

    if (!detected) {
        return {
            rows: [],
            issues: [{
                code: `${kind}_unknown_format`,
                severity: "error",
                file: file.name,
                scope: "parse",
                message: `${kind.toUpperCase()} 檔案格式無法辨識。`,
            }],
        };
    }

    const parsed = detected === "legacy"
        ? parserConfig.legacyParser(text)
        : parserConfig.csvParser(text);

    return {
        rows: parsed.rows,
        issues: parsed.errors.map((error) => normalizeParseIssue(file.name, error)),
    };
}

async function parseDailyAnchorFile(file) {
    const text = await file.text();
    const parsed = parseCsvDailyAnchorText(text);

    return {
        rows: parsed.rows,
        issues: parsed.errors.map((error) => normalizeParseIssue(file.name, error)),
    };
}

function renderValidationSummary(elements, { ok, errorCount, warningCount, signatures }) {
    elements.status.textContent = ok ? "通過" : "阻擋";
    elements.errors.textContent = String(errorCount);
    elements.warnings.textContent = String(warningCount);
    elements.signature.textContent = signatures.bundle ?? "不可用";
}

function formatIssue(issue) {
    const meta = [
        issue.file ? `檔案=${issue.file}` : "",
        issue.lineNumber ? `行號=${issue.lineNumber}` : "",
        issue.ts14 ? `ts14=${issue.ts14}` : "",
        issue.date ? `date=${issue.date}` : "",
    ].filter(Boolean).join(" ");

    return `${issue.message}${meta ? `（${meta}）` : ""}`;
}

function renderIssues(target, issues) {
    target.replaceChildren();

    if (!issues || issues.length === 0) {
        const item = document.createElement("li");
        item.className = "issue-item is-info";
        item.textContent = "目前沒有問題，這包資料已通過瀏覽器端驗證。";
        target.appendChild(item);
        return;
    }

    issues.forEach((issue) => {
        const item = document.createElement("li");
        const tone = issue.severity === "error" ? "is-error" : issue.severity === "warning" ? "is-warning" : "is-info";
        item.className = `issue-item ${tone}`;

        const code = document.createElement("span");
        code.className = "issue-code";
        code.textContent = issue.code;

        const body = document.createElement("span");
        body.textContent = formatIssue(issue);

        item.append(code, body);
        target.appendChild(item);
    });
}

function setValidationIdle(elements, message = "請上傳 M1 與 D1 後再執行正式驗證。") {
    renderValidationSummary(elements, {
        ok: false,
        errorCount: 0,
        warningCount: 0,
        signatures: { bundle: "待產生" },
    });
    setStatusMessage(elements.statusCopy, message);
    renderIssues(elements.issues, []);
    window.__xsLastValidation = null;
}

export function setupValidationPanel() {
    const elements = {
        m1File: document.getElementById("m1-file"),
        d1File: document.getElementById("d1-file"),
        anchorsFile: document.getElementById("anchors-file"),
        requireVolume: document.getElementById("require-volume"),
        allowAnchorRebuild: document.getElementById("allow-anchor-rebuild"),
        validateButton: document.getElementById("validate-data"),
        status: document.getElementById("validation-status"),
        errors: document.getElementById("validation-errors"),
        warnings: document.getElementById("validation-warnings"),
        signature: document.getElementById("validation-signature"),
        statusCopy: document.getElementById("validation-status-copy"),
        issues: document.getElementById("validation-issues"),
    };

    function syncValidateButton() {
        elements.validateButton.disabled = !(elements.m1File.files?.[0] && elements.d1File.files?.[0]);
    }

    [elements.m1File, elements.d1File, elements.anchorsFile, elements.requireVolume, elements.allowAnchorRebuild].forEach((element) => {
        element.addEventListener("change", () => {
            syncValidateButton();
            setStatusMessage(elements.statusCopy, "已準備好驗證目前選取的資料包。");
        });
    });

    syncValidateButton();
    setValidationIdle(elements);

    elements.validateButton.addEventListener("click", async () => {
        const m1File = elements.m1File.files?.[0];
        const d1File = elements.d1File.files?.[0];
        const anchorFile = elements.anchorsFile.files?.[0];

        if (!m1File || !d1File) {
            setStatusMessage(elements.statusCopy, "M1 與 D1 檔案都是必填。", "error");
            return;
        }

        elements.validateButton.disabled = true;
        setStatusMessage(elements.statusCopy, "正在讀取檔案並驗證資料包...", "warning");

        try {
            const [m1Parsed, d1Parsed, anchorParsed] = await Promise.all([
                parseBarFile(m1File, "m1"),
                parseBarFile(d1File, "d1"),
                anchorFile ? parseDailyAnchorFile(anchorFile) : Promise.resolve({ rows: [], issues: [] }),
            ]);

            const parseIssues = [...m1Parsed.issues, ...d1Parsed.issues, ...anchorParsed.issues];
            const result = validateDataBundle(
                {
                    m1Bars: m1Parsed.rows,
                    d1Bars: d1Parsed.rows,
                    dailyAnchors: anchorParsed.rows,
                },
                {
                    requireVolume: elements.requireVolume.checked,
                    allowDailyAnchorRebuild: elements.allowAnchorRebuild.checked,
                },
            );

            const combined = {
                ok: parseIssues.length === 0 && result.ok,
                errorCount: result.errorCount + parseIssues.length,
                warningCount: result.warningCount,
                signatures: result.signatures,
                issues: [...parseIssues, ...result.issues],
                sourceFormats: {
                    m1: result.m1.rows[0]?.source_format ?? "",
                    d1: result.d1.rows[0]?.source_format ?? "",
                    daily_anchor: result.dailyAnchors.rows[0]?.source_format ?? "",
                },
            };

            renderValidationSummary(elements, combined);
            renderIssues(elements.issues, combined.issues);
            window.__xsLastValidation = combined;
            window.dispatchEvent(new CustomEvent("xs:validation-complete", { detail: combined }));

            setStatusMessage(
                elements.statusCopy,
                combined.ok
                    ? "資料包已通過目前的瀏覽器驗證。"
                    : "資料包已被阻擋，請先修正列出的問題再繼續。",
                combined.ok ? "success" : "error",
            );
        } catch (error) {
            renderValidationSummary(elements, {
                ok: false,
                errorCount: 1,
                warningCount: 0,
                signatures: { bundle: "不可用" },
            });
            renderIssues(elements.issues, [{
                code: "validation_runtime_error",
                severity: "error",
                message: String(error.message ?? error),
            }]);
            window.__xsLastValidation = null;
            window.dispatchEvent(new CustomEvent("xs:validation-complete", { detail: null }));
            setStatusMessage(elements.statusCopy, "驗證在執行階段失敗。", "error");
        } finally {
            syncValidateButton();
        }
    });
}
