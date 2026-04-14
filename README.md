# xs-core-engine

台指期 1 分 K 日當沖 XS / XScript 的 **Specification-first Engine**。

## 規範文件

- `docs/highest_spec_v2.md`：最高規範 V2（唯一法源摘要）。
- `docs/specification.md`：專案規格細節。
- `docs/architecture.md`：C1~C6 分層架構。

## 模板與檢查器

- `templates/base_indicator.xs`：指標版母版（C1~C6）。
- `templates/base_trading.xs`：交易版母版（C1~C6）。
- `validators/lookahead_check.py`：交易判斷行的反未來值檢查。
- `validators/data_ready_check.py`：dataReady/分鐘線保護/TXT 輸出硬規則檢查。

## 使用流程

1. 以 `base_indicator.xs` 完成策略並驗證輸出。
2. 同步 C1~C5 到 `base_trading.xs`（只能改 C6）。
3. 執行：
   - `python3 validators/lookahead_check.py`
   - `python3 validators/data_ready_check.py`

