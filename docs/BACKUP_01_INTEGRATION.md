# backup/01 整合設計

這份文件是 `backup/01` 匯入 `xs-core-engine` 前的設計整理。

原則只有一條：

`backup/01` 可提供資料格式、最佳化成果、舊策略素材與 UI 流程參考；
但正式法源、正式 XS 模板、正式生成規則，仍以 xs-core-engine 的 V2 規範為準。`

## 1. 我們從 backup/01 看到什麼

`backup/01` 不是單純的 XS 策略資料夾，而是一套小型最佳化工具。

主要內容包含：

- `bundle/data/`
  - `M1.txt`
  - `D1_XQ_TRUE.txt`
- `bundle/strategy/`
  - `0313plus.xs`
  - `1150412106.xs`
- `bundle/param_presets/`
  - `0313plus.txt`
- `bundle/run_history/`
  - `_persistent_best_params_v3.json`
  - `_persistent_top10_v3.json`
  - `_persistent_top10_v3.csv`
  - `mq01_exports/.../best_indicator.xs`
  - `mq01_exports/.../best_trade.xs`
  - `mq01_exports/.../best_strategy.txt`
  - `mq01_exports/.../summary.json`
- `bundle/src/`
  - `data_loader.py`
  - `dedupe_loader.py`
  - `param_space.py`
  - `xs_generator.py`
  - `xscript_policy.py`
- `mq01/`
  - Streamlit UI
  - job store
  - runtime service
  - XS variant renderer

## 2. 可直接保留的價值

### 2.1 資料格式與去重概念

舊工具已經定義出一套可回測的資料輸入格式：

- `M1`: `date time open high low close`
- `D1`: `date open high low close`

另外，舊資料明顯存在重複列，因此 `dedupe_loader.py` 的概念必須保留。

正式結論：

- 保留舊資料格式相容能力
- 保留 dedupe 機制
- 不直接假設舊資料乾淨

### 2.2 XS 參數解析

`mq01/parameters.py` 會解析：

- XS `input` 參數
- preset 範圍檔

這塊非常適合併入新專案，因為未來：

- 舊策略重構
- 最佳化參數讀取
- 一鍵生成最佳版本

都需要它。

### 2.3 最佳化成果的記憶方式

舊工具已經有成熟的成果物結構：

- `best_params`
- `top10`
- `summary.json`
- `best_indicator.xs`
- `best_trade.xs`
- `best_strategy.txt`
- `latest_run_memory.py`

這非常接近我們未來要的「記住最佳結果，然後一鍵產生正式 XS」。

正式結論：

- 保留成果物概念
- 保留 summary / leaderboard / latest memory 的資訊組織方式
- 但 schema 要改成 `xs-core-engine` 可維護版本

### 2.4 UI 流程的參考價值

`mq01/ui_runtime_v2.py` 的流程是合理的：

1. 選資料路徑
2. 選 XS
3. 讀參數
4. 設定搜尋模式
5. 執行最佳化
6. 輸出最佳策略成果物

這條流程很值得保留，但不代表 UI 本身要直接照搬。

## 3. 不應直接沿用的部分

### 3.1 舊 XS 生成器

`mq01/xs_variants.py` 的做法是：

- 直接替換 input 預設值
- 再用字串拼接方式塞進交易版段落

這不符合我們現在的正式要求：

- `C1~C5` 必須同核
- `C6` 才能分歧
- 要有 parity audit
- 要有 lookahead / dataReady 檢查

正式結論：

- 舊生成器不能直接搬
- 只能保留「最佳結果產出 indicator/trade 成品」這個觀念
- 新專案必須重寫成 spec-first renderer

### 3.2 舊內建 policy

`backup/01` 內有自己的 `xscript_policy.py`。

雖然方向一致，但現在正式法源已經是：

- `docs/HIGHEST_SPEC_V2.md`

正式結論：

- 舊 policy 只能當歷史參考
- 不可與新法源並列

### 3.3 舊硬編碼路徑

舊工具大量綁定：

- `C:\\xs_optimizer_v1`
- `bundle/data/...`
- `bundle/strategy/...`

這種結構不適合直接併入目前專案。

正式結論：

- 所有硬編碼路徑都要抽掉
- 新專案要改成 repo-relative 路徑與明確 artifact 目錄

## 4. 新專案應該怎麼整合

整合不是「整包搬過來」，而是拆成 4 層。

### 4.1 Layer A：資料相容層

目的：

- 同時讀舊 `M1/D1` whitespace 格式
- 也讀新 `CSV/header` 匯出格式
- 做 dedupe
- 做時間戳正規化

建議輸入格式同時支援：

- Legacy M1: `YYYYMMDD HHMMSS O H L C`
- Legacy D1: `YYYYMMDD O H L C`
- New M1 CSV: `ts14,open,high,low,close,volume`
- New D1 CSV: `ts14,open,high,low,close,volume`
- DailyAnchor CSV: `ts14,prev_high,prev_low,prev_close,...`

正式建議：

- 新專案採雙格式相容
- 舊資料不用重做
- 新資料可以改成較乾淨的 CSV

### 4.2 Layer B：策略/參數素材層

目的：

- 匯入舊 XS
- 解析 `input`
- 對接 preset
- 建立「策略素材檔」

建議保留：

- `parse_xs_file`
- `parse_param_preset_file`
- `normalize_params_to_space`

但要新增：

- V2 規範檢查
- 策略特例標註
- 指標版 / 交易版成對關聯

### 4.3 Layer C：最佳化記憶層

目的：

- 保留歷史最佳參數
- 保留 top10
- 保留 summary
- 提供「目前最佳策略」的一鍵讀取能力

建議新 artifact schema 至少包含：

- `strategy_id`
- `strategy_family`
- `source_strategy_path`
- `input_data_signature`
- `policy_version`
- `best_params`
- `top10_rows`
- `summary`
- `best_indicator_xs_path`
- `best_trading_xs_path`
- `best_txt_path`

也就是說：

- 保留舊成果物概念
- 但 schema 改成 engine-aware

### 4.4 Layer D：正式生成層

目的：

- 以 V2 規範模板生成正式 indicator / trading XS

這一層必須完全重寫，不直接沿用 `mq01/xs_variants.py`。

最低要求：

1. 以 canonical base template 為核心
2. 產生 `C1~C5` 同核輸出
3. `C6` 分成 indicator / trading
4. 自動跑 parity 檢查
5. 自動跑 lookahead 檢查
6. 自動跑 dataReady 檢查
7. 檔名可依你的規則輸出，例如 `11504141455`

## 5. 我建議的整合順序

### Phase 1：先整合資料相容層

先做：

- `legacy_loader`
- `csv_loader`
- `dedupe`
- `timestamp normalizer`

這一步完成後，舊 `01` 的資料與新 XQ 匯出資料都能進新專案。

### Phase 2：再整合最佳化成果記憶

再做：

- `best_params` store
- `top10` store
- `summary` schema
- `latest memory` schema

這一步完成後，專案才會真正記得「最佳策略」。

### Phase 3：最後重做正式生成器

再做：

- 根據最佳參數套進 V2 模板
- 生成 `indicator.xs`
- 生成 `trading.xs`
- 用正式檢查器驗證

這一步完成後，才算達成你要的：

`按一下 -> 產生正式指標版 / 交易版完整程式碼`

## 6. 建議保留 / 淘汰 / 重寫清單

### 建議保留

- 舊資料格式相容能力
- dedupe 機制
- XS input 解析
- preset 參數範圍格式
- best params / top10 / summary 的概念
- best artifact 輸出概念

### 建議淘汰

- 舊硬編碼路徑
- 舊 policy 作為法源
- 舊版直接字串拼接交易版
- 舊專案對 `C1~C5` 同核沒有正式保證的部分

### 建議重寫

- loader registry
- artifact schema
- strategy renderer
- indicator/trading pair generation
- validator pipeline
- 最終首頁 / 工作台流程

## 7. 目前我對你的實作建議

下一步不要急著整合 UI。

最穩的下一個工作項目是：

`先把 backup/01 的資料格式相容層做進 xs-core-engine`

原因很簡單：

- 這一步最基礎
- 能立刻接上你現在要做的 XQ 匯出資料
- 也能吃舊 `01` 的 M1 / D1
- 後面最佳化與策略生成都會用到

## 8. 下一輪建議要做的具體項目

我建議下一輪直接做這三個檔：

1. `src/data/legacy_loader.py`
   - 讀 `01` 舊格式 `M1.txt / D1_XQ_TRUE.txt`
2. `src/data/csv_loader.py`
   - 讀新 XQ 匯出 CSV
3. `src/data/normalize.py`
   - dedupe
   - ts14 正規化
   - schema 對齊

做完後我們就能正式討論：

- 要不要把 `01` 的最佳化結果直接匯入新記憶層
- 要不要讓首頁出現「沿用 01 最佳結果」按鈕
- 要不要支援「舊資料 + 新資料混合回測」
