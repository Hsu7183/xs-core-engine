# 資料匯出流程

這一層先不做策略生成，先把 XQ 內的原始與衍生資料穩定輸出成 TXT，之後再匯入你的資料庫。

## 匯出腳本

- `templates/exporters/m1_export.xs`
  - 在 1 分鐘非還原圖執行
  - 每根新 bar 到來時，輸出前一根已完成的 `M1 OHLCV`
- `templates/exporters/d1_export.xs`
  - 在日線圖執行
  - 每根新日 bar 到來時，輸出前一根已完成的 `D1 OHLCV`
- `templates/exporters/daily_anchor_export.xs`
  - 在 1 分鐘非還原圖執行
  - 每個交易日只輸出一次前一日錨點欄位：`yH / yL / yC / dayRange / PP / R1 / S1 / R2 / S2`

## 建議順序

1. 先跑 `m1_export.xs`
2. 再跑 `d1_export.xs`
3. 最後跑 `daily_anchor_export.xs`
4. 把三份 TXT 匯入你的資料庫
5. 確認資料表、時間戳、欄位型別都正確
6. 再開始做策略重構、策略生成、最佳化結果回寫

## TXT 格式

- header 只輸出一次
- 每行都是單一完整字串後再 `Print(File(...), outStr)`
- 時間戳固定為 `YYYYMMDDhhmmss`
- 欄位以逗號分隔，方便後續匯入 CSV / SQLite / PostgreSQL

## 匯入後最低建議資料表

- `m1_bars`
  - `ts14`
  - `open`
  - `high`
  - `low`
  - `close`
  - `volume`
- `d1_bars`
  - `ts14`
  - `open`
  - `high`
  - `low`
  - `close`
  - `volume`
- `daily_anchors`
  - `ts14`
  - `prev_high`
  - `prev_low`
  - `prev_close`
  - `day_range`
  - `pp`
  - `r1`
  - `s1`
  - `r2`
  - `s2`

## 下一步

資料庫打通後，再做兩件事：

1. 舊策略重構成 V2 合規版本
2. 根據資料庫與最佳化結果，生成正式指標版 / 交易版 XS
