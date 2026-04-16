(function () {
    const STORAGE_KEY = "xs-home-best-history-v3";
    const VERIFICATION_REVISION = "2026-04-16-weekly-kpi-detail-v1";
    const XQ_ACTIONS = {
        longEntry: "\u65b0\u8cb7",
        shortEntry: "\u65b0\u8ce3",
        longExit: "\u5e73\u8ce3",
        shortExit: "\u5e73\u8cb7",
        forceExit: "\u5f37\u5236\u5e73\u5009",
    };
    const BEST_ID_KEY = "xs-home-best-id-v1";
    const GATE_SETTINGS_KEY = "xs-home-gate-settings-v1";
    const DEFAULT_BEST_RETURN = 106.0;
    const DEFAULT_COMPARE_SETTINGS = {
        capital: 1000000,
        pointValue: 200,
        sideCostPoints: 2,
    };
    const DEFAULT_BEST_METRICS = {
        totalReturn: null,
        maxDrawdown: null,
        tradeCount: null,
        annualReturns: [
            { year: "待驗證", value: null },
        ],
    };
    const SVG_NS = "http://www.w3.org/2000/svg";
    const PERFORMANCE_RANGE_GROUPS = {
        week: {
            keys: ["week_1", "week_2", "week_3", "week_4"],
            spanLabel: function (span) { return span === 1 ? "當週" : ("近" + span + "週"); },
        },
        month: {
            keys: ["month_1", "month_2", "month_3", "month_4", "month_5", "month_6"],
            spanLabel: function (span) { return span === 1 ? "當月" : ("近" + span + "月"); },
        },
        year: {
            keys: ["year_1", "year_2", "year_3", "year_4", "year_5", "year_6"],
            spanLabel: function (span) { return span === 1 ? "今年" : ("近" + span + "年"); },
        },
    };
    const PERFORMANCE_PERIOD_DEFS = {
        week_1: { group: "week", span: 1 },
        week_2: { group: "week", span: 2 },
        week_3: { group: "week", span: 3 },
        week_4: { group: "week", span: 4 },
        month_1: { group: "month", span: 1 },
        month_2: { group: "month", span: 2 },
        month_3: { group: "month", span: 3 },
        month_4: { group: "month", span: 4 },
        month_5: { group: "month", span: 5 },
        month_6: { group: "month", span: 6 },
        year_1: { group: "year", span: 1 },
        year_2: { group: "year", span: 2 },
        year_3: { group: "year", span: 3 },
        year_4: { group: "year", span: 4 },
        year_5: { group: "year", span: 5 },
        year_6: { group: "year", span: 6 },
    };
    const PERFORMANCE_RANGE_ORDER = [
        "week_1", "week_2", "week_3", "week_4",
        "month_1", "month_2", "month_3", "month_4", "month_5", "month_6",
        "year_1", "year_2", "year_3", "year_4", "year_5", "year_6",
        "all",
    ];
    const PERFORMANCE_RANGE_OPTIONS = Object.keys(PERFORMANCE_PERIOD_DEFS).map(function (key) {
        const definition = PERFORMANCE_PERIOD_DEFS[key];
        return {
            key: key,
            label: (PERFORMANCE_RANGE_GROUPS[definition.group] || PERFORMANCE_RANGE_GROUPS.week).spanLabel(definition.span),
            years: definition.group === "year" ? definition.span : null,
        };
    });
    const PROFILES = {
        breakout: {
            DonLen: "274",
            ATRLen: "2",
            EMAWarmBars: "1",
            EntryBufferPts: "84",
            DonBufferPts: "117",
            MinATRD: "127",
            ATRStopK: "0.57",
            ATRTakeProfitK: "0.81",
            MaxEntriesPerDay: "10",
            TimeStopBars: "60",
            MinRunPctAnchor: "0.22",
            TrailStartPctAnchor: "0.71",
            TrailGivePctAnchor: "0.02",
            UseAnchorExit: "1",
            AnchorBackPct: "0.82",
            SysHistDBars: "600",
            SysHistMBars: "20000",
        },
        ema: {
            DonLen: "220",
            ATRLen: "3",
            EMAWarmBars: "2",
            EntryBufferPts: "72",
            DonBufferPts: "96",
            MinATRD: "110",
            ATRStopK: "0.64",
            ATRTakeProfitK: "0.88",
            MaxEntriesPerDay: "8",
            TimeStopBars: "48",
            MinRunPctAnchor: "0.18",
            TrailStartPctAnchor: "0.58",
            TrailGivePctAnchor: "0.04",
            UseAnchorExit: "1",
            AnchorBackPct: "0.72",
            SysHistDBars: "600",
            SysHistMBars: "20000",
        },
        orb: {
            DonLen: "180",
            ATRLen: "3",
            EMAWarmBars: "1",
            EntryBufferPts: "58",
            DonBufferPts: "88",
            MinATRD: "95",
            ATRStopK: "0.63",
            ATRTakeProfitK: "0.92",
            MaxEntriesPerDay: "6",
            TimeStopBars: "36",
            MinRunPctAnchor: "0.16",
            TrailStartPctAnchor: "0.50",
            TrailGivePctAnchor: "0.04",
            UseAnchorExit: "1",
            AnchorBackPct: "0.60",
            SysHistDBars: "600",
            SysHistMBars: "20000",
        },
    };
    const NEW_THEME_ROTATION = ["breakout", "ema", "orb"];
    const NEW_THEME_LABELS = {
        breakout: "Breakout",
        ema: "EMA",
        orb: "ORB",
    };
    const NEW_NAME_PARTS = {
        breakout: {
            ids: ["Adaptive", "Channel", "Impulse", "Donchian"],
            titles: ["Adaptive Breakout", "Channel Expansion", "Impulse Shift", "Range Drive"],
            suffixes: ["Atlas", "Pulse", "Vector", "Sprint"],
        },
        ema: {
            ids: ["Anchor", "Ribbon", "Trend", "Pullback"],
            titles: ["EMA Pullback", "Anchor Trend", "Ribbon Continuation", "Slope Reclaim"],
            suffixes: ["Glide", "Magnet", "Surge", "Flow"],
        },
        orb: {
            ids: ["OpeningRange", "Morning", "Session", "Retest"],
            titles: ["Opening Range", "Morning Session", "Gap Retest", "Session Rotation"],
            suffixes: ["Launch", "Snap", "Retest", "Drive"],
        },
    };
    const NEW_PROFILE_OPTIONS = {
        breakout: {
            DonLen: [238, 274, 308, 336],
            ATRLen: [2, 3, 4],
            EMAWarmBars: [1, 2, 3],
            EntryBufferPts: [64, 84, 102],
            DonBufferPts: [92, 117, 138],
            MinATRD: [108, 127, 145],
            ATRStopK: [0.49, 0.57, 0.68],
            ATRTakeProfitK: [0.74, 0.81, 0.97],
            MaxEntriesPerDay: [6, 8, 10],
            TimeStopBars: [48, 60, 74],
            MinRunPctAnchor: [0.18, 0.22, 0.28],
            TrailStartPctAnchor: [0.62, 0.71, 0.79],
            TrailGivePctAnchor: [0.02, 0.03, 0.05],
            UseAnchorExit: [1, 1, 0],
            AnchorBackPct: [0.74, 0.82, 0.88],
            SysHistDBars: [500, 600, 720],
            SysHistMBars: [18000, 20000, 24000],
        },
        ema: {
            DonLen: [188, 220, 246, 278],
            ATRLen: [2, 3, 4],
            EMAWarmBars: [1, 2, 3],
            EntryBufferPts: [54, 72, 86],
            DonBufferPts: [82, 96, 118],
            MinATRD: [88, 110, 126],
            ATRStopK: [0.52, 0.64, 0.76],
            ATRTakeProfitK: [0.74, 0.88, 1.02],
            MaxEntriesPerDay: [4, 6, 8],
            TimeStopBars: [36, 48, 64],
            MinRunPctAnchor: [0.12, 0.18, 0.24],
            TrailStartPctAnchor: [0.52, 0.58, 0.66],
            TrailGivePctAnchor: [0.03, 0.04, 0.06],
            UseAnchorExit: [1, 0, 1],
            AnchorBackPct: [0.62, 0.72, 0.8],
            SysHistDBars: [500, 600, 720],
            SysHistMBars: [16000, 20000, 24000],
        },
        orb: {
            DonLen: [144, 180, 212, 244],
            ATRLen: [2, 3, 4],
            EMAWarmBars: [1, 2],
            EntryBufferPts: [42, 58, 72],
            DonBufferPts: [66, 88, 108],
            MinATRD: [78, 95, 112],
            ATRStopK: [0.48, 0.63, 0.78],
            ATRTakeProfitK: [0.76, 0.92, 1.08],
            MaxEntriesPerDay: [3, 4, 6],
            TimeStopBars: [24, 36, 48],
            MinRunPctAnchor: [0.1, 0.16, 0.22],
            TrailStartPctAnchor: [0.42, 0.5, 0.58],
            TrailGivePctAnchor: [0.02, 0.04, 0.05],
            UseAnchorExit: [1, 1, 0],
            AnchorBackPct: [0.48, 0.6, 0.72],
            SysHistDBars: [500, 600, 720],
            SysHistMBars: [14000, 18000, 22000],
        },
    };
    const EXPORT_SCRIPTS = {
        m1: `// M1 匯出
input:
    StartTime(084500, "開始時間"),
    StopTime(134500,  "結束時間");

var:
    outPath(""),
    lastSeenDate(0),
    lastSeenTime(0),
    hh(0),
    mm(0),
    ss(0),
    tStr(""),
    outStr("");

if BarFreq <> "Min" then
    RaiseRunTimeError("本腳本僅支援 1 分 K");

if CurrentBar = 1 then begin
    outPath = "C:\\\\XQ\\\\data\\\\M1.txt";
    lastSeenDate = Date;
    lastSeenTime = Time;
end;

if (Date <> lastSeenDate) or (Time <> lastSeenTime) then begin
    if CurrentBar > 1 and Time[1] >= StartTime and Time[1] <= StopTime then begin
        hh = IntPortion(Time[1] / 10000);
        mm = IntPortion((Time[1] - hh * 10000) / 100);
        ss = Time[1] - hh * 10000 - mm * 100;

        tStr = RightStr("0" + NumToStr(hh, 0), 2)
             + RightStr("0" + NumToStr(mm, 0), 2)
             + RightStr("0" + NumToStr(ss, 0), 2);

        outStr = NumToStr(Date[1], 0) + " "
               + tStr + " "
               + NumToStr(Open[1], 0) + " "
               + NumToStr(High[1], 0) + " "
               + NumToStr(Low[1], 0) + " "
               + NumToStr(Close[1], 0);

        Print(File(outPath), outStr);
    end;

    lastSeenDate = Date;
    lastSeenTime = Time;
end;`,
        d1: `// D1 匯出
input:
    StartDate(20200101, "開始日期"),
    EndDate(20261231,   "結束日期");

var:
    outPath(""),
    outStr(""),
    lastPrintedDate(0),
    dayOpenVal(0),
    dayHighVal(0),
    dayLowVal(0),
    dayCloseVal(0);

if BarFreq <> "Min" then
    RaiseRunTimeError("本腳本僅支援分鐘線");

if CurrentBar = 1 then begin
    outPath = "C:\\\\XQ\\\\data\\\\D1_XQ_TRUE.txt";
    lastPrintedDate = 0;
end;

if Date <> Date[1] then begin
    if (Date[1] >= StartDate) and (Date[1] <= EndDate) and (Date[1] <> lastPrintedDate) then begin
        dayOpenVal  = GetField("開盤價", "D")[1];
        dayHighVal  = GetField("最高價", "D")[1];
        dayLowVal   = GetField("最低價", "D")[1];
        dayCloseVal = GetField("收盤價", "D")[1];

        outStr = NumToStr(Date[1], 0) + " "
               + NumToStr(dayOpenVal, 0) + " "
               + NumToStr(dayHighVal, 0) + " "
               + NumToStr(dayLowVal, 0) + " "
               + NumToStr(dayCloseVal, 0);

        Print(File(outPath), outStr);
        lastPrintedDate = Date[1];
    end;
end;`,
    };

    const STRATEGIES = {
        breakout: {
            inputs: ["BreakoutLen(18)", "EMAFastLen(11)", "ATRLen(21)", "ATRStopK(1.5)", "ATRTakeProfitK(0.9)"],
            vars: ["emaFast(0)", "emaFast_1(0)", "breakoutHi(0)", "breakoutLo(0)", "breakoutHi_2(0)", "breakoutLo_2(0)"],
            calc: [
                "emaFast = XAverage(Close, EMAFastLen);",
                "emaFast_1 = emaFast[1];",
                "trVal = MaxList(High - Low, AbsValue(High - Close[1]), AbsValue(Low - Close[1]));",
                "atrValue = XAverage(trVal, ATRLen);",
                "atrValue_1 = atrValue[1];",
                "breakoutHi = Highest(High, BreakoutLen);",
                "breakoutLo = Lowest(Low, BreakoutLen);",
                "breakoutHi_2 = breakoutHi[2];",
                "breakoutLo_2 = breakoutLo[2];",
            ],
            ready: "(emaFast_1 > 0) and (atrValue_1 > 0) and (breakoutHi_2 > 0) and (breakoutLo_2 > 0)",
            longIn: "(Open >= breakoutHi_2) and (Close[1] > emaFast_1)",
            shortIn: "(Open <= breakoutLo_2) and (Close[1] < emaFast_1)",
        },
        ema: {
            inputs: ["EMAFastLen(9)", "EMASlowLen(24)", "PullbackBandK(0.22)", "ATRLen(13)", "ATRStopK(1.4)", "ATRTakeProfitK(0.7)"],
            vars: ["emaFast(0)", "emaSlow(0)", "emaFast_1(0)", "emaSlow_1(0)", "pullbackBand(0)"],
            calc: [
                "emaFast = XAverage(Close, EMAFastLen);",
                "emaSlow = XAverage(Close, EMASlowLen);",
                "emaFast_1 = emaFast[1];",
                "emaSlow_1 = emaSlow[1];",
                "trVal = MaxList(High - Low, AbsValue(High - Close[1]), AbsValue(Low - Close[1]));",
                "atrValue = XAverage(trVal, ATRLen);",
                "atrValue_1 = atrValue[1];",
                "pullbackBand = atrValue_1 * PullbackBandK;",
            ],
            ready: "(emaFast_1 > 0) and (emaSlow_1 > 0) and (atrValue_1 > 0)",
            longIn: "(Close[1] > emaFast_1) and (emaFast_1 > emaSlow_1) and (Open >= emaFast_1 - pullbackBand) and (Open <= emaFast_1 + pullbackBand)",
            shortIn: "(Close[1] < emaFast_1) and (emaFast_1 < emaSlow_1) and (Open >= emaFast_1 - pullbackBand) and (Open <= emaFast_1 + pullbackBand)",
        },
        orb: {
            inputs: ["ORBars(6)", "ATRLen(15)", "RetestBandK(0.24)", "ATRStopK(1.1)", "ATRTakeProfitK(0.62)"],
            vars: ["dayBarSeq(0)", "orbHi(0)", "orbLo(0)", "orbReady(false)", "retestBand(0)"],
            calc: [
                "trVal = MaxList(High - Low, AbsValue(High - Close[1]), AbsValue(Low - Close[1]));",
                "atrValue = XAverage(trVal, ATRLen);",
                "atrValue_1 = atrValue[1];",
                "retestBand = atrValue_1 * RetestBandK;",
                "if Date <> Date[1] then begin",
                "    dayBarSeq = 1;",
                "    orbHi = High[1];",
                "    orbLo = Low[1];",
                "    orbReady = false;",
                "end",
                "else begin",
                "    dayBarSeq = dayBarSeq + 1;",
                "    if dayBarSeq <= ORBars then begin",
                "        if High[1] > orbHi then orbHi = High[1];",
                "        if Low[1] < orbLo then orbLo = Low[1];",
                "    end;",
                "    if dayBarSeq >= ORBars then orbReady = (orbHi > 0) and (orbLo > 0);",
                "end;",
            ],
            ready: "orbReady and (atrValue_1 > 0)",
            longIn: "orbReady and (Close[1] > orbHi) and (Open >= orbHi - retestBand) and (Open <= orbHi + retestBand)",
            shortIn: "orbReady and (Close[1] < orbLo) and (Open >= orbLo - retestBand) and (Open <= orbLo + retestBand)",
        },
    };
    const BEST_PRESET = { strategyId: "Best_Return_Pair_V2", title: "最佳報酬配對", theme: "breakout" };
    const REFACTOR_PRESETS = {
        breakout: { strategyId: "Refactor_Breakout_V2", title: "Refactor Breakout V2", theme: "breakout" },
        ema: { strategyId: "Refactor_EMA_Pullback_V2", title: "Refactor EMA Pullback V2", theme: "ema" },
        orb: { strategyId: "Refactor_Opening_Range_V2", title: "Refactor Opening Range V2", theme: "orb" },
    };

    const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
    const bestMetricsPanel = document.getElementById("best-metrics-panel");
    const bestMetricsHead = bestMetricsPanel ? bestMetricsPanel.querySelector(".panel-head") : null;
    const bestUploadPanel = document.getElementById("best-upload-panel");
    const refactorUploadPanel = document.getElementById("refactor-upload-panel");
    const metricLabels = bestMetricsPanel ? Array.from(bestMetricsPanel.querySelectorAll(".metric-grid .metric-label")) : [];
    const metricTotalReturn = document.getElementById("metric-total-return");
    const metricMaxDrawdown = document.getElementById("metric-max-drawdown");
    const metricTradeCount = document.getElementById("metric-trade-count");
    const futuresKpiNote = document.getElementById("futures-kpi-note");
    const futuresKpiBody = document.getElementById("futures-kpi-body");
    const annualReturnList = document.getElementById("annual-return-list");
    const annualReturnTitle = annualReturnList && annualReturnList.parentElement
        ? annualReturnList.parentElement.querySelector(".metric-label")
        : null;
    const performanceRangeGroupButtons = Array.from(document.querySelectorAll("[data-performance-range-group]"));
    const performanceRangeReset = document.getElementById("performance-range-reset");
    const performanceRangeList = document.getElementById("performance-range-list");
    const performanceChartNote = document.getElementById("performance-chart-note");
    const performanceLegend = document.getElementById("performance-legend");
    const performanceChartEmpty = document.getElementById("performance-chart-empty");
    const performanceEquityChart = document.getElementById("performance-equity-chart");
    const performanceWeeklyChart = document.getElementById("performance-weekly-chart");
    const bestIndicatorUpload = document.getElementById("best-indicator-upload");
    const bestTradingUpload = document.getElementById("best-trading-upload");
    const bestIndicatorSummary = document.getElementById("best-indicator-summary");
    const bestTradingSummary = document.getElementById("best-trading-summary");
    const bestM1Upload = document.getElementById("best-m1-upload");
    const bestD1Upload = document.getElementById("best-d1-upload");
    const bestM1Summary = document.getElementById("best-m1-summary");
    const bestD1Summary = document.getElementById("best-d1-summary");
    const bestXqTxtUpload = document.getElementById("best-xqtxt-upload");
    const bestXqSummary = document.getElementById("best-xq-summary");
    const bestCapitalInput = document.getElementById("best-capital");
    const bestPointValueInput = document.getElementById("best-point-value");
    const bestSideCostInput = document.getElementById("best-side-cost");
    const applyBestUploadButton = document.getElementById("apply-best-upload");
    const bestUploadStatus = document.getElementById("best-upload-status");
    const bestComparePanel = document.getElementById("best-compare-panel");
    const compareStatusValue = document.getElementById("compare-status-value");
    const compareSimCount = document.getElementById("compare-sim-count");
    const compareXqCount = document.getElementById("compare-xq-count");
    const comparePrefixCount = document.getElementById("compare-prefix-count");
    const compareParamNote = document.getElementById("compare-param-note");
    const compareFirstMismatch = document.getElementById("compare-first-mismatch");
    const compareNote = document.getElementById("compare-note");
    const compareKpiNote = document.getElementById("compare-kpi-note");
    const compareKpiBody = document.getElementById("compare-kpi-body");
    const tradeDetailNote = document.getElementById("trade-detail-note");
    const tradeDetailBody = document.getElementById("trade-detail-body");
    const refactorIndicatorUpload = document.getElementById("refactor-indicator-upload");
    const refactorTradingUpload = document.getElementById("refactor-trading-upload");
    const runRefactorButton = document.getElementById("run-refactor");
    const refactorStatus = document.getElementById("refactor-status");
    const outputKicker = document.getElementById("output-kicker");
    const outputTitle = document.getElementById("output-title");
    const outputFileBase = document.getElementById("output-file-base");
    const pairOutput = document.getElementById("pair-output");
    function ensureSupplementalStyles() {
        if (document.getElementById("xs-home-supplemental-styles")) {
            return;
        }
        const style = document.createElement("style");
        style.id = "xs-home-supplemental-styles";
        style.textContent = [
            ".futures-kpi-table tr.is-section td { padding: 10px 14px; border-bottom-color: rgba(149, 180, 197, 0.18); background: rgba(149, 180, 197, 0.08); color: rgba(236, 246, 247, 0.76); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }",
            ".trade-detail-panel { margin-top: 16px; }",
            ".trade-detail-table-wrap { overflow-x: auto; }",
            ".trade-detail-table { width: 100%; min-width: 1440px; border-collapse: collapse; }",
            ".trade-detail-table th, .trade-detail-table td { padding: 10px 12px; border-bottom: 1px solid rgba(149, 180, 197, 0.12); text-align: left; vertical-align: top; white-space: nowrap; font-variant-numeric: tabular-nums; }",
            ".trade-detail-table th { color: rgba(236, 246, 247, 0.58); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }",
            ".trade-detail-index { color: rgba(236, 246, 247, 0.62); }",
            ".trade-detail-side { font-weight: 700; }",
            ".trade-detail-side.is-long { color: #ffb7a7; }",
            ".trade-detail-side.is-short { color: #9fdfb0; }",
            ".trade-detail-money.is-gain, .trade-detail-points.is-gain { color: #ff8d8d; }",
            ".trade-detail-money.is-loss, .trade-detail-points.is-loss { color: #8ce6b0; }",
            ".trade-detail-money.is-flat, .trade-detail-points.is-flat { color: rgba(236, 246, 247, 0.7); }",
        ].join("\n");
        document.head.appendChild(style);
    }
    ensureSupplementalStyles();
    const exportOutput = document.getElementById("export-output");
    const indicatorFilename = document.getElementById("indicator-filename");
    const tradingFilename = document.getElementById("trading-filename");
    const exportM1Filename = document.getElementById("export-m1-filename");
    const exportD1Filename = document.getElementById("export-d1-filename");
    const indicatorOutput = document.getElementById("indicator-output");
    const tradingOutput = document.getElementById("trading-output");
    const exportM1Output = document.getElementById("export-m1-output");
    const exportD1Output = document.getElementById("export-d1-output");
    const bundledDatasetConfig = window.__XS_REPO_DATA_BUNDLE?.datasets || {};
    const bundledDataUi = window.__XSBundledData || null;
    const bundledStrategyUi = window.__XSBundledStrategyUi || null;
    const xqUploadHelpers = window.__XSXqUpload || null;
    const futuresKpiHelpers = window.__XSFuturesKpi || null;
    let newIndex = -1;
    let fixedBestId = null;
    let bestModeAutoRunStarted = false;
    let fileModeBridgeAttempted = false;
    let performanceChartPayload = null;
    let performanceChartRangeKey = "year_6";
    let bestDataHealthPanel = document.getElementById("best-data-health");
    if (!bestDataHealthPanel && bestMetricsPanel) {
        bestDataHealthPanel = document.createElement("div");
        bestDataHealthPanel.id = "best-data-health";
        bestDataHealthPanel.className = "data-health-list";
        if (bestMetricsHead) {
            bestMetricsHead.insertAdjacentElement("afterend", bestDataHealthPanel);
        } else {
            bestMetricsPanel.prepend(bestDataHealthPanel);
        }
    }

    function setText(el, value) { if (el) { el.textContent = String(value ?? ""); } }
    function logRenderError(scope, error) {
        if (window.console && typeof window.console.error === "function") {
            window.console.error("[xs-home] render failed:", scope, error);
        }
    }
    function runNonCriticalRender(scope, renderFn) {
        try {
            return renderFn();
        } catch (error) {
            logRenderError(scope, error);
            return null;
        }
    }
    function setStatusText(el, value) {
        if (!el) {
            return;
        }
        const text = String(value ?? "");
        el.textContent = text;
        el.hidden = !text;
    }
    function setVisible(el, visible) {
        if (el) {
            el.hidden = !visible;
            el.style.display = visible ? "" : "none";
        }
    }
    function parseDateDigits(value) {
        const digits = String(value || "").replace(/\D+/g, "").slice(0, 8);
        if (digits.length !== 8) {
            return null;
        }
        return {
            year: toInt(digits.slice(0, 4), 0),
            month: toInt(digits.slice(4, 6), 0),
            day: toInt(digits.slice(6, 8), 0),
        };
    }
    function parseTimeDigits(value) {
        const digits = String(value || "").replace(/\D+/g, "").padStart(6, "0").slice(-6);
        return {
            hour: toInt(digits.slice(0, 2), 0),
            minute: toInt(digits.slice(2, 4), 0),
            second: toInt(digits.slice(4, 6), 0),
        };
    }
    function makeLocalDate(parts) {
        if (!parts || !parts.year || !parts.month || !parts.day) {
            return null;
        }
        return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);
    }
    function addLocalDays(date, days) {
        if (!(date instanceof Date)) {
            return null;
        }
        const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
        next.setDate(next.getDate() + days);
        return next;
    }
    function isBusinessDay(date) {
        const weekday = date instanceof Date ? date.getDay() : NaN;
        return weekday >= 1 && weekday <= 5;
    }
    function previousBusinessDay(date) {
        let next = addLocalDays(date, -1);
        while (next && !isBusinessDay(next)) {
            next = addLocalDays(next, -1);
        }
        return next;
    }
    function nextBusinessDay(date) {
        let next = addLocalDays(date, 1);
        while (next && !isBusinessDay(next)) {
            next = addLocalDays(next, 1);
        }
        return next;
    }
    function formatRocDate(date) {
        if (!(date instanceof Date)) {
            return "未提供";
        }
        return String(date.getFullYear() - 1911) + "/" + String(date.getMonth() + 1) + "/" + String(date.getDate());
    }
    function formatRocDateTime(dateText, timeText) {
        const dateParts = parseDateDigits(dateText);
        if (!dateParts) {
            return "未提供";
        }
        const dateLabel = String(dateParts.year - 1911) + "/" + String(dateParts.month) + "/" + String(dateParts.day);
        if (!timeText) {
            return dateLabel;
        }
        const timeParts = parseTimeDigits(timeText);
        return dateLabel
            + " "
            + String(timeParts.hour).padStart(2, "0")
            + ":"
            + String(timeParts.minute).padStart(2, "0");
    }
    function formatBundledRangeRoc(dataset) {
        if (!dataset || !dataset.range) {
            return "未提供";
        }
        return formatRocDateTime(dataset.range.startDate, dataset.range.startTime)
            + " - "
            + formatRocDateTime(dataset.range.endDate, dataset.range.endTime);
    }
    function expectedBundledLatestDate(kind) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
        const latestM1 = previousBusinessDay(today);
        if (!latestM1) {
            return null;
        }
        return kind === "d1" ? previousBusinessDay(latestM1) : latestM1;
    }
    function createDataHealthFragment(text, className, styles) {
        const span = document.createElement("span");
        span.className = className;
        span.textContent = text;
        Object.assign(span.style, styles || {});
        return span;
    }
    function buildBundledFreshnessStatus(kind, dataset) {
        if (!dataset || !dataset.range) {
            return {
                expected: null,
                statusText: "尚未提供資料",
                statusClass: "is-missing",
            };
        }

        const expected = expectedBundledLatestDate(kind);
        const actualEnd = makeLocalDate(parseDateDigits(dataset.range.endDate));
        if (!actualEnd || !expected) {
            return {
                expected: expected,
                statusText: "無法判斷最新日",
                statusClass: "is-neutral",
            };
        }

        if (actualEnd.getTime() < expected.getTime()) {
            const missingStart = nextBusinessDay(actualEnd) || actualEnd;
            return {
                expected: expected,
                statusText: "欠缺 " + formatRocDate(missingStart) + " - " + formatRocDate(expected),
                statusClass: "is-missing",
            };
        }

        return {
            expected: expected,
            statusText: "已對齊",
            statusClass: "is-ok",
        };
    }
    function renderBundledFreshnessRows() {
        if (!bestDataHealthPanel) {
            return;
        }

        const entries = [
            { kind: "m1", label: "M1" },
            { kind: "d1", label: "D1" },
        ];
        Object.assign(bestDataHealthPanel.style, {
            display: "grid",
            gap: "10px",
            margin: "0 0 18px",
        });
        bestDataHealthPanel.replaceChildren();

        entries.forEach(function (entry) {
            const dataset = bundledDatasetConfig && bundledDatasetConfig[entry.kind] ? bundledDatasetConfig[entry.kind] : null;
            const status = buildBundledFreshnessStatus(entry.kind, dataset);
            const row = document.createElement("div");
            row.className = "data-health-row";
            Object.assign(row.style, {
                display: "flex",
                flexWrap: "wrap",
                alignItems: "baseline",
                gap: "8px 14px",
                padding: "12px 14px",
                border: "1px solid rgba(149, 180, 197, 0.12)",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.03)",
            });
            row.appendChild(createDataHealthFragment(entry.label, "data-health-label", {
                minWidth: "34px",
                color: "rgba(244, 247, 251, 0.94)",
                fontSize: "13px",
                fontWeight: "700",
                letterSpacing: "0.08em",
            }));
            row.appendChild(createDataHealthFragment("資料期間 " + formatBundledRangeRoc(dataset), "data-health-range", {
                color: "rgba(236, 246, 247, 0.64)",
                fontSize: "13px",
                lineHeight: "1.6",
            }));
            if (status.expected) {
                row.appendChild(createDataHealthFragment("應更新至 " + formatRocDate(status.expected), "data-health-expected", {
                    color: "rgba(236, 246, 247, 0.64)",
                    fontSize: "13px",
                    lineHeight: "1.6",
                }));
            }
            row.appendChild(createDataHealthFragment(status.statusText, "data-health-status " + status.statusClass, {
                color: status.statusClass === "is-missing"
                    ? "var(--danger)"
                    : (status.statusClass === "is-ok" ? "rgba(121, 216, 147, 0.92)" : "rgba(236, 246, 247, 0.64)"),
                fontSize: "13px",
                fontWeight: "700",
                lineHeight: "1.6",
            }));
            bestDataHealthPanel.appendChild(row);
        });
    }
    function findExecutableTradingPrintLines(code) {
        const lines = String(code || "").replace(/\r\n/g, "\n").split("\n");
        const found = [];
        let inMetaBlock = false;

        lines.forEach(function (line, index) {
            const trimmed = line.trim();
            if (!trimmed) {
                return;
            }
            if (!inMetaBlock && trimmed.startsWith("{*")) {
                inMetaBlock = !trimmed.includes("*}");
                return;
            }
            if (inMetaBlock) {
                if (trimmed.includes("*}")) {
                    inMetaBlock = false;
                }
                return;
            }
            if (trimmed.startsWith("//")) {
                return;
            }
            if (/\b(?:print|plot\d+)\s*\(/i.test(trimmed)) {
                found.push(index + 1);
            }
        });

        return found;
    }
    function protectTradingCode(code, fileName) {
        const lines = String(code || "").replace(/\r\n/g, "\n").split("\n");
        const offending = findExecutableTradingPrintLines(code);
        if (!offending.length) {
            return String(code || "");
        }

        let inMetaBlock = false;
        const safeLines = lines.map(function (line) {
            const trimmed = line.trim();
            if (!trimmed) {
                return line;
            }
            if (!inMetaBlock && trimmed.startsWith("{*")) {
                inMetaBlock = !trimmed.includes("*}");
                return line;
            }
            if (inMetaBlock) {
                if (trimmed.includes("*}")) {
                    inMetaBlock = false;
                }
                return line;
            }
            if (trimmed.startsWith("//")) {
                return line;
            }
            if (/\b(?:print|plot\d+)\s*\(/i.test(trimmed)) {
                return line.replace(/^(\s*)/, "$1// ");
            }
            return line;
        });

        if (window.console && typeof window.console.warn === "function") {
            window.console.warn(
                "xs-core-engine safety guard removed executable Print/Plot lines from "
                + (fileName || "trading.xs")
                + " at lines "
                + offending.join(", ")
            );
        }

        return safeLines.join("\n");
    }
    function formatPercent(v) { return Number(v).toFixed(1) + "%"; }
    function formatSignedPercent(v) { const n = Number(v); return (n > 0 ? "+" : "") + n.toFixed(1) + "%"; }
    function hasMetricValue(v) {
        return !(v === null || v === undefined || v === "");
    }
    function formatMetricPercent(v) { return hasMetricValue(v) && Number.isFinite(Number(v)) ? Number(v).toFixed(1) + "%" : "待驗證"; }
    function formatMetricCount(v) { return hasMetricValue(v) && Number.isFinite(Number(v)) ? String(Math.round(Number(v))) : "待驗證"; }
    function formatMetricRatio(v) { return hasMetricValue(v) && Number.isFinite(Number(v)) ? Number(v).toFixed(2) : "待驗證"; }
    function formatMetricMoney(v) {
        return hasMetricValue(v) && Number.isFinite(Number(v))
            ? Math.round(Number(v)).toLocaleString("en-US")
            : "待驗證";
    }
    function formatSignedMoney(v) {
        if (!hasMetricValue(v) || !Number.isFinite(Number(v))) {
            return "待驗證";
        }
        const rounded = Math.round(Number(v));
        const absText = Math.abs(rounded).toLocaleString("en-US");
        if (rounded > 0) { return "+" + absText; }
        if (rounded < 0) { return "-" + absText; }
        return "0";
    }
    function formatSignedCount(v) {
        if (!hasMetricValue(v) || !Number.isFinite(Number(v))) {
            return "待驗證";
        }
        const rounded = Math.round(Number(v));
        const absText = Math.abs(rounded).toLocaleString("en-US");
        if (rounded > 0) { return "+" + absText; }
        if (rounded < 0) { return "-" + absText; }
        return "0";
    }
    function formatSignedRatio(v) {
        if (!hasMetricValue(v) || !Number.isFinite(Number(v))) {
            return "待驗證";
        }
        const number = Number(v);
        const absText = Math.abs(number).toFixed(2);
        if (number > 0) { return "+" + absText; }
        if (number < 0) { return "-" + absText; }
        return "0.00";
    }
    function formatFutureValue(value, type) {
        if (!hasMetricValue(value) || !Number.isFinite(Number(value))) {
            return "待驗證";
        }
        if (type === "count") {
            return formatMetricCount(value);
        }
        if (type === "percentAbs") {
            return formatAbsolutePercent(value);
        }
        if (type === "percent") {
            return formatSignedPercent(value);
        }
        if (type === "ratio") {
            return formatMetricRatio(value);
        }
        return formatSignedMoney(value);
    }
    function formatFutureDiffValue(value, type) {
        if (!hasMetricValue(value) || !Number.isFinite(Number(value))) {
            return "待驗證";
        }
        if (type === "count") {
            return formatSignedCount(value);
        }
        if (type === "percent") {
            return formatSignedPercent(value);
        }
        if (type === "ratio") {
            return formatSignedRatio(value);
        }
        return formatSignedMoney(value);
    }
    function valueToneClass(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return "";
        }
        if (number > 0) {
            return "is-positive";
        }
        if (number < 0) {
            return "is-negative";
        }
        return "";
    }
    function formatAbsolutePercent(value) {
        if (!hasMetricValue(value) || !Number.isFinite(Number(value))) {
            return "待驗證";
        }
        return Math.abs(Number(value)).toFixed(1) + "%";
    }
    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
    function formatTradeTimestamp(value) {
        const digits = String(value || "").replace(/\D+/g, "");
        if (digits.length < 8) {
            return "—";
        }
        const year = digits.slice(0, 4);
        const month = String(toInt(digits.slice(4, 6), 0));
        const day = String(toInt(digits.slice(6, 8), 0));
        if (digits.length < 12) {
            return year + "/" + month + "/" + day;
        }
        const hour = digits.slice(8, 10);
        const minute = digits.slice(10, 12);
        return year + "/" + month + "/" + day + " " + hour + ":" + minute;
    }
    function formatTradePrice(value) {
        if (!hasMetricValue(value) || !Number.isFinite(Number(value))) {
            return "—";
        }
        const rounded = Math.round(Number(value) * 100) / 100;
        return rounded.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    }
    function formatTradePoints(value) {
        if (!hasMetricValue(value) || !Number.isFinite(Number(value))) {
            return "—";
        }
        const rounded = Math.round(Number(value) * 100) / 100;
        const absText = formatCompactNumber(Math.abs(rounded));
        if (rounded > 0) {
            return "+" + absText;
        }
        if (rounded < 0) {
            return "-" + absText;
        }
        return "0";
    }
    function tradeToneClass(value) {
        const number = Number(value);
        if (!Number.isFinite(number) || Math.abs(number) < 0.0001) {
            return "is-flat";
        }
        return number > 0 ? "is-gain" : "is-loss";
    }
    function formatTradeSide(side) {
        if (side === "long") {
            return "多單";
        }
        if (side === "short") {
            return "空單";
        }
        return "—";
    }
    function buildWeeklyExtremes(details, field) {
        const weeklyMap = new Map();
        (Array.isArray(details) ? details : []).forEach(function (detail) {
            const date = parseChartTimestamp(detail && detail.exitTs);
            const pnl = Number(detail && detail[field]);
            if (!(date instanceof Date) || !Number.isFinite(pnl)) {
                return;
            }
            const weekStart = startOfChartWeek(date);
            const weekKey = weekStart ? String(weekStart.getTime()) : "";
            if (!weekKey) {
                return;
            }
            weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + pnl);
        });

        const values = Array.from(weeklyMap.values()).filter(Number.isFinite);
        return {
            max: values.length ? Math.max.apply(null, values) : 0,
            min: values.length ? Math.min.apply(null, values) : 0,
        };
    }
    function buildFuturesKpiDisplayRows(report) {
        if (!report || !report.theory || !report.actual) {
            return [];
        }

        const capital = Number(report.config && report.config.capital);
        const theoryLossAbs = Math.abs(Number(report.theory.averageLoser || 0));
        const actualLossAbs = Math.abs(Number(report.actual.averageLoser || 0));
        const weeklyTheory = buildWeeklyExtremes(report.details, "theoryPnl");
        const weeklyActual = buildWeeklyExtremes(report.details, "actualPnl");
        const theoryDrawdownPct = capital > 0 ? (Number(report.theory.maxDrawdown || 0) / capital) * 100 : null;
        const actualDrawdownPct = capital > 0 ? (Number(report.actual.maxDrawdown || 0) / capital) * 100 : null;

        return [
            { kind: "section", label: "摘要概覽" },
            { label: "淨利", theory: report.theory.totalNet, actual: report.actual.totalNet, type: "money", description: "完整交易歷史加總後的結果。" },
            { label: "報酬率", theory: report.theory.totalReturnPct, actual: report.actual.totalReturnPct, type: "percent", description: "以本金為分母觀察資金成長幅度。" },
            { label: "交易次數", theory: report.theory.count, actual: report.actual.count, type: "count", description: "完整平倉的交易回合總數。" },
            { kind: "section", label: "交易品質" },
            { label: "勝率", theory: report.theory.winRate * 100, actual: report.actual.winRate * 100, type: "percent", description: "獲利回合占總交易回合的比例。" },
            { label: "平均單筆", theory: report.theory.averageTrade, actual: report.actual.averageTrade, type: "money", description: "總淨利除以交易次數後的期望值。" },
            { label: "平均贏家", theory: report.theory.averageWinner, actual: report.actual.averageWinner, type: "money", description: "只統計獲利交易時的單筆平均值。" },
            { label: "平均輸家", theory: report.theory.averageLoser, actual: report.actual.averageLoser, type: "money", description: "只統計虧損交易時的單筆平均值。" },
            { label: "賺賠比", theory: theoryLossAbs > 0 ? report.theory.averageWinner / theoryLossAbs : null, actual: actualLossAbs > 0 ? report.actual.averageWinner / actualLossAbs : null, type: "ratio", description: "平均贏家除以平均輸家絕對值。" },
            { label: "獲利因子", theory: report.theory.profitFactor, actual: report.actual.profitFactor, type: "ratio", description: "總獲利除以總虧損絕對值。" },
            { kind: "section", label: "風險與回撤" },
            { label: "累積淨利高點", theory: report.theory.cumulativeHigh, actual: report.actual.cumulativeHigh, type: "money", description: "歷史累積淨利到過的最高水位。" },
            { label: "最大回撤金額", theory: -report.theory.maxDrawdown, actual: -report.actual.maxDrawdown, type: "money", description: "由累積高點回落到低點時的最大金額差。" },
            { label: "最大回撤比率", theory: theoryDrawdownPct, actual: actualDrawdownPct, type: "percentAbs", tone: "low", description: "最大回撤金額除以本金。" },
            { label: "最大單日獲利", theory: report.theory.dayMax, actual: report.actual.dayMax, type: "money", description: "以出場日彙總的最佳單日表現。" },
            { label: "最大單日虧損", theory: report.theory.dayMin, actual: report.actual.dayMin, type: "money", description: "以出場日彙總的最差單日表現。" },
            { label: "最佳單週損益", theory: weeklyTheory.max, actual: weeklyActual.max, type: "money", description: "每週彙總後的最佳單週結果。" },
            { label: "最差單週損益", theory: weeklyTheory.min, actual: weeklyActual.min, type: "money", description: "每週彙總後的最差單週結果。" },
            { kind: "section", label: "成本拆解" },
            { label: "手續費", theory: -Number(report.totals && report.totals.fee || 0), actual: -Number(report.totals && report.totals.fee || 0), type: "money", description: "依目前設定估算的累積雙邊手續費。" },
            { label: "交易稅", theory: -Number(report.totals && report.totals.tax || 0), actual: -Number(report.totals && report.totals.tax || 0), type: "money", description: "依契約金額與稅率估算的累積交易稅。" },
            { label: "滑價成本", theory: 0, actual: -Number(report.totals && report.totals.slippage || 0), type: "money", description: "依目前單邊滑點設定估算的累積滑價成本。" },
        ];
    }
    function futuresKpiToneClass(row, value) {
        if (!row || row.tone !== "low") {
            return valueToneClass(value);
        }
        const number = Number(value);
        if (!Number.isFinite(number) || Math.abs(number) < 0.0001) {
            return "";
        }
        return number > 0 ? "is-negative" : "is-positive";
    }
    function readStore() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
            if (saved && saved.verification && saved.verification.revision !== VERIFICATION_REVISION) {
                const normalized = Object.assign({}, saved, {
                    verification: null,
                    lastStatus: "\u5df2\u66f4\u65b0\u8cc7\u6599\u89e3\u6790\u898f\u5247\uff0c\u8acb\u91cd\u65b0\u9a57\u8b49\u4e00\u6b21\u3002",
                });
                writeStore(normalized);
                return normalized;
            }
            if (saved && saved.verification && !hasUsableVerificationPayload(saved.verification)) {
                const normalized = Object.assign({}, saved, {
                    verification: null,
                    lastStatus: "\u767c\u73fe\u820a\u7684\u4e0d\u5b8c\u6574\u9a57\u8b49\u5feb\u53d6\uff0c\u5df2\u81ea\u52d5\u6539\u70ba\u91cd\u65b0\u9a57\u8b49\u3002",
                });
                writeStore(normalized);
                return normalized;
            }
            return saved;
        } catch {
            return null;
        }
    }
    function writeStore(value) {
        try {
            const nextValue = value && typeof value === "object" && !Array.isArray(value)
                ? Object.assign({}, value)
                : value;
            if (nextValue && typeof nextValue.trading === "string") {
                nextValue.trading = protectTradingCode(nextValue.trading, "stored_trading.xs");
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
        } catch {
        }
    }
    function setBestButtonBusy(busy) {
        if (!applyBestUploadButton) {
            return;
        }
        if (!applyBestUploadButton.dataset.idleLabel) {
            applyBestUploadButton.dataset.idleLabel = applyBestUploadButton.textContent;
        }
        applyBestUploadButton.disabled = Boolean(busy);
        applyBestUploadButton.textContent = busy ? "計算中..." : applyBestUploadButton.dataset.idleLabel;
    }
    function createUploadSummaryBadge(text) {
        const badge = document.createElement("span");
        badge.className = "upload-summary-badge";
        badge.textContent = text;
        return badge;
    }
    function createUploadSummaryRow(label, value) {
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
    function renderUploadSummary(target, payload) {
        if (!target) {
            return;
        }

        target.replaceChildren();
        target.classList.toggle("is-empty", Boolean(payload && payload.empty));

        if (payload && payload.badge) {
            target.appendChild(createUploadSummaryBadge(payload.badge));
        }

        (payload?.rows || []).forEach(function (row) {
            target.appendChild(createUploadSummaryRow(row.label, row.value));
        });
    }
    function detectTradeDetailKind(name) {
        const lower = String(name || "").toLowerCase();
        if (lower.endsWith(".csv")) {
            return "CSV";
        }
        if (lower.endsWith(".txt")) {
            return "TXT";
        }
        return "檔案";
    }
    function formatUploadCount(value) {
        const count = Number(value);
        return Number.isFinite(count) ? count.toLocaleString("en-US") : "0";
    }
    function renderTradeDetailSummary(selectedFiles, verification) {
        const files = Array.isArray(selectedFiles) ? selectedFiles.filter(Boolean) : [];

        if (files.length) {
            const kinds = Array.from(new Set(files.map(function (file) {
                return detectTradeDetailKind(file.name);
            }))).join(" / ");
            const names = files.map(function (file) { return file.name; }).join("、");

            renderUploadSummary(bestXqSummary, {
                badge: "已選擇檔案",
                rows: [
                    { label: "載入", value: "已選擇 " + formatUploadCount(files.length) + " 份交易明細" },
                    { label: "類型", value: kinds || "TXT / CSV" },
                    { label: "檔名", value: names },
                    { label: "來源", value: "按下更新並比對後套用" },
                ],
            });
            return;
        }

        const simCount = Number(verification?.compare?.simCount || 0);
        if (simCount > 0) {
            renderUploadSummary(bestXqSummary, {
                badge: "程式試算",
                rows: [
                    { label: "載入", value: "尚未另選檔時直接使用這份" },
                    { label: "狀態", value: "已算出模擬TXT" },
                    { label: "事件", value: formatUploadCount(simCount) + " 筆" },
                    { label: "來源", value: "目前策略 + M1 / D1 試算" },
                ],
            });
            return;
        }

        renderUploadSummary(bestXqSummary, {
            badge: "程式試算",
            empty: true,
            rows: [
                { label: "狀態", value: "尚未上傳；進站後會自動試算" },
                { label: "來源", value: "目前策略 + M1 / D1" },
            ],
        });
    }
    function trySwitchFileModeToLocalSite() {
        if (fileModeBridgeAttempted || window.location.protocol !== "file:") {
            return;
        }
        fileModeBridgeAttempted = true;
        const targetUrl = "http://127.0.0.1:8765/index.html";
        let redirected = false;

        const bridgeScript = document.createElement("script");
        bridgeScript.src = "http://127.0.0.1:8765/assets/gate-standalone.js?bridge=" + Date.now();
        bridgeScript.async = true;
        bridgeScript.onload = function () {
            redirected = true;
            window.location.replace(targetUrl);
        };
        bridgeScript.onerror = function () {
            setStatusText(bestUploadStatus, "你現在是直接開啟 file:/// 版本，所以首頁不會自動讀取內建 M1 / D1，也不會自動算 KPI。請執行 start-local-site.cmd，或直接開啟 http://127.0.0.1:8765/index.html。");
        };
        document.head.appendChild(bridgeScript);

        window.setTimeout(function () {
            if (!redirected) {
                setStatusText(bestUploadStatus, "你現在是直接開啟 file:/// 版本，所以首頁不會自動讀取內建 M1 / D1，也不會自動算 KPI。請執行 start-local-site.cmd，或直接開啟 http://127.0.0.1:8765/index.html。");
            }
        }, 1200);
    }
    function hasBundledCompareData() {
        return Boolean(bundledDataUi && bundledDataUi.hasCompareData());
    }
    function renderBundledDatasetSummaries() {
        if (!bundledDataUi) {
            return;
        }
        bundledDataUi.renderSummaries({
            m1Target: bestM1Summary,
            d1Target: bestD1Summary,
        });
        renderBundledFreshnessRows();
    }
    function renderBundledStrategySummaries(pair, bestId) {
        if (!bundledStrategyUi || !pair) {
            return;
        }
        const safeTrading = protectTradingCode(pair.trading, bestId + "_trading.xs");
        bundledStrategyUi.renderSummaries(
            {
                indicatorTarget: bestIndicatorSummary,
                tradingTarget: bestTradingSummary,
            },
            {
                strategyName: bestId,
                indicatorFileName: bestId + "_indicator.xs",
                tradingFileName: bestId + "_trading.xs",
                indicatorCode: pair.indicator,
                tradingCode: safeTrading,
            }
        );
    }
    function buildBundledStatusText() {
        const baseText = bundledDataUi
            ? bundledDataUi.buildStatusText()
            : "目前這些數值還沒有經過 M1 / D1 與交易明細驗證。";

        if (window.location.protocol === "file:" && hasBundledCompareData()) {
            return baseText + " 目前你是直接用 file:/// 開啟首頁，瀏覽器不會讓程式自動讀取 repo 內建的 M1 / D1 TXT。請改用 start-local-site.cmd 或 http://127.0.0.1:8765/index.html。";
        }

        return baseText;
    }
    function maybeAutoRunBestVerification(saved) {
        const gateSlippage = readGateSlippage(null);
        if (
            bestModeAutoRunStarted
            || !document.body.classList.contains("is-unlocked")
            || window.location.protocol === "file:"
            || !hasBundledCompareData()
            || getDisplayVerification(saved)
            || gateSlippage == null
        ) {
            return;
        }

        bestModeAutoRunStarted = true;
        setBestButtonBusy(true);
        setStatusText(bestUploadStatus, "已載入首頁預設策略與程式內建 M1 / D1，正在自動計算首頁結果...");
        setText(compareStatusValue, "計算中");
        setText(compareSimCount, "-");
        setText(compareXqCount, "-");
        setText(comparePrefixCount, "-");
        setText(compareParamNote, "程式正在直接使用首頁預設指標版 / 交易版、內建 M1 / D1 與滑點 " + formatCompactNumber(gateSlippage) + " 進行回放。");
        setText(compareFirstMismatch, "自動計算完成後，這裡會顯示第一個差異或待上傳交易明細的提示。");
        setText(compareNote, "第一次開啟本機站台時會自動跑一次，之後你仍可按「更新並比對」重算。");

        window.setTimeout(function () {
            updateBestHistory().catch(function (error) {
                bestModeAutoRunStarted = false;
                setBestButtonBusy(false);
                setStatusText(bestUploadStatus, error && error.message ? error.message : "自動計算失敗，請再按一次「更新並比對」。");
            });
        }, 0);
    }
    async function readBundledDataset(kind) {
        return bundledDataUi ? bundledDataUi.readDataset(kind) : null;
    }
    function pad2(v) { return String(v).padStart(2, "0"); }
    function toNumber(value, fallback) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }
    function toInt(value, fallback) {
        const n = parseInt(String(value), 10);
        return Number.isFinite(n) ? n : fallback;
    }
    function readNumericInput(input, fallback) {
        if (!input) { return fallback; }
        const n = Number(input.value);
        return Number.isFinite(n) ? n : fallback;
    }
    function readGateSettings() {
        try {
            const raw = window.localStorage.getItem(GATE_SETTINGS_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }
    function readGateSlippage(fallback) {
        const saved = readGateSettings();
        const slippage = Number(saved && saved.slippage);
        if (Number.isFinite(slippage) && slippage >= 0) {
            return Math.round(slippage * 10) / 10;
        }
        return fallback;
    }
    function formatCompactNumber(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) { return String(value ?? ""); }
        return String(Math.round(n * 100) / 100).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
    }
    function resolveCompareSettings(settings) {
        const safe = settings || {};
        const gateSlippage = readGateSlippage(DEFAULT_COMPARE_SETTINGS.sideCostPoints);
        return {
            capital: Math.max(1, toNumber(safe.capital, DEFAULT_COMPARE_SETTINGS.capital)),
            pointValue: Math.max(1, toNumber(safe.pointValue, DEFAULT_COMPARE_SETTINGS.pointValue)),
            sideCostPoints: Math.max(0, toNumber(safe.sideCostPoints, gateSlippage)),
        };
    }
    function shouldRefreshVerificationForGateSlippage(saved) {
        const gateSlippage = readGateSlippage(null);
        const verifiedSlippage = Number(saved && saved.verification && saved.verification.settings && saved.verification.settings.sideCostPoints);
        return gateSlippage != null && Number.isFinite(verifiedSlippage) && Math.abs(gateSlippage - verifiedSlippage) > 0.0001;
    }
    function hasUsableVerificationPayload(verification) {
        if (!verification || typeof verification !== "object") {
            return false;
        }

        const report = verification.futuresKpi;
        const summary = report && report.summary ? report.summary : null;
        const compare = verification.compare;

        return Boolean(
            summary
            && Number.isFinite(Number(summary.theoryNet))
            && Number.isFinite(Number(summary.actualNet))
            && Number.isFinite(Number(summary.tradeCount))
            && compare
            && Number.isFinite(Number(compare.simCount))
        );
    }
    function getDisplayVerification(saved) {
        if (!hasUsableVerificationPayload(saved && saved.verification)) {
            return null;
        }
        if (shouldRefreshVerificationForGateSlippage(saved)) {
            return null;
        }
        return saved && saved.verification ? saved.verification : null;
    }
    function round1(value) {
        return Math.round(Number(value || 0) * 10) / 10;
    }
    function formatTs(date, time) {
        return String(date) + String(time).padStart(6, "0");
    }
    function parseTimeInt(value) {
        return toInt(String(value).replace(/\D+/g, "").padStart(6, "0").slice(-6), 0);
    }
    function parseDateInt(value) {
        return toInt(String(value).replace(/\D+/g, "").slice(0, 8), 0);
    }
    function parseLineTokens(text) {
        return String(text || "")
            .split(/\r?\n/)
            .map(function (line) { return line.trim(); })
            .filter(Boolean);
    }
    function dedupeSortedRows(rows, keyFn) {
        const deduped = [];
        let lastKey = null;
        rows.forEach(function (row) {
            const key = keyFn(row);
            if (key === lastKey) {
                return;
            }
            deduped.push(row);
            lastKey = key;
        });
        return deduped;
    }
    function stamp() {
        const d = new Date();
        return String(d.getFullYear() - 1911).padStart(3, "0") + pad2(d.getMonth() + 1) + pad2(d.getDate()) + pad2(d.getHours()) + pad2(d.getMinutes());
    }
    function fileBase(totalReturn, withReturn) {
        const s = stamp();
        if (!withReturn) { return s; }
        return s + String(Math.max(0, Math.round(Number(totalReturn) || 0))).padStart(3, "0");
    }
    function pickOption(options, index, stride) {
        const list = Array.isArray(options) && options.length ? options : [0];
        return list[Math.floor(index / Math.max(1, stride)) % list.length];
    }
    function buildNewProfile(theme, variantIndex) {
        const base = Object.assign({}, PROFILES[theme] || PROFILES.breakout);
        const options = NEW_PROFILE_OPTIONS[theme] || NEW_PROFILE_OPTIONS.breakout;
        const strides = {
            DonLen: 1,
            ATRLen: 2,
            EMAWarmBars: 3,
            EntryBufferPts: 4,
            DonBufferPts: 5,
            MinATRD: 6,
            ATRStopK: 7,
            ATRTakeProfitK: 8,
            MaxEntriesPerDay: 9,
            TimeStopBars: 10,
            MinRunPctAnchor: 11,
            TrailStartPctAnchor: 12,
            TrailGivePctAnchor: 13,
            UseAnchorExit: 14,
            AnchorBackPct: 15,
            SysHistDBars: 16,
            SysHistMBars: 17,
        };
        Object.keys(strides).forEach(function (key) {
            base[key] = formatCompactNumber(pickOption(options[key], variantIndex, strides[key]));
        });
        return base;
    }
    function estimateNewPresetReturn(theme, profile, variantIndex) {
        const bias = theme === "breakout" ? 106 : (theme === "ema" ? 98 : 92);
        const score =
            bias
            + toNumber(profile.ATRTakeProfitK, 0) * 18
            + toNumber(profile.TrailStartPctAnchor, 0) * 12
            - toNumber(profile.ATRStopK, 0) * 11
            + (toNumber(profile.MaxEntriesPerDay, 0) - 4) * 2.4
            + (variantIndex % 9) * 1.7;
        return Math.max(84, Math.min(158, Math.round(score)));
    }
    function buildNewPreset(index) {
        const normalizedIndex = Math.max(0, index);
        const theme = NEW_THEME_ROTATION[normalizedIndex % NEW_THEME_ROTATION.length];
        const variantIndex = Math.floor(normalizedIndex / NEW_THEME_ROTATION.length);
        const parts = NEW_NAME_PARTS[theme] || NEW_NAME_PARTS.breakout;
        const family = parts.ids[variantIndex % parts.ids.length];
        const suffix = parts.suffixes[Math.floor(variantIndex / parts.ids.length) % parts.suffixes.length];
        const titleRoot = parts.titles[(variantIndex + normalizedIndex) % parts.titles.length];
        const variantCode = String(normalizedIndex + 1).padStart(3, "0");
        const profileOverrides = buildNewProfile(theme, variantIndex);
        return {
            theme: theme,
            strategyId: family + "_" + suffix + "_" + variantCode,
            title: titleRoot + " " + suffix + " " + variantCode,
            profileOverrides: profileOverrides,
            estimatedReturn: estimateNewPresetReturn(theme, profileOverrides, variantIndex),
            note: NEW_THEME_LABELS[theme] + " 組合 " + variantCode,
        };
    }
    function setActiveMode(mode) {
        modeButtons.forEach(function (btn) { btn.classList.toggle("is-active", btn.dataset.mode === mode); });
    }
    function inputBlock(lines) { return "input:\n    " + lines.join(",\n    ") + ";"; }
    function varBlock(lines) { return "var:\n    " + lines.join(",\n    ") + ";"; }

    function buildPair(preset) {
        const p = Object.assign({}, PROFILES[preset.theme] || PROFILES.breakout, preset.profileOverrides || {});
        const common =
`{*
    strategy_id: ${preset.strategyId}
    title: ${preset.title}
    policy_version: V2
*}

//=======================================================================
// ScriptName : ${preset.strategyId}
// 說明       : ${preset.title}
// 核心模型   : 日 K 定錨 + NH/NL 或 Don 確認 + ATR 濾網 + 多層出場引擎 + 1 分 K Open 執行
// 規範       : C1~C5 與交易版完全一致，只有 C6 不同
//=======================================================================

//====================== C1.參數區 ======================
input:
    DonLen(${p.DonLen}, "1.Don長度"),
    ATRLen(${p.ATRLen}, "2.ATR長度"),
    EMAWarmBars(${p.EMAWarmBars}, "3.EMA定錨回推日數"),
    EntryBufferPts(${p.EntryBufferPts}, "4.NH/NL突破緩衝點數"),
    DonBufferPts(${p.DonBufferPts}, "5.Don突破緩衝點數"),
    MinATRD(${p.MinATRD}, "6.最小日ATR濾網"),
    ATRStopK(${p.ATRStopK}, "7.ATR停損倍數"),
    ATRTakeProfitK(${p.ATRTakeProfitK}, "8.ATR停利倍率"),
    MaxEntriesPerDay(${p.MaxEntriesPerDay}, "9.單日最多進場次數"),
    TimeStopBars(${p.TimeStopBars}, "10.時間停損Bars"),
    MinRunPctAnchor(${p.MinRunPctAnchor}, "11.時間停損最小發動(定錨%)"),
    TrailStartPctAnchor(${p.TrailStartPctAnchor}, "12.回吐停利啟動(定錨%)"),
    TrailGivePctAnchor(${p.TrailGivePctAnchor}, "13.回吐停利允許回吐(定錨%)"),
    UseAnchorExit(${p.UseAnchorExit}, "14.是否啟用08:48定錨失敗出場"),
    AnchorBackPct(${p.AnchorBackPct}, "15.定錨失敗出場(定錨%)"),
    SysHistDBars(${p.SysHistDBars}, "98.SysHistDBars"),
    SysHistMBars(${p.SysHistMBars}, "99.SysHistMBars");

//====================== C2.基礎資料與指標計算 ======================
var:
    isMinChart(false),
    fixedBeginTime(084800),
    fixedEndTime(124000),
    fixedForceExitTime(131200),
    fixedMALen2(3),
    fixedMALen3(5),
    fixedEMALen2(3),
    fixedEMALen3(5),
    sessOnEntry(0),
    sessOnManage(0),
    warmupBars(0),
    dFieldReady(false),
    dataReady(false),
    yH(0),
    yL(0),
    yC(0),
    ma2D(0),
    ma3D(0),
    ema2D(0),
    ema3D(0),
    alpha2(0),
    alpha3(0),
    donHiD(0),
    donLoD(0),
    atrD(0),
    cdpVal(0),
    nhVal(0),
    nlVal(0),
    LongBias(false),
    ShortBias(false),
    LongEntrySig(false),
    ShortEntrySig(false),
    LongExitTrig(false),
    ShortExitTrig(false),
    ForceExitTrig(false),
    posFlag(0),
    cost(0),
    entryATRD(0),
    dayEntryCount(0),
    entryBarNo(0),
    bestHighSinceEntry(0),
    bestLowSinceEntry(0),
    maxRunUpPts(0),
    maxRunDnPts(0),
    barsHeld(0),
    dayAnchorOpen(0),
    minRunPtsByAnchor(0),
    trailStartPtsByAnchor(0),
    trailGivePtsByAnchor(0),
    anchorBackPtsByAnchor(0),
    lastMarkBar(-9999),
    lastExitBar(-9999),
    dayInitDate(0),
    dayRefDate(0),
    i(0),
    maSum(0),
    tmpHi(0),
    tmpLo(0),
    tmpTR(0),
    atrSum(0),
    longMark(0),
    shortMark(0),
    longExitMark(0),
    shortExitMark(0),
    forceExitMark(0),
    fpath(""),
    hdrPrinted(false),
    outStr(""),
    hh(0),
    mm(0),
    ss(0),
    timeStr(""),
    dateTimeStr(""),
    hasTradeEvent(false),
    longEntryLevelNH(0),
    longEntryLevelDon(0),
    shortEntryLevelNL(0),
    shortEntryLevelDon(0),
    atrStopLong(0),
    atrStopShort(0),
    atrTPPriceLong(0),
    atrTPPriceShort(0),
    LongEntryReady(false),
    ShortEntryReady(false),
    LongExitByATR(false),
    ShortExitByATR(false),
    LongExitByTP(false),
    ShortExitByTP(false),
    LongExitByTime(false),
    ShortExitByTime(false),
    LongExitByTrail(false),
    ShortExitByTrail(false),
    LongExitByAnchor(false),
    ShortExitByAnchor(false);

isMinChart = (BarFreq = "Min") and (BarInterval = 1) and (BarAdjusted = false);

if BarFreq <> "Min" then
    RaiseRunTimeError("本腳本僅支援分鐘線");
if BarFreq <> "Min" or BarInterval <> 1 or BarAdjusted then
    RaiseRunTimeError("本腳本僅支援非還原 1 分鐘線");
if DonLen < 1 then
    RaiseRunTimeError("DonLen 必須 >= 1");
if ATRLen < 1 then
    RaiseRunTimeError("ATRLen 必須 >= 1");
if EMAWarmBars < 1 then
    RaiseRunTimeError("EMAWarmBars 必須 >= 1");
if ATRTakeProfitK <= 0 then
    RaiseRunTimeError("ATRTakeProfitK 必須 > 0");

warmupBars = IntPortion(MaxList(fixedMALen3 + 2, fixedEMALen3 + 2, DonLen + 2, ATRLen + 2, EMAWarmBars + 2));

SetBackBar(2);
SetBackBar(SysHistDBars, "D");
SetTotalBar(SysHistMBars);

sessOnEntry  = IFF((Time >= fixedBeginTime) and (Time <= fixedEndTime), 1, 0);
sessOnManage = IFF((Time >= fixedBeginTime) and (Time <= fixedForceExitTime), 1, 0);

if CurrentBar = 1 then begin
    posFlag = 0;
    cost = 0;
    entryATRD = 0;
    dayEntryCount = 0;
    entryBarNo = 0;
    bestHighSinceEntry = 0;
    bestLowSinceEntry = 0;
    maxRunUpPts = 0;
    maxRunDnPts = 0;
    barsHeld = 0;
    dayAnchorOpen = 0;
    minRunPtsByAnchor = 0;
    trailStartPtsByAnchor = 0;
    trailGivePtsByAnchor = 0;
    anchorBackPtsByAnchor = 0;
    lastMarkBar = -9999;
    lastExitBar = -9999;
    dayInitDate = 0;
    dayRefDate = 0;
    hdrPrinted = false;
    fpath = "C:\\XQ\\data\\" + "[ScriptName]_[Date]_[StartTime].txt";
end;

dayRefDate = 0;
dFieldReady = CheckField("High", "D") and CheckField("Low", "D") and CheckField("Close", "D");
if dFieldReady then
    dayRefDate = GetFieldDate("Close", "D");

if (Date <> dayInitDate) and (Time >= fixedBeginTime) and (dayRefDate = Date) then begin
    yH = GetField("High", "D")[1];
    yL = GetField("Low", "D")[1];
    yC = GetField("Close", "D")[1];

    maSum = 0;
    for i = 1 to fixedMALen2 begin
        maSum = maSum + GetField("Close", "D")[i];
    end;
    ma2D = maSum / fixedMALen2;

    maSum = 0;
    for i = 1 to fixedMALen3 begin
        maSum = maSum + GetField("Close", "D")[i];
    end;
    ma3D = maSum / fixedMALen3;

    alpha2 = 2.0 / (fixedEMALen2 + 1);
    alpha3 = 2.0 / (fixedEMALen3 + 1);

    ema2D = GetField("Close", "D")[EMAWarmBars];
    for i = EMAWarmBars - 1 downto 1 begin
        ema2D = alpha2 * GetField("Close", "D")[i] + (1 - alpha2) * ema2D;
    end;

    ema3D = GetField("Close", "D")[EMAWarmBars];
    for i = EMAWarmBars - 1 downto 1 begin
        ema3D = alpha3 * GetField("Close", "D")[i] + (1 - alpha3) * ema3D;
    end;

    tmpHi = GetField("High", "D")[1];
    tmpLo = GetField("Low", "D")[1];
    for i = 2 to DonLen begin
        if GetField("High", "D")[i] > tmpHi then
            tmpHi = GetField("High", "D")[i];
        if GetField("Low", "D")[i] < tmpLo then
            tmpLo = GetField("Low", "D")[i];
    end;
    donHiD = tmpHi;
    donLoD = tmpLo;

    atrSum = 0;
    for i = 1 to ATRLen begin
        tmpTR = MaxList(
                    GetField("High", "D")[i] - GetField("Low", "D")[i],
                    AbsValue(GetField("High", "D")[i] - GetField("Close", "D")[i + 1]),
                    AbsValue(GetField("Low", "D")[i] - GetField("Close", "D")[i + 1])
                );
        atrSum = atrSum + tmpTR;
    end;
    atrD = atrSum / ATRLen;

    cdpVal = (yH + yL + 2 * yC) / 4;
    nhVal = 2 * cdpVal - yL;
    nlVal = 2 * cdpVal - yH;

    LongBias = false;
    ShortBias = false;

    if ((ma2D > ma3D) or (ema2D > ema3D)) and (yC > cdpVal) then
        LongBias = true;
    if ((ma2D < ma3D) or (ema2D < ema3D)) and (yC < cdpVal) then
        ShortBias = true;

    posFlag = 0;
    cost = 0;
    entryATRD = 0;
    dayEntryCount = 0;
    entryBarNo = 0;
    bestHighSinceEntry = 0;
    bestLowSinceEntry = 0;
    maxRunUpPts = 0;
    maxRunDnPts = 0;
    barsHeld = 0;
    dayAnchorOpen = 0;
    minRunPtsByAnchor = 0;
    trailStartPtsByAnchor = 0;
    trailGivePtsByAnchor = 0;
    anchorBackPtsByAnchor = 0;
    lastMarkBar = -9999;
    lastExitBar = -9999;
    dayInitDate = Date;
end;

if (Time = fixedBeginTime) and (dayAnchorOpen = 0) then
    dayAnchorOpen = Open;

if dayAnchorOpen > 0 then begin
    minRunPtsByAnchor = dayAnchorOpen * MinRunPctAnchor * 0.01;
    trailStartPtsByAnchor = dayAnchorOpen * TrailStartPctAnchor * 0.01;
    trailGivePtsByAnchor = dayAnchorOpen * TrailGivePctAnchor * 0.01;
    anchorBackPtsByAnchor = dayAnchorOpen * AnchorBackPct * 0.01;
end
else begin
    minRunPtsByAnchor = 0;
    trailStartPtsByAnchor = 0;
    trailGivePtsByAnchor = 0;
    anchorBackPtsByAnchor = 0;
end;

LongEntrySig = false;
ShortEntrySig = false;
LongExitTrig = false;
ShortExitTrig = false;
ForceExitTrig = false;
LongEntryReady = false;
ShortEntryReady = false;
LongExitByATR = false;
ShortExitByATR = false;
LongExitByTP = false;
ShortExitByTP = false;
LongExitByTime = false;
ShortExitByTime = false;
LongExitByTrail = false;
ShortExitByTrail = false;
LongExitByAnchor = false;
ShortExitByAnchor = false;

longEntryLevelNH = nhVal + EntryBufferPts;
longEntryLevelDon = donHiD + DonBufferPts;
shortEntryLevelNL = nlVal - EntryBufferPts;
shortEntryLevelDon = donLoD - DonBufferPts;

if (posFlag <> 0) and (CurrentBar > entryBarNo) then begin
    if posFlag = 1 then begin
        if High[1] > bestHighSinceEntry then
            bestHighSinceEntry = High[1];
        if Low[1] < bestLowSinceEntry then
            bestLowSinceEntry = Low[1];
        maxRunUpPts = bestHighSinceEntry - cost;
        maxRunDnPts = cost - bestLowSinceEntry;
    end;

    if posFlag = -1 then begin
        if Low[1] < bestLowSinceEntry then
            bestLowSinceEntry = Low[1];
        if High[1] > bestHighSinceEntry then
            bestHighSinceEntry = High[1];
        maxRunUpPts = cost - bestLowSinceEntry;
        maxRunDnPts = bestHighSinceEntry - cost;
    end;
end;

if posFlag <> 0 then
    barsHeld = CurrentBar - entryBarNo
else
    barsHeld = 0;

atrStopLong = cost - ATRStopK * entryATRD;
atrStopShort = cost + ATRStopK * entryATRD;
atrTPPriceLong = cost + ATRTakeProfitK * entryATRD;
atrTPPriceShort = cost - ATRTakeProfitK * entryATRD;

dataReady = isMinChart and (CurrentBar > warmupBars) and dFieldReady and (dayInitDate = Date) and (dayRefDate = Date) and (dayAnchorOpen > 0) and (atrD > 0);

//====================== C3.進場條件 ======================
if dataReady and (sessOnEntry = 1) and (lastMarkBar <> CurrentBar) then begin
    if (posFlag = 0) and (dayEntryCount < MaxEntriesPerDay) then begin
        if LongBias and (atrD >= MinATRD) and ((Open >= longEntryLevelNH) or (Open >= longEntryLevelDon)) then
            LongEntryReady = true;
        if ShortBias and (atrD >= MinATRD) and ((Open <= shortEntryLevelNL) or (Open <= shortEntryLevelDon)) then
            ShortEntryReady = true;

        if LongEntryReady then
            LongEntrySig = true
        else if ShortEntryReady then
            ShortEntrySig = true;
    end;
end;

//====================== C4.出場條件 ======================
if dataReady and (sessOnManage = 1) and (lastMarkBar <> CurrentBar) then begin
    if (Time >= fixedForceExitTime) and (posFlag <> 0) then begin
        ForceExitTrig = true;
    end
    else begin
        if posFlag = 1 then begin
            LongExitByATR = (entryATRD > 0) and (Open <= atrStopLong);
            LongExitByTP = (entryATRD > 0) and (Open >= atrTPPriceLong);
            LongExitByTime = (barsHeld >= TimeStopBars) and (maxRunUpPts < minRunPtsByAnchor);
            LongExitByTrail = (maxRunUpPts >= trailStartPtsByAnchor) and ((bestHighSinceEntry - Open) >= trailGivePtsByAnchor);
            LongExitByAnchor = (UseAnchorExit = 1) and (dayAnchorOpen > 0) and (Open <= dayAnchorOpen - anchorBackPtsByAnchor);
            if LongExitByATR or LongExitByTP or LongExitByTime or LongExitByTrail or LongExitByAnchor then
                LongExitTrig = true;
        end;

        if posFlag = -1 then begin
            ShortExitByATR = (entryATRD > 0) and (Open >= atrStopShort);
            ShortExitByTP = (entryATRD > 0) and (Open <= atrTPPriceShort);
            ShortExitByTime = (barsHeld >= TimeStopBars) and (maxRunUpPts < minRunPtsByAnchor);
            ShortExitByTrail = (maxRunUpPts >= trailStartPtsByAnchor) and ((Open - bestLowSinceEntry) >= trailGivePtsByAnchor);
            ShortExitByAnchor = (UseAnchorExit = 1) and (dayAnchorOpen > 0) and (Open >= dayAnchorOpen + anchorBackPtsByAnchor);
            if ShortExitByATR or ShortExitByTP or ShortExitByTime or ShortExitByTrail or ShortExitByAnchor then
                ShortExitTrig = true;
        end;
    end;
end;

//====================== C5.狀態更新 ======================
hasTradeEvent = false;

if dataReady and (sessOnManage = 1) and (lastMarkBar <> CurrentBar) then begin
    if ForceExitTrig then begin
        posFlag = 0;
        cost = 0;
        entryATRD = 0;
        entryBarNo = 0;
        bestHighSinceEntry = 0;
        bestLowSinceEntry = 0;
        maxRunUpPts = 0;
        maxRunDnPts = 0;
        barsHeld = 0;
        lastMarkBar = CurrentBar;
        lastExitBar = CurrentBar;
        hasTradeEvent = true;
    end
    else if LongExitTrig then begin
        posFlag = 0;
        cost = 0;
        entryATRD = 0;
        entryBarNo = 0;
        bestHighSinceEntry = 0;
        bestLowSinceEntry = 0;
        maxRunUpPts = 0;
        maxRunDnPts = 0;
        barsHeld = 0;
        lastMarkBar = CurrentBar;
        lastExitBar = CurrentBar;
        hasTradeEvent = true;
    end
    else if ShortExitTrig then begin
        posFlag = 0;
        cost = 0;
        entryATRD = 0;
        entryBarNo = 0;
        bestHighSinceEntry = 0;
        bestLowSinceEntry = 0;
        maxRunUpPts = 0;
        maxRunDnPts = 0;
        barsHeld = 0;
        lastMarkBar = CurrentBar;
        lastExitBar = CurrentBar;
        hasTradeEvent = true;
    end;
end;

if dataReady and (sessOnEntry = 1) and (lastMarkBar <> CurrentBar) then begin
    if LongEntrySig then begin
        posFlag = 1;
        cost = Open;
        entryATRD = atrD;
        dayEntryCount = dayEntryCount + 1;
        entryBarNo = CurrentBar;
        bestHighSinceEntry = Open;
        bestLowSinceEntry = Open;
        maxRunUpPts = 0;
        maxRunDnPts = 0;
        barsHeld = 0;
        lastMarkBar = CurrentBar;
        hasTradeEvent = true;
    end
    else if ShortEntrySig then begin
        posFlag = -1;
        cost = Open;
        entryATRD = atrD;
        dayEntryCount = dayEntryCount + 1;
        entryBarNo = CurrentBar;
        bestHighSinceEntry = Open;
        bestLowSinceEntry = Open;
        maxRunUpPts = 0;
        maxRunDnPts = 0;
        barsHeld = 0;
        lastMarkBar = CurrentBar;
        hasTradeEvent = true;
    end;
end;

longMark = IFF(LongEntrySig, Open, 0);
shortMark = IFF(ShortEntrySig, Open, 0);
longExitMark = IFF(LongExitTrig, Open, 0);
shortExitMark = IFF(ShortExitTrig, Open, 0);
forceExitMark = IFF(ForceExitTrig, Open, 0);
`;

        return {
            indicator:
`${common}
//====================== C6.指標版輸出 ======================
if hasTradeEvent then begin
    if hdrPrinted = false then begin
        outStr = "";
        outStr = outStr + "BeginTime=" + NumToStr(fixedBeginTime, 0);
        outStr = outStr + ",EndTime=" + NumToStr(fixedEndTime, 0);
        outStr = outStr + ",ForceExitTime=" + NumToStr(fixedForceExitTime, 0);
        outStr = outStr + ",FixedMA2Len=" + NumToStr(fixedMALen2, 0);
        outStr = outStr + ",FixedMA3Len=" + NumToStr(fixedMALen3, 0);
        outStr = outStr + ",FixedEMA2Len=" + NumToStr(fixedEMALen2, 0);
        outStr = outStr + ",FixedEMA3Len=" + NumToStr(fixedEMALen3, 0);
        outStr = outStr + ",DonLen=" + NumToStr(DonLen, 0);
        outStr = outStr + ",ATRLen=" + NumToStr(ATRLen, 0);
        outStr = outStr + ",EMAWarmBars=" + NumToStr(EMAWarmBars, 0);
        outStr = outStr + ",EntryBufferPts=" + NumToStr(EntryBufferPts, 0);
        outStr = outStr + ",DonBufferPts=" + NumToStr(DonBufferPts, 0);
        outStr = outStr + ",MinATRD=" + NumToStr(MinATRD, 0);
        outStr = outStr + ",ATRStopK=" + NumToStr(ATRStopK, 2);
        outStr = outStr + ",ATRTakeProfitK=" + NumToStr(ATRTakeProfitK, 2);
        outStr = outStr + ",MaxEntriesPerDay=" + NumToStr(MaxEntriesPerDay, 0);
        outStr = outStr + ",TimeStopBars=" + NumToStr(TimeStopBars, 0);
        outStr = outStr + ",MinRunPctAnchor=" + NumToStr(MinRunPctAnchor, 2);
        outStr = outStr + ",TrailStartPctAnchor=" + NumToStr(TrailStartPctAnchor, 2);
        outStr = outStr + ",TrailGivePctAnchor=" + NumToStr(TrailGivePctAnchor, 2);
        outStr = outStr + ",UseAnchorExit=" + NumToStr(UseAnchorExit, 0);
        outStr = outStr + ",AnchorBackPct=" + NumToStr(AnchorBackPct, 2);
        outStr = outStr + ",Strategy=DailyBiasSoft(MAorEMA+CDP)+NHNLorDon+ATRFilter+ATRStop+ATRTakeProfit+TimeStop+TrailExitPctAnchor+AnchorExitPctAnchor";
        Print(File(fpath), outStr);
        hdrPrinted = true;
    end;

    hh = IntPortion(Time / 10000);
    mm = IntPortion((Time - hh * 10000) / 100);
    ss = Time - hh * 10000 - mm * 100;

    timeStr = "";
    if hh < 10 then
        timeStr = timeStr + "0" + NumToStr(hh, 0)
    else
        timeStr = timeStr + NumToStr(hh, 0);

    if mm < 10 then
        timeStr = timeStr + "0" + NumToStr(mm, 0)
    else
        timeStr = timeStr + NumToStr(mm, 0);

    if ss < 10 then
        timeStr = timeStr + "0" + NumToStr(ss, 0)
    else
        timeStr = timeStr + NumToStr(ss, 0);

    dateTimeStr = NumToStr(Date, 0) + timeStr;

    if LongEntrySig then begin
        outStr = dateTimeStr + " " + NumToStr(IntPortion(Open), 0) + " 新買";
        Print(File(fpath), outStr);
    end
    else if ShortEntrySig then begin
        outStr = dateTimeStr + " " + NumToStr(IntPortion(Open), 0) + " 新賣";
        Print(File(fpath), outStr);
    end
    else if LongExitTrig then begin
        outStr = dateTimeStr + " " + NumToStr(IntPortion(Open), 0) + " 平賣";
        Print(File(fpath), outStr);
    end
    else if ShortExitTrig then begin
        outStr = dateTimeStr + " " + NumToStr(IntPortion(Open), 0) + " 平買";
        Print(File(fpath), outStr);
    end
    else if ForceExitTrig then begin
        outStr = dateTimeStr + " " + NumToStr(IntPortion(Open), 0) + " 強制平倉";
        Print(File(fpath), outStr);
    end;
end;

Plot1(longMark, "新買");
Plot2(shortMark, "新賣");
Plot3(longExitMark, "平賣");
Plot4(shortExitMark, "平買");
Plot5(forceExitMark, "強制平倉");`,
            trading:
`${common}
//====================== C6.交易版執行 ======================
// Plot1(longMark, "新買");
// Plot2(shortMark, "新賣");
// Plot3(longExitMark, "平賣");
// Plot4(shortExitMark, "平買");
// Plot5(forceExitMark, "強制平倉");
//
// if hasTradeEvent then begin
//     Print(File(fpath), "YYYYMMDDhhmmss 價格 動作");
// end;

if dataReady and (sessOnManage = 1) and (CurrentBar > warmupBars) and (lastMarkBar = CurrentBar) then begin
    if ForceExitTrig or LongExitTrig or ShortExitTrig then begin
        if Position <> 0 then
            SetPosition(0, MARKET);
    end;
end;

if dataReady and (sessOnEntry = 1) and (CurrentBar > warmupBars) and (lastMarkBar = CurrentBar) then begin
    if LongEntrySig then begin
        if Position <> 1 then
            SetPosition(1, MARKET);
    end
    else if ShortEntrySig then begin
        if Position <> -1 then
            SetPosition(-1, MARKET);
    end;
end;`,
        };
    }

    function renderYears(items) {
        annualReturnList.innerHTML = "";
        (Array.isArray(items) && items.length ? items : DEFAULT_BEST_METRICS.annualReturns).forEach(function (item) {
            const chip = document.createElement("article");
            chip.className = "annual-chip";
            const valueText = hasMetricValue(item.value) && Number.isFinite(Number(item.value)) ? formatSignedPercent(item.value) : "待驗證";
            chip.innerHTML = '<span class="annual-year">' + item.year + '</span><strong class="annual-value">' + valueText + "</strong>";
            annualReturnList.appendChild(chip);
        });
    }

    function createSvgNode(tagName, attributes) {
        const node = document.createElementNS(SVG_NS, tagName);
        Object.keys(attributes || {}).forEach(function (key) {
            if (attributes[key] !== undefined && attributes[key] !== null) {
                node.setAttribute(key, String(attributes[key]));
            }
        });
        return node;
    }

    function clearNode(node) {
        if (node) {
            node.replaceChildren();
        }
    }

    function parseChartTimestamp(value) {
        const digits = String(value || "").replace(/\D+/g, "");
        if (digits.length < 8) {
            return null;
        }

        const year = toInt(digits.slice(0, 4), 0);
        const month = toInt(digits.slice(4, 6), 1) - 1;
        const day = toInt(digits.slice(6, 8), 1);
        const hour = digits.length >= 10 ? toInt(digits.slice(8, 10), 0) : 0;
        const minute = digits.length >= 12 ? toInt(digits.slice(10, 12), 0) : 0;
        const date = new Date(year, month, day, hour, minute, 0, 0);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function cloneChartDate(date) {
        return date instanceof Date ? new Date(date.getTime()) : null;
    }
    function normalizeChartDate(date) {
        const next = cloneChartDate(date);
        if (!next) {
            return null;
        }
        next.setHours(0, 0, 0, 0);
        return next;
    }

    function addChartYears(date, years) {
        const next = cloneChartDate(date);
        if (!next) {
            return null;
        }
        next.setFullYear(next.getFullYear() + years);
        return next;
    }

    function addChartDays(date, days) {
        const next = cloneChartDate(date);
        if (!next) {
            return null;
        }
        next.setDate(next.getDate() + days);
        return next;
    }

    function addChartMonths(date, months) {
        const next = cloneChartDate(date);
        if (!next) {
            return null;
        }
        return new Date(next.getFullYear(), next.getMonth() + months, 1);
    }

    function startOfChartWeek(date) {
        const next = normalizeChartDate(date);
        if (!next) {
            return null;
        }
        const day = next.getDay();
        const diff = (day + 6) % 7;
        next.setDate(next.getDate() - diff);
        return next;
    }
    function isSameChartWeek(left, right) {
        const leftWeek = startOfChartWeek(left);
        const rightWeek = startOfChartWeek(right);
        return Boolean(
            leftWeek
            && rightWeek
            && leftWeek.getTime() === rightWeek.getTime()
        );
    }
    function getChartWeekDisplayDate(weekStart) {
        const friday = addChartDays(weekStart, 4);
        if (!friday) {
            return normalizeChartDate(weekStart);
        }
        return friday;
    }

    function startOfChartMonth(date) {
        const next = cloneChartDate(date);
        if (!next) {
            return null;
        }
        return new Date(next.getFullYear(), next.getMonth(), 1);
    }

    function startOfChartYear(date) {
        const next = cloneChartDate(date);
        if (!next) {
            return null;
        }
        return new Date(next.getFullYear(), 0, 1);
    }

    function formatChartDate(date, compact) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
            return "";
        }
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        if (compact) {
            return year + "/" + month + "/" + day;
        }
        return year + "/" + month + "/" + day;
    }

    function formatRangeCaption(range) {
        if (!range || !(range.start instanceof Date) || !(range.end instanceof Date)) {
            return "全部區間";
        }
        return range.label + "｜" + formatChartDate(range.start, false) + " - " + formatChartDate(range.end, false);
    }

    function buildPerformanceRangeMap(firstDate, lastDate) {
        const rangeMap = {};
        PERFORMANCE_RANGE_OPTIONS.forEach(function (option) {
            if (!(firstDate instanceof Date) || !(lastDate instanceof Date)) {
                return;
            }
            const start = option.years == null
                ? cloneChartDate(firstDate)
                : (function () {
                    const candidate = addChartYears(lastDate, -option.years);
                    if (!(candidate instanceof Date)) {
                        return cloneChartDate(firstDate);
                    }
                    return candidate < firstDate ? cloneChartDate(firstDate) : candidate;
                }());

            rangeMap[option.key] = {
                key: option.key,
                label: option.label,
                start: start,
                end: cloneChartDate(lastDate),
            };
        });
        return rangeMap;
    }

    function chooseTickIndexes(length, maxTickCount) {
        if (!Number.isFinite(length) || length <= 0) {
            return [];
        }
        if (length === 1) {
            return [0];
        }

        const target = Math.max(2, Math.min(length, maxTickCount || 6));
        const indexes = new Set([0, length - 1]);
        for (let i = 1; i < target - 1; i += 1) {
            indexes.add(Math.round((length - 1) * (i / (target - 1))));
        }
        return Array.from(indexes).sort(function (left, right) { return left - right; });
    }
    function resolvePerformanceDomain(slice) {
        const firstPointDate = slice?.points?.find(function (point) { return point?.date instanceof Date; })?.date || null;
        const lastPointDate = slice?.points?.length
            ? slice.points.slice().reverse().find(function (point) { return point?.date instanceof Date; })?.date || null
            : null;
        const firstWeeklyDate = slice?.weekly?.find(function (item) { return item?.date instanceof Date; })?.date || null;
        const lastWeeklyDate = slice?.weekly?.length
            ? slice.weekly.slice().reverse().find(function (item) { return item?.date instanceof Date; })?.date || null
            : null;

        const start = normalizeChartDate(firstPointDate || firstWeeklyDate || slice?.range?.start);
        const end = normalizeChartDate(lastPointDate || lastWeeklyDate || slice?.range?.end || start);
        if (!start || !end) {
            return null;
        }

        if (end.getTime() <= start.getTime()) {
            end.setDate(end.getDate() + 1);
        }

        return {
            start: start,
            end: end,
            startMs: start.getTime(),
            endMs: end.getTime(),
            spanMs: Math.max(1, end.getTime() - start.getTime()),
        };
    }
    function buildPerformanceAxisDates(slice, maxTickCount) {
        const dates = [];
        const seen = new Set();
        [slice?.points || [], slice?.weekly || []].forEach(function (items) {
            items.forEach(function (item) {
                const date = item && item.date instanceof Date ? normalizeChartDate(item.date) : null;
                const key = date ? String(date.getTime()) : "";
                if (!key || seen.has(key)) {
                    return;
                }
                seen.add(key);
                dates.push(date);
            });
        });

        if (!dates.length) {
            return [];
        }
        dates.sort(function (left, right) { return left - right; });
        return chooseTickIndexes(dates.length, maxTickCount || 6).map(function (index) {
            return dates[index];
        });
    }
    function buildPerformanceSlotDates(slice) {
        const dates = [];
        const seen = new Set();
        (slice?.weekly || []).forEach(function (item) {
            const date = item && item.date instanceof Date ? normalizeChartDate(item.date) : null;
            const key = date ? String(date.getTime()) : "";
            if (!key || seen.has(key)) {
                return;
            }
            seen.add(key);
            dates.push(date);
        });
        dates.sort(function (left, right) { return left - right; });
        return dates;
    }
    function createPerformanceXScale(domain, margin, plotWidth) {
        return function (date) {
            const time = date instanceof Date ? date.getTime() : Number(date);
            if (!Number.isFinite(time) || !domain) {
                return margin.left + plotWidth / 2;
            }
            const clamped = Math.min(domain.endMs, Math.max(domain.startMs, time));
            return margin.left + ((clamped - domain.startMs) / domain.spanMs) * plotWidth;
        };
    }
    function getPerformancePeriodLabel(key) {
        const definition = PERFORMANCE_PERIOD_DEFS[key];
        const group = definition ? PERFORMANCE_RANGE_GROUPS[definition.group] : null;
        return definition && group ? group.spanLabel(definition.span) : "";
    }

    function getPerformanceGroupForKey(key) {
        return PERFORMANCE_PERIOD_DEFS[key] ? PERFORMANCE_PERIOD_DEFS[key].group : null;
    }

    function hasPerformanceDataInRange(points, start, end) {
        return (Array.isArray(points) ? points : []).some(function (point) {
            return !point.synthetic && point.date instanceof Date && point.date >= start && point.date <= end;
        });
    }

    function buildPerformanceRangeCatalog(firstDate, lastDate, points) {
        const rangeMap = {
            all: {
                key: "all",
                label: "全部",
                start: cloneChartDate(firstDate),
                end: cloneChartDate(lastDate),
                group: null,
            },
        };

        if (!(firstDate instanceof Date) || !(lastDate instanceof Date)) {
            return rangeMap;
        }

        Object.keys(PERFORMANCE_PERIOD_DEFS).forEach(function (key) {
            const definition = PERFORMANCE_PERIOD_DEFS[key];
            let start = null;

            if (definition.group === "week") {
                start = addChartDays(startOfChartWeek(lastDate), -7 * (definition.span - 1));
            } else if (definition.group === "month") {
                start = addChartMonths(startOfChartMonth(lastDate), -(definition.span - 1));
            } else if (definition.group === "year") {
                start = addChartYears(startOfChartYear(lastDate), -(definition.span - 1));
            }

            if (!(start instanceof Date)) {
                return;
            }
            if (start < firstDate) {
                start = cloneChartDate(firstDate);
            }
            if (!hasPerformanceDataInRange(points, start, lastDate)) {
                return;
            }

            rangeMap[key] = {
                key: key,
                label: getPerformancePeriodLabel(key),
                start: start,
                end: cloneChartDate(lastDate),
                group: definition.group,
            };
        });

        return rangeMap;
    }

    function getDefaultPerformanceRangeKey(rangeMap) {
        if (!rangeMap) {
            return "all";
        }

        const preferredKeys = [
            "year_6", "year_5", "year_4", "year_3", "year_2", "year_1",
            "month_6", "month_5", "month_4", "month_3", "month_2", "month_1",
            "week_4", "week_3", "week_2", "week_1",
            "all",
        ];
        for (let index = 0; index < preferredKeys.length; index += 1) {
            if (rangeMap[preferredKeys[index]]) {
                return preferredKeys[index];
            }
        }
        return Object.keys(rangeMap)[0] || "all";
    }

    function formatPerformanceRangeCaption(range) {
        if (!range || !(range.start instanceof Date) || !(range.end instanceof Date)) {
            return "全部區間";
        }
        return range.label + "｜" + formatChartDate(range.start, false) + " - " + formatChartDate(range.end, false);
    }

    function formatAxisMoney(value) {
        if (!Number.isFinite(value)) {
            return "";
        }
        return Math.round(value).toLocaleString("en-US");
    }

    function buildPerformancePayload(report) {
        const safeDetails = Array.isArray(report && report.details) ? report.details : [];
        if (!safeDetails.length) {
            return null;
        }

        const normalized = safeDetails.map(function (detail) {
            return {
                date: parseChartTimestamp(detail && detail.exitTs),
                side: String(detail && detail.side || "").toLowerCase(),
                theoryPnl: Number(detail && detail.theoryPnl),
                actualPnl: Number(detail && detail.actualPnl),
            };
        }).filter(function (detail) {
            return detail.date instanceof Date
                && Number.isFinite(detail.theoryPnl)
                && Number.isFinite(detail.actualPnl);
        }).sort(function (left, right) {
            return left.date - right.date;
        });

        if (!normalized.length) {
            return null;
        }

        const firstDate = normalizeChartDate(normalized[0].date);
        const lastDate = normalizeChartDate(normalized[normalized.length - 1].date);
        const weeklyMap = new Map();

        let theoryTotal = 0;
        let actualTotal = 0;
        let theoryLong = 0;
        let actualLong = 0;
        let theoryShort = 0;
        let actualShort = 0;

        normalized.forEach(function (detail) {
            theoryTotal += detail.theoryPnl;
            actualTotal += detail.actualPnl;

            if (detail.side === "long") {
                theoryLong += detail.theoryPnl;
                actualLong += detail.actualPnl;
            } else if (detail.side === "short") {
                theoryShort += detail.theoryPnl;
                actualShort += detail.actualPnl;
            }

            const weekDate = startOfChartWeek(detail.date);
            const weekKey = weekDate ? String(weekDate.getTime()) : "";
            if (!weekKey) {
                return;
            }

            if (!weeklyMap.has(weekKey)) {
                weeklyMap.set(weekKey, {
                    weekStart: cloneChartDate(weekDate),
                    date: normalizeChartDate(detail.date),
                    theory: 0,
                    actual: 0,
                    theoryTotal: 0,
                    actualTotal: 0,
                    theoryLong: 0,
                    actualLong: 0,
                    theoryShort: 0,
                    actualShort: 0,
                });
            }

            const bucket = weeklyMap.get(weekKey);
            bucket.date = normalizeChartDate(detail.date);
            bucket.theory += detail.theoryPnl;
            bucket.actual += detail.actualPnl;
            bucket.theoryTotal = theoryTotal;
            bucket.actualTotal = actualTotal;
            bucket.theoryLong = theoryLong;
            bucket.actualLong = actualLong;
            bucket.theoryShort = theoryShort;
            bucket.actualShort = actualShort;
        });

        const firstWeek = startOfChartWeek(firstDate);
        const lastWeek = startOfChartWeek(lastDate);
        if (!firstWeek || !lastWeek) {
            return null;
        }

        const weeklyBuckets = [];
        let cursor = cloneChartDate(firstWeek);
        let rollingTotals = {
            theoryTotal: 0,
            actualTotal: 0,
            theoryLong: 0,
            actualLong: 0,
            theoryShort: 0,
            actualShort: 0,
        };

        while (cursor && cursor.getTime() <= lastWeek.getTime()) {
            const weekKey = String(cursor.getTime());
            const existing = weeklyMap.get(weekKey);
            const bucket = existing
                ? {
                    weekStart: cloneChartDate(existing.weekStart),
                    date: getChartWeekDisplayDate(existing.weekStart),
                    theory: round1(existing.theory),
                    actual: round1(existing.actual),
                    theoryTotal: round1(existing.theoryTotal),
                    actualTotal: round1(existing.actualTotal),
                    theoryLong: round1(existing.theoryLong),
                    actualLong: round1(existing.actualLong),
                    theoryShort: round1(existing.theoryShort),
                    actualShort: round1(existing.actualShort),
                }
                : {
                    weekStart: cloneChartDate(cursor),
                    date: getChartWeekDisplayDate(cursor),
                    theory: 0,
                    actual: 0,
                    theoryTotal: round1(rollingTotals.theoryTotal),
                    actualTotal: round1(rollingTotals.actualTotal),
                    theoryLong: round1(rollingTotals.theoryLong),
                    actualLong: round1(rollingTotals.actualLong),
                    theoryShort: round1(rollingTotals.theoryShort),
                    actualShort: round1(rollingTotals.actualShort),
                };

            weeklyBuckets.push(bucket);
            rollingTotals = {
                theoryTotal: bucket.theoryTotal,
                actualTotal: bucket.actualTotal,
                theoryLong: bucket.theoryLong,
                actualLong: bucket.actualLong,
                theoryShort: bucket.theoryShort,
                actualShort: bucket.actualShort,
            };
            cursor = addChartDays(cursor, 7);
        }

        if (!weeklyBuckets.length) {
            return null;
        }

        const points = [{
            date: cloneChartDate(weeklyBuckets[0].date),
            theoryTotal: 0,
            actualTotal: 0,
            theoryLong: 0,
            actualLong: 0,
            theoryShort: 0,
            actualShort: 0,
            synthetic: true,
        }].concat(weeklyBuckets.map(function (item) {
            return {
                date: cloneChartDate(item.date),
                theoryTotal: round1(item.theoryTotal),
                actualTotal: round1(item.actualTotal),
                theoryLong: round1(item.theoryLong),
                actualLong: round1(item.actualLong),
                theoryShort: round1(item.theoryShort),
                actualShort: round1(item.actualShort),
                synthetic: false,
            };
        }));

        const weekly = weeklyBuckets.map(function (item) {
            return {
                weekStart: cloneChartDate(item.weekStart),
                date: cloneChartDate(item.date),
                theory: round1(item.theory),
                actual: round1(item.actual),
            };
        });

        const displayFirstDate = cloneChartDate(weeklyBuckets[0].date);
        const displayLastDate = cloneChartDate(weeklyBuckets[weeklyBuckets.length - 1].date);

        return {
            points: points,
            weekly: weekly,
            rangeMap: buildPerformanceRangeCatalog(displayFirstDate, displayLastDate, points),
        };
    }

    function isPerformancePayload(value) {
        return Boolean(
            value
            && Array.isArray(value.points)
            && Array.isArray(value.weekly)
            && value.rangeMap
        );
    }

    function getPerformanceSlice(payload, rangeKey) {
        if (!payload || !payload.rangeMap) {
            return null;
        }

        const range = payload.rangeMap[rangeKey] || payload.rangeMap.all || null;
        if (!range) {
            return null;
        }

        let baseline = {
            theoryTotal: 0,
            actualTotal: 0,
            theoryLong: 0,
            actualLong: 0,
            theoryShort: 0,
            actualShort: 0,
        };

        payload.points.forEach(function (point) {
            if (!point.synthetic && point.date < range.start) {
                baseline = point;
            }
        });

        const adjustedPoints = payload.points.filter(function (point) {
            return !point.synthetic && point.date >= range.start && point.date <= range.end;
        }).map(function (point) {
            return {
                date: cloneChartDate(point.date),
                theoryTotal: round1(point.theoryTotal - baseline.theoryTotal),
                actualTotal: round1(point.actualTotal - baseline.actualTotal),
                theoryLong: round1(point.theoryLong - baseline.theoryLong),
                actualLong: round1(point.actualLong - baseline.actualLong),
                theoryShort: round1(point.theoryShort - baseline.theoryShort),
                actualShort: round1(point.actualShort - baseline.actualShort),
                synthetic: false,
            };
        });

        if (!adjustedPoints.length) {
            return null;
        }

        const chartPoints = [{
            date: cloneChartDate(adjustedPoints[0].date),
            theoryTotal: 0,
            actualTotal: 0,
            theoryLong: 0,
            actualLong: 0,
            theoryShort: 0,
            actualShort: 0,
            synthetic: true,
        }].concat(adjustedPoints);

        const weekly = payload.weekly.filter(function (item) {
            return item.date >= range.start && item.date <= range.end;
        }).map(function (item) {
            return {
                weekStart: cloneChartDate(item.weekStart),
                date: cloneChartDate(item.date),
                theory: round1(item.theory),
                actual: round1(item.actual),
            };
        });

        let maxPoint = null;
        let minPoint = null;
        adjustedPoints.forEach(function (point) {
            if (!maxPoint || point.actualTotal > maxPoint.actualTotal) {
                maxPoint = point;
            }
            if (!minPoint || point.actualTotal < minPoint.actualTotal) {
                minPoint = point;
            }
        });

        return {
            range: range,
            points: chartPoints,
            weekly: weekly,
            maxPoint: maxPoint,
            minPoint: minPoint,
        };
    }

    function renderPerformanceLegend() {
        if (!performanceLegend) {
            return;
        }

        performanceLegend.innerHTML = "";
        [
            { label: "含滑價總損益", color: "#f4f7fb" },
            { label: "理論總損益", color: "#a9b8ca", dashed: true },
            { label: "多頭含滑價", color: "#ff7c70" },
            { label: "多頭理論", color: "#ff7c70", dashed: true },
            { label: "空頭含滑價", color: "#79d893" },
            { label: "空頭理論", color: "#79d893", dashed: true },
            { label: "期間最高點", color: "#ff7c70", marker: true },
            { label: "期間最低點", color: "#79d893", marker: true },
        ].forEach(function (item) {
            const wrapper = document.createElement("span");
            wrapper.className = "performance-legend-item";
            wrapper.style.color = item.color;

            const swatch = document.createElement("span");
            swatch.className = "performance-legend-swatch";

            const line = document.createElement("span");
            line.className = "performance-legend-line";
            if (item.dashed) {
                line.classList.add("is-dashed");
            }
            if (item.marker) {
                line.classList.add("is-marker");
            }
            swatch.appendChild(line);

            const label = document.createElement("span");
            label.textContent = item.label;

            wrapper.append(swatch, label);
            performanceLegend.appendChild(wrapper);
        });
    }

    function renderPerformanceRangeButtons(activeKey) {
        if (!performanceRangeList || !performanceChartPayload || !performanceChartPayload.rangeMap) {
            return;
        }

        performanceRangeGroupButtons.forEach(function (button) {
            const active = button.dataset.performanceRangeGroup === performanceChartRangeGroup;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");
        });

        if (performanceRangeReset) {
            const isAll = activeKey === "all";
            performanceRangeReset.classList.toggle("is-active", isAll);
            performanceRangeReset.setAttribute("aria-pressed", isAll ? "true" : "false");
        }

        performanceRangeList.innerHTML = "";
        const group = PERFORMANCE_RANGE_GROUPS[performanceChartRangeGroup] || PERFORMANCE_RANGE_GROUPS.week;
        group.keys.forEach(function (key) {
            const range = performanceChartPayload.rangeMap[key] || null;
            const button = document.createElement("button");
            button.type = "button";
            button.className = "performance-range-chip" + (key === activeKey ? " is-active" : "");
            button.textContent = getPerformancePeriodLabel(key);
            if (!range) {
                button.disabled = true;
                button.title = "目前區間無資料";
            } else {
                button.title = formatPerformanceRangeCaption(range);
            }
            button.addEventListener("click", function () {
                if (!range) {
                    return;
                }
                performanceChartRangeKey = key;
                renderPerformanceCharts(null, performanceChartRangeKey);
            });
            performanceRangeList.appendChild(button);
        });
    }

    performanceRangeGroupButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const nextGroup = button.dataset.performanceRangeGroup;
            if (!PERFORMANCE_RANGE_GROUPS[nextGroup]) {
                return;
            }
            performanceChartRangeGroup = nextGroup;
            const nextRangeKey = getPerformanceGroupForKey(performanceChartRangeKey) === nextGroup
                ? performanceChartRangeKey
                : (getDefaultPerformanceRangeKeyForGroup(
                    performanceChartPayload ? performanceChartPayload.rangeMap : null,
                    nextGroup
                ) || performanceChartRangeKey);
            renderPerformanceCharts(null, nextRangeKey);
        });
    });

    if (performanceRangeReset) {
        performanceRangeReset.addEventListener("click", function () {
            performanceChartRangeKey = "all";
            renderPerformanceCharts(null, "all");
        });
    }

    function renderPerformanceRangeButtons(activeKey) {
        if (!performanceRangeList || !performanceChartPayload || !performanceChartPayload.rangeMap) {
            return;
        }

        performanceRangeList.innerHTML = "";
        PERFORMANCE_RANGE_ORDER.forEach(function (key) {
            const range = performanceChartPayload.rangeMap[key] || null;
            const button = document.createElement("button");
            button.type = "button";
            button.className = "performance-range-chip" + (key === activeKey ? " is-active" : "");
            button.textContent = key === "all" ? "全部" : getPerformancePeriodLabel(key);
            button.title = range ? formatPerformanceRangeCaption(range) : "目前區間無資料";
            button.disabled = !range;
            button.addEventListener("click", function () {
                if (!range) {
                    return;
                }
                performanceChartRangeKey = key;
                renderPerformanceCharts(null, key);
            });
            performanceRangeList.appendChild(button);
        });
    }

    function renderPerformanceEmpty(message) {
        if (performanceChartEmpty) {
            performanceChartEmpty.hidden = false;
            performanceChartEmpty.textContent = message;
        }
        performanceRangeGroupButtons.forEach(function (button) {
            const active = button.dataset.performanceRangeGroup === performanceChartRangeGroup;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");
        });
        if (performanceRangeReset) {
            performanceRangeReset.classList.toggle("is-active", performanceChartRangeKey === "all");
            performanceRangeReset.setAttribute("aria-pressed", performanceChartRangeKey === "all" ? "true" : "false");
        }
        clearNode(performanceRangeList);
        clearNode(performanceLegend);
        clearNode(performanceEquityChart);
        clearNode(performanceWeeklyChart);
    }

    function renderPerformanceEquityChart(slice) {
        if (!performanceEquityChart) {
            return;
        }

        clearNode(performanceEquityChart);
        performanceEquityChart.setAttribute("viewBox", "0 0 1000 340");

        if (!slice || !Array.isArray(slice.points) || slice.points.length < 2) {
            return;
        }

        const width = 1000;
        const height = 340;
        const margin = { top: 18, right: 22, bottom: 36, left: 86 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;
        const domain = resolvePerformanceDomain(slice);
        if (!domain) {
            return;
        }
        const series = [
            { key: "actualTotal", color: "#f4f7fb", width: 2.4 },
            { key: "theoryTotal", color: "#a9b8ca", width: 1.6, dashed: true },
            { key: "actualLong", color: "#ff7c70", width: 1.8 },
            { key: "theoryLong", color: "#ff7c70", width: 1.1, dashed: true, opacity: 0.7 },
            { key: "actualShort", color: "#79d893", width: 1.8 },
            { key: "theoryShort", color: "#79d893", width: 1.1, dashed: true, opacity: 0.7 },
        ];

        const values = [0];
        slice.points.forEach(function (point) {
            series.forEach(function (item) {
                const value = Number(point[item.key]);
                if (Number.isFinite(value)) {
                    values.push(value);
                }
            });
        });

        if (slice.maxPoint && Number.isFinite(slice.maxPoint.actualTotal)) {
            values.push(slice.maxPoint.actualTotal);
        }
        if (slice.minPoint && Number.isFinite(slice.minPoint.actualTotal)) {
            values.push(slice.minPoint.actualTotal);
        }

        let yMin = Math.min.apply(null, values);
        let yMax = Math.max.apply(null, values);
        if (yMin === yMax) {
            const delta = Math.max(Math.abs(yMin) * 0.1, 1);
            yMin -= delta;
            yMax += delta;
        } else {
            const padding = Math.max((yMax - yMin) * 0.08, 1);
            yMin -= padding;
            yMax += padding;
        }

        const xScale = createPerformanceXScale(domain, margin, plotWidth);
        const slotDates = buildPerformanceSlotDates(slice);
        const tickDates = buildPerformanceAxisDates(slice, 6);
        const yScale = function (value) {
            return margin.top + ((yMax - value) / (yMax - yMin)) * plotHeight;
        };

        const horizontalTicks = 6;
        for (let index = 0; index < horizontalTicks; index += 1) {
            const ratio = index / (horizontalTicks - 1);
            const y = margin.top + plotHeight * ratio;
            const value = yMax - (yMax - yMin) * ratio;
            performanceEquityChart.appendChild(createSvgNode("line", {
                x1: margin.left,
                y1: y,
                x2: width - margin.right,
                y2: y,
                class: "performance-chart-grid",
            }));
            const label = createSvgNode("text", {
                x: margin.left - 12,
                y: y + 4,
                "text-anchor": "end",
                class: "performance-chart-label",
            });
            label.textContent = formatAxisMoney(value);
            performanceEquityChart.appendChild(label);
        }

        slotDates.forEach(function (slotDate) {
            const x = xScale(slotDate);
            performanceEquityChart.appendChild(createSvgNode("line", {
                x1: x,
                y1: margin.top,
                x2: x,
                y2: height - margin.bottom,
                class: "performance-chart-grid",
                "stroke-opacity": 0.22,
            }));
        });

        tickDates.forEach(function (tickDate, tickIndex) {
            const x = xScale(tickDate);
            const label = createSvgNode("text", {
                x: x,
                y: height - 12,
                "text-anchor": tickIndex === 0 ? "start" : (tickIndex === tickDates.length - 1 ? "end" : "middle"),
                class: "performance-chart-label",
            });
            label.textContent = formatChartDate(tickDate, false);
            performanceEquityChart.appendChild(label);
        });

        performanceEquityChart.appendChild(createSvgNode("line", {
            x1: margin.left,
            y1: height - margin.bottom,
            x2: width - margin.right,
            y2: height - margin.bottom,
            class: "performance-chart-axis",
        }));
        performanceEquityChart.appendChild(createSvgNode("line", {
            x1: margin.left,
            y1: margin.top,
            x2: margin.left,
            y2: height - margin.bottom,
            class: "performance-chart-axis",
        }));

        series.forEach(function (item) {
            const path = slice.points.map(function (point, index) {
                return (index ? "L" : "M") + xScale(point.date).toFixed(2) + " " + yScale(Number(point[item.key])).toFixed(2);
            }).join(" ");
            performanceEquityChart.appendChild(createSvgNode("path", {
                d: path,
                class: "performance-chart-series" + (item.dashed ? " is-dashed" : ""),
                stroke: item.color,
                "stroke-width": item.width,
                opacity: item.opacity || 1,
            }));
        });

        if (slice.maxPoint) {
            if (slice.maxPoint.date instanceof Date) {
                performanceEquityChart.appendChild(createSvgNode("circle", {
                    cx: xScale(slice.maxPoint.date),
                    cy: yScale(slice.maxPoint.actualTotal),
                    r: 4.5,
                    fill: "#ff7c70",
                    class: "performance-chart-marker",
                }));
            }
        }

        if (slice.minPoint) {
            if (slice.minPoint.date instanceof Date) {
                performanceEquityChart.appendChild(createSvgNode("circle", {
                    cx: xScale(slice.minPoint.date),
                    cy: yScale(slice.minPoint.actualTotal),
                    r: 4.5,
                    fill: "#79d893",
                    class: "performance-chart-marker",
                }));
            }
        }
    }

    function renderPerformanceWeeklyChart(slice) {
        if (!performanceWeeklyChart) {
            return;
        }

        clearNode(performanceWeeklyChart);
        performanceWeeklyChart.setAttribute("viewBox", "0 0 1000 220");

        if (!slice || !Array.isArray(slice.weekly) || !slice.weekly.length) {
            return;
        }

        const width = 1000;
        const height = 220;
        const margin = { top: 18, right: 22, bottom: 34, left: 86 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;
        const domain = resolvePerformanceDomain(slice);
        if (!domain) {
            return;
        }
        const xScale = createPerformanceXScale(domain, margin, plotWidth);
        const slotDates = buildPerformanceSlotDates(slice);
        const tickDates = buildPerformanceAxisDates(slice, 6);
        const values = slice.weekly.map(function (item) { return Number(item.actual); }).filter(Number.isFinite);
        const maxAbs = Math.max.apply(null, values.map(function (value) { return Math.abs(value); }).concat([1]));
        const yScale = function (value) {
            return margin.top + ((maxAbs - value) / (maxAbs * 2)) * plotHeight;
        };
        const zeroY = yScale(0);
        const weeklyCenters = slice.weekly.map(function (item) {
            return xScale(item.date);
        });
        let minCenterGap = Number.POSITIVE_INFINITY;
        for (let index = 1; index < weeklyCenters.length; index += 1) {
            const gap = weeklyCenters[index] - weeklyCenters[index - 1];
            if (gap > 0) {
                minCenterGap = Math.min(minCenterGap, gap);
            }
        }
        const nominalWeekWidth = plotWidth * ((7 * 24 * 60 * 60 * 1000) / domain.spanMs) * 0.72;
        const gapWidth = Number.isFinite(minCenterGap) ? minCenterGap * 0.72 : nominalWeekWidth;
        const barWidth = Math.max(4, Math.min(24, nominalWeekWidth || 24, gapWidth || 24));

        for (let index = 0; index < 5; index += 1) {
            const ratio = index / 4;
            const y = margin.top + plotHeight * ratio;
            const value = maxAbs - (maxAbs * 2) * ratio;
            performanceWeeklyChart.appendChild(createSvgNode("line", {
                x1: margin.left,
                y1: y,
                x2: width - margin.right,
                y2: y,
                class: "performance-chart-grid",
            }));
            const label = createSvgNode("text", {
                x: margin.left - 12,
                y: y + 4,
                "text-anchor": "end",
                class: "performance-chart-label",
            });
            label.textContent = formatAxisMoney(value);
            performanceWeeklyChart.appendChild(label);
        }

        slotDates.forEach(function (slotDate) {
            const x = xScale(slotDate);
            performanceWeeklyChart.appendChild(createSvgNode("line", {
                x1: x,
                y1: margin.top,
                x2: x,
                y2: height - margin.bottom,
                class: "performance-chart-grid",
                "stroke-opacity": 0.22,
            }));
        });

        performanceWeeklyChart.appendChild(createSvgNode("line", {
            x1: margin.left,
            y1: zeroY,
            x2: width - margin.right,
            y2: zeroY,
            class: "performance-weekly-zero",
        }));

        slice.weekly.forEach(function (item, index) {
            const x = weeklyCenters[index] - (barWidth / 2);
            const y = yScale(item.actual);
            const rectY = Math.min(y, zeroY);
            const rectHeight = Math.max(1, Math.abs(zeroY - y));
            const tone = item.actual > 0 ? "is-positive" : (item.actual < 0 ? "is-negative" : "is-flat");
            performanceWeeklyChart.appendChild(createSvgNode("rect", {
                x: x,
                y: rectY,
                width: barWidth,
                height: rectHeight,
                rx: 2,
                class: "performance-weekly-bar " + tone,
            }));
        });

        tickDates.forEach(function (tickDate, tickIndex) {
            const x = xScale(tickDate);
            const label = createSvgNode("text", {
                x: x,
                y: height - 10,
                "text-anchor": tickIndex === 0 ? "start" : (tickIndex === tickDates.length - 1 ? "end" : "middle"),
                class: "performance-chart-label",
            });
            label.textContent = formatChartDate(tickDate, false);
            performanceWeeklyChart.appendChild(label);
        });
    }

    function renderPerformanceCharts(report, requestedRangeKey) {
        if (!performanceEquityChart || !performanceWeeklyChart) {
            return;
        }

        if (isPerformancePayload(report)) {
            performanceChartPayload = report;
        } else if (report) {
            performanceChartPayload = buildPerformancePayload(report);
        }

        if (!performanceChartPayload) {
            renderPerformanceEmpty("等待回測驗證後顯示累積損益與週損益圖表。");
            if (performanceChartNote) {
                performanceChartNote.textContent = "等待回測驗證後顯示累積損益與週損益圖表。";
            }
            return;
        }

        const nextRangeKey = performanceChartPayload.rangeMap[requestedRangeKey]
            ? requestedRangeKey
            : (performanceChartPayload.rangeMap[performanceChartRangeKey]
                ? performanceChartRangeKey
                : getDefaultPerformanceRangeKey(performanceChartPayload.rangeMap));
        performanceChartRangeKey = nextRangeKey;
        if (nextRangeKey !== "all") {
            performanceChartRangeGroup = getPerformanceGroupForKey(nextRangeKey) || performanceChartRangeGroup;
        }

        const slice = getPerformanceSlice(performanceChartPayload, nextRangeKey);
        if (!slice) {
            renderPerformanceEmpty("目前區間沒有足夠的期貨交易明細可供繪圖。");
            if (performanceChartNote) {
                performanceChartNote.textContent = "目前區間沒有足夠的期貨交易明細可供繪圖。";
            }
            return;
        }

        if (performanceChartEmpty) {
            performanceChartEmpty.hidden = true;
        }
        renderPerformanceLegend();
        renderPerformanceRangeButtons(nextRangeKey);
        renderPerformanceEquityChart(slice);
        renderPerformanceWeeklyChart(slice);

        if (performanceChartNote) {
            performanceChartNote.textContent = formatPerformanceRangeCaption(slice.range) + "，累積損益與週損益都改用每週最後一個交易日顯示；每根柱體代表一整週的含滑價實績。";
        }
    }

    function showPair(kicker, title, baseName, indicator, trading) {
        const safeTrading = protectTradingCode(trading, baseName + "_trading.xs");
        setVisible(pairOutput, true);
        setVisible(exportOutput, false);
        setText(outputKicker, kicker);
        setText(outputTitle, title);
        setText(outputFileBase, "策略名：" + baseName);
        setText(indicatorFilename, baseName + "_indicator.xs");
        setText(tradingFilename, baseName + "_trading.xs");
        indicatorOutput.value = indicator;
        tradingOutput.value = safeTrading;
    }

    function showExport(baseName) {
        setVisible(pairOutput, false);
        setVisible(exportOutput, true);
        setText(outputKicker, "資料匯出");
        setText(outputTitle, "匯出 XQ 資料腳本");
        setText(outputFileBase, "策略名：" + baseName);
        setText(exportM1Filename, baseName + "_M1.xs");
        setText(exportD1Filename, baseName + "_D1.xs");
        exportM1Output.value = EXPORT_SCRIPTS.m1;
        exportD1Output.value = EXPORT_SCRIPTS.d1;
    }

    function getBestId() {
        if (fixedBestId) {
            return fixedBestId;
        }

        const saved = safeName(localStorage.getItem(BEST_ID_KEY) || "");
        if (saved) {
            fixedBestId = saved;
            return fixedBestId;
        }

        const store = readStore();
        const totalReturn = store?.verification?.futuresKpi?.summary?.actualReturnPct ?? store?.verification?.metrics?.totalReturn;
        fixedBestId = fileBase(Number.isFinite(Number(totalReturn)) ? totalReturn : DEFAULT_BEST_RETURN, true);
        try {
            localStorage.setItem(BEST_ID_KEY, fixedBestId);
        } catch {
            // ignore storage failures
        }
        return fixedBestId;
    }

    function normalizeCodeForXScript(code) {
        return String(code || "")
            .replace(/\bdailyFieldReady\b/g, "dFieldReady")
            .replace(/\bBUY_ENTRY\b/g, "新買")
            .replace(/\bSELL_ENTRY\b/g, "新賣")
            .replace(/\bLONG_EXIT\b/g, "平賣")
            .replace(/\bSHORT_EXIT\b/g, "平買")
            .replace(/\bFORCE_EXIT\b/g, "強制平倉");
    }

    function applyIdentity(code, strategyId, title) {
        return normalizeCodeForXScript(code)
            .replace(/\/\/ ScriptName : [^\n]+/g, "// ScriptName : " + strategyId)
            .replace(/\/\/ 說明       : [^\n]+/g, "// 說明       : " + title)
            .replace(/strategy_id: [^\n]+/g, "strategy_id: " + strategyId)
            .replace(/title: [^\n]+/g, "title: " + title)
            .replace(/strategy_id=[^,\n]+/g, "strategy_id=" + strategyId);
    }

    function renderFuturesKpiRows(report) {
        if (!futuresKpiBody) {
            return;
        }

        const rows = buildFuturesKpiDisplayRows(report);
        if (!rows.length) {
            futuresKpiBody.innerHTML = '<tr><td colspan="4">等待回放完成後顯示。</td></tr>';
            return;
        }

        futuresKpiBody.innerHTML = rows.map(function (row) {
            if (row.kind === "section") {
                return '<tr class="is-section"><td colspan="4">' + escapeHtml(row.label) + "</td></tr>";
            }
            return [
                "<tr>",
                '<td class="futures-kpi-name">' + escapeHtml(row.label) + "</td>",
                '<td><span class="futures-kpi-value ' + futuresKpiToneClass(row, row.theory) + '">' + formatFutureValue(row.theory, row.type) + "</span></td>",
                '<td><span class="futures-kpi-value ' + futuresKpiToneClass(row, row.actual) + '">' + formatFutureValue(row.actual, row.type) + "</span></td>",
                '<td class="futures-kpi-desc">' + escapeHtml(row.description || "") + "</td>",
                "</tr>",
            ].join("");
        }).join("");
    }

    function renderTradeDetailRows(report) {
        if (!tradeDetailBody) {
            return;
        }

        if (!report || !Array.isArray(report.details) || !report.details.length) {
            tradeDetailBody.innerHTML = '<tr><td colspan="15">等待回放完成後顯示。</td></tr>';
            if (tradeDetailNote) {
                tradeDetailNote.textContent = "按出場時間排序；每列代表一筆完整平倉交易。";
            }
            return;
        }

        const details = report.details.slice().sort(function (left, right) {
            const leftKey = String(left && (left.exitTs || left.entryTs) || "");
            const rightKey = String(right && (right.exitTs || right.entryTs) || "");
            return leftKey.localeCompare(rightKey);
        });

        let theoryAccum = 0;
        let actualAccum = 0;

        tradeDetailBody.innerHTML = details.map(function (detail, index) {
            const theoryPnl = Number(detail && detail.theoryPnl);
            const actualPnl = Number(detail && detail.actualPnl);
            theoryAccum += Number.isFinite(theoryPnl) ? theoryPnl : 0;
            actualAccum += Number.isFinite(actualPnl) ? actualPnl : 0;

            const sideClass = detail && detail.side === "long"
                ? "is-long"
                : (detail && detail.side === "short" ? "is-short" : "");
            const pointTone = tradeToneClass(detail && detail.points);
            const theoryTone = tradeToneClass(theoryPnl);
            const actualTone = tradeToneClass(actualPnl);

            return [
                "<tr>",
                '<td class="trade-detail-index">' + (index + 1) + "</td>",
                "<td>" + escapeHtml(formatTradeTimestamp(detail && detail.entryTs)) + "</td>",
                "<td>" + escapeHtml(formatTradeTimestamp(detail && detail.exitTs)) + "</td>",
                '<td><span class="trade-detail-side ' + sideClass + '">' + escapeHtml(formatTradeSide(detail && detail.side)) + "</span></td>",
                "<td>" + escapeHtml(formatTradePrice(detail && detail.entryPrice)) + "</td>",
                "<td>" + escapeHtml(formatTradePrice(detail && detail.exitPrice)) + "</td>",
                "<td>" + formatMetricCount(detail && detail.quantity) + "</td>",
                '<td><span class="trade-detail-points ' + pointTone + '">' + escapeHtml(formatTradePoints(detail && detail.points)) + "</span></td>",
                "<td>" + formatMetricMoney(detail && detail.fee) + "</td>",
                "<td>" + formatMetricMoney(detail && detail.tax) + "</td>",
                "<td>" + formatMetricMoney(detail && detail.slipCost) + "</td>",
                '<td><span class="trade-detail-money ' + theoryTone + '">' + formatSignedMoney(theoryPnl) + "</span></td>",
                '<td><span class="trade-detail-money ' + tradeToneClass(theoryAccum) + '">' + formatSignedMoney(theoryAccum) + "</span></td>",
                '<td><span class="trade-detail-money ' + actualTone + '">' + formatSignedMoney(actualPnl) + "</span></td>",
                '<td><span class="trade-detail-money ' + tradeToneClass(actualAccum) + '">' + formatSignedMoney(actualAccum) + "</span></td>",
                "</tr>",
            ].join("");
        }).join("");

        if (tradeDetailNote) {
            tradeDetailNote.textContent = "共 " + formatMetricCount(details.length) + " 筆完整交易，按出場時間排序；含滑價欄位已納入目前單邊滑點 "
                + formatCompactNumber(report.config && report.config.slipPerSide) + " 點。";
        }
    }

    function diffReportValue(left, right, type) {
        const leftNumber = Number(left);
        const rightNumber = Number(right);
        if (!Number.isFinite(leftNumber) || !Number.isFinite(rightNumber)) {
            return null;
        }
        const diff = leftNumber - rightNumber;
        if (type === "count") {
            return Math.round(diff);
        }
        if (type === "ratio") {
            return Math.round(diff * 100) / 100;
        }
        return round1(diff);
    }

    function buildCompareKpiRows(simulationReport, xqReport) {
        if (!simulationReport || !Array.isArray(simulationReport.rows) || !xqReport || !Array.isArray(xqReport.rows)) {
            return [];
        }

        const xqRowsByKey = new Map(
            xqReport.rows.map(function (row) {
                return [row.key, row];
            })
        );

        return simulationReport.rows
            .filter(function (row) { return xqRowsByKey.has(row.key); })
            .map(function (row) {
                const xqRow = xqRowsByKey.get(row.key);
                return {
                    key: row.key,
                    label: row.label,
                    type: row.type,
                    simulationTheory: row.theory,
                    simulationActual: row.actual,
                    xqTheory: xqRow.theory,
                    xqActual: xqRow.actual,
                    diffTheory: diffReportValue(row.theory, xqRow.theory, row.type),
                    diffActual: diffReportValue(row.actual, xqRow.actual, row.type),
                    description: row.description || xqRow.description || "",
                };
            });
    }

    function buildCompareKpiStack(labelA, valueA, labelB, valueB, type, formatter) {
        return [
            '<div class="compare-kpi-stack">',
            '<div class="compare-kpi-subvalue"><span class="compare-kpi-subvalue-label">' + labelA + '</span><span class="compare-kpi-value ' + valueToneClass(valueA) + '">' + formatter(valueA, type) + "</span></div>",
            '<div class="compare-kpi-subvalue"><span class="compare-kpi-subvalue-label">' + labelB + '</span><span class="compare-kpi-value ' + valueToneClass(valueB) + '">' + formatter(valueB, type) + "</span></div>",
            "</div>",
        ].join("");
    }

    function renderCompareKpiRows(rows) {
        if (!compareKpiBody) {
            return;
        }

        if (!Array.isArray(rows) || !rows.length) {
            compareKpiBody.innerHTML = '<tr><td colspan="5">等待上傳 XQ TXT / CSV 後顯示。</td></tr>';
            return;
        }

        compareKpiBody.innerHTML = rows.map(function (row) {
            return [
                "<tr>",
                '<td class="compare-kpi-name">' + row.label + "</td>",
                "<td>" + buildCompareKpiStack("理論", row.simulationTheory, "含滑價", row.simulationActual, row.type, formatFutureValue) + "</td>",
                "<td>" + buildCompareKpiStack("理論", row.xqTheory, "含滑價", row.xqActual, row.type, formatFutureValue) + "</td>",
                "<td>" + buildCompareKpiStack("理論差", row.diffTheory, "含滑價差", row.diffActual, row.type, formatFutureDiffValue) + "</td>",
                '<td class="compare-kpi-desc">' + (row.description || "") + "</td>",
                "</tr>",
            ].join("");
        }).join("");
    }

    function renderCompareKpiPanel(verification) {
        if (!compareKpiNote || !compareKpiBody) {
            return;
        }

        if (!verification) {
            setText(compareKpiNote, "上傳 XQ TXT / CSV 後，這裡會用和上方相同的期貨 KPI 口徑顯示程式模擬與 XQ 明細差異。");
            renderCompareKpiRows(null);
            return;
        }

        const simulationReport = verification.futuresKpi || null;
        const xqReport = verification.xqFuturesKpi || verification.xqAuthorityFuturesKpi || null;

        if (!simulationReport) {
            setText(compareKpiNote, "等待回放完成後，這裡會顯示程式模擬與 XQ 明細的期貨 KPI 對照。");
            renderCompareKpiRows(null);
            return;
        }

        if (!xqReport) {
            setText(
                compareKpiNote,
                verification.hasXqComparison
                    ? "目前已載入 XQ 明細，但還沒有可直接對照的期貨 KPI。"
                    : "尚未提供 XQ TXT / CSV，因此下表暫時只保留給後續的 KPI 對照使用。"
            );
            renderCompareKpiRows(null);
            return;
        }

        const rows = buildCompareKpiRows(simulationReport, xqReport);
        const noteParts = [
            "下表使用和上方相同的期貨 KPI 口徑，XQ 欄位目前採 " + (verification.xqKpiSourceLabel || "XQ 交易明細轉換 KPI") + "。",
        ];
        if (verification.futuresKpiCompare) {
            noteParts.push(
                "理論淨利差 " + formatSignedMoney(verification.futuresKpiCompare.theoryNetDiff)
                + "，含滑價淨利差 " + formatSignedMoney(verification.futuresKpiCompare.actualNetDiff)
                + "，交易次數差 " + formatSignedCount(verification.futuresKpiCompare.tradeCountDiff) + "。"
            );
        }

        setText(compareKpiNote, noteParts.join(" "));
        renderCompareKpiRows(rows);
    }

    function renderBestMetrics(verification) {
        const report = verification && verification.futuresKpi ? verification.futuresKpi : null;
        const fallbackMetrics = verification && verification.metrics ? verification.metrics : DEFAULT_BEST_METRICS;

        if (metricLabels[0]) { setText(metricLabels[0], "理論淨利"); }
        if (metricLabels[1]) { setText(metricLabels[1], "含滑淨利"); }
        if (metricLabels[2]) { setText(metricLabels[2], "交易次數"); }
        setText(annualReturnTitle, "近六年含滑報酬率");

        if (report) {
            setText(metricTotalReturn, formatMetricMoney(report.summary.theoryNet));
            setText(metricMaxDrawdown, formatMetricMoney(report.summary.actualNet));
            setText(metricTradeCount, formatMetricCount(report.summary.tradeCount));
            runNonCriticalRender("best-metrics/annual-returns", function () {
                renderYears(report.annualReturns);
            });
            runNonCriticalRender("best-metrics/performance-charts", function () {
                renderPerformanceCharts(report, performanceChartRangeKey);
            });
            setText(
                futuresKpiNote,
                "期貨口徑：每點 " + formatMetricCount(report.config.pointValue)
                    + "、單邊手續費 " + formatMetricMoney(report.config.feePerSide)
                    + "、交易稅率 " + Number(report.config.taxRate).toFixed(5)
                    + "、單邊滑點 " + formatCompactNumber(report.config.slipPerSide) + " 點。"
            );
            runNonCriticalRender("best-metrics/futures-kpi-rows", function () {
                renderFuturesKpiRows(report);
            });
            runNonCriticalRender("best-metrics/trade-detail-rows", function () {
                renderTradeDetailRows(report);
            });
            return;
        }

        setText(metricTotalReturn, formatMetricPercent(fallbackMetrics.totalReturn));
        setText(metricMaxDrawdown, formatMetricPercent(fallbackMetrics.maxDrawdown));
        setText(metricTradeCount, formatMetricCount(fallbackMetrics.tradeCount));
        runNonCriticalRender("best-metrics/fallback-annual-returns", function () {
            renderYears(fallbackMetrics.annualReturns);
        });
        performanceChartPayload = null;
        runNonCriticalRender("best-metrics/fallback-performance-charts", function () {
            renderPerformanceCharts(null, "year_6");
        });
        setText(futuresKpiNote, "等待回放完成後，這裡會顯示期貨口徑的理論 / 含滑價 KPI。");
        runNonCriticalRender("best-metrics/fallback-futures-kpi-rows", function () {
            renderFuturesKpiRows(null);
        });
        runNonCriticalRender("best-metrics/fallback-trade-detail-rows", function () {
            renderTradeDetailRows(null);
        });
    }

    function resetComparePanel() {
        setText(compareStatusValue, "待驗證");
        setText(compareSimCount, "-");
        setText(compareXqCount, "-");
        setText(comparePrefixCount, "-");
        setText(compareParamNote, "尚未上傳完整資料與交易明細，還不能驗證。");
        setText(compareFirstMismatch, "尚未比對。");
        setText(compareNote, "目前首頁只會把已完成比對的結果視為可信。");
    }

    function renderComparePanel(verification) {
        if (!verification) {
            renderCompareKpiPanel(null);
            if (window.location.protocol === "file:" && hasBundledCompareData()) {
                setText(compareStatusValue, "請改用本機站台");
                setText(compareSimCount, "-");
                setText(compareXqCount, "-");
                setText(comparePrefixCount, "-");
                setText(compareParamNote, "你現在是用 file:/// 開啟頁面。雖然畫面已顯示程式內建 M1 / D1 摘要，但瀏覽器不允許前端自動讀取 repo 內的原始 TXT。");
                setText(compareFirstMismatch, "請先執行 start-local-site.cmd，或開啟 http://127.0.0.1:8765/index.html，再按一次「更新並比對」。");
                setText(compareNote, "切到本機站台後，首頁預設指標版 / 交易版加上程式內建 M1 / D1 就能直接計算；之後若再上傳交易明細，才會做逐筆一致性比對。");
                return;
            }
            resetComparePanel();
            return;
        }
        setText(compareStatusValue, verification.statusLabel || "待驗證");
        setText(compareSimCount, verification.compare ? verification.compare.simCount : "-");
        setText(compareXqCount, verification.hasXqComparison ? verification.compare.xqCount : "待上傳");
        setText(comparePrefixCount, verification.hasXqComparison ? verification.compare.samePrefixCount : "-");
        setText(compareParamNote, verification.paramNote || "未提供交易明細參數列。");
        setText(compareFirstMismatch, verification.firstMismatchText || "完全吻合。");
        setText(compareNote, verification.note || "");
        renderCompareKpiPanel(verification);
    }

    function applyCompareSettings(settings) {
        const safe = resolveCompareSettings(settings);
        if (bestCapitalInput) { bestCapitalInput.value = String(Math.round(toNumber(safe.capital, DEFAULT_COMPARE_SETTINGS.capital))); }
        if (bestPointValueInput) { bestPointValueInput.value = String(Math.round(toNumber(safe.pointValue, DEFAULT_COMPARE_SETTINGS.pointValue))); }
        if (bestSideCostInput) { bestSideCostInput.value = String(formatCompactNumber(safe.sideCostPoints)); }
    }

    function readCompareSettings() {
        const resolved = resolveCompareSettings(null);
        return {
            capital: Math.max(1, readNumericInput(bestCapitalInput, resolved.capital)),
            pointValue: Math.max(1, readNumericInput(bestPointValueInput, resolved.pointValue)),
            sideCostPoints: Math.max(0, readNumericInput(bestSideCostInput, resolved.sideCostPoints)),
        };
    }

    function showBestMode() {
        const saved = readStore();
        const displayVerification = getDisplayVerification(saved);
        const pair = buildPair(BEST_PRESET);
        const bestId = getBestId();
        const nextIndicator = applyIdentity(saved?.indicator || pair.indicator, bestId, "最佳報酬配對");
        const nextTrading = applyIdentity(saved?.trading || pair.trading, bestId, "最佳報酬配對");
        setActiveMode("best");
        setVisible(bestMetricsPanel, true);
        setVisible(bestUploadPanel, true);
        setVisible(bestComparePanel, true);
        setVisible(refactorUploadPanel, false);
        renderBestMetrics(displayVerification);
        renderComparePanel(displayVerification);
        applyCompareSettings(displayVerification && displayVerification.settings ? displayVerification.settings : null);
        runNonCriticalRender("best-mode/bundled-dataset-summaries", function () {
            renderBundledDatasetSummaries();
        });
        runNonCriticalRender("best-mode/bundled-strategy-summaries", function () {
            renderBundledStrategySummaries({ indicator: nextIndicator, trading: nextTrading }, bestId);
        });
        runNonCriticalRender("best-mode/trade-detail-summary", function () {
            renderTradeDetailSummary(Array.from(bestXqTxtUpload?.files || []), displayVerification);
        });
        runNonCriticalRender("best-mode/show-pair", function () {
            showPair("歷史最佳", "最佳報酬配對", bestId, nextIndicator, nextTrading);
        });
        setStatusText(
            bestUploadStatus,
            saved?.lastStatus
                ? saved.lastStatus
                : displayVerification
                ? ("最後驗證：" + displayVerification.verifiedAt)
                : (saved?.updatedAt ? "已更新策略版本，但尚未完成比對。" : (buildBundledStatusText() + " 若未另上傳策略檔，會直接使用目前下方輸出的指標版與交易版。"))
        );
        maybeAutoRunBestVerification(saved);
    }

    function showNewMode() {
        newIndex += 1;
        const preset = buildNewPreset(newIndex);
        const pair = buildPair(preset);
        setActiveMode("new");
        setVisible(bestMetricsPanel, false);
        setVisible(bestUploadPanel, false);
        setVisible(bestComparePanel, false);
        setVisible(refactorUploadPanel, false);
        showPair("已生成新策略", "新策略配對", fileBase(preset.estimatedReturn, true), pair.indicator, pair.trading);
    }

    function showRefactorMode() {
        setActiveMode("refactor");
        setVisible(bestMetricsPanel, false);
        setVisible(bestUploadPanel, false);
        setVisible(bestComparePanel, false);
        setVisible(refactorUploadPanel, true);
        showPair("等待上傳舊 XS", "重構舊 XS", fileBase(null, false), "請先上傳舊的指標版或交易版，然後按「重寫輸出」。", "請先上傳舊的指標版或交易版，然後按「重寫輸出」。");
        setText(refactorStatus, "");
    }

    function showExportMode() {
        setActiveMode("export");
        setVisible(bestMetricsPanel, false);
        setVisible(bestUploadPanel, false);
        setVisible(bestComparePanel, false);
        setVisible(refactorUploadPanel, false);
        showExport(fileBase(null, false));
    }

    async function readUploadedFiles(input) {
        if (xqUploadHelpers && typeof xqUploadHelpers.readUploadedFiles === "function") {
            return xqUploadHelpers.readUploadedFiles(input);
        }

        const files = Array.from(input && input.files ? input.files : []);
        return Promise.all(files.map(async function (file) {
            return {
                name: file.name,
                text: await file.text(),
            };
        }));
    }

    async function readUploadedFile(input) {
        const files = await readUploadedFiles(input);
        return files[0] || null;
    }

    function classifyXqUploads(files) {
        const allFiles = Array.isArray(files) ? files.filter(Boolean) : [];
        const csvFile = allFiles.find(function (file) {
            return Boolean(xqUploadHelpers
                && typeof xqUploadHelpers.looksLikeXqTradeCsv === "function"
                && xqUploadHelpers.looksLikeXqTradeCsv(file.text, file.name));
        }) || null;
        const txtFile = allFiles.find(function (file) { return file !== csvFile; }) || null;
        return {
            csvFile: csvFile,
            txtFile: txtFile,
            count: allFiles.length,
        };
    }

    function safeName(name) {
        return String(name || "").replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || "Uploaded_Strategy";
    }

    function extractParamsFromCode(code) {
        const names = Object.keys(PROFILES.breakout);
        const defaults = Object.fromEntries(names.map(function (key) { return [key, toNumber(PROFILES.breakout[key], 0)]; }));
        const source = String(code || "");
        names.forEach(function (key) {
            const match = source.match(new RegExp("\\b" + key + "\\s*\\(\\s*([^,\\)]+)", "i"));
            if (match) {
                defaults[key] = toNumber(match[1], defaults[key]);
            }
        });
        return defaults;
    }

    function extractForceExitTimeFromCode(code) {
        const source = String(code || "");
        const match = source.match(/\bForceExitTime\s*\(\s*(\d{5,6})\s*,/i)
            || source.match(/\bfixedForceExitTime\s*\(\s*(\d{5,6})\s*\)/i)
            || source.match(/\bForceExitTime\s*=\s*(\d{5,6})\b/i);
        const digits = match ? String(match[1]) : "131200";
        return digits.replace(/\D/g, "").padStart(6, "0").slice(-6);
    }

    function parseM1Text(text) {
        const rows = [];
        parseLineTokens(text).forEach(function (line) {
            const match = line.match(/^(\d{8})\s+(\d{6})\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/);
            if (!match) { return; }
            rows.push({
                date: parseDateInt(match[1]),
                time: parseTimeInt(match[2]),
                open: Number(match[3]),
                high: Number(match[4]),
                low: Number(match[5]),
                close: Number(match[6]),
            });
        });
        rows.sort(function (a, b) { return a.date === b.date ? a.time - b.time : a.date - b.date; });
        const dedupedRows = dedupeSortedRows(rows, function (row) { return row.date + "|" + row.time; });
        if (!dedupedRows.length) {
            throw new Error("M1 資料庫格式不正確，或檔案沒有可用資料。");
        }
        return dedupedRows;
    }

    function parseD1Text(text) {
        const rows = [];
        parseLineTokens(text).forEach(function (line) {
            const match = line.match(/^(\d{8})\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/);
            if (!match) { return; }
            rows.push({
                date: parseDateInt(match[1]),
                open: Number(match[2]),
                high: Number(match[3]),
                low: Number(match[4]),
                close: Number(match[5]),
            });
        });
        rows.sort(function (a, b) { return a.date - b.date; });
        const dedupedRows = dedupeSortedRows(rows, function (row) { return row.date; });
        if (!dedupedRows.length) {
            throw new Error("D1 資料庫格式不正確，或檔案沒有可用資料。");
        }
        return dedupedRows;
    }

    function parseDAText(text) {
        const rows = [];
        parseLineTokens(text).forEach(function (line) {
            const parts = line.split(/\s+/);
            if (parts.length < 9) { return; }
            if (!/^\d{8}$/.test(parts[0]) || !/^\d{6}$/.test(parts[1])) { return; }
            rows.push({
                date: parseDateInt(parts[0]),
                time: parseTimeInt(parts[1]),
                prevHigh: Number(parts[2]),
                prevLow: Number(parts[3]),
                prevClose: Number(parts[4]),
                dayRange: Number(parts[5]),
                pp: Number(parts[6]),
                nh: Number(parts[7]),
                nl: Number(parts[8]),
            });
        });
        rows.sort(function (a, b) { return a.date === b.date ? a.time - b.time : a.date - b.date; });
        const dedupedRows = dedupeSortedRows(rows, function (row) { return row.date + "|" + row.time; });
        if (!dedupedRows.length) {
            throw new Error("DA 資料庫格式不正確，或檔案沒有可用資料。");
        }
        return dedupedRows;
    }

    function deriveDailyAnchorsFromD1(d1Rows, m1Bars) {
        const rows = [];
        const seenDates = Array.from(new Set(m1Bars.map(function (bar) { return bar.date; }))).sort();
        seenDates.forEach(function (tradeDate) {
            const prevRows = d1Rows.filter(function (row) { return row.date < tradeDate; });
            if (!prevRows.length) { return; }
            const prev = prevRows[prevRows.length - 1];
            const pp = (Number(prev.high) + Number(prev.low) + 2 * Number(prev.close)) / 4;
            rows.push({
                date: tradeDate,
                time: 84500,
                prevHigh: Number(prev.high),
                prevLow: Number(prev.low),
                prevClose: Number(prev.close),
                dayRange: Number(prev.high) - Number(prev.low),
                pp: pp,
                nh: 2 * pp - Number(prev.low),
                nl: 2 * pp - Number(prev.high),
            });
        });
        return rows;
    }

    function parseXqTradeText(text) {
        const lines = parseLineTokens(text);
        const headerLine = lines.find(function (line) { return line.includes("=") && line.includes(","); }) || "";
        const headerParams = {};
        if (headerLine) {
            headerLine.replace(/([A-Za-z0-9_]+)=([^,]+)/g, function (_, key, value) {
                headerParams[key.trim()] = value.trim();
                return _;
            });
        }
        const events = [];
        lines.forEach(function (line) {
            const match = line.match(/^(\d{14})\s+(-?\d+(?:\.\d+)?)\s+(新買|新賣|平買|平賣|強制平倉)$/);
            if (!match) { return; }
            events.push({
                ts: match[1],
                price: Number(match[2]),
                action: match[3],
            });
        });
        if (!events.length) {
            throw new Error("XQ TXT 交易明細格式不正確，或檔案沒有可用事件。");
        }
        return { headerParams: headerParams, events: events };
    }

    function parseXqTradeTextFlexible(text) {
        const source = String(text || "");
        const headerLine = parseLineTokens(source).find(function (line) { return line.includes("=") && line.includes(","); }) || "";
        const headerParams = {};
        if (headerLine) {
            headerLine.replace(/([A-Za-z0-9_]+)=([^,]+)/g, function (_, key, value) {
                headerParams[key.trim()] = value.trim();
                return _;
            });
        }

        const actionPattern = [
            XQ_ACTIONS.longEntry,
            XQ_ACTIONS.shortEntry,
            XQ_ACTIONS.longExit,
            XQ_ACTIONS.shortExit,
            XQ_ACTIONS.forceExit,
        ]
            .map(function (action) { return action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); })
            .join("|");
        const eventPattern = new RegExp("(\\d{14})\\s+(-?\\d+(?:\\.\\d+)?)\\s+(" + actionPattern + ")", "g");
        const events = [];
        let match = eventPattern.exec(source);
        while (match) {
            events.push({
                ts: match[1],
                price: Number(match[2]),
                action: match[3],
            });
            match = eventPattern.exec(source);
        }

        if (!events.length) {
            throw new Error("XQ TXT \u627e\u4e0d\u5230\u53ef\u89e3\u6790\u7684\u4ea4\u6613\u4e8b\u4ef6\u3002");
        }
        return {
            headerParams: headerParams,
            events: events,
        };
    }

    function averageLast(rows, count, field) {
        if (rows.length < count) { return null; }
        const slice = rows.slice(rows.length - count);
        return slice.reduce(function (sum, row) { return sum + Number(row[field]); }, 0) / count;
    }

    function anchoredEma(rows, warmBars, length) {
        if (rows.length < warmBars || warmBars < 1) { return null; }
        const startIndex = rows.length - warmBars;
        let ema = Number(rows[startIndex].close);
        const alpha = 2 / (length + 1);
        for (let index = startIndex + 1; index < rows.length; index += 1) {
            ema = alpha * Number(rows[index].close) + (1 - alpha) * ema;
        }
        return ema;
    }

    function compareNumeric(a, b, tolerance) {
        return Math.abs(Number(a) - Number(b)) <= (tolerance || 1e-9);
    }

    function computeDailyContext(previousRows, daRow, params) {
        const issues = [];
        const need = Math.max(5, toInt(params.DonLen, 1), toInt(params.ATRLen, 1) + 1, toInt(params.EMAWarmBars, 1));
        if (previousRows.length < need) {
            return { valid: false, issues: ["D1 歷史資料不足，無法計算日線定錨。"] };
        }

        const prevDay = previousRows[previousRows.length - 1];
        const yH = Number(daRow && Number.isFinite(daRow.prevHigh) ? daRow.prevHigh : prevDay.high);
        const yL = Number(daRow && Number.isFinite(daRow.prevLow) ? daRow.prevLow : prevDay.low);
        const yC = Number(daRow && Number.isFinite(daRow.prevClose) ? daRow.prevClose : prevDay.close);
        const ma2D = averageLast(previousRows, 3, "close");
        const ma3D = averageLast(previousRows, 5, "close");
        const ema2D = anchoredEma(previousRows, toInt(params.EMAWarmBars, 1), 3);
        const ema3D = anchoredEma(previousRows, toInt(params.EMAWarmBars, 1), 5);
        const donSource = previousRows.slice(previousRows.length - toInt(params.DonLen, 1));
        const donHiD = Math.max.apply(null, donSource.map(function (row) { return Number(row.high); }));
        const donLoD = Math.min.apply(null, donSource.map(function (row) { return Number(row.low); }));

        let atrSum = 0;
        for (let offset = 0; offset < toInt(params.ATRLen, 1); offset += 1) {
            const rowIndex = previousRows.length - 1 - offset;
            const row = previousRows[rowIndex];
            const prevClose = previousRows[rowIndex - 1].close;
            const tr = Math.max(
                Number(row.high) - Number(row.low),
                Math.abs(Number(row.high) - Number(prevClose)),
                Math.abs(Number(row.low) - Number(prevClose))
            );
            atrSum += tr;
        }
        const atrD = atrSum / toInt(params.ATRLen, 1);
        const cdpVal = Number(daRow && Number.isFinite(daRow.pp) ? daRow.pp : (yH + yL + 2 * yC) / 4);
        const nhVal = Number(daRow && Number.isFinite(daRow.nh) ? daRow.nh : (2 * cdpVal - yL));
        const nlVal = Number(daRow && Number.isFinite(daRow.nl) ? daRow.nl : (2 * cdpVal - yH));

        if (daRow && (!compareNumeric(prevDay.high, yH, 1e-6) || !compareNumeric(prevDay.low, yL, 1e-6) || !compareNumeric(prevDay.close, yC, 1e-6))) {
            issues.push("DA 與 D1 的前一日定錨值不完全一致。");
        }

        return {
            valid: Number.isFinite(ma2D) && Number.isFinite(ma3D) && Number.isFinite(ema2D) && Number.isFinite(ema3D) && Number.isFinite(atrD),
            issues: issues,
            yH: yH,
            yL: yL,
            yC: yC,
            ma2D: ma2D,
            ma3D: ma3D,
            ema2D: ema2D,
            ema3D: ema3D,
            donHiD: donHiD,
            donLoD: donLoD,
            atrD: atrD,
            cdpVal: cdpVal,
            nhVal: nhVal,
            nlVal: nlVal,
            LongBias: ((ma2D > ma3D) || (ema2D > ema3D)) && (yC > cdpVal),
            ShortBias: ((ma2D < ma3D) || (ema2D < ema3D)) && (yC < cdpVal),
        };
    }

    function inferPreset(text) {
        const s = String(text || "").toLowerCase();
        if (s.includes("opening range") || s.includes("orb") || s.includes("orbars") || s.includes("daybarseq")) { return REFACTOR_PRESETS.orb; }
        if (s.includes("ema") || s.includes("pullback") || s.includes("emafast") || s.includes("emaslow")) { return REFACTOR_PRESETS.ema; }
        return REFACTOR_PRESETS.breakout;
    }

    function renamePair(pair, strategyId, title) {
        return {
            indicator: pair.indicator.replace(/strategy_id: [^\n]+/g, "strategy_id: " + strategyId).replace(/title: [^\n]+/g, "title: " + title).replace(/strategy_id=[^,]+/g, "strategy_id=" + strategyId),
            trading: pair.trading.replace(/strategy_id: [^\n]+/g, "strategy_id: " + strategyId).replace(/title: [^\n]+/g, "title: " + title).replace(/strategy_id=[^,]+/g, "strategy_id=" + strategyId),
        };
    }

    function simulateBestStrategy(dataset, params) {
        const fixedBeginTime = 84800;
        const fixedEndTime = 124000;
        const fixedForceExitTime = 131200;
        const warmupBars = Math.trunc(Math.max(7, toInt(params.DonLen, 1) + 2, toInt(params.ATRLen, 1) + 2, toInt(params.EMAWarmBars, 1) + 2));
        const d1Rows = dataset.d1Rows.slice().sort(function (a, b) { return a.date - b.date; });
        const daMap = new Map(dataset.daRows.map(function (row) { return [row.date, row]; }));
        const prevRowsCache = new Map();
        const issues = [];
        const events = [];
        const state = {
            dayInitDate: 0,
            dayAnchorOpen: 0,
            posFlag: 0,
            cost: 0,
            entryATRD: 0,
            dayEntryCount: 0,
            entryBarNo: 0,
            bestHighSinceEntry: 0,
            bestLowSinceEntry: 0,
            maxRunUpPts: 0,
            maxRunDnPts: 0,
            barsHeld: 0,
            minRunPtsByAnchor: 0,
            trailStartPtsByAnchor: 0,
            trailGivePtsByAnchor: 0,
            anchorBackPtsByAnchor: 0,
            lastMarkBar: -9999,
            dFieldReady: false,
            yH: 0,
            yL: 0,
            yC: 0,
            ma2D: 0,
            ma3D: 0,
            ema2D: 0,
            ema3D: 0,
            donHiD: 0,
            donLoD: 0,
            atrD: 0,
            cdpVal: 0,
            nhVal: 0,
            nlVal: 0,
            LongBias: false,
            ShortBias: false,
        };

        function previousDailyRows(date) {
            if (prevRowsCache.has(date)) {
                return prevRowsCache.get(date);
            }
            const rows = d1Rows.filter(function (row) { return row.date < date; });
            prevRowsCache.set(date, rows);
            return rows;
        }

        dataset.m1Bars.forEach(function (bar, index) {
            const currentBar = index + 1;
            const prevBar = index > 0 ? dataset.m1Bars[index - 1] : null;
            const daRow = daMap.get(bar.date);
            const sessOnEntry = bar.time >= fixedBeginTime && bar.time <= fixedEndTime;
            const sessOnManage = bar.time >= fixedBeginTime && bar.time <= fixedForceExitTime;

            if (state.dayInitDate !== bar.date && bar.time >= fixedBeginTime) {
                const daily = computeDailyContext(previousDailyRows(bar.date), daRow, params);
                if (daily.valid) {
                    state.dayInitDate = bar.date;
                    state.dayAnchorOpen = 0;
                    state.posFlag = 0;
                    state.cost = 0;
                    state.entryATRD = 0;
                    state.dayEntryCount = 0;
                    state.entryBarNo = 0;
                    state.bestHighSinceEntry = 0;
                    state.bestLowSinceEntry = 0;
                    state.maxRunUpPts = 0;
                    state.maxRunDnPts = 0;
                    state.barsHeld = 0;
                    state.minRunPtsByAnchor = 0;
                    state.trailStartPtsByAnchor = 0;
                    state.trailGivePtsByAnchor = 0;
                    state.anchorBackPtsByAnchor = 0;
                    state.lastMarkBar = -9999;
                    state.dFieldReady = true;
                    Object.assign(state, daily);
                    daily.issues.forEach(function (issue) { issues.push(bar.date + "：" + issue); });
                } else if (!issues.some(function (issue) { return issue.startsWith(String(bar.date)); })) {
                    issues.push(bar.date + "：" + daily.issues.join(" / "));
                }
            }

            if (bar.time === fixedBeginTime && state.dayInitDate === bar.date && state.dayAnchorOpen === 0) {
                state.dayAnchorOpen = Number(bar.open);
            }

            if (state.dayAnchorOpen > 0) {
                state.minRunPtsByAnchor = state.dayAnchorOpen * toNumber(params.MinRunPctAnchor, 0) * 0.01;
                state.trailStartPtsByAnchor = state.dayAnchorOpen * toNumber(params.TrailStartPctAnchor, 0) * 0.01;
                state.trailGivePtsByAnchor = state.dayAnchorOpen * toNumber(params.TrailGivePctAnchor, 0) * 0.01;
                state.anchorBackPtsByAnchor = state.dayAnchorOpen * toNumber(params.AnchorBackPct, 0) * 0.01;
            } else {
                state.minRunPtsByAnchor = 0;
                state.trailStartPtsByAnchor = 0;
                state.trailGivePtsByAnchor = 0;
                state.anchorBackPtsByAnchor = 0;
            }

            if (state.posFlag !== 0 && prevBar && currentBar > state.entryBarNo) {
                if (state.posFlag === 1) {
                    state.bestHighSinceEntry = Math.max(state.bestHighSinceEntry, Number(prevBar.high));
                    state.bestLowSinceEntry = Math.min(state.bestLowSinceEntry, Number(prevBar.low));
                    state.maxRunUpPts = state.bestHighSinceEntry - state.cost;
                    state.maxRunDnPts = state.cost - state.bestLowSinceEntry;
                } else if (state.posFlag === -1) {
                    state.bestLowSinceEntry = Math.min(state.bestLowSinceEntry, Number(prevBar.low));
                    state.bestHighSinceEntry = Math.max(state.bestHighSinceEntry, Number(prevBar.high));
                    state.maxRunUpPts = state.cost - state.bestLowSinceEntry;
                    state.maxRunDnPts = state.bestHighSinceEntry - state.cost;
                }
            }

            state.barsHeld = state.posFlag !== 0 ? (currentBar - state.entryBarNo) : 0;
            const atrStopLong = state.cost - toNumber(params.ATRStopK, 0) * state.entryATRD;
            const atrStopShort = state.cost + toNumber(params.ATRStopK, 0) * state.entryATRD;
            const atrTPPriceLong = state.cost + toNumber(params.ATRTakeProfitK, 0) * state.entryATRD;
            const atrTPPriceShort = state.cost - toNumber(params.ATRTakeProfitK, 0) * state.entryATRD;
            const longEntryLevelNH = state.nhVal + toNumber(params.EntryBufferPts, 0);
            const longEntryLevelDon = state.donHiD + toNumber(params.DonBufferPts, 0);
            const shortEntryLevelNL = state.nlVal - toNumber(params.EntryBufferPts, 0);
            const shortEntryLevelDon = state.donLoD - toNumber(params.DonBufferPts, 0);
            const dataReady = currentBar > warmupBars && state.dFieldReady && state.dayInitDate === bar.date && state.dayAnchorOpen > 0 && state.atrD > 0;

            let LongEntrySig = false;
            let ShortEntrySig = false;
            let LongExitTrig = false;
            let ShortExitTrig = false;
            let ForceExitTrig = false;

            if (dataReady && sessOnEntry && state.lastMarkBar !== currentBar) {
                if (state.posFlag === 0 && state.dayEntryCount < toInt(params.MaxEntriesPerDay, 0)) {
                    if (state.LongBias && state.atrD >= toNumber(params.MinATRD, 0) && ((bar.open >= longEntryLevelNH) || (bar.open >= longEntryLevelDon))) {
                        LongEntrySig = true;
                    }
                    if (!LongEntrySig && state.ShortBias && state.atrD >= toNumber(params.MinATRD, 0) && ((bar.open <= shortEntryLevelNL) || (bar.open <= shortEntryLevelDon))) {
                        ShortEntrySig = true;
                    }
                }
            }

            if (dataReady && sessOnManage && state.lastMarkBar !== currentBar) {
                if (bar.time >= fixedForceExitTime && state.posFlag !== 0) {
                    ForceExitTrig = true;
                } else if (state.posFlag === 1) {
                    LongExitTrig = (state.entryATRD > 0 && bar.open <= atrStopLong)
                        || (state.entryATRD > 0 && bar.open >= atrTPPriceLong)
                        || (state.barsHeld >= toInt(params.TimeStopBars, 0) && state.maxRunUpPts < state.minRunPtsByAnchor)
                        || (state.maxRunUpPts >= state.trailStartPtsByAnchor && (state.bestHighSinceEntry - bar.open) >= state.trailGivePtsByAnchor)
                        || (toInt(params.UseAnchorExit, 0) === 1 && state.dayAnchorOpen > 0 && bar.open <= state.dayAnchorOpen - state.anchorBackPtsByAnchor);
                    if (!LongExitTrig) { LongExitTrig = false; }
                } else if (state.posFlag === -1) {
                    ShortExitTrig = (state.entryATRD > 0 && bar.open >= atrStopShort)
                        || (state.entryATRD > 0 && bar.open <= atrTPPriceShort)
                        || (state.barsHeld >= toInt(params.TimeStopBars, 0) && state.maxRunUpPts < state.minRunPtsByAnchor)
                        || (state.maxRunUpPts >= state.trailStartPtsByAnchor && (bar.open - state.bestLowSinceEntry) >= state.trailGivePtsByAnchor)
                        || (toInt(params.UseAnchorExit, 0) === 1 && state.dayAnchorOpen > 0 && bar.open >= state.dayAnchorOpen + state.anchorBackPtsByAnchor);
                    if (!ShortExitTrig) { ShortExitTrig = false; }
                }
            }

            if (dataReady && sessOnManage && state.lastMarkBar !== currentBar && (ForceExitTrig || LongExitTrig || ShortExitTrig)) {
                events.push({
                    ts: formatTs(bar.date, bar.time),
                    price: Math.trunc(Number(bar.open)),
                    action: ForceExitTrig ? "強制平倉" : (LongExitTrig ? "平賣" : "平買"),
                });
                state.posFlag = 0;
                state.cost = 0;
                state.entryATRD = 0;
                state.entryBarNo = 0;
                state.bestHighSinceEntry = 0;
                state.bestLowSinceEntry = 0;
                state.maxRunUpPts = 0;
                state.maxRunDnPts = 0;
                state.barsHeld = 0;
                state.lastMarkBar = currentBar;
            }

            if (dataReady && sessOnEntry && state.lastMarkBar !== currentBar && (LongEntrySig || ShortEntrySig)) {
                events.push({
                    ts: formatTs(bar.date, bar.time),
                    price: Math.trunc(Number(bar.open)),
                    action: LongEntrySig ? "新買" : "新賣",
                });
                state.posFlag = LongEntrySig ? 1 : -1;
                state.cost = Number(bar.open);
                state.entryATRD = state.atrD;
                state.dayEntryCount += 1;
                state.entryBarNo = currentBar;
                state.bestHighSinceEntry = Number(bar.open);
                state.bestLowSinceEntry = Number(bar.open);
                state.maxRunUpPts = 0;
                state.maxRunDnPts = 0;
                state.barsHeld = 0;
                state.lastMarkBar = currentBar;
            }
        });

        return { events: events, issues: issues };
    }

    function buildTradesFromEvents(events, settings) {
        const trades = [];
        const anomalies = [];
        let openTrade = null;
        const roundTripCostPoints = toNumber(settings.sideCostPoints, DEFAULT_COMPARE_SETTINGS.sideCostPoints) * 2;
        const pointValue = toNumber(settings.pointValue, DEFAULT_COMPARE_SETTINGS.pointValue);

        events.forEach(function (event) {
            if (event.action === "新買" || event.action === "新賣") {
                if (openTrade) {
                    anomalies.push("偵測到未平倉就再次進場：" + event.ts + " " + event.action);
                }
                openTrade = {
                    side: event.action === "新買" ? "long" : "short",
                    entryTs: event.ts,
                    entryPrice: Number(event.price),
                    entryAction: event.action,
                };
                return;
            }

            if (!openTrade) {
                anomalies.push("偵測到沒有進場就先出場：" + event.ts + " " + event.action);
                return;
            }

            const grossPoints = openTrade.side === "long"
                ? Number(event.price) - openTrade.entryPrice
                : openTrade.entryPrice - Number(event.price);
            const netPoints = grossPoints - roundTripCostPoints;
            trades.push({
                side: openTrade.side,
                entryTs: openTrade.entryTs,
                exitTs: event.ts,
                entryPrice: openTrade.entryPrice,
                exitPrice: Number(event.price),
                entryAction: openTrade.entryAction,
                exitAction: event.action,
                grossPoints: grossPoints,
                netPoints: netPoints,
                pnlCurrency: netPoints * pointValue,
            });
            openTrade = null;
        });

        if (openTrade) {
            anomalies.push("最後仍有未平倉交易：" + openTrade.entryTs);
        }

        return { trades: trades, anomalies: anomalies };
    }

    function buildTradesFromEventsFlexible(events, settings) {
        const trades = [];
        const anomalies = [];
        let openTrade = null;
        const roundTripCostPoints = toNumber(settings.sideCostPoints, DEFAULT_COMPARE_SETTINGS.sideCostPoints) * 2;
        const pointValue = toNumber(settings.pointValue, DEFAULT_COMPARE_SETTINGS.pointValue);

        events.forEach(function (event) {
            if (event.action === XQ_ACTIONS.longEntry || event.action === XQ_ACTIONS.shortEntry) {
                if (openTrade) {
                    anomalies.push("\u91cd\u8907\u958b\u5009\uff1a" + event.ts + " " + event.action);
                }
                openTrade = {
                    side: event.action === XQ_ACTIONS.longEntry ? "long" : "short",
                    entryTs: event.ts,
                    entryPrice: Number(event.price),
                    entryAction: event.action,
                };
                return;
            }

            if (event.action !== XQ_ACTIONS.longExit && event.action !== XQ_ACTIONS.shortExit && event.action !== XQ_ACTIONS.forceExit) {
                anomalies.push("\u672a\u77e5\u6216\u7121\u6cd5\u914d\u5c0d\u7684\u4ea4\u6613\u4e8b\u4ef6\uff1a" + event.ts + " " + event.action);
                return;
            }

            if (!openTrade) {
                anomalies.push("\u672a\u77e5\u6216\u7121\u6cd5\u914d\u5c0d\u7684\u4ea4\u6613\u4e8b\u4ef6\uff1a" + event.ts + " " + event.action);
                return;
            }

            const grossPoints = openTrade.side === "long"
                ? Number(event.price) - openTrade.entryPrice
                : openTrade.entryPrice - Number(event.price);
            const netPoints = grossPoints - roundTripCostPoints;
            trades.push({
                side: openTrade.side,
                entryTs: openTrade.entryTs,
                exitTs: event.ts,
                entryPrice: openTrade.entryPrice,
                exitPrice: Number(event.price),
                entryAction: openTrade.entryAction,
                exitAction: event.action,
                grossPoints: grossPoints,
                netPoints: netPoints,
                pnlCurrency: netPoints * pointValue,
            });
            openTrade = null;
        });

        if (openTrade) {
            anomalies.push("\u5c1a\u6709\u672a\u5e73\u5009\u4ea4\u6613\uff1a" + openTrade.entryTs);
        }

        return { trades: trades, anomalies: anomalies };
    }

    function buildMetricsFromTrades(trades, settings) {
        if (!trades.length) {
            return DEFAULT_BEST_METRICS;
        }

        const capital = Math.max(1, toNumber(settings.capital, DEFAULT_COMPARE_SETTINGS.capital));
        let totalPnl = 0;
        let peakEquity = capital;
        let maxDrawdownPct = 0;
        const annualMap = new Map();

        trades.forEach(function (trade) {
            totalPnl += Number(trade.pnlCurrency);
            const equity = capital + totalPnl;
            if (equity > peakEquity) {
                peakEquity = equity;
            }
            const drawdownPct = peakEquity > 0 ? ((equity - peakEquity) / peakEquity) * 100 : 0;
            if (drawdownPct < maxDrawdownPct) {
                maxDrawdownPct = drawdownPct;
            }

            const year = String(trade.exitTs).slice(0, 4);
            annualMap.set(year, (annualMap.get(year) || 0) + Number(trade.pnlCurrency));
        });

        const exitYears = Array.from(annualMap.keys()).sort();
        const lastYear = exitYears.length ? Number(exitYears[exitYears.length - 1]) : new Date().getFullYear();
        const annualReturns = [];
        for (let year = lastYear - 5; year <= lastYear; year += 1) {
            const pnl = annualMap.get(String(year)) || 0;
            annualReturns.push({
                year: year,
                value: round1((pnl / capital) * 100),
            });
        }

        return {
            totalReturn: round1((totalPnl / capital) * 100),
            maxDrawdown: round1(maxDrawdownPct),
            tradeCount: trades.length,
            annualReturns: annualReturns,
        };
    }

    function compareEventLists(xqEvents, simEvents) {
        const minCount = Math.min(xqEvents.length, simEvents.length);
        let samePrefixCount = minCount;
        let firstMismatch = null;
        let mismatchCount = Math.abs(xqEvents.length - simEvents.length);

        for (let index = 0; index < minCount; index += 1) {
            const xq = xqEvents[index];
            const sim = simEvents[index];
            if (xq.ts !== sim.ts || xq.action !== sim.action || !compareNumeric(xq.price, sim.price, 1e-9)) {
                samePrefixCount = index;
                firstMismatch = { index: index, xq: xq, sim: sim };
                mismatchCount += 1;
                break;
            }
        }

        return {
            xqCount: xqEvents.length,
            simCount: simEvents.length,
            samePrefixCount: samePrefixCount,
            mismatchCount: mismatchCount,
            firstMismatch: firstMismatch,
            exactMatch: !firstMismatch && xqEvents.length === simEvents.length,
        };
    }

    function compareHeaderParams(headerParams, params) {
        const mappings = [
            ["BeginTime", 84800],
            ["EndTime", 124000],
            ["ForceExitTime", 131200],
            ["DonLen", params.DonLen],
            ["ATRLen", params.ATRLen],
            ["EMAWarmBars", params.EMAWarmBars],
            ["EntryBufferPts", params.EntryBufferPts],
            ["DonBufferPts", params.DonBufferPts],
            ["MinATRD", params.MinATRD],
            ["ATRStopK", params.ATRStopK],
            ["ATRTakeProfitK", params.ATRTakeProfitK],
            ["MaxEntriesPerDay", params.MaxEntriesPerDay],
            ["TimeStopBars", params.TimeStopBars],
            ["MinRunPctAnchor", params.MinRunPctAnchor],
            ["TrailStartPctAnchor", params.TrailStartPctAnchor],
            ["TrailGivePctAnchor", params.TrailGivePctAnchor],
            ["UseAnchorExit", params.UseAnchorExit],
            ["AnchorBackPct", params.AnchorBackPct],
        ];
        const mismatches = [];
        let checkedCount = 0;
        mappings.forEach(function (item) {
            const key = item[0];
            if (!(key in headerParams)) { return; }
            checkedCount += 1;
            if (!compareNumeric(headerParams[key], item[1], 1e-9)) {
                mismatches.push(key + "：XQ=" + headerParams[key] + " / 本頁=" + item[1]);
            }
        });
        return {
            checkedCount: checkedCount,
            mismatches: mismatches,
            allMatch: mismatches.length === 0,
        };
    }

    function inspectXqEventStructure(events) {
        const countByTs = new Map();
        events.forEach(function (event) {
            countByTs.set(event.ts, (countByTs.get(event.ts) || 0) + 1);
        });
        let multiTimestampCount = 0;
        countByTs.forEach(function (count) {
            if (count > 1) {
                multiTimestampCount += 1;
            }
        });
        return {
            multiTimestampCount: multiTimestampCount,
            hasMultiEventTimestamps: multiTimestampCount > 0,
        };
    }

    function buildXqMetricsSourceNote(xqStructure, xqTradePack) {
        if (xqStructure && xqStructure.hasMultiEventTimestamps) {
            return "\u4e0a\u65b9\u7e3d\u5831\u916c\u7387\u76ee\u524d\u4ecd\u4ee5\u6a21\u64ec TXT \u70ba\u6e96\uff1aXQ TXT \u542b "
                + xqStructure.multiTimestampCount
                + " \u500b\u540c\u6642\u9593\u591a\u4e8b\u4ef6\uff0c\u73fe\u884c XQ \u7e3e\u6548\u89e3\u6790\u9084\u4e0d\u652f\u63f4\u9019\u7a2e\u591a\u53e3/\u5206\u6279\u7d50\u69cb\u3002";
        }
        if (xqTradePack && Array.isArray(xqTradePack.anomalies) && xqTradePack.anomalies.length) {
            return "\u4e0a\u65b9\u7e3d\u5831\u916c\u7387\u76ee\u524d\u4ecd\u4ee5\u6a21\u64ec TXT \u70ba\u6e96\uff1aXQ TXT \u5728\u73fe\u884c\u89e3\u6790\u5668\u4e2d\u51fa\u73fe "
                + xqTradePack.anomalies.length
                + " \u7b46\u7121\u6cd5\u914d\u5c0d\u7684\u4ea4\u6613\u4e8b\u4ef6\u3002";
        }
        return "";
    }

    function describeFirstMismatch(firstMismatch) {
        if (!firstMismatch) {
            return "完全吻合。";
        }
        return "第 " + (firstMismatch.index + 1) + " 筆不同：XQ="
            + firstMismatch.xq.ts + " " + firstMismatch.xq.price + " " + firstMismatch.xq.action
            + "；本頁="
            + firstMismatch.sim.ts + " " + firstMismatch.sim.price + " " + firstMismatch.sim.action;
    }

    function buildVerificationResult(input) {
        const params = extractParamsFromCode((input.indicatorCode || "") + "\n" + (input.tradingCode || ""));
        const m1Bars = parseM1Text(input.m1Text);
        const d1Rows = parseD1Text(input.d1Text);
        const daRows = input.daText ? parseDAText(input.daText) : deriveDailyAnchorsFromD1(d1Rows, m1Bars);
        const xqText = parseXqTradeTextFlexible(input.xqText);
        const simulation = simulateBestStrategy({ m1Bars: m1Bars, d1Rows: d1Rows, daRows: daRows }, params);
        const compare = compareEventLists(xqText.events, simulation.events);
        const paramCompare = compareHeaderParams(xqText.headerParams, params);
        const tradePack = buildTradesFromEventsFlexible(simulation.events, input.settings);
        const metrics = buildMetricsFromTrades(tradePack.trades, input.settings);
        const statusLabel = compare.exactMatch && paramCompare.allMatch && tradePack.anomalies.length === 0
            ? "已驗證"
            : (simulation.events.length ? "有差異" : "未算出事件");
        const noteParts = [
            "模擬 " + simulation.events.length + " 筆事件，XQ " + xqText.events.length + " 筆。"
        ];
        if (simulation.issues.length) {
            noteParts.push("資料提醒：" + simulation.issues.slice(0, 3).join(" / "));
        }
        if (tradePack.anomalies.length) {
            noteParts.push("交易結構提醒：" + tradePack.anomalies.slice(0, 2).join(" / "));
        }

        return {
            revision: VERIFICATION_REVISION,
            verifiedAt: new Date().toLocaleString("zh-TW", { hour12: false }),
            settings: input.settings,
            metrics: metrics,
            compare: compare,
            paramCompare: paramCompare,
            simIssues: simulation.issues,
            tradeIssues: tradePack.anomalies,
            statusLabel: statusLabel,
            paramNote: paramCompare.checkedCount
                ? (paramCompare.allMatch ? "XQ 參數列與目前策略參數一致。" : "XQ 參數列與目前策略參數有差異：" + paramCompare.mismatches.join(" / "))
                : "XQ TXT 沒有可比較的參數列。",
            firstMismatchText: describeFirstMismatch(compare.firstMismatch),
            note: noteParts.join(" "),
        };
    }

    function buildSimulatedTxt(events, params) {
        const headerPairs = [
            ["BeginTime", 84800],
            ["EndTime", 124000],
            ["ForceExitTime", 131200],
            ["DonLen", params.DonLen],
            ["ATRLen", params.ATRLen],
            ["EMAWarmBars", params.EMAWarmBars],
            ["EntryBufferPts", params.EntryBufferPts],
            ["DonBufferPts", params.DonBufferPts],
            ["MinATRD", params.MinATRD],
            ["ATRStopK", params.ATRStopK],
            ["ATRTakeProfitK", params.ATRTakeProfitK],
            ["MaxEntriesPerDay", params.MaxEntriesPerDay],
            ["TimeStopBars", params.TimeStopBars],
            ["MinRunPctAnchor", params.MinRunPctAnchor],
            ["TrailStartPctAnchor", params.TrailStartPctAnchor],
            ["TrailGivePctAnchor", params.TrailGivePctAnchor],
            ["UseAnchorExit", params.UseAnchorExit],
            ["AnchorBackPct", params.AnchorBackPct],
        ];
        const headerLine = headerPairs
            .map(function (pair) { return pair[0] + "=" + pair[1]; })
            .join(", ");
        const bodyLines = events.map(function (event) {
            return event.ts + " " + Math.trunc(Number(event.price)) + " " + event.action;
        });
        return [headerLine].concat(bodyLines).join("\n");
    }

    function buildVerificationResultFlexible(input) {
        const params = extractParamsFromCode((input.indicatorCode || "") + "\n" + (input.tradingCode || ""));
        const m1Bars = parseM1Text(input.m1Text);
        const d1Rows = parseD1Text(input.d1Text);
        const daRows = input.daText ? parseDAText(input.daText) : deriveDailyAnchorsFromD1(d1Rows, m1Bars);
        const simulation = simulateBestStrategy({ m1Bars: m1Bars, d1Rows: d1Rows, daRows: daRows }, params);
        const tradePack = buildTradesFromEvents(simulation.events, input.settings);
        const metrics = buildMetricsFromTrades(tradePack.trades, input.settings);
        const simulatedTxt = buildSimulatedTxt(simulation.events, params);
        const noteParts = [
            "模擬 " + simulation.events.length + " 筆事件。"
        ];

        if (simulation.issues.length) {
            noteParts.push("資料提醒：" + simulation.issues.slice(0, 3).join(" / "));
        }
        if (tradePack.anomalies.length) {
            noteParts.push("交易事件提醒：" + tradePack.anomalies.slice(0, 2).join(" / "));
        }

        if (!input.xqText) {
            noteParts.push("已先算出模擬 TXT，等待上傳 XQ TXT 後再逐筆比對。");
            return {
                revision: VERIFICATION_REVISION,
                verifiedAt: new Date().toLocaleString("zh-TW", { hour12: false }),
                settings: input.settings,
                metrics: metrics,
                compare: {
                    xqCount: 0,
                    simCount: simulation.events.length,
                    samePrefixCount: 0,
                    mismatchCount: 0,
                    firstMismatch: null,
                    exactMatch: false,
                },
                paramCompare: {
                    checkedCount: 0,
                    mismatches: [],
                    allMatch: false,
                },
                simIssues: simulation.issues,
                tradeIssues: tradePack.anomalies,
                statusLabel: simulation.events.length ? "已算出模擬TXT" : "未算出事件",
                paramNote: "目前尚未上傳 XQ TXT；已先依目前策略與 M1 / D1 算出模擬事件。",
                firstMismatchText: "尚未上傳 XQ TXT，故未逐筆比對。",
                note: noteParts.join(" "),
                hasXqComparison: false,
                simulatedTxt: simulatedTxt,
            };
        }

        const xqText = parseXqTradeText(input.xqText);
        const xqStructure = inspectXqEventStructure(xqText.events);
        const xqTradePack = buildTradesFromEvents(xqText.events, input.settings);
        const compare = compareEventLists(xqText.events, simulation.events);
        const paramCompare = compareHeaderParams(xqText.headerParams, params);
        const metricsSourceNote = buildXqMetricsSourceNote(xqStructure, xqTradePack);
        const statusLabel = compare.exactMatch && paramCompare.allMatch && tradePack.anomalies.length === 0
            ? "已驗證"
            : (simulation.events.length ? "有差異" : "未算出事件");

        noteParts[0] = "模擬 " + simulation.events.length + " 筆事件，XQ " + xqText.events.length + " 筆。";

        if (metricsSourceNote) {
            noteParts.push(metricsSourceNote);
        }

        return {
            revision: VERIFICATION_REVISION,
            verifiedAt: new Date().toLocaleString("zh-TW", { hour12: false }),
            settings: input.settings,
            metrics: metrics,
            compare: compare,
            paramCompare: paramCompare,
            simIssues: simulation.issues,
            tradeIssues: tradePack.anomalies,
            statusLabel: statusLabel,
            paramNote: paramCompare.checkedCount
                ? (paramCompare.allMatch ? "XQ 參數列與目前策略參數一致。" : "XQ 參數列與目前策略參數有差異：" + paramCompare.mismatches.join(" / "))
                : "XQ TXT 沒有可比較的參數列。",
            firstMismatchText: describeFirstMismatch(compare.firstMismatch),
            note: noteParts.join(" "),
            hasXqComparison: true,
            metricsSourceNote: metricsSourceNote,
            simulatedTxt: simulatedTxt,
        };
    }

    function buildVerificationResultFlexibleV2(input) {
        const params = extractParamsFromCode((input.indicatorCode || "") + "\n" + (input.tradingCode || ""));
        const forceExitTime = extractForceExitTimeFromCode((input.indicatorCode || "") + "\n" + (input.tradingCode || ""));
        const m1Bars = parseM1Text(input.m1Text);
        const d1Rows = parseD1Text(input.d1Text);
        const daRows = input.daText ? parseDAText(input.daText) : deriveDailyAnchorsFromD1(d1Rows, m1Bars);
        const simulation = simulateBestStrategy({ m1Bars: m1Bars, d1Rows: d1Rows, daRows: daRows }, params);
        const tradePack = buildTradesFromEventsFlexible(simulation.events, input.settings);
        const simulationMetrics = buildMetricsFromTrades(tradePack.trades, input.settings);
        const futuresKpi = futuresKpiHelpers && typeof futuresKpiHelpers.buildSimulationReport === "function"
            ? futuresKpiHelpers.buildSimulationReport(tradePack.trades, {
                capital: input.settings.capital,
                pointValue: input.settings.pointValue,
                slipPerSide: input.settings.sideCostPoints,
            })
            : null;
        const simulatedTxt = buildSimulatedTxt(simulation.events, params);
        const noteParts = [
            "\u5df2\u6a21\u64ec " + simulation.events.length + " \u7b46\u4e8b\u4ef6\u3002",
        ];

        if (simulation.issues.length) {
            noteParts.push("\u6a21\u64ec\u554f\u984c\uff1a" + simulation.issues.slice(0, 3).join(" / "));
        }
        if (tradePack.anomalies.length) {
            noteParts.push("\u6a21\u64ec\u4ea4\u6613\u914d\u5c0d\u554f\u984c\uff1a" + tradePack.anomalies.slice(0, 2).join(" / "));
        }

        const hasXqTxt = Boolean(input.xqText);
        const hasXqCsv = Boolean(input.xqCsvText);
        if (!hasXqTxt && !hasXqCsv) {
            noteParts.push("\u672a\u63d0\u4f9b XQ TXT / CSV\uff0c\u9996\u9801 KPI \u76ee\u524d\u76f4\u63a5\u4ee5\u7a0b\u5f0f\u6a21\u64ec\u51fa\u7684\u671f\u8ca8\u4ea4\u6613\u8a08\u7b97\u3002");
            return {
                revision: VERIFICATION_REVISION,
                verifiedAt: new Date().toLocaleString("zh-TW", { hour12: false }),
                settings: input.settings,
                metrics: simulationMetrics,
                futuresKpi: futuresKpi,
                xqFuturesKpi: null,
                xqAuthorityFuturesKpi: null,
                futuresKpiCompare: null,
                compare: {
                    xqCount: 0,
                    simCount: simulation.events.length,
                    samePrefixCount: 0,
                    mismatchCount: 0,
                    firstMismatch: null,
                    exactMatch: false,
                },
                paramCompare: {
                    checkedCount: 0,
                    mismatches: [],
                    allMatch: false,
                },
                simIssues: simulation.issues,
                tradeIssues: tradePack.anomalies,
                statusLabel: simulation.events.length ? "\u5df2\u7b97\u51fa\u6a21\u64ecTXT" : "\u5f85\u9a57\u8b49",
                paramNote: "\u672a\u63d0\u4f9b XQ TXT / CSV\uff0c\u5c1a\u672a\u9032\u884c XQ \u53c3\u6578\u6bd4\u5c0d\u3002",
                firstMismatchText: "\u672a\u63d0\u4f9b XQ \u660e\u7d30\u3002",
                note: noteParts.join(" "),
                hasXqComparison: false,
                metricsSourceNote: "",
                simulatedTxt: simulatedTxt,
                xqKpiSourceLabel: "",
            };
        }

        let metrics = simulationMetrics;
        let metricsSourceNote = "";
        let xqSourceLabel = hasXqTxt ? "XQ TXT" : "XQ CSV";
        let xqEvents = [];
        let xqFuturesKpi = null;
        let xqAuthorityFuturesKpi = null;
        let xqKpiSourceLabel = "";
        let futuresKpiCompare = null;
        let paramCompare = {
            checkedCount: 0,
            mismatches: [],
            allMatch: false,
        };

        if (hasXqCsv) {
            if (!xqUploadHelpers || typeof xqUploadHelpers.parseXqTradeCsvText !== "function") {
                throw new Error("XQ CSV \u89e3\u6790\u5668\u5c1a\u672a\u6e96\u5099\u5b8c\u6210\u3002");
            }
            const xqCsvPack = xqUploadHelpers.parseXqTradeCsvText(
                input.xqCsvText,
                Object.assign({}, input.settings, {
                    forceExitTime: forceExitTime,
                    headerText: buildSimulatedTxt([], params),
                })
            );
            if (futuresKpiHelpers && typeof futuresKpiHelpers.buildXqAuthorityReport === "function") {
                xqAuthorityFuturesKpi = futuresKpiHelpers.buildXqAuthorityReport(xqCsvPack.trades, {
                    capital: input.settings.capital,
                    pointValue: input.settings.pointValue,
                    slipPerSide: input.settings.sideCostPoints,
                });
                xqFuturesKpi = xqAuthorityFuturesKpi;
                xqKpiSourceLabel = "XQ CSV 權威 KPI";
                if (futuresKpi && typeof futuresKpiHelpers.compareReports === "function") {
                    futuresKpiCompare = futuresKpiHelpers.compareReports(futuresKpi, xqFuturesKpi);
                }
            }
            metricsSourceNote = "\u5df2\u8f09\u5165 XQ CSV\uff0c\u4f46\u9996\u9801 KPI \u4ecd\u7dad\u6301\u4ee5\u7a0b\u5f0f\u6a21\u64ec\u7684\u671f\u8ca8\u53e3\u5f91\u986f\u793a\uff1bXQ \u660e\u7d30\u53ea\u7528\u4f86\u505a\u4e8b\u4ef6\u8207 KPI \u6821\u5c0d\u3002";
            noteParts.push(metricsSourceNote);
            if (Array.isArray(xqCsvPack.issues) && xqCsvPack.issues.length) {
                noteParts.push("XQ CSV\uff1a" + xqCsvPack.issues.slice(0, 2).join(" / "));
            }
            if (futuresKpiCompare) {
                const theoryNetDiff = Number(futuresKpiCompare.theoryNetDiff || 0);
                const tradeCountDiff = Number(futuresKpiCompare.tradeCountDiff || 0);
                if (Math.abs(theoryNetDiff) <= 0.1 && tradeCountDiff === 0) {
                    noteParts.push("\u7121\u6ed1\u50f9 KPI \u5df2\u8207 XQ CSV \u5c0d\u9f4a\u3002");
                } else {
                    noteParts.push("\u7121\u6ed1\u50f9 KPI \u8207 XQ CSV \u4ecd\u6709\u5dee\u7570\uff1a\u6de8\u5229\u5dee " + formatSignedMoney(theoryNetDiff) + "\uff0c\u4ea4\u6613\u6578\u5dee " + formatSignedCount(tradeCountDiff) + "\u3002");
                }
            }
            if (!hasXqTxt) {
                xqEvents = xqCsvPack.events;
                noteParts.push("\u672a\u63d0\u4f9b XQ TXT\uff0c\u4e8b\u4ef6\u6bd4\u5c0d\u5df2\u76f4\u63a5\u4ee5 XQ CSV \u8f49\u6210\u7684 TXT \u4e8b\u4ef6\u70ba\u6e96\uff0c\u4e26\u4f9d ForceExitTime=" + forceExitTime + " \u63a8\u5c0e\u5f37\u5236\u5e73\u5009\u3002");
            }
        }

        if (hasXqTxt) {
            const xqText = parseXqTradeTextFlexible(input.xqText);
            const xqStructure = inspectXqEventStructure(xqText.events);
            const xqTradePack = buildTradesFromEventsFlexible(xqText.events, input.settings);
            xqEvents = xqText.events;
            paramCompare = compareHeaderParams(xqText.headerParams, params);
            if (futuresKpiHelpers && typeof futuresKpiHelpers.buildSimulationReport === "function") {
                const xqTextFuturesKpi = futuresKpiHelpers.buildSimulationReport(xqTradePack.trades, {
                    capital: input.settings.capital,
                    pointValue: input.settings.pointValue,
                    slipPerSide: input.settings.sideCostPoints,
                });
                if (!xqFuturesKpi) {
                    xqFuturesKpi = xqTextFuturesKpi;
                    xqKpiSourceLabel = "XQ TXT 轉換 KPI";
                }
                if (!futuresKpiCompare && futuresKpi && typeof futuresKpiHelpers.compareReports === "function") {
                    futuresKpiCompare = futuresKpiHelpers.compareReports(futuresKpi, xqTextFuturesKpi);
                }
            }
            if (!metricsSourceNote) {
                metricsSourceNote = buildXqMetricsSourceNote(xqStructure, xqTradePack);
                if (metricsSourceNote) {
                    noteParts.push(metricsSourceNote);
                }
            }
        }

        const compare = xqEvents.length
            ? compareEventLists(xqEvents, simulation.events)
            : {
                xqCount: 0,
                simCount: simulation.events.length,
                samePrefixCount: 0,
                mismatchCount: 0,
                firstMismatch: null,
                exactMatch: false,
            };
        const statusLabel = hasXqTxt
            ? (compare.exactMatch && paramCompare.allMatch && tradePack.anomalies.length === 0
                ? "\u5df2\u9a57\u8b49"
                : (simulation.events.length ? "\u5df2\u7b97\u51fa\u6a21\u64ecTXT" : "\u5f85\u9a57\u8b49"))
            : "\u5df2\u8f09\u5165 XQ CSV";
        noteParts[0] = "\u5df2\u6a21\u64ec " + simulation.events.length + " \u7b46\u4e8b\u4ef6\uff0c\u5c0d\u7167 " + xqSourceLabel + " " + xqEvents.length + " \u7b46\u4e8b\u4ef6\u3002";

        return {
            revision: VERIFICATION_REVISION,
            verifiedAt: new Date().toLocaleString("zh-TW", { hour12: false }),
            settings: input.settings,
            metrics: metrics,
            futuresKpi: futuresKpi,
            xqFuturesKpi: xqFuturesKpi,
            xqAuthorityFuturesKpi: xqAuthorityFuturesKpi,
            xqKpiSourceLabel: xqKpiSourceLabel,
            futuresKpiCompare: futuresKpiCompare,
            compare: compare,
            paramCompare: paramCompare,
            simIssues: simulation.issues,
            tradeIssues: tradePack.anomalies,
            statusLabel: statusLabel,
            paramNote: hasXqTxt
                ? (paramCompare.checkedCount
                    ? (paramCompare.allMatch
                        ? "XQ TXT \u53c3\u6578\u5217\u8207\u76ee\u524d\u7b56\u7565\u53c3\u6578\u4e00\u81f4\u3002"
                        : "XQ TXT \u53c3\u6578\u5217\u8207\u76ee\u524d\u7b56\u7565\u4e0d\u4e00\u81f4\uff1a" + paramCompare.mismatches.join(" / "))
                    : "XQ TXT \u672a\u63d0\u4f9b\u53ef\u6bd4\u5c0d\u7684\u53c3\u6578\u5217\u3002")
                : "XQ CSV \u4e0d\u542b\u539f\u59cb\u53c3\u6578\u5217\uff0c\u76ee\u524d\u5df2\u4f9d ForceExitTime=" + forceExitTime + " \u5c07\u539f\u59cb\u56de\u6e2c\u660e\u7d30\u8f49\u6210 TXT \u4e8b\u4ef6\u5f8c\u518d\u9032\u884c\u6bd4\u5c0d\u3002",
            firstMismatchText: xqEvents.length ? describeFirstMismatch(compare.firstMismatch) : "\u672a\u63d0\u4f9b XQ \u4e8b\u4ef6\u3002",
            note: noteParts.join(" "),
            hasXqComparison: xqEvents.length > 0,
            metricsSourceNote: metricsSourceNote,
            simulatedTxt: simulatedTxt,
            xqSourceLabel: xqSourceLabel,
        };
    }

    async function updateBestHistory() {
        setBestButtonBusy(true);
        setStatusText(bestUploadStatus, "正在整理策略與資料來源，準備回放計算...");

        try {
            const indicatorFile = await readUploadedFile(bestIndicatorUpload);
            const tradingFile = await readUploadedFile(bestTradingUpload);
            const uploadedM1File = await readUploadedFile(bestM1Upload);
            const uploadedD1File = await readUploadedFile(bestD1Upload);
            const uploadedXqFiles = await readUploadedFiles(bestXqTxtUpload);
            const xqUploads = classifyXqUploads(uploadedXqFiles);
            const xqTxtFile = xqUploads.txtFile;
            const xqCsvFile = xqUploads.csvFile;
            const m1File = uploadedM1File || await readBundledDataset("m1");
            const d1File = uploadedD1File || await readBundledDataset("d1");
            const bundledKinds = [];
            const defaultStrategyKinds = [];

            if (!uploadedM1File && m1File?.source === "bundled") { bundledKinds.push("M1"); }
            if (!uploadedD1File && d1File?.source === "bundled") { bundledKinds.push("D1"); }
            if (!indicatorFile) { defaultStrategyKinds.push("指標版"); }
            if (!tradingFile) { defaultStrategyKinds.push("交易版"); }

            if (!indicatorFile && !tradingFile && !uploadedM1File && !uploadedD1File && !xqUploads.count && !hasBundledCompareData()) {
                setStatusText(
                    bestUploadStatus,
                    hasBundledCompareData()
                        ? (buildBundledStatusText() + " 目前策略直接使用下方預設指標版與交易版。若要重新比對，請補上交易明細，手動上傳也可以覆蓋程式內建資料。")
                        : "請先上傳策略、資料庫或交易明細。"
                );
                return;
            }

            const saved = readStore();
            const currentPair = saved || buildPair(BEST_PRESET);
            const bestId = getBestId();
            const nextIndicator = applyIdentity(indicatorFile ? indicatorFile.text : currentPair.indicator, bestId, "最佳報酬配對");
            const nextTrading = applyIdentity(tradingFile ? tradingFile.text : currentPair.trading, bestId, "最佳報酬配對");
            const settings = readCompareSettings();
            let verification = null;
            let statusMessage = "已更新策略版本，但尚未完成比對。";

            if (m1File || d1File || xqTxtFile || xqCsvFile) {
                const missing = [];
                if (!m1File) { missing.push("M1"); }
                if (!d1File) { missing.push("D1"); }

                if (missing.length) {
                    statusMessage = "資料尚未完整，缺少 " + missing.join("、") + "。";
                    if (window.location.protocol === "file:" && missing.some(function (kind) { return kind === "M1" || kind === "D1"; }) && hasBundledCompareData()) {
                        statusMessage += " 目前是直接開啟本機 HTML，瀏覽器不會自動讀取程式子資料夾內的原始 TXT；起訖期間已顯示，但要比對仍需手動選一次檔案。";
                    }
                } else {
                    try {
                        verification = buildVerificationResultFlexibleV2({
                            indicatorCode: nextIndicator,
                            tradingCode: nextTrading,
                            m1Text: m1File.text,
                            d1Text: d1File.text,
                            xqText: xqTxtFile ? xqTxtFile.text : "",
                            xqCsvText: xqCsvFile ? xqCsvFile.text : "",
                            settings: settings,
                        });
                        statusMessage = verification.hasXqComparison
                            ? (verification.statusLabel === "已驗證"
                                ? "已完成與交易明細比對，並更新歷史最佳指標版與交易版。"
                                : "已完成回放，但模擬結果與交易明細仍有差異，請再檢查參數與資料來源。")
                            : "已依目前策略與 M1 / D1 算出模擬 TXT，現在可以再上傳交易明細做逐筆比對。";
                        statusMessage = verification.hasXqComparison
                            ? (verification.statusLabel === "已驗證"
                                ? "已完成 XQ 事件比對，首頁 KPI 已改用期貨口徑同步更新。"
                                : "已完成 XQ 載入與模擬比對，首頁 KPI 仍以程式模擬的期貨口徑顯示。")
                            : "已完成 M1 / D1 模擬，首頁 KPI 已依期貨口徑重算。";
                        if (xqCsvFile) {
                            statusMessage += " XQ CSV 目前只拿來做事件與 KPI 校對。";
                        }
                        if (defaultStrategyKinds.length) {
                            statusMessage += " 本次策略直接使用目前頁面預設輸出：" + defaultStrategyKinds.join(" / ") + "。";
                        }
                        if (bundledKinds.length) {
                            statusMessage += " 本次 M1 / D1 來自程式內建資料：" + bundledKinds.join(" / ") + "。";
                        }
                    } catch (error) {
                        verification = null;
                        statusMessage = error && error.message ? error.message : "比對失敗，請先確認上傳檔案格式正確。";
                    }
                }
            }

            writeStore({
                indicator: nextIndicator,
                trading: nextTrading,
                verification: verification,
                lastStatus: statusMessage,
                updatedAt: new Date().toLocaleString("zh-TW", { hour12: false }),
            });

            bestIndicatorUpload.value = "";
            bestTradingUpload.value = "";
            if (bestM1Upload) { bestM1Upload.value = ""; }
            if (bestD1Upload) { bestD1Upload.value = ""; }
            if (bestXqTxtUpload) { bestXqTxtUpload.value = ""; }
            showBestMode();
        } finally {
            setBestButtonBusy(false);
        }
    }

    async function runRefactor() {
        const indicatorFile = await readUploadedFile(refactorIndicatorUpload);
        const tradingFile = await readUploadedFile(refactorTradingUpload);
        if (!indicatorFile && !tradingFile) {
            setText(refactorStatus, "請先上傳舊的指標版或交易版。");
            return;
        }
        const rawName = indicatorFile?.name || tradingFile?.name || "Uploaded_Strategy.xs";
        const preset = inferPreset((indicatorFile?.text || "") + "\n" + (tradingFile?.text || ""));
        const pair = renamePair(buildPair(preset), safeName(rawName) + "_V2", rawName.replace(/\.[^.]+$/, "") + " V2");
        showPair("重構輸出", "重構舊 XS", fileBase(null, false), pair.indicator, pair.trading);
        setText(refactorStatus, "已依 V2 規範重新輸出 paired XS。");
    }

    function fallbackCopy(text) {
        const temp = document.createElement("textarea");
        temp.value = String(text || "");
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch { ok = false; }
        document.body.removeChild(temp);
        return ok;
    }

    async function copyText(button, text) {
        let ok = false;
        if (navigator.clipboard && window.isSecureContext) {
            try { await navigator.clipboard.writeText(String(text || "")); ok = true; } catch { ok = false; }
        }
        if (!ok) { ok = fallbackCopy(text); }
        const original = button.dataset.label || "複製";
        button.textContent = ok ? "已複製" : "複製失敗";
        setTimeout(function () { button.textContent = original; }, 1200);
    }

    function bindCopy(id, getter) {
        const button = document.getElementById(id);
        button.dataset.label = button.textContent;
        button.addEventListener("click", function () { copyText(button, getter()); });
    }

    modeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            if (button.dataset.mode === "best") { showBestMode(); return; }
            if (button.dataset.mode === "new") { showNewMode(); return; }
            if (button.dataset.mode === "refactor") { showRefactorMode(); return; }
            showExportMode();
        });
    });

    if (bestXqTxtUpload) {
        bestXqTxtUpload.addEventListener("change", function () {
            renderTradeDetailSummary(Array.from(bestXqTxtUpload.files || []), getDisplayVerification(readStore()));
        });
    }
    function scheduleBestAutoRunRetry() {
        window.setTimeout(function () {
            const saved = readStore();
            if (
                bestModeAutoRunStarted
                || getDisplayVerification(saved)
                || !document.body.classList.contains("is-unlocked")
                || window.location.protocol === "file:"
            ) {
                return;
            }

            bestModeAutoRunStarted = true;
            setBestButtonBusy(true);
            setStatusText(bestUploadStatus, "已載入首頁預設策略與程式內建 M1 / D1，正在自動計算首頁結果...");
            setText(compareStatusValue, "計算中");
            setText(compareSimCount, "-");
            setText(compareXqCount, "-");
            setText(comparePrefixCount, "-");
            setText(compareParamNote, "程式正在直接使用首頁預設指標版 / 交易版與內建 M1 / D1 進行回放。");
            setText(compareFirstMismatch, "尚未進入比對階段。");
            setText(compareNote, "若本次仍失敗，狀態訊息會直接顯示在資料上傳區下方。");

            updateBestHistory().catch(function (error) {
                bestModeAutoRunStarted = false;
                setBestButtonBusy(false);
                setStatusText(bestUploadStatus, error && error.message ? error.message : "自動計算失敗，請再按一次「更新並比對」。");
            });
        }, 80);
    }
    window.addEventListener("xs:slippage-ready", function (event) {
        const nextSlippage = toNumber(event && event.detail && event.detail.slippage, readGateSlippage(DEFAULT_COMPARE_SETTINGS.sideCostPoints));
        if (bestSideCostInput) {
            bestSideCostInput.value = String(formatCompactNumber(nextSlippage));
        }
        bestModeAutoRunStarted = false;
        showBestMode();
        scheduleBestAutoRunRetry();
    });
    window.addEventListener("load", function () {
        scheduleBestAutoRunRetry();
    });
    window.addEventListener("pageshow", function () {
        scheduleBestAutoRunRetry();
    });
    window.addEventListener("focus", function () {
        scheduleBestAutoRunRetry();
    });
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) {
            scheduleBestAutoRunRetry();
        }
    });
    applyBestUploadButton.addEventListener("click", function () { updateBestHistory(); });
    runRefactorButton.addEventListener("click", function () { runRefactor(); });
    bindCopy("copy-indicator", function () { return indicatorOutput.value; });
    bindCopy("copy-trading", function () { return tradingOutput.value; });
    bindCopy("copy-export-m1", function () { return exportM1Output.value; });
    bindCopy("copy-export-d1", function () { return exportD1Output.value; });
    trySwitchFileModeToLocalSite();
    showBestMode();
    scheduleBestAutoRunRetry();
})();
