# ARTIFACT SCHEMA

本文件定義 `xs-core-engine` 未來正式成果物的最小結構。

目標是讓專案在 GitHub 上留下可接續的記憶，不管換哪台電腦，Codex 都能知道：

- 最佳結果是什麼
- 用了哪份資料
- 套用了哪版規範
- 產出了哪些 XS 檔

## 1. 成果物類型

每次正式最佳化或正式生成，至少應產出以下成果物：

1. `indicator.xs`
2. `trading.xs`
3. `params.txt`
4. `summary.json`
5. `artifact_meta.json`

若有需要，再加：

- `top10.json`
- `top10.csv`
- `trade_lines.txt`

## 2. 檔名規則

正式輸出檔名應以你指定的「年月日 + 時間」為主鍵。

建議格式：

- `11504141455_indicator.xs`
- `11504141455_trading.xs`
- `11504141455_params.txt`
- `11504141455_summary.json`

其中：

- `11504141455` 代表民國年時間戳主鍵
- 同一輪成果物應共用同一個 artifact id

## 3. artifact id

建議欄位：

- `artifact_id`
- `generated_at`
- `strategy_family`
- `strategy_name`
- `policy_version`
- `data_signature`

範例：

```json
{
  "artifact_id": "11504141455",
  "generated_at": "2026-04-14T14:55:00+08:00",
  "strategy_family": "0313plus",
  "strategy_name": "0313_DailyMap_Formal_IND_V5",
  "policy_version": "V2",
  "data_signature": "..."
}
```

## 4. `params.txt` 契約

第一行固定：

`key=value,key=value,key=value`

後續若有交易事件，固定：

`YYYYMMDDhhmmss 價格 動作`

正式規則：

- header 全檔一次
- 不得多餘空白
- 不得多參數 `Print`
- 不得輸出 `INPOS`

## 5. `summary.json` 最低欄位

最低建議欄位：

- `artifact_id`
- `generated_at`
- `strategy_name`
- `strategy_family`
- `policy_version`
- `source_strategy_path`
- `indicator_xs_path`
- `trading_xs_path`
- `params_txt_path`
- `data_signature`
- `best_params`
- `metrics`

其中 `metrics` 最低建議包含：

- `total_return`
- `mdd_pct`
- `n_trades`
- `year_avg_return`
- `year_return_std`
- `loss_years`
- `composite_score`

## 6. `artifact_meta.json` 最低欄位

這份檔主要給未來 Codex 與工作台快速索引使用。

最低建議欄位：

- `artifact_id`
- `artifact_status`
- `policy_version`
- `source_format`
- `data_signature`
- `generated_files`
- `notes`

`generated_files` 建議列出：

- `indicator.xs`
- `trading.xs`
- `params.txt`
- `summary.json`

## 7. 最佳化記憶層應保留的集合

除了單次 artifact，還應有全域記憶：

### 7.1 `best_params`

目前最佳的一組正式參數。

### 7.2 `top10`

保留前 10 名策略結果。

### 7.3 `latest_memory`

保留最近一次正式運行的結果與路徑。

## 8. GitHub 記憶原則

只要成果物要成為跨電腦共享記憶，就至少要保留：

- 說明文件
- schema
- best params
- summary
- 少量 sample artifacts

不建議把大量原始 `M1/D1` 直接丟進主 repo。

目前 repo-backed 正式記憶層的 canonical 路徑為：

- `artifacts/<artifact_id>/`
- `artifacts/_memory/best_params.json`
- `artifacts/_memory/latest_memory.json`
- `artifacts/_memory/top10.json`
- `artifacts/_memory/top10.csv`

## 9. 與 V2 規範的關係

artifact schema 不能獨立於 V2。

也就是說，任何 artifact 若缺少以下資訊，都不應視為正式成果：

- 使用哪版 policy
- 用哪份資料
- 哪個 source strategy
- 是否產出成對 `indicator/trading`

## 10. 下一步實作對應

這份 schema 之後會對應到：

- JS 版 artifact store
- JS 版 best params store
- JS 版 top10 leaderboard
- JS 版一鍵產生最佳指標版 / 交易版
