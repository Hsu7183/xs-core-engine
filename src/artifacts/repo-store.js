import { promises as fs } from "node:fs";
import path from "node:path";

import { buildArtifactMemoryPaths, buildArtifactPaths, DEFAULT_ARTIFACT_DIR } from "./naming.js";
import { buildLeaderboardRow, mergeTop10Rows } from "./store.js";

const DEFAULT_ENCODING = "utf8";

function cloneRecord(value) {
    if (value === null || value === undefined) {
        return null;
    }

    return JSON.parse(JSON.stringify(value));
}

function resolveRepoPath(repoRoot, relativePath) {
    return path.resolve(repoRoot, String(relativePath).replace(/\//g, path.sep));
}

function formatJson(value) {
    return `${JSON.stringify(value, null, 2)}\n`;
}

function formatParamsText(value) {
    const text = String(value ?? "");
    return text ? `${text}\n` : "";
}

function formatTradeLines(value) {
    if (Array.isArray(value)) {
        return value.map((line) => String(line ?? "")).join("\n").replace(/\n?$/, "\n");
    }

    const text = String(value ?? "");
    return text ? text.replace(/\n?$/, "\n") : "";
}

function escapeCsvValue(value) {
    const text = value === null || value === undefined
        ? ""
        : typeof value === "string"
            ? value
            : JSON.stringify(value);

    if (!/[",\r\n]/.test(text)) {
        return text;
    }

    return `"${text.replace(/"/g, "\"\"")}"`;
}

function formatTop10Csv(rows = []) {
    const header = [
        "artifact_id",
        "generated_at",
        "strategy_family",
        "strategy_name",
        "policy_version",
        "data_signature",
        "composite_score",
        "total_return",
        "mdd_pct",
        "n_trades",
        "best_params_json",
    ];

    const lines = rows.map((row) => [
        row.artifact_id,
        row.generated_at,
        row.strategy_family,
        row.strategy_name,
        row.policy_version,
        row.data_signature,
        row.composite_score,
        row.metrics?.total_return,
        row.metrics?.mdd_pct,
        row.metrics?.n_trades,
        row.best_params ?? {},
    ].map(escapeCsvValue).join(","));

    return `${header.join(",")}\n${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`;
}

async function ensureParentDirectory(targetPath) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
}

async function readJsonFile(filePath, fallback) {
    try {
        const raw = await fs.readFile(filePath, DEFAULT_ENCODING);
        return JSON.parse(raw);
    } catch (error) {
        if (error?.code === "ENOENT") {
            return cloneRecord(fallback);
        }

        throw new Error(`Failed to read JSON at ${filePath}: ${String(error.message ?? error)}`);
    }
}

async function writeTextFile(filePath, contents) {
    await ensureParentDirectory(filePath);
    await fs.writeFile(filePath, contents, DEFAULT_ENCODING);
}

async function writeJsonFile(filePath, value) {
    await writeTextFile(filePath, formatJson(value));
}

async function removeFileIfExists(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error?.code !== "ENOENT") {
            throw error;
        }
    }
}

function normalizeTop10Payload(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.rows)) {
        return payload.rows;
    }

    return [];
}

function getCompositeScore(row) {
    return Number(buildLeaderboardRow(toLeaderboardInput(row) ?? row).composite_score);
}

function pickBestParams(existing, candidate) {
    if (!candidate) {
        return cloneRecord(existing);
    }

    if (!existing) {
        return cloneRecord(candidate);
    }

    const candidateScore = getCompositeScore(candidate);
    const existingScore = getCompositeScore(existing);

    if (candidateScore > existingScore) {
        return cloneRecord(candidate);
    }

    if (candidateScore < existingScore) {
        return cloneRecord(existing);
    }

    return String(candidate.generated_at ?? "") >= String(existing.generated_at ?? "")
        ? cloneRecord(candidate)
        : cloneRecord(existing);
}

function toLeaderboardInput(row) {
    if (!row) {
        return null;
    }

    return {
        artifactId: row.artifact_id ?? row.artifactId,
        generatedAt: row.generated_at ?? row.generatedAt,
        strategyFamily: row.strategy_family ?? row.strategyFamily,
        strategyName: row.strategy_name ?? row.strategyName,
        policyVersion: row.policy_version ?? row.policyVersion,
        dataSignature: row.data_signature ?? row.dataSignature,
        bestParams: row.best_params ?? row.bestParams,
        metrics: row.metrics,
    };
}

function normalizeState(state) {
    return {
        bestParams: cloneRecord(state?.bestParams),
        latestMemory: cloneRecord(state?.latestMemory),
        top10: Array.isArray(state?.top10)
            ? state.top10.map((row) => buildLeaderboardRow(toLeaderboardInput(row) ?? row))
            : [],
    };
}

