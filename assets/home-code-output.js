(function () {
    const STORAGE_KEY = "xs-home-best-history-v3";
    const BEST_ID_KEY = "xs-home-best-id-v1";
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
    const NEW_RETURNS = [106, 93, 118];
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
        da: `// DailyAnchor 匯出
input:
    AnchorTime(084500, "定錨時間");

var:
    outPath(""),
    outStr(""),
    lastPrintedDate(0),
    yH(0),
    yL(0),
    yC(0),
    dayRange(0),
    ppVal(0),
    nhVal(0),
    nlVal(0);

if BarFreq <> "Min" then
    RaiseRunTimeError("本腳本僅支援分鐘線");

if CurrentBar = 1 then begin
    outPath = "C:\\\\XQ\\\\data\\\\DailyAnchor.txt";
    lastPrintedDate = 0;
end;

if (Date <> Date[1]) and (Date <> lastPrintedDate) then begin
    yH = GetField("最高價", "D")[1];
    yL = GetField("最低價", "D")[1];
    yC = GetField("收盤價", "D")[1];

    if (yH > 0) and (yL > 0) and (yC > 0) then begin
        dayRange = yH - yL;
        ppVal = (yH + yL + 2 * yC) / 4;
        nhVal = 2 * ppVal - yL;
        nlVal = 2 * ppVal - yH;

        outStr = NumToStr(Date, 0) + " "
               + NumToStr(AnchorTime, 0) + " "
               + NumToStr(yH, 0) + " "
               + NumToStr(yL, 0) + " "
               + NumToStr(yC, 0) + " "
               + NumToStr(dayRange, 0) + " "
               + NumToStr(ppVal, 2) + " "
               + NumToStr(nhVal, 2) + " "
               + NumToStr(nlVal, 2);

        Print(File(outPath), outStr);
        lastPrintedDate = Date;
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
    const NEW_PRESETS = [
        { strategyId: "Morning_Breakout_Driver", title: "Morning Breakout Driver", theme: "ema" },
        { strategyId: "Adaptive_Breakout_Trend", title: "Adaptive Breakout Trend", theme: "breakout" },
        { strategyId: "Opening_Range_Retest_Morning", title: "Opening Range Retest Morning", theme: "orb" },
    ];
    const REFACTOR_PRESETS = {
        breakout: { strategyId: "Refactor_Breakout_V2", title: "Refactor Breakout V2", theme: "breakout" },
        ema: { strategyId: "Refactor_EMA_Pullback_V2", title: "Refactor EMA Pullback V2", theme: "ema" },
        orb: { strategyId: "Refactor_Opening_Range_V2", title: "Refactor Opening Range V2", theme: "orb" },
    };

    const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
    const bestMetricsPanel = document.getElementById("best-metrics-panel");
    const bestUploadPanel = document.getElementById("best-upload-panel");
    const refactorUploadPanel = document.getElementById("refactor-upload-panel");
    const metricTotalReturn = document.getElementById("metric-total-return");
    const metricMaxDrawdown = document.getElementById("metric-max-drawdown");
    const metricTradeCount = document.getElementById("metric-trade-count");
    const annualReturnList = document.getElementById("annual-return-list");
    const bestIndicatorUpload = document.getElementById("best-indicator-upload");
    const bestTradingUpload = document.getElementById("best-trading-upload");
    const bestM1Upload = document.getElementById("best-m1-upload");
    const bestD1Upload = document.getElementById("best-d1-upload");
    const bestXqTxtUpload = document.getElementById("best-xqtxt-upload");
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
    const refactorIndicatorUpload = document.getElementById("refactor-indicator-upload");
    const refactorTradingUpload = document.getElementById("refactor-trading-upload");
    const runRefactorButton = document.getElementById("run-refactor");
    const refactorStatus = document.getElementById("refactor-status");
    const outputKicker = document.getElementById("output-kicker");
    const outputTitle = document.getElementById("output-title");
    const outputFileBase = document.getElementById("output-file-base");
    const pairOutput = document.getElementById("pair-output");
    const exportOutput = document.getElementById("export-output");
    const indicatorFilename = document.getElementById("indicator-filename");
    const tradingFilename = document.getElementById("trading-filename");
    const exportM1Filename = document.getElementById("export-m1-filename");
    const exportD1Filename = document.getElementById("export-d1-filename");
    const exportDailyAnchorFilename = document.getElementById("export-daily-anchor-filename");
    const indicatorOutput = document.getElementById("indicator-output");
    const tradingOutput = document.getElementById("trading-output");
    const exportM1Output = document.getElementById("export-m1-output");
    const exportD1Output = document.getElementById("export-d1-output");
    const exportDailyAnchorOutput = document.getElementById("export-daily-anchor-output");
    let newIndex = -1;
    let fixedBestId = null;

    function setText(el, value) { if (el) { el.textContent = String(value ?? ""); } }
    function setVisible(el, visible) {
        if (el) {
            el.hidden = !visible;
            el.style.display = visible ? "" : "none";
        }
    }
    function formatPercent(v) { return Number(v).toFixed(1) + "%"; }
    function formatSignedPercent(v) { const n = Number(v); return (n > 0 ? "+" : "") + n.toFixed(1) + "%"; }
    function hasMetricValue(v) {
        return !(v === null || v === undefined || v === "");
    }
    function formatMetricPercent(v) { return hasMetricValue(v) && Number.isFinite(Number(v)) ? Number(v).toFixed(1) + "%" : "待驗證"; }
    function formatMetricCount(v) { return hasMetricValue(v) && Number.isFinite(Number(v)) ? String(Math.round(Number(v))) : "待驗證"; }
    function readStore() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; } }
    function writeStore(value) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { } }
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
    function stamp() {
        const d = new Date();
        return String(d.getFullYear() - 1911).padStart(3, "0") + pad2(d.getMonth() + 1) + pad2(d.getDate()) + pad2(d.getHours()) + pad2(d.getMinutes());
    }
    function fileBase(totalReturn, withReturn) {
        const s = stamp();
        if (!withReturn) { return s; }
        return s + String(Math.max(0, Math.round(Number(totalReturn) || 0))).padStart(3, "0");
    }
    function setActiveMode(mode) {
        modeButtons.forEach(function (btn) { btn.classList.toggle("is-active", btn.dataset.mode === mode); });
    }
    function inputBlock(lines) { return "input:\n    " + lines.join(",\n    ") + ";"; }
    function varBlock(lines) { return "var:\n    " + lines.join(",\n    ") + ";"; }

    function buildPair(preset) {
        const p = PROFILES[preset.theme] || PROFILES.breakout;
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

    function showPair(kicker, title, baseName, indicator, trading) {
        setVisible(pairOutput, true);
        setVisible(exportOutput, false);
        setText(outputKicker, kicker);
        setText(outputTitle, title);
        setText(outputFileBase, "策略名：" + baseName);
        setText(indicatorFilename, baseName + "_indicator.xs");
        setText(tradingFilename, baseName + "_trading.xs");
        indicatorOutput.value = indicator;
        tradingOutput.value = trading;
    }

    function showExport(baseName) {
        setVisible(pairOutput, false);
        setVisible(exportOutput, true);
        setText(outputKicker, "資料匯出");
        setText(outputTitle, "匯出 XQ 資料腳本");
        setText(outputFileBase, "策略名：" + baseName);
        setText(exportM1Filename, baseName + "_M1.xs");
        setText(exportD1Filename, baseName + "_D1.xs");
        setText(exportDailyAnchorFilename, baseName + "_DA.xs");
        exportM1Output.value = EXPORT_SCRIPTS.m1;
        exportD1Output.value = EXPORT_SCRIPTS.d1;
        exportDailyAnchorOutput.value = EXPORT_SCRIPTS.da;
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
        const totalReturn = store?.verification?.metrics?.totalReturn;
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

    function renderBestMetrics(metrics) {
        const safeMetrics = metrics || DEFAULT_BEST_METRICS;
        setText(metricTotalReturn, formatMetricPercent(safeMetrics.totalReturn));
        setText(metricMaxDrawdown, formatMetricPercent(safeMetrics.maxDrawdown));
        setText(metricTradeCount, formatMetricCount(safeMetrics.tradeCount));
        renderYears(safeMetrics.annualReturns);
    }

    function resetComparePanel() {
        setText(compareStatusValue, "待驗證");
        setText(compareSimCount, "-");
        setText(compareXqCount, "-");
        setText(comparePrefixCount, "-");
        setText(compareParamNote, "尚未上傳完整資料與 XQ TXT，還不能驗證。DA 會由 D1 自動推導。");
        setText(compareFirstMismatch, "尚未比對。");
        setText(compareNote, "目前首頁只會把已完成比對的結果視為可信。");
    }

    function renderComparePanel(verification) {
        if (!verification) {
            resetComparePanel();
            return;
        }
        setText(compareStatusValue, verification.statusLabel || "待驗證");
        setText(compareSimCount, verification.compare ? verification.compare.simCount : "-");
        setText(compareXqCount, verification.compare ? verification.compare.xqCount : "-");
        setText(comparePrefixCount, verification.compare ? verification.compare.samePrefixCount : "-");
        setText(compareParamNote, verification.paramNote || "未提供 XQ 參數列。");
        setText(compareFirstMismatch, verification.firstMismatchText || "完全吻合。");
        setText(compareNote, verification.note || "");
    }

    function applyCompareSettings(settings) {
        const safe = settings || DEFAULT_COMPARE_SETTINGS;
        if (bestCapitalInput) { bestCapitalInput.value = String(Math.round(toNumber(safe.capital, DEFAULT_COMPARE_SETTINGS.capital))); }
        if (bestPointValueInput) { bestPointValueInput.value = String(Math.round(toNumber(safe.pointValue, DEFAULT_COMPARE_SETTINGS.pointValue))); }
        if (bestSideCostInput) { bestSideCostInput.value = String(toNumber(safe.sideCostPoints, DEFAULT_COMPARE_SETTINGS.sideCostPoints)); }
    }

    function readCompareSettings() {
        return {
            capital: Math.max(1, readNumericInput(bestCapitalInput, DEFAULT_COMPARE_SETTINGS.capital)),
            pointValue: Math.max(1, readNumericInput(bestPointValueInput, DEFAULT_COMPARE_SETTINGS.pointValue)),
            sideCostPoints: Math.max(0, readNumericInput(bestSideCostInput, DEFAULT_COMPARE_SETTINGS.sideCostPoints)),
        };
    }

    function bestMetricsFromStore(saved) {
        return saved && saved.verification && saved.verification.metrics && saved.verification.statusLabel === "已驗證"
            ? saved.verification.metrics
            : DEFAULT_BEST_METRICS;
    }

    function showBestMode() {
        const saved = readStore();
        const pair = buildPair(BEST_PRESET);
        const bestId = getBestId();
        const nextIndicator = applyIdentity(saved?.indicator || pair.indicator, bestId, "最佳報酬配對");
        const nextTrading = applyIdentity(saved?.trading || pair.trading, bestId, "最佳報酬配對");
        setActiveMode("best");
        setVisible(bestMetricsPanel, true);
        setVisible(bestUploadPanel, true);
        setVisible(bestComparePanel, true);
        setVisible(refactorUploadPanel, false);
        renderBestMetrics(bestMetricsFromStore(saved));
        renderComparePanel(saved?.verification || null);
        applyCompareSettings(saved?.verification?.settings || DEFAULT_COMPARE_SETTINGS);
        showPair("歷史最佳", "最佳報酬配對", bestId, nextIndicator, nextTrading);
        setText(
            bestUploadStatus,
            saved?.lastStatus
                ? saved.lastStatus
                : saved?.verification
                ? ("最後驗證：" + saved.verification.verifiedAt)
                : (saved?.updatedAt ? "已更新策略版本，但尚未完成比對。" : "目前這些數值還沒有經過 M1 / D1 與 XQ TXT 驗證。DA 會由 D1 自動推導。")
        );
    }

    function showNewMode() {
        newIndex = (newIndex + 1) % NEW_PRESETS.length;
        const preset = NEW_PRESETS[newIndex];
        const pair = buildPair(preset);
        setActiveMode("new");
        setVisible(bestMetricsPanel, false);
        setVisible(bestUploadPanel, false);
        setVisible(bestComparePanel, false);
        setVisible(refactorUploadPanel, false);
        showPair("已生成新策略", "新策略配對", fileBase(NEW_RETURNS[newIndex], true), pair.indicator, pair.trading);
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

    async function readUploadedFile(input) {
        const file = input.files && input.files[0];
        if (!file) { return null; }
        return { name: file.name, text: await file.text() };
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
        if (!rows.length) {
            throw new Error("M1 資料庫格式不正確，或檔案沒有可用資料。");
        }
        return rows;
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
        if (!rows.length) {
            throw new Error("D1 資料庫格式不正確，或檔案沒有可用資料。");
        }
        return rows;
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
        if (!rows.length) {
            throw new Error("DA 資料庫格式不正確，或檔案沒有可用資料。");
        }
        return rows;
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
        const xqText = parseXqTradeText(input.xqText);
        const simulation = simulateBestStrategy({ m1Bars: m1Bars, d1Rows: d1Rows, daRows: daRows }, params);
        const compare = compareEventLists(xqText.events, simulation.events);
        const paramCompare = compareHeaderParams(xqText.headerParams, params);
        const tradePack = buildTradesFromEvents(simulation.events, input.settings);
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

    async function updateBestHistory() {
        const indicatorFile = await readUploadedFile(bestIndicatorUpload);
        const tradingFile = await readUploadedFile(bestTradingUpload);
        const m1File = await readUploadedFile(bestM1Upload);
        const d1File = await readUploadedFile(bestD1Upload);
        const xqTxtFile = await readUploadedFile(bestXqTxtUpload);

        if (!indicatorFile && !tradingFile && !m1File && !d1File && !xqTxtFile) {
            setText(bestUploadStatus, "請先上傳策略、資料庫或 XQ TXT。");
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

        if (m1File || d1File || xqTxtFile) {
            const missing = [];
            if (!m1File) { missing.push("M1"); }
            if (!d1File) { missing.push("D1"); }
            if (!xqTxtFile) { missing.push("XQ TXT"); }

            if (missing.length) {
                statusMessage = "若要回放比對，還缺少：" + missing.join("、") + "。";
            } else {
                try {
                    verification = buildVerificationResult({
                        indicatorCode: nextIndicator,
                        tradingCode: nextTrading,
                        m1Text: m1File.text,
                        d1Text: d1File.text,
                        xqText: xqTxtFile.text,
                        settings: settings,
                    });
                    statusMessage = verification.statusLabel === "已驗證"
                        ? "已完成回放與 XQ TXT 比對，這批歷史最佳數值可視為可信。"
                        : "已完成回放，但本頁結果與 XQ TXT 還有差異，請先檢查後再採信。";
                } catch (error) {
                    verification = null;
                    statusMessage = error && error.message ? error.message : "比對失敗，請檢查上傳檔案格式。";
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

    applyBestUploadButton.addEventListener("click", function () { updateBestHistory(); });
    runRefactorButton.addEventListener("click", function () { runRefactor(); });
    bindCopy("copy-indicator", function () { return indicatorOutput.value; });
    bindCopy("copy-trading", function () { return tradingOutput.value; });
    bindCopy("copy-export-m1", function () { return exportM1Output.value; });
    bindCopy("copy-export-d1", function () { return exportD1Output.value; });
    bindCopy("copy-export-daily-anchor", function () { return exportDailyAnchorOutput.value; });

    showBestMode();
})();
