import {
    buildLeaderboardRow,
    mergeTop10Rows,
} from "./store.js";

const DEFAULT_STORAGE_KEY = "xs-artifact-memory-v1";

function safeParseJson(raw) {
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function safeRead(storage, key) {
    try {
        return storage.getItem(key);
    } catch {
        return null;
    }
}

function safeWrite(storage, key, value) {
    try {
        storage.setItem(key, value);
    } catch {
        // ignore storage failures
    }
}

function safeRemove(storage, key) {
    try {
        storage.removeItem(key);
    } catch {
        // ignore storage failures
    }
}

function cloneRecord(value) {
    if (value === null || value === undefined) {
        return null;
    }

    return JSON.parse(JSON.stringify(value));
}

function normalizeState(state) {
    const top10 = Array.isArray(state?.top10) ? state.top10.map((row) => cloneRecord(row)) : [];

    return {
        bestParams: cloneRecord(state?.bestParams),
        latestMemory: cloneRecord(state?.latestMemory),
        top10,
    };
}

function getCompositeScore(row) {
    return Number(buildLeaderboardRow(row).composite_score);
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

export function createBrowserArtifactStore(
    storage = window.localStorage,
    { storageKey = DEFAULT_STORAGE_KEY } = {},
) {
    function readState() {
        return normalizeState(safeParseJson(safeRead(storage, storageKey)) ?? {});
    }

    function writeState(state) {
        const normalized = normalizeState(state);
        safeWrite(storage, storageKey, JSON.stringify(normalized));
        return normalized;
    }

    function clear() {
        safeRemove(storage, storageKey);
        return readState();
    }

    function saveArtifactBundle(bundle) {
        const current = readState();
        const candidateTop10 = {
            artifactId: bundle?.artifactId,
            generatedAt: bundle?.generatedAt,
            strategyFamily: bundle?.bestParamsMemory?.strategy_family,
            strategyName: bundle?.bestParamsMemory?.strategy_name,
            policyVersion: bundle?.bestParamsMemory?.policy_version,
            dataSignature: bundle?.bestParamsMemory?.data_signature,
            bestParams: bundle?.bestParamsMemory?.best_params,
            metrics: bundle?.bestParamsMemory?.metrics,
        };

        const nextState = {
            bestParams: pickBestParams(current.bestParams, bundle?.bestParamsMemory),
            latestMemory: bundle?.latestMemory ? cloneRecord(bundle.latestMemory) : current.latestMemory,
            top10: mergeTop10Rows(
                current.top10.map((row) => toLeaderboardInput(row)).filter(Boolean),
                [candidateTop10],
            ),
        };

        return writeState(nextState);
    }

    return {
        readState,
        writeState,
        clear,
        saveArtifactBundle,
    };
}
