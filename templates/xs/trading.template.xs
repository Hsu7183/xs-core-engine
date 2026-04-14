{*
    xs-core-engine trading template
    C1-C5 must stay byte-identical to the indicator template.
*}

Inputs:
    WarmupBars(240),
    SysHistDBars(60),
    SysHistMBars(2000),
    TxtPath(""),
    EmitHeader(true);

Vars:
    dayInitDate(0),
    dayRefDate(0),
    prevDayClose(0),
    prevDayHigh(0),
    prevDayLow(0),
    atrFrozen(0),
    dailyAnchorReady(false),
    dailyFieldReady(false),
    historyReady(false),
    dayInitOk(false),
    crossFrequencyReady(false),
    indicatorsReady(false),
    dataReady(false),
    currentDecisionKey(0),
    lastDecisionKey(-1),
    longSignal(false),
    shortSignal(false),
    exitLongSignal(false),
    exitShortSignal(false),
    desiredPosition(0),
    nextPosition(0),
    outAction(""),
    outStr(""),
    headerWritten(false);

SetBackBar(2);
SetBackBar(SysHistDBars, "D");
SetTotalBar(SysHistMBars);

if BarFreq <> "Min" or BarInterval <> 1 or BarAdjusted then
    RaiseRunTimeError("本腳本僅支援非還原 1 分鐘線");

if Date <> dayInitDate then
begin
    dayInitOk = false;
    dailyAnchorReady = false;
    dailyFieldReady = CheckField("Close", "D");

    if dailyFieldReady then
    begin
        dayRefDate = GetFieldDate("Close", "D");

        if dayRefDate = Date then
        begin
            prevDayClose = GetField("Close", "D")[1];
            prevDayHigh = GetField("High", "D")[1];
            prevDayLow = GetField("Low", "D")[1];

            atrFrozen = 0;
            dailyAnchorReady = true;
            dayInitDate = Date;
            dayInitOk = true;
        end;
    end;
end;

// C1 Parameters
// Place strategy-specific input expansion here. Keep this section identical in both outputs.

historyReady = CurrentBar > WarmupBars;
dailyFieldReady = CheckField("Close", "D");
crossFrequencyReady = dailyFieldReady and dayRefDate = Date;
indicatorsReady = dailyAnchorReady;
dataReady = historyReady and dayInitOk and dayInitDate = Date and dailyFieldReady and crossFrequencyReady and indicatorsReady;

if dataReady then
begin
    currentDecisionKey = Date * 10000 + Time;

    if currentDecisionKey <> lastDecisionKey then
    begin
        lastDecisionKey = currentDecisionKey;
        longSignal = false;
        shortSignal = false;
        exitLongSignal = false;
        exitShortSignal = false;
        outAction = "";
        nextPosition = desiredPosition;

        // C2 Indicator Calculation
        // Compute minute-level indicators here using [1] or older data only.
        // Keep all daily anchors frozen after day initialization.

        // C3 Entry Conditions
        // Evaluate entry conditions here using [1] or older data only.
        // Do not allow signal carry across bars.

        // C4 Exit Conditions
        // Evaluate exit conditions before entry execution.
        // Do not use current-bar Close, High, Low, or Volume.

        // C5 State Update
        if desiredPosition = 1 and exitLongSignal then
        begin
            nextPosition = 0;
            outAction = "EXIT_LONG";
        end
        else if desiredPosition = -1 and exitShortSignal then
        begin
            nextPosition = 0;
            outAction = "EXIT_SHORT";
        end
        else if desiredPosition = 0 then
        begin
            if longSignal then
            begin
                nextPosition = 1;
                outAction = "ENTER_LONG";
            end
            else if shortSignal then
            begin
                nextPosition = -1;
                outAction = "ENTER_SHORT";
            end;
        end;

        desiredPosition = nextPosition;
    end;
end;

// C6 Output
if EmitHeader and not headerWritten and TxtPath <> "" then
begin
    Print(File(TxtPath), "engine=xs-core-engine,layer=trading,mode=spec-first");
    headerWritten = true;
end;

if outAction <> "" and TxtPath <> "" then
begin
    outStr = "YYYYMMDDhhmmss " + NumToStr(Open, 2) + " " + outAction;
    Print(File(TxtPath), outStr);
end;

if desiredPosition <> Position then
    SetPosition(desiredPosition, MARKET);
