(function () {
    const bundledRepoData = window.__XS_REPO_DATA_BUNDLE?.datasets || {};
    const bundledTextCache = Object.create(null);

    function getBundledDataset(kind) {
        return bundledRepoData && bundledRepoData[kind] ? bundledRepoData[kind] : null;
    }

    function hasCompareData() {
        return Boolean(getBundledDataset("m1") && getBundledDataset("d1"));
    }

    function formatCount(value) {
        const count = Number(value);
        return Number.isFinite(count) ? count.toLocaleString("en-US") : "未知";
    }

    function formatDateLabel(value) {
        const digits = String(value || "").replace(/\D+/g, "").slice(0, 8);
        if (digits.length !== 8) {
            return "未知";
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
            return "未知";
        }

        const start = formatDateLabel(range.startDate) + (range.startTime ? " " + formatTimeLabel(range.startTime) : "");
        const end = formatDateLabel(range.endDate) + (range.endTime ? " " + formatTimeLabel(range.endTime) : "");
        return start + " -> " + end;
    }

    function datasetFileName(dataset) {
        return String(dataset?.path || "").split("/").pop() || "";
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
            target.appendChild(createSummaryRow("狀態", "目前沒有程式內建資料摘要。"));
            return;
        }

        target.classList.remove("is-empty");

        const badge = document.createElement("span");
        badge.className = "upload-summary-badge";
        badge.textContent = "程式內建";
        target.appendChild(badge);
        target.appendChild(createSummaryRow("載入", "已掛載首頁預設資料"));
        target.appendChild(createSummaryRow("期間", formatRangeLabel(dataset.range)));
        target.appendChild(createSummaryRow("筆數", formatCount(dataset.rows) + " 筆"));
        target.appendChild(createSummaryRow("來源", dataset.path || datasetFileName(dataset)));
    }

    function renderSummaries(targets = {}) {
        renderDatasetSummary(targets.m1Target, getBundledDataset("m1"));
        renderDatasetSummary(targets.d1Target, getBundledDataset("d1"));
    }

    function buildStatusText() {
        if (!hasCompareData()) {
            return "目前這些數值還沒有經過 M1 / D1 與 XQ TXT 驗證。DA 會由 D1 自動推導。";
        }

        const m1 = getBundledDataset("m1");
        const d1 = getBundledDataset("d1");
        return "已掛載程式內建 M1 / D1 資料摘要，並顯示資料起訖期間。M1："
            + formatRangeLabel(m1.range)
            + "；D1："
            + formatRangeLabel(d1.range)
            + "。";
    }

    async function readDataset(kind) {
        const dataset = getBundledDataset(kind);
        if (!dataset?.path) {
            return null;
        }

        if (bundledTextCache[kind]) {
            return {
                name: datasetFileName(dataset),
                text: bundledTextCache[kind],
                source: "bundled",
            };
        }

        if (typeof fetch !== "function") {
            return null;
        }

        try {
            const response = await fetch(dataset.path, { cache: "no-store" });
            if (!response.ok) {
                return null;
            }

            const text = await response.text();
            bundledTextCache[kind] = text;
            return {
                name: datasetFileName(dataset),
                text: text,
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
