# MQQuant 01

這個資料夾是重新拆出的「固定策略參數最佳化」小程式。

重點：

- 不再依賴 `gui_app.py` 的 UI 主體
- 直接呼叫 `C:\xs_optimizer_v1\src\optimize\gui_backend.py`
- 目前預設以 `0313plus.xs`、`M1.txt`、`D1_XQ_TRUE.txt` 為主
- 可以切換 `智慧搜尋`、`單參數輪巡`、`完整網格`

啟動方式（CMD）：

```cmd
cd /d C:\Users\User\Documents\mqquant\01
run.cmd
```

如果原始專案不在 `C:\xs_optimizer_v1`，先設定：

```cmd
set MQQUANT_SOURCE_ROOT=你的原始專案路徑
run.cmd
```
