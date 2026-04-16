import test from "node:test";
import assert from "node:assert/strict";

import {
    buildDataSignature,
    dedupeM1Bars,
    validateDataBundle,
} from "../src/data/index.js";

function buildValidBundle() {
    return {
        m1Bars: [
            { ts14: "20260414090000", date: 20260414, time: 90000, open: 100, high: 110, low: 95, close: 105, volume: 10, source_format: "xq_m1_csv" },
            { ts14: "20260414090100", date: 20260414, time: 90100, open: 105, high: 112, low: 101, close: 109, volume: 12, source_format: "xq_m1_csv" },
        ],
        d1Bars: [
            { ts14: "20260413000000", date: 20260413, time: 0, open: 90, high: 120, low: 80, close: 100, volume: 999, source_format: "xq_d1_csv" },
        ],
        dailyAnchors: [
            { ts14: "20260414090000", date: 20260414, time: 90000, prev_high: 120, prev_low: 80, prev_close: 100, day_range: 40, pp: 100, r1: 120, s1: 80, r2: 140, s2: 60, source_format: "xq_daily_anchor_csv" },
        ],
    };
}

test("validateDataBundle accepts a valid xq bundle", () => {
    const result = validateDataBundle(buildValidBundle(), { requireVolume: true });

    assert.equal(result.ok, true);
    assert.equal(result.errorCount, 0);
    assert.equal(result.warningCount, 0);
    assert.match(result.signatures.bundle, /^bundle\|sha1:/);
});

test("validateDataBundle rejects invalid ts14 and missing previous d1", () => {
    const bundle = buildValidBundle();
    bundle.m1Bars = [
        { ...bundle.m1Bars[0], ts14: "20260414990000" },
    ];
    bundle.d1Bars = [];

    const result = validateDataBundle(bundle, { requireVolume: true });
    const codes = result.issues.map((issue) => issue.code);

    assert.equal(result.ok, false);
    assert.ok(codes.includes("m1_invalid_ts14"));
    assert.ok(codes.includes("bundle_missing_d1"));
    assert.ok(codes.includes("bundle_m1_missing_previous_d1_at_bundle_start"));
});

test("validateDataBundle warns when dedupe removes repeated rows", () => {
    const bundle = buildValidBundle();
    bundle.m1Bars = [bundle.m1Bars[0], bundle.m1Bars[0], bundle.m1Bars[1]];

    const result = validateDataBundle(bundle, { requireVolume: true });

    assert.equal(result.ok, true);
    assert.equal(result.m1.duplicates_removed, 1);
    assert.ok(result.issues.some((issue) => issue.code === "m1_duplicates_removed"));
});

test("validateDataBundle can downgrade missing daily anchors to a warning", () => {
    const bundle = buildValidBundle();
    bundle.dailyAnchors = [];

    const result = validateDataBundle(bundle, {
        requireVolume: true,
        allowDailyAnchorRebuild: true,
    });

    assert.equal(result.ok, true);
    assert.ok(result.issues.some((issue) => issue.code === "bundle_missing_daily_anchors_rebuild_required"));
});

test("validateDataBundle treats missing previous D1 on the first bundle trading day as a warning", () => {
    const result = validateDataBundle({
        m1Bars: [
            { ts14: "20260414090000", date: 20260414, time: 90000, open: 100, high: 110, low: 95, close: 105, volume: 10, source_format: "xq_m1_csv" },
        ],
        d1Bars: [
            { ts14: "20260414000000", date: 20260414, time: 0, open: 90, high: 120, low: 80, close: 100, volume: 999, source_format: "xq_d1_csv" },
        ],
        dailyAnchors: [],
    }, {
        requireVolume: true,
        allowDailyAnchorRebuild: true,
    });

    assert.equal(result.ok, true);
    assert.ok(result.issues.some((issue) => issue.code === "bundle_m1_missing_previous_d1_at_bundle_start"));
    assert.ok(!result.issues.some((issue) => issue.code === "bundle_m1_missing_previous_d1"));
});

test("buildDataSignature is stable for deduped sorted rows", () => {
    const rows = [
        { ts14: "20260414090100", date: 20260414, time: 90100, open: 105, high: 112, low: 101, close: 109, volume: 12, source_format: "xq_m1_csv" },
        { ts14: "20260414090000", date: 20260414, time: 90000, open: 100, high: 110, low: 95, close: 105, volume: 10, source_format: "xq_m1_csv" },
        { ts14: "20260414090000", date: 20260414, time: 90000, open: 100, high: 110, low: 95, close: 105, volume: 10, source_format: "xq_m1_csv" },
    ];

    const deduped = dedupeM1Bars(rows).rows;
    const signatureA = buildDataSignature(deduped, { label: "m1" });
    const signatureB = buildDataSignature([...deduped].reverse(), { label: "m1" });

    assert.equal(signatureA, signatureB);
    assert.match(signatureA, /^m1\|xq_m1_csv\|2\|20260414090000\|20260414090100\|sha1:/);
});
