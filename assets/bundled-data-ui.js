(function () {
    const bundledRepoData = window.__XS_REPO_DATA_BUNDLE?.datasets || {};
    const bundledTextCache = Object.create(null);
    const bundledManifestCache = Object.create(null);

    function getBundledDataset(kind) {
        return bundledRepoData && bundledRepoData[kind] ? bundledRepoData[kind] : null;
    }

    function joinBundledPath(basePath, filePath) {
        const base = String(basePath || "").replace(/\/+$/, "");
        const file = String(filePath || "").replace(/^\/+/, "");
        if (!base) {
            return file;
        }
        return base + "/" + file;
    }

    function datasetParts(dataset, manifest) {
        if (dataset?.path) {
            return [dataset.path];
        }
        if (Array.isArray(dataset?.paths) && dataset.paths.length) {
            return dataset.paths.slice();
        }
        if (Array.isArray(manifest?.parts) && manifest.parts.length) {
            return manifest.parts
                .map(function (part) {
                    const file = typeof part === "string" ? part : part?.file;
                    return file ? joinBundledPath(dataset?.basePath, file) : "";
                })
                .filter(Boolean);
        }
        return [];
    }

    function datasetPartCount(dataset) {
        const count = Number(dataset?.partCount);
        if (Number.isFinite(count) && count > 0) {
            return count;
        }
        return datasetParts(dataset).length;
    }

    function hasCompareData() {
        return Boolean(getBundledDataset("m1") && getBundledDataset("d1"));
    }

    function formatCount(value) {
        const count = Number(value);
        return Number.isFinite(count) ? count.toLocaleString("en-US") : "未提供";
    }

    function formatDateLabel(value) {
        const digits = String(value || "").replace(/\D+/g, "").slice(0, 8);
        if (digits.length !== 8) {
            return "未提供";
        }
        return digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6, 8);
    }

    function formatTimeLabel(value) {
        const digits = String(value || "").replace(/\D+/g, "").padStart(6, "0").slice(-6);
        if (!digits.trim()) {
            return "";
        }
        return digits.slice(0, 2) + ":" + digits.slice(2, 4) + ":" + digits.slice(4, 6);
    }

    function formatRangeLabel(range) {
        if (!range) {
            return "未提供";
        }

        const start = formatDateLabel(range.startDate) + (range.startTime ? " " + formatTimeLabel(range.startTime) : "");
        const end = formatDateLabel(range.endDate) + (range.endTime ? " " + formatTimeLabel(range.endTime) : "");
        return start + " -> " + end;
    }

    function datasetSourceLabel(dataset) {
        if (dataset?.path && Number(dataset?.partCount) > 1) {
            return "月分片合併快照";
        }

        const count = datasetPartCount(dataset);
        if (count > 1) {
            return count + " 個月分片";
        }

        const parts = datasetParts(dataset);
        if (parts.length === 1) {
            return parts[0];
        }

        return dataset?.manifestPath || "未提供";
    }

    function datasetFileName(dataset, resolvedParts) {
        const parts = Array.isArray(resolvedParts) ? resolvedParts : datasetParts(dataset);
        return parts.length ? String(parts[parts.length - 1]).split("/").pop() || "" : "";
    }

    function createSummaryRow(label, value) {
        const row = document.createElement("div");
        row.className = "upload-summary-row";

        const labelEl = document.createElement("span");
        labelEl.className = "upload-summary-label";
        labelEl.textContent = label;

        const valueEl = document.createElement("span");
        valueEl.className = "upload-summary-value";
        valueEl.textContent = value;

        row.append(labelEl, valueEl);
        return row;
    }

    function renderDatasetSummary(target, dataset) {
        if (!target) {
            return;
        }

        target.replaceChildren();

        if (!dataset) {
            target.classList.add("is-empty");
            target.appendChild(createSummaryRow("狀態", "目前沒有內建資料"));
            return;
        }

        target.classList.remove("is-empty");

        const badge = document.createElement("span");
        badge.className = "upload-summary-badge";
        badge.textContent = "內建資料";
        target.appendChild(badge);
        target.appendChild(createSummaryRow("格式", dataset.sourceFormat || "未提供"));
        target.appendChild(createSummaryRow("期間", formatRangeLabel(dataset.range)));
        target.appendChild(createSummaryRow("筆數", formatCount(dataset.rows) + " 筆"));
        target.appendChild(createSummaryRow("來源", datasetSourceLabel(dataset)));
    }

    function renderSummaries(targets = {}) {
        renderDatasetSummary(targets.m1Target, getBundledDataset("m1"));
        renderDatasetSummary(targets.d1Target, getBundledDataset("d1"));
    }

    function buildStatusText() {
        if (!hasCompareData()) {
            return "目前這些數值還沒有經過 M1 / D1 與 XQ TXT 驗證。定錨資料會由 D1 自動推導。";
        }

        const m1 = getBundledDataset("m1");
        const d1 = getBundledDataset("d1");
        return "內建資料已覆蓋可驗證期間。M1：" + formatRangeLabel(m1.range)
            + "；D1：" + formatRangeLabel(d1.range)
            + "。定錨資料會由 D1 自動推導。";
    }

    async function fetchDatasetPart(path) {
        if (typeof fetch !== "function") {
            return null;
        }

        const response = await fetch(path, { cache: "no-store" });
        if (!response.ok) {
            throw new Error("failed_to_fetch:" + path);
        }
        return response.text();
    }

    async function readDatasetManifest(dataset) {
        if (!dataset?.manifestPath || typeof fetch !== "function") {
            return null;
        }

        if (!bundledManifestCache[dataset.manifestPath]) {
            bundledManifestCache[dataset.manifestPath] = fetch(dataset.manifestPath, { cache: "no-store" })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("failed_to_fetch_manifest:" + dataset.manifestPath);
                    }
                    return response.json();
                });
        }

        try {
            return await bundledManifestCache[dataset.manifestPath];
        } catch {
            delete bundledManifestCache[dataset.manifestPath];
            return null;
        }
    }

    function normalizeJoinedText(parts) {
        const lines = [];
        parts.forEach(function (text) {
            String(text || "")
                .replace(/\r\n/g, "\n")
                .split("\n")
                .forEach(function (line) {
                    const trimmed = line.trim();
                    if (trimmed) {
                        lines.push(trimmed);
                    }
                });
        });
        return lines.length ? lines.join("\n") + "\n" : "";
    }

    async function readDataset(kind) {
        const dataset = getBundledDataset(kind);
        if (bundledTextCache[kind]) {
            return {
                name: bundledTextCache[kind].name,
                text: bundledTextCache[kind].text,
                source: "bundled",
            };
        }

        try {
            const manifest = await readDatasetManifest(dataset);
            const parts = datasetParts(dataset, manifest);
            if (!parts.length) {
                return null;
            }

            const texts = await Promise.all(parts.map(fetchDatasetPart));
            const combinedText = normalizeJoinedText(texts);
            const cached = {
                name: datasetFileName(dataset, parts),
                text: combinedText,
            };
            bundledTextCache[kind] = cached;
            return {
                name: cached.name,
                text: cached.text,
                source: "bundled",
            };
        } catch {
            return null;
        }
    }

    window.__XSBundledData = {
        hasCompareData,
        buildStatusText,
        renderSummaries,
        readDataset,
    };
})();
