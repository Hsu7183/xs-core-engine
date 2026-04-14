import {
    buildArtifactBundle,
    createBrowserArtifactStore,
} from "../src/artifacts/index.js";

const DRAFT_KEY = "xs-artifact-draft-v1";

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

function readDraft() {
    try {
        const raw = window.localStorage.getItem(DRAFT_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function writeDraft(value) {
    try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
    } catch {
        // ignore storage failures
    }
}

function safeParseJson(text, fallbackLabel) {
    const value = String(text ?? "").trim();
    if (!value) {
        return {};
    }

    try {
        const parsed = JSON.parse(value);
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
            throw new Error(`${fallbackLabel} 必須是 JSON 物件。`);
        }
        return parsed;
    } catch (error) {
        throw new Error(`${fallbackLabel} 的 JSON 格式錯誤：${String(error.message ?? error)}`);
    }
}

function parseNotes(text) {
    return String(text ?? "")
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
}

function copyButtonText(button, text) {
    button.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(text());
            button.textContent = "已複製";
        } catch {
            button.textContent = "複製失敗";
        }

        window.setTimeout(() => {
            button.textContent = "複製";
        }, 1200);
    });
}

function formatJson(value) {
    return JSON.stringify(value, null, 2);
}

function bundleSnapshotFileName(bundle) {
    const artifactId = String(bundle?.artifactId ?? "xs_artifact_bundle").trim() || "xs_artifact_bundle";
    return `${artifactId}_artifact_bundle.json`;
}