function buildNormalizedBundle(bundle, { baseDir }) {
    const artifactId = String(
        bundle?.artifactId
        ?? bundle?.artifact_id
        ?? bundle?.summary?.artifact_id
        ?? bundle?.artifactMeta?.artifact_id
        ?? "",
    ).trim();

    if (!artifactId) {
        throw new Error("Artifact bundle is missing artifactId.");
    }

    const artifactPaths = buildArtifactPaths(artifactId, { baseDir });

    const generatedAt = String(
        bundle?.generatedAt
        ?? bundle?.generated_at
        ?? bundle?.summary?.generated_at
        ?? bundle?.artifactMeta?.generated_at
        ?? bundle?.latestMemory?.generated_at
        ?? new Date().toISOString(),
    );

    const strategyFamily = bundle?.bestParamsMemory?.strategy_family
        ?? bundle?.latestMemory?.strategy_family
        ?? bundle?.summary?.strategy_family
        ?? "";
    const strategyName = bundle?.bestParamsMemory?.strategy_name
        ?? bundle?.latestMemory?.strategy_name
        ?? bundle?.summary?.strategy_name
        ?? "";
    const policyVersion = bundle?.bestParamsMemory?.policy_version
        ?? bundle?.latestMemory?.policy_version
        ?? bundle?.summary?.policy_version
        ?? "V2";
    const dataSignature = bundle?.bestParamsMemory?.data_signature
        ?? bundle?.latestMemory?.data_signature
        ?? bundle?.summary?.data_signature
        ?? "";
    const bestParams = cloneRecord(
        bundle?.bestParamsMemory?.best_params
        ?? bundle?.latestMemory?.best_params
        ?? bundle?.summary?.best_params
        ?? {},
    ) ?? {};
    const metrics = cloneRecord(
        bundle?.bestParamsMemory?.metrics
        ?? bundle?.latestMemory?.metrics
        ?? bundle?.summary?.metrics
        ?? {},
    ) ?? {};

    const summary = {
        ...(cloneRecord(bundle?.summary) ?? {}),
        artifact_id: artifactId,
        generated_at: generatedAt,
        strategy_family: strategyFamily,
        strategy_name: strategyName,
        policy_version: policyVersion,
        data_signature: dataSignature,
        indicator_xs_path: artifactPaths.indicatorXsPath,
        trading_xs_path: artifactPaths.tradingXsPath,
        params_txt_path: artifactPaths.paramsTxtPath,
        best_params: bestParams,
        metrics,
    };

    const artifactMeta = {
        ...(cloneRecord(bundle?.artifactMeta) ?? {}),
        artifact_id: artifactId,
        generated_at: generatedAt,
        policy_version: policyVersion,
        data_signature: dataSignature,
        generated_files: {
            indicator: artifactPaths.indicatorXsPath,
            trading: artifactPaths.tradingXsPath,
            params: artifactPaths.paramsTxtPath,
            summary: artifactPaths.summaryPath,
        },
    };

    const bestParamsMemory = {
        ...(cloneRecord(bundle?.bestParamsMemory) ?? {}),
        artifact_id: artifactId,
        generated_at: generatedAt,
        strategy_family: strategyFamily,
        strategy_name: strategyName,
        policy_version: policyVersion,
        data_signature: dataSignature,
        best_params: bestParams,
        metrics,
    };

    const latestMemory = {
        ...(cloneRecord(bundle?.latestMemory) ?? {}),
        artifact_id: artifactId,
        generated_at: generatedAt,
        strategy_family: strategyFamily,
        strategy_name: strategyName,
        policy_version: policyVersion,
        data_signature: dataSignature,
        best_params: bestParams,
        metrics,
        files: cloneRecord(artifactPaths),
    };

    return {
        artifactId,
        generatedAt,
        files: artifactPaths,
        paramsHeader: String(bundle?.paramsHeader ?? ""),
        summary,
        artifactMeta,
        bestParamsMemory,
        latestMemory,
        indicatorSource: typeof bundle?.indicatorSource === "string" ? bundle.indicatorSource : null,
        tradingSource: typeof bundle?.tradingSource === "string" ? bundle.tradingSource : null,
        tradeLines: bundle?.tradeLines ?? null,
    };
}

