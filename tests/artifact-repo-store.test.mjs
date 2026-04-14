import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { buildArtifactBundle, buildArtifactMemoryPaths, buildArtifactPaths } from "../src/artifacts/index.js";
import { createRepoArtifactStore } from "../src/artifacts/repo-store.js";

function buildSampleBundle({
    artifactId,
    generatedAt,
    totalReturn,
    mddPct,
    nTrades,
    strategyName = "sample_strategy",
} = {}) {
    return {
        ...buildArtifactBundle({
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
            notes: ["repo persistence smoke test"],
        }),
        indicatorSource: `// indicator ${artifactId}\n`,
        tradingSource: `// trading ${artifactId}\n`,
        tradeLines: [
            "20260414201000 BUY OPEN",
            "20260414204500 SELL CLOSE",
        ],
    };
}

async function withTempRepo(run) {
    const root = await mkdtemp(path.join(os.tmpdir(), "xs-core-engine-artifacts-"));

    try {
        await run(root);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
}

test("repo artifact store persists artifact files and repo memory files", async () => {
    await withTempRepo(async (root) => {
        const store = createRepoArtifactStore(root);
        const bundle = buildSampleBundle({
            artifactId: "11504142100",
            generatedAt: "2026-04-14T21:00:00+08:00",
            totalReturn: 12.5,
            mddPct: -4.2,
            nTrades: 86,
        });

        const result = await store.persistArtifactBundle(bundle);
        const artifactPaths = buildArtifactPaths(bundle.artifactId);
        const memoryPaths = buildArtifactMemoryPaths();

        const paramsText = await readFile(path.resolve(root, artifactPaths.paramsTxtPath), "utf8");
        const summary = JSON.parse(await readFile(path.resolve(root, artifactPaths.summaryPath), "utf8"));
        const artifactMeta = JSON.parse(await readFile(path.resolve(root, artifactPaths.artifactMetaPath), "utf8"));
        const bestParams = JSON.parse(await readFile(path.resolve(root, memoryPaths.bestParamsPath), "utf8"));
        const latestMemory = JSON.parse(await readFile(path.resolve(root, memoryPaths.latestMemoryPath), "utf8"));
        const top10 = JSON.parse(await readFile(path.resolve(root, memoryPaths.top10JsonPath), "utf8"));
        const top10Csv = await readFile(path.resolve(root, memoryPaths.top10CsvPath), "utf8");
        const indicatorText = await readFile(path.resolve(root, artifactPaths.indicatorXsPath), "utf8");
        const tradingText = await readFile(path.resolve(root, artifactPaths.tradingXsPath), "utf8");
        const tradeLinesText = await readFile(path.resolve(root, artifactPaths.tradeLinesPath), "utf8");

        assert.equal(paramsText.trim(), bundle.paramsHeader);
        assert.equal(summary.artifact_id, "11504142100");
        assert.equal(artifactMeta.generated_files.summary, artifactPaths.summaryPath);
        assert.equal(bestParams.artifact_id, "11504142100");
        assert.equal(latestMemory.artifact_id, "11504142100");
        assert.equal(top10.length, 1);
        assert.match(top10Csv, /^artifact_id,generated_at,/);
        assert.equal(indicatorText, bundle.indicatorSource);
        assert.equal(tradingText, bundle.tradingSource);
        assert.match(tradeLinesText, /BUY OPEN/);
        assert.equal(result.state.top10[0].artifact_id, "11504142100");
    });
});

test("repo artifact store keeps best params by score while latest memory follows the latest bundle", async () => {
    await withTempRepo(async (root) => {
        const store = createRepoArtifactStore(root);

        const stronger = buildSampleBundle({
            artifactId: "11504142101",
            generatedAt: "2026-04-14T21:01:00+08:00",
            totalReturn: 20,
            mddPct: -5,
            nTrades: 80,
        });
        const weaker = buildSampleBundle({
            artifactId: "11504142102",
            generatedAt: "2026-04-14T21:02:00+08:00",
            totalReturn: 8,
            mddPct: -6,
            nTrades: 70,
        });

        await store.persistArtifactBundle(stronger);
        const result = await store.persistArtifactBundle(weaker);

        assert.equal(result.state.bestParams.artifact_id, "11504142101");
        assert.equal(result.state.latestMemory.artifact_id, "11504142102");
        assert.equal(result.state.top10.length, 2);
        assert.equal(result.state.top10[0].artifact_id, "11504142101");
    });
});

test("repo artifact store can reload persisted repo memory state", async () => {
    await withTempRepo(async (root) => {
        const firstStore = createRepoArtifactStore(root);
        const bundle = buildSampleBundle({
            artifactId: "11504142103",
            generatedAt: "2026-04-14T21:03:00+08:00",
            totalReturn: 18,
            mddPct: -3,
            nTrades: 60,
        });

        await firstStore.persistArtifactBundle(bundle);

        const secondStore = createRepoArtifactStore(root);
        const state = await secondStore.readState();

        assert.equal(state.bestParams.artifact_id, "11504142103");
        assert.equal(state.latestMemory.artifact_id, "11504142103");
        assert.equal(state.top10.length, 1);
    });
});
