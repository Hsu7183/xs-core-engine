# xs-core-engine 規格書（Specification-first）

## 1. 核心目標

1. 指標版 / 交易版輸出除 C6 外完全一致。
2. 嚴格避免：
   - 未來值
   - 浮動值
   - 同 Bar 重複執行
   - 訊號累積
3. 確保：
   - 可回測
   - 可實倉
   - 可定錨（歷史重算一致）
4. 杜絕：
   - `(1401) 資料不足`
   - 頻率錯誤
   - 欄位未初始化

## 2. 系統硬規則

- 商品：台指期
- 週期：1 分 K
- 型態：日當沖
- 語言：XScript / XS

## 3. 執行環境強制檢查

```xs
if BarFreq <> "Min" or BarInterval <> 1 or BarAdjusted then
    RaiseRunTimeError("本腳本僅支援非還原 1 分鐘線");
```

## 4. 交易模型（唯一原則）

- 只用已完成資料，在當根 Open 判斷並執行。
- 可引用資料僅限 `[1]` 或更早。
- 禁止使用當根 `Close/High/Low/Volume`。
- 單 Bar 單次執行。
- 出場優先於進場。
- 禁止同 Bar 反手。
- 訊號不可累積/遞延。

## 5. dataReady 安全機制（防 1401）

策略執行前必須同時滿足：

1. `CurrentBar > warmupBars`
2. 前日資料初始化成功
3. 日線欄位可讀（`CheckField`）
4. `dayInitDate = Date`
5. 跨頻率資料完整
6. 所有指標值可安全引用

若任一不成立：不得做進出場判斷。

## 6. (1401) 不合格定義

凡策略在執行時讀取未存在或未初始化資料，導致 XQ 回報 `(1401)`，視為不合格。

## 7. 跨頻率資料規範

使用：

```xs
CheckField("Close","D")
GetFieldDate("Close","D")
```

僅當：

```xs
dayRefDate = Date
```

時，才允許：

```xs
GetField("Close","D")[1]
```

## 8. 歷史資料讀取規範

```xs
SetBackBar(2);
SetBackBar(SysHistDBars, "D");
SetTotalBar(SysHistMBars);
```

且：

- `SysHistDBars >= 最大日線需求`
- `SysHistMBars >= 分鐘線需求`

## 9. 日線指標定錨規範

MA / EMA / Donchian / ATR / CDP / NH / NL：

- 只在換日時計算一次
- 當日盤中只讀取 freeze 結果
- 不可盤中重新計算

## 10. 指標版 / 交易版一致性

C1~C5 必須完全一致：

- 參數
- 環境檢查
- 資料讀取
- 日線定錨
- 進出場條件
- 狀態機

僅 C6 可不同：

- 指標版：`Plot`、`Print(File(...), outStr)`
- 交易版：`SetPosition(1/0/-1, MARKET)`

## 11. Position / Filled

- `Position`：策略目標部位
- `Filled`：帳戶實際成交部位
- 不可混用

## 12. TXT 輸出規範

- 第一行只輸出一次：`key=value,key=value,...`
- 後續每行：`YYYYMMDDhhmmss 價格 動作`
- 強制用法：

```xs
outStr = "...";
Print(File(path), outStr);
```

- 禁止：`Print(File(...), a, b, c)`

## 13. 固定策略分層

```text
C1 參數
C2 指標計算
C3 進場條件
C4 出場條件
C5 狀態更新
C6 輸出
```

## 14. 母版策略要求

- 核心架構：`0313_DailyMap_Formal_IND_V5`
- 安全層參考：`1150412106 交易版`

