//====================== M1 Export ======================
// 用途：在 XQ 1 分鐘圖輸出已完成的 M1 OHLCV，供外部資料庫匯入。

input:
    SysHistMBars(60000),
    TxtPath("C:\\XQ\\data\\[ScriptName]_M1.txt");

var:
    headerWritten(false),
    lastPrintBar(-9999),
    outStr(""),
    ts14("");

if barfreq <> "Min" then
    raiseRunTimeError("本腳本僅支援分鐘線");

if BarFreq <> "Min" or BarInterval <> 1 or BarAdjusted then
    RaiseRunTimeError("本腳本僅支援非還原 1 分鐘線");

SetBackBar(2);
SetTotalBar(SysHistMBars);

if not headerWritten and TxtPath <> "" then begin
    outStr = "ts14,open,high,low,close,volume";
    Print(File(TxtPath), outStr);
    headerWritten = true;
end;

if CurrentBar > 1 and (lastPrintBar <> CurrentBar) then begin
    ts14 = NumToStr(Date[1], 0) + RightStr("000000" + NumToStr(Time[1], 0), 6);
    outStr = ts14
           + "," + NumToStr(Open[1], 0)
           + "," + NumToStr(High[1], 0)
           + "," + NumToStr(Low[1], 0)
           + "," + NumToStr(Close[1], 0)
           + "," + NumToStr(Volume[1], 0);
    Print(File(TxtPath), outStr);
    lastPrintBar = CurrentBar;
end;

Plot1(Close[1], "M1Close");
