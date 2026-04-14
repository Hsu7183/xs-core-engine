# 台指期 1 分 K 日當沖 XS 最高規範 V2

本文件是 `xs-core-engine` 的唯一最高法源。

所有後續 XS / XScript 指標版、交易版、稽核器、模板、重構與策略設計，都必須以本文件為唯一標準。舊策略、舊模板、舊規範僅可作為參考樣本，不得凌駕本文件。

## 1. 系統定位

- 交易商品：台指期
- 交易週期：1 分 K
- 交易型態：日當沖，不留倉
- 程式語言：純 XScript / XS
- 目標：可實倉、可回測、可定錨、回測與實盤一致

## 2. 執行環境硬規則

所有正式腳本都必須包含以下分鐘線保護：

```xs
if barfreq <> "Min" then
    raiseRunTimeError("本腳本僅支援分鐘線");
```

若策略限制為非還原 1 分 K，必須額外加入：

```xs
if BarFreq <> "Min" or BarInterval <> 1 or BarAdjusted then
    RaiseRunTimeError("本腳本僅支援非還原 1 分鐘線");
```

## 3. 核心交易模型

核心原則只有一句話：

> 所有交易判斷，只能使用已完成且已定錨的資料，並在當根 K 棒 Open 出現瞬間完成判斷與執行。

正式流程固定為：

1. 當根 Open 出現
2. 只用前一根或更早已完成資料判斷
3. 當根 Open 立即執行

## 4. 單 Bar 單次執行

- 每根 1 分 K 只允許一次交易動作
- 出場優先於進場
- 禁止同 Bar 反手
- 訊號不得保留、遞延、累積
- 每根 K 棒只在 Open 首次出現時判斷一次

正式狀態控制至少應具備：

- `lastMarkBar`
- `lastExitBar`
- `posFlag`
- `cost`
- `entryATR`

## 5. 定錨資料白名單

可用於正式交易判斷的資料必須是定錨值。

合法白名單包含：

- `Open`：僅作為當根觸發價與執行價
- `Open[1]`
- `High[1]`
- `Low[1]`
- `Close[1]`
- `Volume[1]`
- 所有技術指標之 `[1]` 或更早值
- 前一日資料，例如 `GetField("Close","D")[1]`

## 6. 黑名單與禁止事項

以下不得直接用於當根交易判斷：

- `Close`
- `High`
- `Low`
- `Volume`
- 所有未加 `[1]` 的技術指標值
- 正在累積中的 ORB / 區間型結構值
- 任何先用當根 Open 更新、再回頭判斷同根 Open 的寫法

## 7. 前一根資料優先原則

- 若無特殊策略理由，判斷應優先使用 `Close[1]`
- `Open[1]` 不是通用預設來源
- 若無特別指定，技術指標預設來源一律以 `Close` 計算
- 正式交易判斷應優先使用已命名之定錨變數，例如 `emaFast_1`、`ATRv_1`、`vwap_1`

## 8. 出場條件分類

價格觸發型出場：

- 固定停利
- 固定停損
- ATR 停利 / 停損
- 保護停利

正式判斷應優先使用：

- `High[1]`
- `Low[1]`

狀態反轉型出場：

- 趨勢轉弱
- 結構反轉
- 均線反向
- RSI / MACD / BB / KC / VWAP 反轉

正式判斷應優先使用：

- `Close[1]`
- 衍生指標 `[1]`

## 9. ATR / VWAP / Donchian 定版原則

ATR：

- `trVal = MaxList(High - Low, AbsValue(High - Close[1]), AbsValue(Low - Close[1]))`
- `ATRv = XAverage(trVal, ATR_Len)`
- 正式持倉風險應使用 `entryATR = ATRv[1]`
- 同一筆交易期間不得讓 ATR 持續滾動改寫停利停損

VWAP：

- 一律手動累積
- 每逢 `Date <> Date[1]` 必須歸零
- 交易判斷只能用 `vwap[1]`

Donchian：

- `donHi = Highest(High, DonLen)`
- `donLo = Lowest(Low, DonLen)`
- 預設主判斷優先使用 `High[1] >= donHi[2]` / `Low[1] <= donLo[2]`

## 10. 跨日初始化與 Warmup

使用前日資料時，每個新交易日都必須先完成初始化，包括但不限於：

- 前日高低收
- 前日區間
- CDP / Pivot / Fib 衍生值

若初始化失敗、缺值、為零值，當日不得正式交易。

`warmupBars` 的工程定義必須同時計入：

- 最大指標長度
- 平滑穩定期
- `[1]` / `[2]` 等位移需求
- 多重平滑需求
- 額外安全緩衝

## 11. dataReady 硬規則

正式交易前，至少必須同時滿足：

1. `CurrentBar > warmupBars`
2. 前日初始化成功
3. `CheckField` 成功
4. `dayInitDate = Date`
5. `dayRefDate = Date`
6. 交易判斷用指標皆可安全讀取

若任一條件不成立：

- 不得進場
- 不得出場
- 不得變更部位

## 12. 模組化架構

所有策略必須固定分為：

- `C1` 參數區
- `C2` 基礎資料與指標計算
- `C3` 進場條件
- `C4` 出場條件
- `C5` 狀態更新
- `C6` 輸出模組

`C2` 與 `C5` 建議至少區分：

- `calc session`
- `entry session`
- `manage session`

## 13. 狀態機硬規則

每根 K 棒的順序固定為：

1. 出場
2. 再進場
3. 更新狀態變數

每次平倉、強制平倉或跨日重置時，所有與持倉相關的衍生狀態都必須完整歸零，不得只重置 `posFlag`。

## 14. 指標版 / 交易版一致性

核心邏輯必須 100% 一致，差別只能在輸出層。

指標版：

- 保留 `Plot`
- 保留 `Print`

交易版：

- 保留相同邏輯
- 將 `Plot` / `Print` 以註解保留，不刪除
- 啟用 `SetPosition(..., MARKET)`

## 15. TXT 輸出硬規則

- 第一行 header 必須為整份檔案唯一第一行
- header 全檔只允許輸出一次
- 所有 `key=value` 之間不得有多餘空白
- 交易事件格式固定為：`YYYYMMDDhhmmss 價格 動作`
- 時間戳必須手動補零為 14 碼
- 禁止 `INPOS`

所有正式輸出都必須採用：

```xs
outStr = "...";
Print(File(path), outStr);
```

禁止：

```xs
Print(File(path), a, b, c);
```

## 16. 舊策略與策略特例

- `1001plus+`、`1001`、`0807` 都不是法源
- 舊策略只能提供想法、參數經驗、重構素材
- 若與本規範衝突，一律以本規範為準

若存在策略特例，必須在程式開頭註解明確標示：

- 此處為策略特例
- 特例內容
- 為何不採通用預設
- 是否只限本策略

## 17. 工程結論

`xs-core-engine` 的正式工程標準是：

- 完全定錨
- 前一根完整資訊優先
- Open 瞬間判斷
- Open 立即執行
- 單 Bar 單次執行
- 訊號不累積
- ATR 逐筆 freeze
- VWAP 用前一根
- 指標版與交易版邏輯同核
- TXT 採單一完整字串與單參數 `Print`

任何偏離上述模型的寫法，皆視為違反最高規範。
