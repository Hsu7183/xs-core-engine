# PROJECT STATE

本文件記錄目前 `xs-core-engine` 的專案狀態，讓未來不同電腦上的 Codex 可以快速續接。

## 1. 狀態日期

- 狀態快照日期：`2026-04-14`

## 2. 已確立的正式方向

- 唯一法源：`docs/HIGHEST_SPEC_V2.md`
- 正式任務：依 V2 規範生成 `指標版 XS` 與 `交易版 XS`
- 正式產品方向：GitHub repo + HTML/CSS/JS + XS
- `backup/01` 僅作資料格式、最佳化成果、流程參考

## 3. 目前已完成

### 3.1 法源與模板基礎

已存在：

- `docs/HIGHEST_SPEC_V2.md`
- `docs/ENGINE_STANDARD.md`
- `docs/ARCHITECTURE.md`
- `templates/base_indicator.xs`
- `templates/base_trading.xs`

### 3.2 本地首頁雛形

已存在：

- `index.html`
- `assets/home.css`
- `assets/home.js`

目前用途：

- 作為本地工作台首頁
- 尚未定版
- 尚未作為正式跨電腦工作流入口

### 3.3 XQ 資料匯出模板

已新增：

- `templates/exporters/m1_export.xs`
- `templates/exporters/d1_export.xs`
- `templates/exporters/daily_anchor_export.xs`

目前定位：

- 作為 XQ 端資料輸出腳本
- 先匯出資料，再匯入資料庫

### 3.4 JavaScript 資料相容層

已新增：

- `src/data/legacy-loader.js`
- `src/data/csv-loader.js`
- `src/data/normalize.js`
- `src/data/index.js`

目前定位：

- 同時讀舊 `01` 的 whitespace 資料
- 同時讀新 XQ 匯出 CSV
- 先做 dedupe、ts14 正規化、基本驗證
- 作為未來 JS 工作台與最佳化記憶層的底層

### 3.5 backup/01 整合分析

已完成分析，並整理為：

- `docs/BACKUP_01_INTEGRATION.md`

目前結論：

- 保留資料格式相容
- 保留 dedupe
- 保留參數解析概念
- 保留最佳化成果結構概念
- 不直接沿用舊生成器

## 4. 目前尚未完成

以下都還沒正式完成：

- 雙格式資料 loader
- 更完整的正式資料驗證器
- 正式 artifact schema 實作
- 正式最佳化記憶層
- 正式 JS 版工作台
- 正式 spec-first renderer
- 正式一鍵產生最佳指標版 / 交易版

## 5. 目前工作策略

正式建議順序如下：

1. 先補強資料驗證層
2. 再做最佳化記憶層
3. 再做正式生成器
4. 最後才做正式工作台整合

## 6. backup/01 的定位

`backup/01` 目前定位不是正式子系統，而是：

- 舊資料輸入格式參考
- 舊最佳化成果格式參考
- 舊 UI / 流程參考
- 舊策略素材參考

正式禁止：

- 直接把 `backup/01` 當正式法源
- 直接把 `backup/01` 的 Python 生成器當正式生成器

## 7. 正式資料流程

目前預設資料流程是：

1. 在 XQ 跑資料匯出 XS
2. 匯出 `M1`
3. 匯出 `D1`
4. 匯出 `DailyAnchor`
5. 先驗證資料
6. 再進資料庫
7. 再開始策略生成或最佳化

## 8. 正式成果物方向

未來每次正式最佳結果都應至少產出：

- 指標版 XS
- 交易版 XS
- 參數檔
- summary
- 資料簽章
- policy version

## 9. 下個建議工作

截至 `2026-04-14`，下一個最穩的工作項目是：

- `src/data` 驗證規則補強
- artifact store
- best params store

目的：

- 讓舊 `01` 資料與新 XQ 匯出資料都能被正式記憶層與生成層使用

## 10. 接續提醒

未來若這份文件與實際 repo 狀態不一致，應優先更新本文件，再繼續做其他功能。否則跨電腦接續時會很容易失真。
