# DATA CONTRACT

本文件定義 `xs-core-engine` 後續正式資料層的最低契約。

目的不是描述資料庫產品，而是先定義：

- 哪些資料可以進引擎
- 哪些資料必須先驗證
- 哪些欄位是正式策略生成前的必要條件

## 1. 正式資料來源類型

目前正式支援的資料來源應分成兩類：

### 1.1 Legacy 格式

來自 `backup/01` 的既有格式。

- Legacy M1
  - 格式：`YYYYMMDD HHMMSS O H L C`
- Legacy D1
  - 格式：`YYYYMMDD O H L C`

### 1.2 New XQ Export 格式

來自新 XQ 匯出 XS。

- New M1 CSV
  - header：`ts14,open,high,low,close,volume`
- New D1 CSV
  - header：`ts14,open,high,low,close,volume`
- DailyAnchor CSV
  - header：`ts14,prev_high,prev_low,prev_close,day_range,pp,r1,s1,r2,s2`

## 2. 正式輸入資料表

後續不管是實體資料庫、JSON、還是前端記憶體，都應先對齊成以下三種結構。

### 2.1 `m1_bars`

必要欄位：

- `ts14`
- `date`
- `time`
- `open`
- `high`
- `low`
- `close`
- `volume`
- `source_format`

### 2.2 `d1_bars`

必要欄位：

- `ts14`
- `date`
- `open`
- `high`
- `low`
- `close`
- `volume`
- `source_format`

### 2.3 `daily_anchors`

必要欄位：

- `ts14`
- `date`
- `prev_high`
- `prev_low`
- `prev_close`
- `day_range`
- `pp`
- `r1`
- `s1`
- `r2`
- `s2`
- `source_format`

## 3. 進入引擎前必驗證

只要資料要進策略生成、回測、最佳化，就必須先驗證。

最低檢查項目如下：

### 3.1 格式驗證

- 欄位數正確
- 欄位順序正確
- header 正確
- 欄位型別可解析

### 3.2 時間驗證

- `ts14` 必須為 `YYYYMMDDhhmmss`
- `date` / `time` 必須能從 `ts14` 反推
- `M1` 時間序列必須可排序
- `D1` 日期序列必須可排序

### 3.3 價格驗證

- `high >= low`
- `open`、`high`、`low`、`close` 不得為空
- `close` 不得為負值
- `volume` 不得為負值

### 3.4 重複與連續性驗證

- 同 key 重複列必須先 dedupe
- `M1` 不得有完全重複 bar 混入
- `D1` 不得有完全重複日 bar 混入

### 3.5 跨表一致性驗證

- `daily_anchors.date` 必須對得上 `d1_bars` 的前一日資料
- `prev_high / prev_low / prev_close` 必須能由 `d1_bars` 推回
- `day_range = prev_high - prev_low`

## 4. 正式策略生成前的最低資料條件

在任何策略生成、重構、最佳化前，至少要滿足：

1. `M1` 已匯入
2. `D1` 已匯入
3. `DailyAnchor` 已匯入或可由 `D1` 重建
4. 已通過 dedupe
5. 已通過時間驗證
6. 已通過價格驗證

## 5. source_format 建議值

建議固定使用以下值：

- `legacy_m1`
- `legacy_d1`
- `xq_m1_csv`
- `xq_d1_csv`
- `xq_daily_anchor_csv`

## 6. 建議資料簽章

後續每次正式最佳化或正式生成，都應綁定資料簽章 `data_signature`。

最低建議組成：

- `source_format`
- `row_count`
- `first_ts14`
- `last_ts14`
- `sha1` 或等價摘要

這樣未來才能知道：

- 這份最佳參數是用哪批資料算的
- 這份最佳策略是對哪批資料成立

## 7. 正式資料契約原則

只要資料契約沒過，後面的事都不應該做：

- 不進資料庫
- 不做最佳化
- 不做生成
- 不產出最佳策略

## 8. 後續實作對應

這份文件目前已對應到：

- `src/data/legacy-loader.js`
- `src/data/csv-loader.js`
- `src/data/normalize.js`
- `src/data/index.js`

後續還要再補：

- 更嚴格的資料驗證規則
- artifact-aware data signature 規則
- 與工作台 UI 的整合