function downloadJsonFile(filename, value) {
    const blob = new Blob([`${formatJson(value)}\n`], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

function compactArtifactLabel(record) {
    if (!record?.artifact_id) {
        return "無";
    }

    const score = Number(record?.metrics?.composite_score);
    if (Number.isFinite(score)) {
        return `${record.artifact_id}（分數 ${score.toFixed(3)}）`;
    }

    return String(record.artifact_id);
}

export function setupArtifactPreviewPanel() {
    const store = createBrowserArtifactStore(window.localStorage);

    const elements = {
        strategyFamily: document.getElementById("artifact-strategy-family"),
        strategyName: document.getElementById("artifact-strategy-name"),
        sourcePath: document.getElementById("artifact-source-path"),
        bestParams: document.getElementById("artifact-best-params"),
        metrics: document.getElementById("artifact-metrics"),
        notes: document.getElementById("artifact-notes"),
        buildButton: document.getElementById("build-artifact"),
        saveButton: document.getElementById("save-artifact-memory"),
        downloadButton: document.getElementById("download-artifact-bundle"),
        clearButton: document.getElementById("clear-artifact-memory"),
        syncHint: document.getElementById("artifact-sync-hint"),
        artifactId: document.getElementById("artifact-id"),
        artifactPolicy: document.getElementById("artifact-policy"),
        artifactSignature: document.getElementById("artifact-signature"),
        artifactStatus: document.getElementById("artifact-status"),
        paramsHeader: document.getElementById("artifact-params-header"),
        summaryJson: document.getElementById("artifact-summary-json"),
        metaJson: document.getElementById("artifact-meta-json"),
        memoryJson: document.getElementById("artifact-memory-json"),
        copyParams: document.getElementById("copy-params-header"),
        copySummary: document.getElementById("copy-summary-json"),
        copyMeta: document.getElementById("copy-meta-json"),
        copyMemory: document.getElementById("copy-memory-json"),
        memoryBestArtifact: document.getElementById("memory-best-artifact"),
        memoryLatestArtifact: document.getElementById("memory-latest-artifact"),
        memoryTop10Count: document.getElementById("memory-top10-count"),
        memoryStatus: document.getElementById("memory-status"),
        memoryBestJson: document.getElementById("memory-best-json"),
        memoryLatestJson: document.getElementById("memory-latest-json"),
        memoryTop10Json: document.getElementById("memory-top10-json"),
        copyBestMemory: document.getElementById("copy-best-memory"),
        copyLatestMemory: document.getElementById("copy-latest-memory"),
        copyTop10Memory: document.getElementById("copy-top10-memory"),
    };

    let currentBundle = null;

    function applyDraft() {
        const draft = readDraft();
        elements.strategyFamily.value = draft.strategyFamily ?? "";
        elements.strategyName.value = draft.strategyName ?? "";
        elements.sourcePath.value = draft.sourcePath ?? "";
        elements.bestParams.value = draft.bestParams ?? "{}";
        elements.metrics.value = draft.metrics ?? "{}";
        elements.notes.value = draft.notes ?? "";
    }

    function persistDraft() {
        writeDraft({
            strategyFamily: elements.strategyFamily.value,
            strategyName: elements.strategyName.value,
            sourcePath: elements.sourcePath.value,
            bestParams: elements.bestParams.value,
            metrics: elements.metrics.value,
            notes: elements.notes.value,
        });
    }

    function renderMemoryState(state = store.readState()) {
        elements.memoryBestArtifact.textContent = compactArtifactLabel(state.bestParams);
        elements.memoryLatestArtifact.textContent = compactArtifactLabel(state.latestMemory);
        elements.memoryTop10Count.textContent = String(state.top10.length);
        elements.memoryBestJson.textContent = state.bestParams ? formatJson(state.bestParams) : "待產生";
        elements.memoryLatestJson.textContent = state.latestMemory ? formatJson(state.latestMemory) : "待產生";
        elements.memoryTop10Json.textContent = state.top10.length > 0 ? formatJson(state.top10) : "待產生";

        setStatusMessage(
            elements.memoryStatus,
            state.top10.length > 0
                ? `目前瀏覽器記憶中有 ${state.top10.length} 筆排行榜資料。`
                : "目前還沒有瀏覽器端 artifact 記憶。",
            state.top10.length > 0 ? "success" : "info",
        );
    }

    function updateSyncHint(message) {
        elements.syncHint.textContent = message;
    }

    function resetPreview(message = "請先完成資料驗證，再填入策略資訊建立 artifact 預覽。") {
        currentBundle = null;
        elements.artifactId.textContent = "待產生";
        elements.artifactPolicy.textContent = "V2";
        elements.artifactSignature.textContent = window.__xsLastValidation?.signatures?.bundle ?? "請先驗資料";
        elements.paramsHeader.textContent = "待產生";
        elements.summaryJson.textContent = "待產生";
        elements.metaJson.textContent = "待產生";
        elements.memoryJson.textContent = "待產生";
        elements.saveButton.disabled = true;
        elements.downloadButton.disabled = true;
        updateSyncHint(
            "Repo 同步橋接：先建立預覽，下載 bundle snapshot，再在此 repo 內執行 `npm.cmd run persist:artifact -- --input path\\to\\bundle.json`。",
        );
        setStatusMessage(elements.artifactStatus, message);
    }

    function updateSignatureFromValidation(validation) {
        elements.artifactSignature.textContent = validation?.signatures?.bundle ?? "請先驗資料";
    }

    function getSourceFormat(validation) {
        if (!validation) {
            return "unknown";
        }

        return [
            validation.sourceFormats?.m1,
            validation.sourceFormats?.d1,
            validation.sourceFormats?.daily_anchor,
        ].filter(Boolean).join("|") || "unknown";
    }

    function buildPreview() {
        const validation = window.__xsLastValidation;
        if (!validation?.ok) {
            throw new Error("請先完成一次成功的資料驗證；artifact 預覽只能建立在通過的資料包上。");
        }

        const strategyFamily = elements.strategyFamily.value.trim();
        const strategyName = elements.strategyName.value.trim();
        const sourceStrategyPath = elements.sourcePath.value.trim();

        if (!strategyFamily || !strategyName) {
            throw new Error("策略家族與策略名稱都必填。");
        }

        const bestParams = safeParseJson(elements.bestParams.value, "Best Params");
        const metrics = safeParseJson(elements.metrics.value, "Metrics");
        const notes = parseNotes(elements.notes.value);

        currentBundle = buildArtifactBundle({
            strategyFamily,
            strategyName,
            sourceStrategyPath,
            policyVersion: "V2",
            sourceFormat: getSourceFormat(validation),
            dataSignature: validation.signatures.bundle,
            bestParams,
            metrics,
            notes,
            artifactStatus: "preview",
        });

        elements.artifactId.textContent = currentBundle.artifactId;
        elements.artifactPolicy.textContent = "V2";
        elements.artifactSignature.textContent = validation.signatures.bundle;
        elements.paramsHeader.textContent = currentBundle.paramsHeader || "(空白)";
        elements.summaryJson.textContent = formatJson(currentBundle.summary);
        elements.metaJson.textContent = formatJson(currentBundle.artifactMeta);
        elements.memoryJson.textContent = formatJson(currentBundle.latestMemory);
        elements.saveButton.disabled = false;
        elements.downloadButton.disabled = false;
        updateSyncHint(
            `Repo 同步橋接：下載 ${bundleSnapshotFileName(currentBundle)}，再在此 repo 內執行 npm.cmd run persist:artifact -- --input path\\to\\${bundleSnapshotFileName(currentBundle)}。`,
        );
        setStatusMessage(elements.artifactStatus, "已根據最新通過的資料包建立 artifact 預覽，接下來可以儲存到瀏覽器記憶，或下載 repo 同步 snapshot。", "success");
    }

    function saveCurrentBundle() {
        if (!currentBundle) {
            throw new Error("請先建立 artifact 預覽。");
        }

        const state = store.saveArtifactBundle(currentBundle);
        renderMemoryState(state);
        setStatusMessage(elements.artifactStatus, "artifact 預覽已存入瀏覽器記憶。", "success");
    }

    function downloadCurrentBundle() {
        if (!currentBundle) {
            throw new Error("請先建立 artifact 預覽。");
        }

        downloadJsonFile(bundleSnapshotFileName(currentBundle), currentBundle);
        setStatusMessage(elements.artifactStatus, "artifact bundle snapshot 已下載，可用 repo persist script 寫入正式記憶檔。", "success");
    }

    [
        elements.strategyFamily,
        elements.strategyName,
        elements.sourcePath,
        elements.bestParams,
        elements.metrics,
        elements.notes,
    ].forEach((element) => {
        element.addEventListener("input", persistDraft);
    });

    elements.buildButton.addEventListener("click", () => {
        try {
            buildPreview();
        } catch (error) {
            setStatusMessage(elements.artifactStatus, String(error.message ?? error), "error");
        }
    });

    elements.saveButton.addEventListener("click", () => {
        try {
            saveCurrentBundle();
        } catch (error) {
            setStatusMessage(elements.artifactStatus, String(error.message ?? error), "error");
        }
    });

    elements.downloadButton.addEventListener("click", () => {
        try {
            downloadCurrentBundle();
        } catch (error) {
            setStatusMessage(elements.artifactStatus, String(error.message ?? error), "error");
        }
    });

    elements.clearButton.addEventListener("click", () => {
        const cleared = store.clear();
        renderMemoryState(cleared);
        setStatusMessage(elements.artifactStatus, "瀏覽器端 artifact 記憶已清除。", "warning");
    });

    window.addEventListener("xs:validation-complete", (event) => {
        updateSignatureFromValidation(event.detail);
        if (!event.detail?.ok) {
            resetPreview("artifact 預覽正在等待一包通過驗證的資料。");
        }
    });

    copyButtonText(elements.copyParams, () => elements.paramsHeader.textContent);
    copyButtonText(elements.copySummary, () => elements.summaryJson.textContent);
    copyButtonText(elements.copyMeta, () => elements.metaJson.textContent);
    copyButtonText(elements.copyMemory, () => elements.memoryJson.textContent);
    copyButtonText(elements.copyBestMemory, () => elements.memoryBestJson.textContent);
    copyButtonText(elements.copyLatestMemory, () => elements.memoryLatestJson.textContent);
    copyButtonText(elements.copyTop10Memory, () => elements.memoryTop10Json.textContent);

    applyDraft();
    renderMemoryState();
    updateSignatureFromValidation(window.__xsLastValidation);
    resetPreview();
}
