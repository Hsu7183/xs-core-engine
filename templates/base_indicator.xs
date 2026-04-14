// xs-core-engine base indicator template (V2)
// 規範：台指期 1 分 K、Open 觸發、前一根資料判斷、單 Bar 單次執行

//====================== C1.參數 ======================
input:
    DonLen(100),
    ATRLen(14),
    ATRStopK(1.2),
    ATRTakeProfitK(0.8),
    CoolDownBars(0),
    ForceFlatTime(134000),
    HeaderOnce(1),
    OutputPath("C:\\XQ\\data\\[ScriptName].txt"),
    SysHistDBars(500),
    SysHistMBars(20000);

//====================== C2.變數 ======================
var:
    dataReady(false),
    dayInitDate(0),
    dayRefDate(0),

    yH(0), yL(0), yC(0),

    donHi(0),
    donLo(0),
    trVal(0),
    atrV(0),
    atrV_1(0),

    posFlag(0),
    cost(0),
    entryATR(0),

    lastMarkBar(-9999),
    lastExitBar(-9999),

    LongEntrySig(false),
    LongExitTrig(false),
    ForceExitTrig(false),

    headerPrinted(false),
    ts14(""),
    outStr("");

//====================== C3.環境檢查 ======================
if barfreq <> "Min" then
    raiseRunTimeError("本腳本僅支援分鐘線");

if BarFreq <> "Min" or BarInterval <> 1 or BarAdjusted then
    RaiseRunTimeError("只允許1分鐘非還原K");

//====================== C4.資料準備 ======================
SetBackBar(2);
SetBackBar(SysHistDBars, "D");
SetTotalBar(SysHistMBars);

dayRefDate = 0;
if CheckField("High", "D") and CheckField("Low", "D") and CheckField("Close", "D") then
    dayRefDate = GetFieldDate("Close", "D");

//====================== C5.日K定錨 / 指標計算 ======================
if (Date <> dayInitDate) and (dayRefDate = Date) then begin
    yH = GetField("High", "D")[1];
    yL = GetField("Low", "D")[1];
    yC = GetField("Close", "D")[1];
    dayInitDate = Date;
end;

donHi = Highest(High, DonLen);
donLo = Lowest(Low, DonLen);

trVal = MaxList(
    High - Low,
    AbsValue(High - Close[1]),
    AbsValue(Low - Close[1])
);
atrV = XAverage(trVal, ATRLen);
atrV_1 = atrV[1];

//====================== C5-1.資料完整性 ======================
dataReady = (dayInitDate = Date)
            and (CurrentBar > DonLen + ATRLen + 20)
            and (atrV_1 > 0)
            and (dayRefDate = Date);

//====================== C5-2.交易邏輯（前一根資料） ======================
LongEntrySig = false;
LongExitTrig = false;
ForceExitTrig = false;

if dataReady and (lastMarkBar <> CurrentBar) then begin

    // 進場：突破確認型（使用前一根 High[1] 對前二根結構 donHi[2]）
    if (posFlag = 0) and (CurrentBar > lastExitBar + CoolDownBars) then begin
        if High[1] >= donHi[2] then
            LongEntrySig = true;
    end;

    // 出場：價格觸發型一律用前一根 High[1]/Low[1]
    if posFlag = 1 then begin
        if (Low[1] <= cost - entryATR * ATRStopK) or
           (High[1] >= cost + entryATR * ATRTakeProfitK) then
            LongExitTrig = true;
    end;

    // 強制平倉：當根 Open 立即執行
    if (posFlag = 1) and (Time >= ForceFlatTime) then
        ForceExitTrig = true;

end;

//====================== C5-3.狀態更新（出場優先） ======================
if dataReady and (lastMarkBar <> CurrentBar) then begin

    if LongExitTrig or ForceExitTrig then begin
        posFlag = 0;
        cost = 0;
        entryATR = 0;
        lastMarkBar = CurrentBar;
        lastExitBar = CurrentBar;
    end
    else if LongEntrySig then begin
        posFlag = 1;
        cost = Open;
        entryATR = atrV_1; // ATR freeze per trade
        lastMarkBar = CurrentBar;
    end;

end;

//====================== C6.指標版輸出 ======================
if HeaderOnce = 1 and (not headerPrinted) then begin
    outStr = "DonLen=" + NumToStr(DonLen,0)
           + ",ATRLen=" + NumToStr(ATRLen,0)
           + ",ATRStopK=" + NumToStr(ATRStopK,2)
           + ",ATRTakeProfitK=" + NumToStr(ATRTakeProfitK,2)
           + ",ForceFlatTime=" + NumToStr(ForceFlatTime,0);
    Print(File(OutputPath), outStr);
    headerPrinted = true;
end;

ts14 = NumToStr(Date, 0) + RightStr("000000" + NumToStr(Time, 0), 6);

Plot1(IFF(LongEntrySig, Open, 0), "新買");
Plot2(IFF(LongExitTrig or ForceExitTrig, Open, 0), "平賣");

if LongEntrySig then begin
    outStr = ts14 + " " + NumToStr(Open, 0) + " 新買";
    Print(File(OutputPath), outStr);
end;

if LongExitTrig then begin
    outStr = ts14 + " " + NumToStr(Open, 0) + " 平賣";
    Print(File(OutputPath), outStr);
end;

if ForceExitTrig then begin
    outStr = ts14 + " " + NumToStr(Open, 0) + " 強制平倉";
    Print(File(OutputPath), outStr);
end;
