//====================== D1 Export ======================
// 用途：在 XQ 日線圖輸出已完成的 D1 OHLCV，供外部資料庫匯入。

input:
    SysHistDBars(5000),
    TxtPath("C:\\XQ\\data\\[ScriptName]_D1.txt");

var:
    headerWritten(false),
    lastPrintBar(-9999),
    outStr(""),
    ts14("");

if BarFreq <> "Day" then
    RaiseRunTimeError("本腳本僅支援日線");

SetBackBar(2);
SetTotalBar(SysHistDBars);

if not headerWritten and TxtPath <> "" then begin
    outStr = "ts14,open,high,low,close,volume";
    Print(File(TxtPath), outStr);
    headerWritten = true;
end;

if CurrentBar > 1 and (lastPrintBar <> CurrentBar) then begin
    ts14 = NumToStr(Date[1], 0) + "000000";
    outStr = ts14
           + "," + NumToStr(Open[1], 0)
           + "," + NumToStr(High[1], 0)
           + "," + NumToStr(Low[1], 0)
           + "," + NumToStr(Close[1], 0)
           + "," + NumToStr(Volume[1], 0);
    Print(File(TxtPath), outStr);
    lastPrintBar = CurrentBar;
end;

Plot1(Close[1], "D1Close");
