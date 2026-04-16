(function () {
    const workflows = {
        best: {
            tag: "模式 01",
            title: "最佳報酬配對",
            description: "從已驗證資料、最佳參數與 artifact memory，往正式成對 XS 生成流程前進。",
            steps: [
                "先打開 docs/HIGHEST_SPEC_V2.md，確認這次輸出仍以 V2 為唯一法源。",
                "確認你手上的 M1 / D1 與 best params 已準備好。",
                "下一句直接叫我：依 V2 幫我做最佳報酬配對的 indicator / trading。"
            ],
            files: [
                { label: "核心規範", href: "docs/HIGHEST_SPEC_V2.md" },
                { label: "成果物結構", href: "docs/ARTIFACT_SCHEMA.md" },
                { label: "JS 執行狀態", href: "docs/JS_RUNTIME_STATUS.md" }
            ],
            primary: { label: "開啟核心規範", href: "docs/HIGHEST_SPEC_V2.md" },
            secondary: { label: "開啟成果物結構", href: "docs/ARTIFACT_SCHEMA.md" },
            prompt: "依 docs/HIGHEST_SPEC_V2.md 幫我開始做最佳報酬配對，先檢查資料與 artifact memory，再生成 indicator.xs 和 trading.xs。"
        },
        new: {
            tag: "模式 02",
            title: "新策略配對",
            description: "把新的策略想法轉成符合 V2 的 indicator / trading 正式配對。",
            steps: [
                "先明確寫出進場、出場、濾網、風控與方向限制。",
                "打開 docs/HIGHEST_SPEC_V2.md，再對照 base templates。",
                "下一句直接叫我：依 V2 把這個新策略轉成正式成對 XS。"
            ],
            files: [
                { label: "核心規範", href: "docs/HIGHEST_SPEC_V2.md" },
                { label: "指標模板", href: "templates/base_indicator.xs" },
                { label: "交易模板", href: "templates/base_trading.xs" }
            ],
            primary: { label: "開啟核心規範", href: "docs/HIGHEST_SPEC_V2.md" },
            secondary: { label: "開啟指標模板", href: "templates/base_indicator.xs" },
            prompt: "依 docs/HIGHEST_SPEC_V2.md 幫我把新策略做成正式 paired XS，先建立 C1~C5 共用核心，再分流 C6。"
        },
        refactor: {
            tag: "模式 03",
            title: "重構舊 XS",
            description: "先審核舊碼問題，再改寫成符合 V2 的正式 indicator / trading 結構。",
            steps: [
                "準備舊版 indicator.xs 或 trading.xs 原始碼。",
                "先對照 HIGHEST_SPEC_V2 與 BACKUP_01_INTEGRATION，分清楚法源與參考。",
                "下一句直接叫我：先審核違規點，再重構成正式 paired XS。"
            ],
            files: [
                { label: "核心規範", href: "docs/HIGHEST_SPEC_V2.md" },
                { label: "起點文件", href: "docs/START_HERE.md" },
                { label: "舊版參考整合", href: "docs/BACKUP_01_INTEGRATION.md" }
            ],
            primary: { label: "開啟核心規範", href: "docs/HIGHEST_SPEC_V2.md" },
            secondary: { label: "開啟舊版參考", href: "docs/BACKUP_01_INTEGRATION.md" },
            prompt: "依 docs/HIGHEST_SPEC_V2.md 先審核這份舊 XS 的違規點，再重構成 indicator.xs 和 trading.xs。"
        },
        export: {
            tag: "模式 04",
            title: "匯出 XQ 資料腳本",
            description: "生成 XQ 匯出腳本，先把 M1 / D1 正式拉成可驗證資料。",
            steps: [
                "先確認你要匯出的頻率、檔案格式與落地路徑。",
                "打開 DATA_CONTRACT 與 exporter templates，確認輸出欄位。",
                "下一句直接叫我：幫我生成 XQ 的 M1 / D1 匯出腳本。"
            ],
            files: [
                { label: "資料契約", href: "docs/DATA_CONTRACT.md" },
                { label: "資料流程", href: "docs/DATA_PIPELINE.md" },
                { label: "M1 匯出模板", href: "templates/exporters/m1_export.xs" }
            ],
            primary: { label: "開啟資料契約", href: "docs/DATA_CONTRACT.md" },
            secondary: { label: "開啟 M1 匯出模板", href: "templates/exporters/m1_export.xs" },
            prompt: "依 docs/HIGHEST_SPEC_V2.md 與 docs/DATA_CONTRACT.md，幫我生成 XQ 的 M1 / D1 匯出腳本。"
        }
    };

    const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
    const modeTag = document.getElementById("mode-tag");
    const modeTitle = document.getElementById("mode-title");
    const modeDescription = document.getElementById("mode-description");
    const modeSteps = document.getElementById("mode-steps");
    const modeFiles = document.getElementById("mode-files");
    const modePrompt = document.getElementById("mode-prompt");
    const copyPromptButton = document.getElementById("copy-mode-prompt");
    const openPrimaryFile = document.getElementById("open-primary-file");
    const openSecondaryFile = document.getElementById("open-secondary-file");

    function renderList(target, items, asLinks) {
        target.innerHTML = "";

        items.forEach(function (item) {
            const li = document.createElement("li");

            if (asLinks) {
                const link = document.createElement("a");
                link.href = item.href;
                link.textContent = item.label;
                link.className = "inline-link";
                li.appendChild(link);
            } else {
                li.textContent = item;
            }

            target.appendChild(li);
        });
    }

    function setMode(modeName) {
        const workflow = workflows[modeName];
        if (!workflow) {
            return;
        }

        modeTag.textContent = workflow.tag;
        modeTitle.textContent = workflow.title;
        modeDescription.textContent = workflow.description;
        modePrompt.value = workflow.prompt;

        renderList(modeSteps, workflow.steps, false);
        renderList(modeFiles, workflow.files, true);

        openPrimaryFile.href = workflow.primary.href;
        openPrimaryFile.textContent = workflow.primary.label;
        openSecondaryFile.href = workflow.secondary.href;
        openSecondaryFile.textContent = workflow.secondary.label;

        modeButtons.forEach(function (button) {
            button.classList.toggle("is-active", button.dataset.mode === modeName);
        });
    }

    function fallbackCopy(text) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "readonly");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        let copied = false;
        try {
            copied = document.execCommand("copy");
        } catch {
            copied = false;
        }

        document.body.removeChild(textarea);
        return copied;
    }

    async function copyPrompt() {
        const text = modePrompt.value;
        let copied = false;

        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                copied = true;
            } catch {
                copied = false;
            }
        }

        if (!copied) {
            copied = fallbackCopy(text);
        }

        copyPromptButton.textContent = copied ? "已複製" : "複製失敗";

        window.setTimeout(function () {
            copyPromptButton.textContent = "複製";
        }, 1200);
    }

    modeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            setMode(button.dataset.mode);
        });
    });

    copyPromptButton.addEventListener("click", function () {
        copyPrompt();
    });

    setMode("best");
})();
