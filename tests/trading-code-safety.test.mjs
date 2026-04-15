import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
    assertTradingCodeSafe,
    findExecutableTradingPrintLines,
    stripExecutableTradingPrints,
} from "../src/xs-trading-safety.js";

const ROOT = resolve(".");

function extractTradingBlocksFromModeFile(text) {
    return Array.from(text.matchAll(/"trading": "((?:[^"\\]|\\.)*)"/g), (match) => JSON.parse('"' + match[1] + '"'));
}

test("stripExecutableTradingPrints comments out live Print/Plot statements but keeps trading actions", () => {
    const sample = [
        "{*",
        "    strategy_id: Demo",
        "*}",
        "if hasTradeEvent then begin",
        "    Print(File(fpath), outStr);",
        "end;",
        "Plot1(longMark, \"新買\");",
        "// Print(File(fpath), outStr);",
        "SetPosition(1, MARKET);",
    ].join("\n");

    assert.deepEqual(findExecutableTradingPrintLines(sample), [5, 7]);

    const stripped = stripExecutableTradingPrints(sample);

    assert.deepEqual(stripped.removedLines, [5, 7]);
    assert.match(stripped.code, /^\s*\/\/ Print\(File\(fpath\), outStr\);$/m);
    assert.match(stripped.code, /^\s*\/\/ Plot1\(longMark, "新買"\);$/m);
    assert.match(stripped.code, /SetPosition\(1, MARKET\);/);
    assert.doesNotThrow(() => assertTradingCodeSafe(stripped.code, "sample_trading.xs"));
});

test("commented Print lines stay allowed in trading templates", () => {
    const templateText = readFileSync(resolve(ROOT, "templates/base_trading.xs"), "utf8");

    assert.deepEqual(findExecutableTradingPrintLines(templateText), []);
    assert.doesNotThrow(() => assertTradingCodeSafe(templateText, "templates/base_trading.xs"));
});

test("bootstrap trading template is free of executable Print statements", () => {
    const templateText = readFileSync(resolve(ROOT, "templates/xs/trading.template.xs"), "utf8");

    assert.deepEqual(findExecutableTradingPrintLines(templateText), []);
    assert.doesNotThrow(() => assertTradingCodeSafe(templateText, "templates/xs/trading.template.xs"));
});

test("representative generated trading artifact is free of executable Print statements", () => {
    const tradingText = readFileSync(resolve(ROOT, "artifacts/11504130952/11504130952_trading.xs"), "utf8");

    assert.deepEqual(findExecutableTradingPrintLines(tradingText), []);
    assert.doesNotThrow(() => assertTradingCodeSafe(tradingText, "artifacts/11504130952/11504130952_trading.xs"));
});

test("embedded mode-generated trading examples are free of executable Print statements", () => {
    const source = readFileSync(resolve(ROOT, "assets/mode-generated-code.js"), "utf8");
    const blocks = extractTradingBlocksFromModeFile(source);

    assert.ok(blocks.length > 0);
    blocks.forEach((block, index) => {
        assert.deepEqual(findExecutableTradingPrintLines(block), []);
        assert.doesNotThrow(() => assertTradingCodeSafe(block, "assets/mode-generated-code.js trading block #" + (index + 1)));
    });
});

test("browser renderer wires the trading safety guard into display and storage paths", () => {
    const assetText = readFileSync(resolve(ROOT, "assets/home-code-output.js"), "utf8");

    assert.match(assetText, /function protectTradingCode\(code, fileName\)/);
    assert.match(assetText, /const safeTrading = protectTradingCode\(pair\.trading, bestId \+ "_trading\.xs"\);/);
    assert.match(assetText, /const safeTrading = protectTradingCode\(trading, baseName \+ "_trading\.xs"\);/);
    assert.match(assetText, /nextValue\.trading = protectTradingCode\(nextValue\.trading, "stored_trading\.xs"\);/);
});
