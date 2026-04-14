//====================== C1.參數 ======================
input:
    WarmupBars(240),
    CalcBeginTime(084500),
    EntryBeginTime(084800),
    ForceFlatTime(134300),
    CoolDownBars(0),
    MaxEntriesPerDay(5),

    EMAFastLen(2),
    EMAMidLen(3),
    DonLen(20),
    ATRLen(14),

    ATRStopK(1.2),
    ATRTakeProfitK(0.8),

    SysHistDBars(500),
    SysHistMBars(20000),
    TxtPath("C:\\XQ\\data\\[ScriptName].txt");

//====================== C2.基礎資料與指標計算 ======================
var:
    calcSession(false),
    entrySession(false),
    manageSession(false),
    historyReady(false),
    dailyFieldReady(false),
    crossFrequencyReady(false),
    dayInitOk(false),
    indicatorsReady(false),
    dataReady(false),
    headerWritten(false),

    dayInitDate(0),
    dayRefDate(0),
    yH(0),
    yL(0),
    yC(0),
    dayRange(0),
    PP(0),
    R1(0),
    S1(0),
    R2(0),
    S2(0),

    emaFast(0),
    emaFast_1(0),
    emaMid(0),
    emaMid_1(0),
    trVal(0),
    ATRv(0),
    ATRv_1(0),
    tpPrice(0),
    cumPV(0),
    cumVol(0),
    vwap(0),
    vwap_1(0),
    donHi(0),
    donLo(0),
    donHi_1(0),
    donHi_2(0),
    donLo_1(0),
    donLo_2(0),

    posFlag(0),
    cost(0),
    entryATR(0),
    lastMarkBar(-9999),
    lastExitBar(-9999),
    entriesToday(0),

    LongReady(false),
    ShortReady(false),
    ExitTrig(false),
    ForceExitTrig(false),
    currentAction(""),
    outStr(""),
    ts14("");

if barfreq <> "Min" then
    raiseRunTimeError("本腳本僅支援分鐘線");

if BarFreq <> "Min" or BarInterval <> 1 or BarAdjusted then
    RaiseRunTimeError("本腳本僅支援非還原 1 分鐘線");

SetBackBar(2);
SetBackBar(SysHistDBars, "D");
SetTotalBar(SysHistMBars);

calcSession = Time >= CalcBeginTime and Time <= ForceFlatTime;
entrySession = Time >= EntryBeginTime and Time < ForceFlatTime;
manageSession = Time >= EntryBeginTime and Time <= ForceFlatTime;

if Date <> Date[1] then begin
    cumPV = 0;
    cumVol = 0;
    vwap = 0;
    entriesToday = 0;
    dayInitOk = false;
    dayInitDate = 0;
end;

dailyFieldReady = CheckField("High","D") and CheckField("Low","D") and CheckField("Close","D");
dayRefDate = 0;

if dailyFieldReady then
    dayRefDate = GetFieldDate("Close","D");

if (Date <> dayInitDate) and (dayRefDate = Date) then begin
    yH = GetField("High","D")[1];
    yL = GetField("Low","D")[1];
    yC = GetField("Close","D")[1];

    dayRange = yH - yL;
    PP = (yH + yL + yC) / 3;
    R1 = 2 * PP - yL;
    S1 = 2 * PP - yH;
    R2 = PP + (yH - yL);
    S2 = PP - (yH - yL);

    dayInitDate = Date;
    dayInitOk = (yH > 0) and (yL > 0) and (yC > 0);
end;

emaFast = XAverage(Close, EMAFastLen);
emaFast_1 = emaFast[1];
emaMid = XAverage(Close, EMAMidLen);
emaMid_1 = emaMid[1];

trVal = MaxList(
    High - Low,
    AbsValue(High - Close[1]),
    AbsValue(Low - Close[1])
);
ATRv = XAverage(trVal, ATRLen);
ATRv_1 = ATRv[1];

if Date <> Date[1] then begin
    cumPV = 0;
    cumVol = 0;
end;

tpPrice = (High + Low + Close) / 3;
cumPV = cumPV + tpPrice * Volume;
cumVol = cumVol + Volume;

if cumVol > 0 then
    vwap = cumPV / cumVol
else
    vwap = 0;

vwap_1 = vwap[1];

donHi = Highest(High, DonLen);
donLo = Lowest(Low, DonLen);
donHi_1 = donHi[1];
donHi_2 = donHi[2];
donLo_1 = donLo[1];
donLo_2 = donLo[2];

