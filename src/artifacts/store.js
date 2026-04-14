import { buildArtifactId, buildArtifactPaths } from "./naming.js";

function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
}

function ensurePlainObject(value) {
    return isPlainObject(value) ? value : {};
}

function stableClone(value) {
    if (Array.isArray(value)) {
        return value.map(stableClone);
    }

    if (!isPlainObject(value)) {
        return value;
    }

    return Object.keys(value)
        .sort()
        .reduce((result, key) => {
            result[key] = stableClone(value[key]);
            return result;
        }, {});
}

function normalizeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function normalizeMetrics(metrics = {}) {
    const normalized = {};

    Object.entries(ensurePlainObject(metrics)).forEach(([key, value]) => {
        normalized[key] = typeof value === "number" ? value : normalizeNumber(value) ?? value;
    });

    return stableClone(normalized);
}

function normalizeBestParams(bestParams = {}) {
    const normalized = {};

    Object.entries(ensurePlainObject(bestParams)).forEach(([key, value]) => {
        const numericValue = normalizeNumber(value);
        normalized[key] = numericValue ?? value;
    });

    return stableClone(normalized);
}

function normalizeNotes(notes = []) {
    if (!Array.isArray(notes)) {
        return [];
    }

    return notes
        .map((note) => String(note ?? "").trim())
        .filter(Boolean);
}

function resolveArtifactId(artifactId, generatedAt) {
    if (artifactId) {
        return String(artifactId);
    }

    return buildArtifactId(generatedAt ?? new Date());
}

function toIsoString(value) {
    if (!value) {
        return new Date().toISOString();
    }

    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
}

function defaultFiles(artifactId, files = {}) {
    const defaults = buildArtifactPaths(artifactId);
    return {
        ...defaults,
        ...ensurePlainObject(files),
    };
}

function getCompositeScore(metrics = {}) {
    const direct = normalizeNumber(metrics.composite_score);
    if (direct !== null) {
        return direct;
    }

    const totalReturn = normalizeNumber(metrics.total_return) ?? 0;
    const mddPct = normalizeNumber(metrics.mdd_pct) ?? 0;
    const nTrades = normalizeNumber(metrics.n_trades) ?? 0;
    return totalReturn - Math.abs(mddPct) + Math.min(nTrades, 500) * 0.001;
}

export function serializeParamsHeader(params = {}) {
    return Object.entries(ensurePlainObject(params))
        .map(([key, value]) => `${String(key).trim()}=${String(value).trim()}`)
        .join(",");
}

export function createSummaryRecord({
    artifactId,
    generatedAt = new Date(),
    strategyFamily = "",
    strategyName = "",
    sourceStrategyPath = "",
    policyVersion = "V2",
    dataSignature = "",
    bestParams = {},
    metrics = {},
    files = {},
} = {}) {
    const resolvedArtifactId = resolveArtifactId(artifactId, generatedAt);
    const resolvedFiles = defaultFiles(resolvedArtifactId, files);

    return stableClone({
        artifact_id: resolvedArtifactId,
        generated_at: toIsoString(generatedAt),
        strategy_family: strategyFamily,
        strategy_name: strategyName,
        policy_version: policyVersion,
        source_strategy_path: sourceStrategyPath,
        indicator_xs_path: resolvedFiles.indicatorXsPath,
        trading_xs_path: resolvedFiles.tradingXsPath,
        params_txt_path: resolvedFiles.paramsTxtPath,
        data_signature: dataSignature,
        best_params: normalizeBestParams(bestParams),
        metrics: normalizeMetrics(metrics),
    });
}

export function createArtifactMeta({
    artifactId,
    generatedAt = new Date(),
    artifactStatus = "draft",
    policyVersion = "V2",
    sourceFormat = "unknown",
    dataSignature = "",
    files = {},
    notes = [],
} = {}) {
    const resolvedArtifactId = resolveArtifactId(artifactId, generatedAt);
    const resolvedFiles = defaultFiles(resolvedArtifactId, files);

    return stableClone({
        artifact_id: resolvedArtifactId,
        generated_at: toIsoString(generatedAt),
        artifact_status: artifactStatus,
        policy_version: policyVersion,
        source_format: sourceFormat,
        data_signature: dataSignature,
        generated_files: {
            indicator: resolvedFiles.indicatorXsPath,
            trading: resolvedFiles.tradingXsPath,
            params: resolvedFiles.paramsTxtPath,
            summary: resolvedFiles.summaryPath,
        },
        notes: normalizeNotes(notes),
    });
}

