import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  DALAT_JOURNEY_CHECKPOINT_IDS,
  dalatJourneyDefinition,
} from "./dalat-journey";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

test("Dalat journey registers the approved five checkpoints", () => {
  assert.deepEqual(DALAT_JOURNEY_CHECKPOINT_IDS, [
    "mistGate",
    "memoryPines",
    "timeGlasshouse",
    "lakePavilion",
    "wishValley",
  ]);
  assert.equal(new Set(DALAT_JOURNEY_CHECKPOINT_IDS).size, 5);
  assert.deepEqual(
    dalatJourneyDefinition.checkpoints.map(({ id }) => id),
    DALAT_JOURNEY_CHECKPOINT_IDS,
  );
});

test("Dalat journey keeps approved camera limits and fallback assets", () => {
  assert.equal(dalatJourneyDefinition.look.yawDegrees, 20);
  assert.equal(dalatJourneyDefinition.look.pitchDegrees, 8);
  assert.equal(dalatJourneyDefinition.camera.fovDegrees, 50);

  for (const checkpoint of dalatJourneyDefinition.checkpoints) {
    assert.ok(checkpoint.travelDurationMs >= 1_500);
    assert.ok(checkpoint.travelDurationMs <= 2_000);
    assert.match(
      checkpoint.fallbackImage,
      /^\/chungdoi\/labs\/dalat-journey\/.+\.webp$/,
    );
  }
});

test("Dalat journey authors one typed rail midpoint for every adjacent leg", () => {
  const expectedMidpoints = [
    [-0.6, 1.82, 3.7],
    [0.55, 1.82, -5.8],
    [-0.65, 1.8, -15.2],
    [0.65, 1.86, -25.5],
    null,
  ];
  const actualMidpoints = dalatJourneyDefinition.checkpoints.map(
    (checkpoint) =>
      "travelMidpointToNext" in checkpoint
        ? checkpoint.travelMidpointToNext
        : undefined,
  );

  assert.deepEqual(actualMidpoints, expectedMidpoints);
});

test("Dalat journey catalogs expose identical localized key paths", () => {
  const locales = ["vi", "en", "ja", "ko", "zh"] as const;
  const entries = locales.map((locale) => {
    const catalog = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "messages", `${locale}.json`),
        "utf8",
      ),
    ) as { dalatJourneyLab?: unknown };
    assert.ok(catalog.dalatJourneyLab, `${locale} is missing dalatJourneyLab`);
    return [locale, leafKeys(catalog.dalatJourneyLab).sort()] as const;
  });

  for (const [locale, keys] of entries) {
    assert.deepEqual(keys, entries[0][1], `${locale} key paths differ`);
  }
});