historyReady = CurrentBar > WarmupBars;
crossFrequencyReady = dailyFieldReady and (dayRefDate = Date);
indicatorsReady = (emaFast_1 > 0) and (emaMid_1 > 0) and (ATRv_1 > 0) and (donHi_2 > 0) and (donLo_2 > 0) and (vwap_1 >= 0);
dataReady = calcSession and historyReady and dayInitOk and (dayInitDate = Date) and crossFrequencyReady and indicatorsReady;

//====================== C3.進場條件 ======================
LongReady = false;
ShortReady = false;

if dataReady and entrySession and (lastMarkBar <> CurrentBar) then begin
    // 多方價格確認型突破範例：
    // if High[1] >= donHi_2 then
    //     LongReady = true;

    // 空方價格確認型突破範例：
    // if Low[1] <= donLo_2 then
    //     ShortReady = true;
end;

//====================== C4.出場條件 ======================
ExitTrig = false;
ForceExitTrig = false;

if dataReady and manageSession and (lastMarkBar <> CurrentBar) then begin
    if posFlag = 1 then begin
        // 價格觸發型出場範例：
        // if Low[1] <= cost - entryATR * ATRStopK or
        //    High[1] >= cost + entryATR * ATRTakeProfitK then
        //     ExitTrig = true;
    end;

    if posFlag = -1 then begin
        // 價格觸發型出場範例：
        // if High[1] >= cost + entryATR * ATRStopK or
        //    Low[1] <= cost - entryATR * ATRTakeProfitK then
        //     ExitTrig = true;
    end;

    if posFlag <> 0 and Time >= ForceFlatTime then
        ForceExitTrig = true;
end;

//====================== C5.狀態更新 ======================
currentAction = "";

if dataReady and manageSession and (lastMarkBar <> CurrentBar) then begin
    if posFlag <> 0 and (ExitTrig or ForceExitTrig) then begin
        if ForceExitTrig then
            currentAction = "強制平倉"
        else if posFlag = 1 then
            currentAction = "平賣"
        else
            currentAction = "平買";

        posFlag = 0;
        cost = 0;
        entryATR = 0;
        lastMarkBar = CurrentBar;
        lastExitBar = CurrentBar;
    end
    else if entrySession and (entriesToday < MaxEntriesPerDay) and (CurrentBar > lastExitBar + CoolDownBars) then begin
        if LongReady then begin
            posFlag = 1;
            cost = Open;
            entryATR = ATRv_1;
            entriesToday = entriesToday + 1;
            lastMarkBar = CurrentBar;
            currentAction = "新買";
        end
        else if ShortReady then begin
            posFlag = -1;
            cost = Open;
            entryATR = ATRv_1;
            entriesToday = entriesToday + 1;
            lastMarkBar = CurrentBar;
            currentAction = "新賣";
        end;
    end;
end;

//====================== C6.交易版輸出 ======================
// if not headerWritten and TxtPath <> "" then begin
//     outStr = "CalcBeginTime=" + NumToStr(CalcBeginTime, 0)
//            + ",EntryBeginTime=" + NumToStr(EntryBeginTime, 0)
//            + ",ForceFlatTime=" + NumToStr(ForceFlatTime, 0)
//            + ",WarmupBars=" + NumToStr(WarmupBars, 0)
//            + ",EMAFastLen=" + NumToStr(EMAFastLen, 0)
//            + ",EMAMidLen=" + NumToStr(EMAMidLen, 0)
//            + ",DonLen=" + NumToStr(DonLen, 0)
//            + ",ATRLen=" + NumToStr(ATRLen, 0);
//     Print(File(TxtPath), outStr);
//     headerWritten = true;
// end;

// ts14 = NumToStr(Date, 0) + RightStr("000000" + NumToStr(Time, 0), 6);

// Plot1(IFF(currentAction = "新買", Open, 0), "新買");
// Plot2(IFF(currentAction = "新賣", Open, 0), "新賣");
// Plot3(IFF((currentAction = "平賣") or (currentAction = "平買") or (currentAction = "強制平倉"), Open, 0), "出場");

// if currentAction <> "" and TxtPath <> "" then begin
//     outStr = ts14 + " " + NumToStr(Open, 0) + " " + currentAction;
//     Print(File(TxtPath), outStr);
// end;

if lastMarkBar = CurrentBar then begin
    if (currentAction = "平賣") or (currentAction = "平買") or (currentAction = "強制平倉") then begin
        if Position <> 0 then
            SetPosition(0, MARKET);
    end
    else if currentAction = "新買" then begin
        if Position <> 1 then
            SetPosition(1, MARKET);
    end
    else if currentAction = "新賣" then begin
        if Position <> -1 then
            SetPosition(-1, MARKET);
    end;
end;
