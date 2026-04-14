import { readFile } from "node:fs/promises";
import path from "node:path";

import { createRepoArtifactStore } from "../src/artifacts/repo-store.js";

function parseArgs(argv) {
    const options = {
        input: "",
        baseDir: "artifacts",
    };

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (token === "--input") {
            options.input = argv[index + 1] ?? "";
            index += 1;
            continue;
        }

        if (token === "--base-dir") {
            options.baseDir = argv[index + 1] ?? options.baseDir;
            index += 1;
            continue;
        }
    }

    return options;
}

function printUsage() {
    console.error("Usage: node scripts/persist_artifact_bundle.mjs --input path/to/bundle.json [--base-dir artifacts]");
}

async function main() {
    const options = parseArgs(process.argv.slice(2));

    if (!options.input) {
        printUsage();
        process.exitCode = 1;
        return;
    }

    const inputPath = path.resolve(process.cwd(), options.input);
    const raw = await readFile(inputPath, "utf8");
    const payload = JSON.parse(raw);
    const bundle = payload?.bundle && typeof payload.bundle === "object" ? payload.bundle : payload;

    const store = createRepoArtifactStore(process.cwd(), {
        baseDir: options.baseDir,
    });
    const result = await store.persistArtifactBundle(bundle);

    console.log(`Persisted artifact ${bundle?.artifactId ?? bundle?.summary?.artifact_id ?? "unknown"} into ${options.baseDir}.`);
    console.log(`Best params artifact: ${result.state.bestParams?.artifact_id ?? "none"}`);
    console.log(`Latest memory artifact: ${result.state.latestMemory?.artifact_id ?? "none"}`);
    console.log(`Top10 rows: ${result.state.top10.length}`);
    console.log(`Artifact summary: ${result.artifactFiles.summaryPath}`);
    console.log(`Repo memory top10: ${result.memoryFiles.top10JsonPath}`);
}

main().catch((error) => {
    console.error(String(error?.stack ?? error));
    process.exitCode = 1;
});
