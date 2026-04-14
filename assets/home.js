const workflows = {
    best: {
        tag: "Best Return",
        title: "Output the indicator and trading pair for the best-return strategy",
        description:
            "Use validated M1, D1, DailyAnchor, and optimization memory to output the V2-compliant XS pair for the best-return strategy.",
        inputs: [
            "Validated M1, D1, and DailyAnchor data",
            "Best params or optimization memory",
            "Strategy family or strategy name",
            "Data signature and policy version",
        ],
        outputs: [
            "indicator.xs for the best-return strategy",
            "matching trading.xs with the same C1-C5 core",
            "params.txt header string",
            "summary.json and artifact meta",
        ],
        rules: [
            "Validate data before generating code",
            "Keep C1-C5 identical and allow differences in C6 only",
            "Use ROC date-time artifact naming",
            "Store outputs in a GitHub-readable artifact structure",
        ],
        files: [
            { label: "docs/ARTIFACT_SCHEMA.md", href: "docs/ARTIFACT_SCHEMA.md" },
            { label: "docs/JS_RUNTIME_STATUS.md", href: "docs/JS_RUNTIME_STATUS.md" },
            { label: "src/artifacts/store.js", href: "src/artifacts/store.js" },
        ],
        prompt:
            "Use docs/HIGHEST_SPEC_V2.md and the validated M1, D1, DailyAnchor, and optimization memory to output the best-return indicator.xs and trading.xs.\\n" +
            "Requirements:\\n" +
            "1. Check data signature and policy version first.\\n" +
            "2. Apply the best params.\\n" +
            "3. Keep C1-C5 identical across both outputs.\\n" +
            "4. Use ROC date-time artifact naming.",
    },
    new: {
        tag: "New Strategy",
        title: "Output the indicator and trading pair for a new strategy",
        description:
            "Turn a new strategy idea into a V2-compliant indicator.xs and trading.xs pair. The trading version may change C6 only.",
        inputs: [
            "Direction: long-only, short-only, or bi-directional",
            "Entry, exit, filter, and risk-control rules",
            "Requested indicators such as ATR, VWAP, or Donchian",
            "TXT output requirements if needed",
        ],
        outputs: [
            "V2-compliant indicator.xs",
            "V2-compliant trading.xs",
            "strategy exception notes if needed",
            "auditable named conditions and output format",
        ],
        rules: [
            "Use anchored previous-bar data for formal decisions",
            "Use current-bar open only for trigger and execution",
            "Block future values, floating values, and same-bar double execution",
            "Keep TXT output as one full string with a single Print argument",
        ],
        files: [
            { label: "docs/HIGHEST_SPEC_V2.md", href: "docs/HIGHEST_SPEC_V2.md" },
            { label: "templates/base_indicator.xs", href: "templates/base_indicator.xs" },
            { label: "templates/base_trading.xs", href: "templates/base_trading.xs" },
        ],
        prompt:
            "Use docs/HIGHEST_SPEC_V2.md to turn my new strategy logic into indicator.xs and trading.xs.\\n" +
            "Requirements:\\n" +
            "1. Build the shared C1-C5 core first.\\n" +
            "2. Use only previous-bar or older anchored data for formal trading decisions.\\n" +
            "3. Use the current-bar open only for trigger and execution.\\n" +
            "4. Keep trading.xs different in C6 only.",
    },
    refactor: {
        tag: "Refactor Old XS",
        title: "Upload old XS and rewrite it into a compliant indicator and trading pair",
        description:
            "Audit old indicator or trading XS first, then rewrite it into a V2-compliant pair without preserving invalid legacy behavior.",
        inputs: [
            "Old indicator.xs or trading.xs source code",
            "Direction and logic that must be preserved",
            "Whether to keep the old params, exits, and TXT format",
            "Any explicit strategy exception notes",
        ],
        outputs: [
            "V2-compliant indicator.xs",
            "V2-compliant trading.xs",
            "summary of rule violations in the old code",
            "rewritten core conditions in named form",
        ],
        rules: [
            "Old strategy code is reference only, never law",
            "Rewrite same-bar, floating-value, and unsafe-read patterns",
            "Document strategy exceptions when needed",
            "End with a shared C1-C5 core and separate C6 output layers",
        ],
        files: [
            { label: "docs/BACKUP_01_INTEGRATION.md", href: "docs/BACKUP_01_INTEGRATION.md" },
            { label: "docs/HIGHEST_SPEC_V2.md", href: "docs/HIGHEST_SPEC_V2.md" },
            { label: "docs/START_HERE.md", href: "docs/START_HERE.md" },
        ],
        prompt:
            "Audit the old XS code against docs/HIGHEST_SPEC_V2.md, list the violations, then rewrite it into indicator.xs and trading.xs.\\n" +
            "Requirements:\\n" +
            "1. Old code is reference only.\\n" +
            "2. Formal trading decisions must use previous-bar anchored data.\\n" +
            "3. trading.xs may change the output layer only.\\n" +
            "4. Document strategy exceptions if they exist.",
    },
    export: {
        tag: "XQ Export",
        title: "Output XQ Print scripts for M1, D1, and related database feeds",
        description:
            "Generate XS export scripts that can run on XQ and Print stable M1, D1, and DailyAnchor data before those rows enter your database.",
        inputs: [
            "Which feeds to export: M1, D1, DailyAnchor",
            "Where each script runs inside XQ",
            "TXT path and file naming rules",
            "Legacy 01 format or new CSV format",
        ],
        outputs: [
            "M1 export XS script for XQ",
            "D1 export XS script for XQ",
            "DailyAnchor export XS script for XQ",
            "notes for database import and validation",
        ],
        rules: [
            "Export first, validate second, store third, then optimize and generate strategies",
            "Use a format that the JS data layer can validate",
            "Normalize ts14 and check duplicate and bad-price rows",
            "Do not place large raw datasets directly into the main GitHub repo",
        ],
        files: [
            { label: "docs/DATA_PIPELINE.md", href: "docs/DATA_PIPELINE.md" },
            { label: "templates/exporters/m1_export.xs", href: "templates/exporters/m1_export.xs" },
            { label: "templates/exporters/d1_export.xs", href: "templates/exporters/d1_export.xs" },
        ],
        prompt:
            "Generate XS export scripts for XQ that Print M1, D1, and DailyAnchor data.\\n" +
            "Requirements:\\n" +
            "1. State which chart frequency each script must run on.\\n" +
            "2. Use an export format that the JS data layer can validate.\\n" +
            "3. Build one full output string before calling Print.\\n" +
            "4. Explain which database table each export belongs to.",
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
        copyButton.textContent = "Copied";
    } catch {
        copyButton.textContent = "Failed";
    }

    setTimeout(() => {
        copyButton.textContent = "Copy";
    }, 1200);
});

setWorkflow("best");