export function createBestParamsMemory({
    artifactId,
    generatedAt = new Date(),
    strategyFamily = "",
    strategyName = "",
    policyVersion = "V2",
    dataSignature = "",
    bestParams = {},
    metrics = {},
} = {}) {
    const resolvedArtifactId = resolveArtifactId(artifactId, generatedAt);

    return stableClone({
        artifact_id: resolvedArtifactId,
        generated_at: toIsoString(generatedAt),
        strategy_family: strategyFamily,
        strategy_name: strategyName,
        policy_version: policyVersion,
        data_signature: dataSignature,
        best_params: normalizeBestParams(bestParams),
        metrics: normalizeMetrics(metrics),
    });
}

export function buildLeaderboardRow({
    artifactId,
    generatedAt = new Date(),
    strategyFamily = "",
    strategyName = "",
    policyVersion = "V2",
    dataSignature = "",
    bestParams = {},
    metrics = {},
} = {}) {
    const normalizedMetrics = normalizeMetrics(metrics);

    return stableClone({
        artifact_id: resolveArtifactId(artifactId, generatedAt),
        generated_at: toIsoString(generatedAt),
        strategy_family: strategyFamily,
        strategy_name: strategyName,
        policy_version: policyVersion,
        data_signature: dataSignature,
        best_params: normalizeBestParams(bestParams),
        metrics: normalizedMetrics,
        composite_score: getCompositeScore(normalizedMetrics),
    });
}

export function mergeTop10Rows(existingRows = [], candidateRows = [], { limit = 10 } = {}) {
    const merged = [...existingRows, ...candidateRows]
        .map((row) => buildLeaderboardRow(row))
        .sort((left, right) => {
            const scoreDelta = Number(right.composite_score) - Number(left.composite_score);
            if (scoreDelta !== 0) {
                return scoreDelta;
            }
            return String(right.generated_at).localeCompare(String(left.generated_at));
        });

    const deduped = [];
    const seen = new Set();

    merged.forEach((row) => {
        const key = `${row.artifact_id}|${row.data_signature}`;
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        deduped.push(row);
    });

    return deduped.slice(0, limit).map(stableClone);
}

export function createLatestMemorySnapshot({
    artifactId,
    generatedAt = new Date(),
    strategyFamily = "",
    strategyName = "",
    policyVersion = "V2",
    dataSignature = "",
    files = {},
    bestParams = {},
    metrics = {},
} = {}) {
    const resolvedArtifactId = resolveArtifactId(artifactId, generatedAt);
    const resolvedFiles = defaultFiles(resolvedArtifactId, files);

    return stableClone({
        artifact_id: resolvedArtifactId,
        generated_at: toIsoString(generatedAt),
        strategy_family: strategyFamily,
        strategy_name: strategyName,
        policy_version: policyVersion,
        data_signature: dataSignature,
        best_params: normalizeBestParams(bestParams),
        metrics: normalizeMetrics(metrics),
        files: resolvedFiles,
    });
}

export function buildArtifactBundle({
    artifactId,
    generatedAt = new Date(),
    strategyFamily = "",
    strategyName = "",
    sourceStrategyPath = "",
    policyVersion = "V2",
    sourceFormat = "unknown",
    dataSignature = "",
    bestParams = {},
    metrics = {},
    artifactStatus = "draft",
    notes = [],
} = {}) {
    const resolvedArtifactId = resolveArtifactId(artifactId, generatedAt);
    const files = defaultFiles(resolvedArtifactId);

    return {
        artifactId: resolvedArtifactId,
        generatedAt: toIsoString(generatedAt),
        files,
        paramsHeader: serializeParamsHeader(bestParams),
        summary: createSummaryRecord({
            artifactId: resolvedArtifactId,
            generatedAt,
            strategyFamily,
            strategyName,
            sourceStrategyPath,
            policyVersion,
            dataSignature,
            bestParams,
            metrics,
            files,
        }),
        artifactMeta: createArtifactMeta({
            artifactId: resolvedArtifactId,
            generatedAt,
            artifactStatus,
            policyVersion,
            sourceFormat,
            dataSignature,
            files,
            notes,
        }),
        bestParamsMemory: createBestParamsMemory({
            artifactId: resolvedArtifactId,
            generatedAt,
            strategyFamily,
            strategyName,
            policyVersion,
            dataSignature,
            bestParams,
            metrics,
        }),
        latestMemory: createLatestMemorySnapshot({
            artifactId: resolvedArtifactId,
            generatedAt,
            strategyFamily,
            strategyName,
            policyVersion,
            dataSignature,
            files,
            bestParams,
            metrics,
        }),
    };
}