export function createRepoArtifactStore(
    repoRoot = process.cwd(),
    { baseDir = DEFAULT_ARTIFACT_DIR } = {},
) {
    const resolvedRepoRoot = path.resolve(repoRoot);

    function getArtifactPaths(bundle) {
        const artifactId = String(bundle?.artifactId ?? bundle?.summary?.artifact_id ?? "").trim();
        return buildArtifactPaths(artifactId, { baseDir });
    }

    function getMemoryPaths() {
        return buildArtifactMemoryPaths({ baseDir });
    }

    async function readState() {
        const memoryPaths = getMemoryPaths();
        const bestParams = await readJsonFile(
            resolveRepoPath(resolvedRepoRoot, memoryPaths.bestParamsPath),
            null,
        );
        const latestMemory = await readJsonFile(
            resolveRepoPath(resolvedRepoRoot, memoryPaths.latestMemoryPath),
            null,
        );
        const top10Payload = await readJsonFile(
            resolveRepoPath(resolvedRepoRoot, memoryPaths.top10JsonPath),
            [],
        );

        return normalizeState({
            bestParams,
            latestMemory,
            top10: normalizeTop10Payload(top10Payload),
        });
    }

    async function writeState(state) {
        const normalized = normalizeState(state);
        const memoryPaths = getMemoryPaths();
        const bestParamsPath = resolveRepoPath(resolvedRepoRoot, memoryPaths.bestParamsPath);
        const latestMemoryPath = resolveRepoPath(resolvedRepoRoot, memoryPaths.latestMemoryPath);
        const top10JsonPath = resolveRepoPath(resolvedRepoRoot, memoryPaths.top10JsonPath);
        const top10CsvPath = resolveRepoPath(resolvedRepoRoot, memoryPaths.top10CsvPath);

        if (normalized.bestParams) {
            await writeJsonFile(bestParamsPath, normalized.bestParams);
        } else {
            await removeFileIfExists(bestParamsPath);
        }

        if (normalized.latestMemory) {
            await writeJsonFile(latestMemoryPath, normalized.latestMemory);
        } else {
            await removeFileIfExists(latestMemoryPath);
        }

        if (normalized.top10.length > 0) {
            await writeJsonFile(top10JsonPath, normalized.top10);
            await writeTextFile(top10CsvPath, formatTop10Csv(normalized.top10));
        } else {
            await removeFileIfExists(top10JsonPath);
            await removeFileIfExists(top10CsvPath);
        }

        return normalized;
    }

    async function clearMemory() {
        const memoryPaths = getMemoryPaths();
        await Promise.all([
            removeFileIfExists(resolveRepoPath(resolvedRepoRoot, memoryPaths.bestParamsPath)),
            removeFileIfExists(resolveRepoPath(resolvedRepoRoot, memoryPaths.latestMemoryPath)),
            removeFileIfExists(resolveRepoPath(resolvedRepoRoot, memoryPaths.top10JsonPath)),
            removeFileIfExists(resolveRepoPath(resolvedRepoRoot, memoryPaths.top10CsvPath)),
        ]);

        return readState();
    }

    async function persistArtifactBundle(bundle) {
        const normalizedBundle = buildNormalizedBundle(bundle, { baseDir });
        const artifactPaths = getArtifactPaths(normalizedBundle);

        await Promise.all([
            writeTextFile(
                resolveRepoPath(resolvedRepoRoot, artifactPaths.paramsTxtPath),
                formatParamsText(normalizedBundle.paramsHeader),
            ),
            writeJsonFile(
                resolveRepoPath(resolvedRepoRoot, artifactPaths.summaryPath),
                normalizedBundle.summary,
            ),
            writeJsonFile(
                resolveRepoPath(resolvedRepoRoot, artifactPaths.artifactMetaPath),
                normalizedBundle.artifactMeta,
            ),
        ]);

        if (normalizedBundle.indicatorSource) {
            await writeTextFile(
                resolveRepoPath(resolvedRepoRoot, artifactPaths.indicatorXsPath),
                normalizedBundle.indicatorSource,
            );
        }

        if (normalizedBundle.tradingSource) {
            await writeTextFile(
                resolveRepoPath(resolvedRepoRoot, artifactPaths.tradingXsPath),
                normalizedBundle.tradingSource,
            );
        }

        if (normalizedBundle.tradeLines) {
            await writeTextFile(
                resolveRepoPath(resolvedRepoRoot, artifactPaths.tradeLinesPath),
                formatTradeLines(normalizedBundle.tradeLines),
            );
        }

        const current = await readState();
        const nextState = {
            bestParams: pickBestParams(current.bestParams, normalizedBundle.bestParamsMemory),
            latestMemory: cloneRecord(normalizedBundle.latestMemory),
            top10: mergeTop10Rows(
                current.top10.map((row) => toLeaderboardInput(row)).filter(Boolean),
                [toLeaderboardInput(normalizedBundle.bestParamsMemory)].filter(Boolean),
            ),
        };
        const state = await writeState(nextState);

        return {
            artifactFiles: cloneRecord(artifactPaths),
            memoryFiles: cloneRecord(getMemoryPaths()),
            state,
        };
    }

    return {
        getArtifactPaths,
        getMemoryPaths,
        readState,
        writeState,
        clearMemory,
        persistArtifactBundle,
    };
}
