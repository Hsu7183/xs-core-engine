//====================== Daily Anchor Export ======================
// 用途：在 XQ 1 分鐘圖輸出日線衍生錨點資料，供策略資料庫匯入。

input:
    SysHistDBars(5000),
    SysHistMBars(60000),
    TxtPath("C:\\XQ\\data\\[ScriptName]_DailyAnchor.txt");

var:
    headerWritten(false),
    dailyFieldReady(false),
    dayRefDate(0),
    lastExportDate(0),
    yH(0),
    yL(0),
    yC(0),
    dayRange(0),
    PP(0),
    R1(0),
    S1(0),
    R2(0),
    S2(0),
    outStr(""),
    ts14("");

if barfreq <> "Min" then
    raiseRunTimeError("本腳本僅支援分鐘線");

if BarFreq <> "Min" or BarInterval <> 1 or BarAdjusted then
    RaiseRunTimeError("本腳本僅支援非還原 1 分鐘線");

SetBackBar(2);
SetBackBar(SysHistDBars, "D");
SetTotalBar(SysHistMBars);

dailyFieldReady =
    CheckField("High","D")
    and CheckField("Low","D")
    and CheckField("Close","D")
    and CheckField("Open","D");

dayRefDate = 0;
if dailyFieldReady then
    dayRefDate = GetFieldDate("Close","D");

if not headerWritten and TxtPath <> "" then begin
    outStr = "ts14,prev_high,prev_low,prev_close,day_range,pp,r1,s1,r2,s2";
    Print(File(TxtPath), outStr);
    headerWritten = true;
end;

if dailyFieldReady and (dayRefDate = Date) and (Date <> lastExportDate) then begin
    yH = GetField("High","D")[1];
    yL = GetField("Low","D")[1];
    yC = GetField("Close","D")[1];

    if (yH > 0) and (yL > 0) and (yC > 0) then begin
        dayRange = yH - yL;
        PP = (yH + yL + yC) / 3;
        R1 = 2 * PP - yL;
        S1 = 2 * PP - yH;
        R2 = PP + (yH - yL);
        S2 = PP - (yH - yL);

        ts14 = NumToStr(Date, 0) + RightStr("000000" + NumToStr(Time, 0), 6);
        outStr = ts14
               + "," + NumToStr(yH, 0)
               + "," + NumToStr(yL, 0)
               + "," + NumToStr(yC, 0)
               + "," + NumToStr(dayRange, 0)
               + "," + NumToStr(PP, 0)
               + "," + NumToStr(R1, 0)
               + "," + NumToStr(S1, 0)
               + "," + NumToStr(R2, 0)
               + "," + NumToStr(S2, 0);
        Print(File(TxtPath), outStr);
        lastExportDate = Date;
    end;
end;

Plot1(PP, "PP");
