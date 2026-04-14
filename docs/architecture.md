# 架構說明：核心邏輯層 + 安全層 + 輸出層

## 分層原則

- 核心邏輯層：進出場邏輯與狀態機（指標版/交易版共享）。
- 安全層：環境檢查、資料可用性檢查、單 Bar 單次執行控制（共享）。
- 輸出層：唯一允許差異（Plot/Print vs SetPosition）。

## C1~C6 固定責任

### C1 參數

- 交易時段
- 風險參數（ATR、停損停利）
- warmup bars
- 歷史需求（SysHistDBars / SysHistMBars）

### C2 指標計算

- 僅在換日時更新日線 freeze 指標。
- 盤中禁止重新計算日線級指標。
- 分鐘級訊號引用 `[1]` 或更早。

### C3 進場條件

- 只在 `dataReady=true` 且本 bar 未執行下判斷。
- 僅讀完成 K 資料。

### C4 出場條件

- 出場優先於進場。
- 禁止同 Bar 反手。
- 日當沖時間到強制平倉。

### C5 狀態更新

- 當 bar 執行鎖（single-exec lock）。
- 訊號一次性消耗（no accumulation）。
- 更新 day init / freeze timestamp。

### C6 輸出

- 指標版：Plot、文字輸出。
- 交易版：SetPosition。

