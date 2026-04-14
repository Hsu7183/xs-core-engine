import { setupValidationPanel } from "./validator.js";
import { setupArtifactPreviewPanel } from "./artifacts-ui.js";

const workflows = {
    best: {
        tag: "最佳報酬配對",
        title: "輸出最佳報酬策略的指標版與交易版配對",
        description:
            "使用已驗證的 M1、D1、DailyAnchor 與最佳化記憶，輸出符合 V2 的 XS 成對結果。",
        inputs: [
            "已驗證的 M1、D1、DailyAnchor 資料",
            "最佳參數或最佳化記憶",
            "策略家族或策略名稱",
            "資料簽章與 policy 版本",
        ],
        outputs: [
            "最佳報酬策略的 indicator.xs",
            "與其共用相同 C1~C5 核心的 trading.xs",
            "params.txt 標頭字串",
            "summary.json 與 artifact meta",
        ],
        rules: [
            "先驗資料，再生成程式",
            "指標版與交易版必須 C1~C5 完全一致，只有 C6 可不同",
            "使用民國年月日時分 artifact 命名",
            "輸出必須落在 GitHub 可讀的 artifact 結構中",
        ],
        files: [
            { label: "docs/ARTIFACT_SCHEMA.md", href: "docs/ARTIFACT_SCHEMA.md" },
            { label: "docs/JS_RUNTIME_STATUS.md", href: "docs/JS_RUNTIME_STATUS.md" },
            { label: "src/artifacts/store.js", href: "src/artifacts/store.js" },
        ],
        prompt:
            "請依 docs/HIGHEST_SPEC_V2.md，使用已驗證的 M1、D1、DailyAnchor 與最佳化記憶，輸出最佳報酬策略的 indicator.xs 與 trading.xs。\\n" +
            "要求：\\n" +
            "1. 先檢查 data signature 與 policy version。\\n" +
            "2. 套用 best params。\\n" +
            "3. 兩個輸出必須維持 C1~C5 完全一致。\\n" +
            "4. 使用民國年月日時分 artifact 命名。",
    },
    new: {
        tag: "新策略配對",
        title: "把新策略想法轉成指標版與交易版配對",
        description:
            "把新策略邏輯整理成符合 V2 的 indicator.xs 與 trading.xs；交易版只能在 C6 有差異。",
        inputs: [
            "方向設定：只做多、只做空、或雙向",
            "進場、出場、過濾、風控規則",
            "指定指標，例如 ATR、VWAP、Donchian",
            "若需要，提供 TXT 輸出需求",
        ],
        outputs: [
            "符合 V2 的 indicator.xs",
            "符合 V2 的 trading.xs",
            "必要時的策略例外說明",
            "可稽核的命名條件與輸出格式",
        ],
        rules: [
            "正式決策只能使用前一根或更早的定錨資料",
            "當根只允許拿來做觸發與執行價",
            "禁止未來值、浮動值、同棒雙重執行",
            "TXT 輸出必須先組完整字串，再只呼叫一次 Print",
        ],
        files: [
            { label: "docs/HIGHEST_SPEC_V2.md", href: "docs/HIGHEST_SPEC_V2.md" },
            { label: "templates/base_indicator.xs", href: "templates/base_indicator.xs" },
            { label: "templates/base_trading.xs", href: "templates/base_trading.xs" },
        ],
        prompt:
            "請依 docs/HIGHEST_SPEC_V2.md，把我的新策略邏輯整理成 indicator.xs 與 trading.xs。\\n" +
            "要求：\\n" +
            "1. 先建立共用的 C1~C5 核心。\\n" +
            "2. 正式交易判斷只能用前一根或更早的定錨資料。\\n" +
            "3. 當根 open 只能拿來做觸發與執行。\\n" +
            "4. trading.xs 只能在 C6 與 indicator.xs 不同。",
    },
    refactor: {
        tag: "重構舊 XS",
        title: "上傳舊 XS，重寫成合規的指標版與交易版配對",
        description:
            "先審視舊的 indicator 或 trading XS，再重寫成符合 V2 的成對版本，不保留不合法的舊行為。",
        inputs: [
            "舊 indicator.xs 或 trading.xs 原始碼",
            "必須保留的方向與邏輯",
            "是否保留舊參數、出場、TXT 格式",
            "任何明確的策略例外說明",
        ],
        outputs: [
            "符合 V2 的 indicator.xs",
            "符合 V2 的 trading.xs",
            "舊碼違規點摘要",
            "重寫後的命名核心條件",
        ],
        rules: [
            "舊策略程式只能參考，不能當法源",
            "必須改寫同棒、浮動值與不安全讀值模式",
            "有策略例外時要明確寫出",
            "最終結果必須是共用 C1~C5、分離 C6 的配對結構",
        ],
        files: [
            { label: "docs/BACKUP_01_INTEGRATION.md", href: "docs/BACKUP_01_INTEGRATION.md" },
            { label: "docs/HIGHEST_SPEC_V2.md", href: "docs/HIGHEST_SPEC_V2.md" },
            { label: "docs/START_HERE.md", href: "docs/START_HERE.md" },
        ],
        prompt:
            "請先依 docs/HIGHEST_SPEC_V2.md 審核這份舊 XS，列出違規點，再重寫成 indicator.xs 與 trading.xs。\\n" +
            "要求：\\n" +
            "1. 舊碼只能參考，不能直接沿用。\\n" +
            "2. 正式交易判斷必須使用前一根定錨資料。\\n" +
            "3. trading.xs 只能改輸出層。\\n" +
            "4. 若有策略例外請明確記錄。",
    },
    export: {
        tag: "XQ 匯出",
        title: "輸出 XQ 用的 M1、D1 與資料匯出腳本",
        description:
            "產生可在 XQ 執行的 XS 匯出腳本，在資料進入資料庫之前先穩定輸出 M1、D1、DailyAnchor。",
        inputs: [
            "要匯出的資料：M1、D1、DailyAnchor",
            "每支腳本在 XQ 哪個圖表頻率執行",
            "TXT 路徑與檔名規則",
            "legacy 01 格式或新的 CSV 格式",
        ],
        outputs: [
            "XQ 用 M1 匯出 XS",
            "XQ 用 D1 匯出 XS",
            "XQ 用 DailyAnchor 匯出 XS",
            "資料入庫與驗證說明",
        ],
        rules: [
            "流程順序必須是：先匯出、再驗證、再存放、最後最佳化與生成策略",
            "匯出格式必須能被 JS 資料層驗證",
            "要正規化 ts14，並檢查重複列與壞價格列",
            "不要把大型原始資料直接放進主 GitHub repo",
        ],
        files: [
            { label: "docs/DATA_PIPELINE.md", href: "docs/DATA_PIPELINE.md" },
            { label: "templates/exporters/m1_export.xs", href: "templates/exporters/m1_export.xs" },
            { label: "templates/exporters/d1_export.xs", href: "templates/exporters/d1_export.xs" },
        ],
        prompt:
            "請產生可在 XQ 執行、用來輸出 M1、D1、DailyAnchor 的 XS 匯出腳本。\\n" +
            "要求：\\n" +
            "1. 明確說明每支腳本要跑在哪個圖表頻率。\\n" +
            "2. 匯出格式必須能被 JS 資料層驗證。\\n" +
            "3. 呼叫 Print 前要先組完整輸出字串。\\n" +
            "4. 說明每種匯出對應哪個資料表。",
    },
};

