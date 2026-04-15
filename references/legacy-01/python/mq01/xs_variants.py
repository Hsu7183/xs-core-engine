from __future__ import annotations

import re
from typing import Any, Mapping


def format_param_value(value: Any) -> str:
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        if abs(value - round(value)) < 1e-9:
            return str(int(round(value)))
        return f"{value:.4f}".rstrip("0").rstrip(".")
    return str(value)


def render_indicator_xs(base_xs_text: str, best_params: Mapping[str, Any]) -> str:
    rendered_lines: list[str] = []
    for line in base_xs_text.splitlines():
        updated_line = line
        for name, value in best_params.items():
            pattern = rf"^(\s*{re.escape(name)}\s*\()\s*([^,]+)(,.*)$"
            match = re.match(pattern, updated_line)
            if match is None:
                continue
            updated_line = f"{match.group(1)}{format_param_value(value)}{match.group(3)}"
            break
        rendered_lines.append(updated_line)
    return "\n".join(rendered_lines) + "\n"


_TRADE_SECTION = """//====================== C10.交易版執行 ======================
if isMinChart then begin
    if (sessOnManage = 1) and (CurrentBar > warmupBars) and (lastMarkBar = CurrentBar) then begin
        if ForceExitTrig or LongExitTrig or ShortExitTrig then begin
            if Position <> 0 then
                SetPosition(0, MARKET);
        end;
    end;

    if (sessOnEntry = 1) and (CurrentBar > warmupBars) and (lastMarkBar = CurrentBar) then begin
        if LongEntrySig then begin
            if Position <> 1 then
                SetPosition(1, MARKET);
        end
        else if ShortEntrySig then begin
            if Position <> -1 then
                SetPosition(-1, MARKET);
        end;
    end;
end;

//====================== C11.輸出（交易版不輸出） ======================
// // Plot / Print 交易版不使用
"""


def render_trade_xs(base_xs_text: str, best_params: Mapping[str, Any]) -> str:
    rendered = render_indicator_xs(base_xs_text, best_params)
    marker = "//====================== C10."
    if marker in rendered:
        rendered = rendered.split(marker, 1)[0].rstrip() + "\n\n"
    return rendered + _TRADE_SECTION
