import test from "node:test";
import assert from "node:assert/strict";

import { buildArtifactBundle, createBrowserArtifactStore } from "../src/artifacts/index.js";

function createMemoryStorage() {
    const map = new Map();

    return {
        getItem(key) {
            return map.has(key) ? map.get(key) : null;
        },
        setItem(key, value) {
            map.set(key, String(value));
        },
        removeItem(key) {
            map.delete(key);
        },
    };
}

function buildSampleBundle({
    artifactId,
    generatedAt,
    totalReturn,
    mddPct,
    nTrades,
    strategyName = "sample_strategy",
} = {}) {
    return buildArtifactBundle({
        artifactId,
        generatedAt,
        strategyFamily: "0313plus",
        strategyName,
        sourceStrategyPath: "references/sample_strategy.xs",
        policyVersion: "V2",
        sourceFormat: "xq_m1_csv|xq_d1_csv|xq_daily_anchor_csv",
        dataSignature: `bundle|sha1:${artifactId}`,
        bestParams: { FastLen: 20, SlowLen: 55 },
        metrics: {
            total_return: totalReturn,
            mdd_pct: mddPct,
            n_trades: nTrades,
        },
        artifactStatus: "preview",
    });
}

test("browser artifact store persists latest memory and top10", () => {
    const storage = createMemoryStorage();
    const store = createBrowserArtifactStore(storage);

    const first = buildSampleBundle({
        artifactId: "11504142010",
        generatedAt: "2026-04-14T20:10:00+08:00",
        totalReturn: 12.5,
        mddPct: -4.2,
        nTrades: 86,
    });

    const second = buildSampleBundle({
        artifactId: "11504142011",
        generatedAt: "2026-04-14T20:11:00+08:00",
        totalReturn: 14.1,
        mddPct: -3.7,
        nTrades: 90,
        strategyName: "sample_strategy_v2",
    });

    store.saveArtifactBundle(first);
    const state = store.saveArtifactBundle(second);

    assert.equal(state.latestMemory.artifact_id, "11504142011");
    assert.equal(state.bestParams.artifact_id, "11504142011");
    assert.equal(state.top10.length, 2);
    assert.equal(state.top10[0].artifact_id, "11504142011");
});

test("browser artifact store keeps the higher-scoring best params memory", () => {
    const storage = createMemoryStorage();
    const store = createBrowserArtifactStore(storage);

    const stronger = buildSampleBundle({
        artifactId: "11504142012",
        generatedAt: "2026-04-14T20:12:00+08:00",
        totalReturn: 20,
        mddPct: -5,
        nTrades: 80,
    });

    const weaker = buildSampleBundle({
        artifactId: "11504142013",
        generatedAt: "2026-04-14T20:13:00+08:00",
        totalReturn: 10,
        mddPct: -6,
        nTrades: 75,
    });

    store.saveArtifactBundle(stronger);
    const state = store.saveArtifactBundle(weaker);

    assert.equal(state.latestMemory.artifact_id, "11504142013");
    assert.equal(state.bestParams.artifact_id, "11504142012");
});

test("browser artifact store clear removes persisted state", () => {
    const storage = createMemoryStorage();
    const store = createBrowserArtifactStore(storage);

    store.saveArtifactBundle(buildSampleBundle({
        artifactId: "11504142014",
        generatedAt: "2026-04-14T20:14:00+08:00",
        totalReturn: 18,
        mddPct: -3,
        nTrades: 60,
    }));

    const cleared = store.clear();

    assert.equal(cleared.bestParams, null);
    assert.equal(cleared.latestMemory, null);
    assert.deepEqual(cleared.top10, []);
});
