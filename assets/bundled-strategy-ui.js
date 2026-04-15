(function () {
    function countMeaningfulLines(text) {
        return String(text || "")
            .split(/\r?\n/)
            .map(function (line) { return line.trim(); })
            .filter(Boolean)
            .length;
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

    function renderCard(target, payload) {
        if (!target) {
            return;
        }

        target.replaceChildren();

        const badge = document.createElement("span");
        badge.className = "upload-summary-badge";
        badge.textContent = "首頁預設";
        target.appendChild(badge);
        target.appendChild(createSummaryRow("載入", "未另上傳時直接使用這份"));
        target.appendChild(createSummaryRow("策略", payload.strategyName || "最佳報酬配對"));
        target.appendChild(createSummaryRow("檔名", payload.fileName || ""));
        target.appendChild(createSummaryRow("行數", String(countMeaningfulLines(payload.code)) + " 行"));
        target.appendChild(createSummaryRow("來源", "目前下方輸出的預設版本"));
    }

    function renderSummaries(targets, payload) {
        renderCard(targets.indicatorTarget, {
            strategyName: payload.strategyName,
            fileName: payload.indicatorFileName,
            code: payload.indicatorCode,
        });
        renderCard(targets.tradingTarget, {
            strategyName: payload.strategyName,
            fileName: payload.tradingFileName,
            code: payload.tradingCode,
        });
    }

    window.__XSBundledStrategyUi = {
        renderSummaries,
    };
})();