const tagEl = document.getElementById("workflow-tag");
const titleEl = document.getElementById("workflow-title");
const descriptionEl = document.getElementById("workflow-description");
const inputsEl = document.getElementById("workflow-inputs");
const outputsEl = document.getElementById("workflow-outputs");
const rulesEl = document.getElementById("workflow-rules");
const filesEl = document.getElementById("workflow-files");
const promptEl = document.getElementById("workflow-prompt");
const copyButton = document.getElementById("copy-prompt");
const choices = [...document.querySelectorAll(".choice")];

function renderList(target, items, linkMode = false) {
    target.innerHTML = "";

    items.forEach((item) => {
        const li = document.createElement("li");

        if (linkMode) {
            const link = document.createElement("a");
            link.href = item.href;
            link.textContent = item.label;
            li.appendChild(link);
        } else {
            li.textContent = item;
        }

        target.appendChild(li);
    });
}

function setWorkflow(name) {
    const workflow = workflows[name];
    if (!workflow) {
        return;
    }

    tagEl.textContent = workflow.tag;
    titleEl.textContent = workflow.title;
    descriptionEl.textContent = workflow.description;
    promptEl.textContent = workflow.prompt;

    renderList(inputsEl, workflow.inputs);
    renderList(outputsEl, workflow.outputs);
    renderList(rulesEl, workflow.rules);
    renderList(filesEl, workflow.files, true);

    choices.forEach((choice) => {
        const active = choice.dataset.workflow === name;
        choice.classList.toggle("is-active", active);
    });
}

choices.forEach((choice) => {
    choice.addEventListener("click", () => setWorkflow(choice.dataset.workflow));
});

copyButton.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(promptEl.textContent);
        copyButton.textContent = "已複製";
    } catch {
        copyButton.textContent = "複製失敗";
    }

    setTimeout(() => {
        copyButton.textContent = "複製";
    }, 1200);
});

setupValidationPanel();
setupArtifactPreviewPanel();
setWorkflow("best");
