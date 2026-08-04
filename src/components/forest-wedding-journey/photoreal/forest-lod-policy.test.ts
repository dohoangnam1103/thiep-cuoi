import assert from "node:assert/strict";
import test from "node:test";

import { selectForestLod } from "./forest-lod-policy";

test("near vegetation on desktop renders as hero geometry", () => {
  assert.equal(
    selectForestLod({ distance: 5, previous: null, tier: "desktop" }),
    "hero",
  );
});

test("distant vegetation on mobile collapses to an impostor", () => {
  assert.equal(
    selectForestLod({ distance: 20, previous: null, tier: "mobile" }),
    "impostor",
  );
});

test("hysteresis holds the previous tier just past the boundary", () => {
  assert.equal(
    selectForestLod({ distance: 12.1, previous: "hero", tier: "desktop" }),
    "hero",
  );
  assert.equal(
    selectForestLod({ distance: 12.1, previous: null, tier: "desktop" }),
    "mid",
  );
});

test("mobile and reduced tiers transition earlier than desktop", () => {
  assert.equal(
    selectForestLod({ distance: 10, previous: null, tier: "desktop" }),
    "hero",
  );
  assert.equal(
    selectForestLod({ distance: 10, previous: null, tier: "mobile" }),
    "mid",
  );
  assert.equal(
    selectForestLod({ distance: 10, previous: null, tier: "reduced" }),
    "mid",
  );
});

test("hysteresis cannot resurrect a tier beyond its release band", () => {
  assert.equal(
    selectForestLod({ distance: 40, previous: "hero", tier: "desktop" }),
    "impostor",
  );
});

test("selection is deterministic and monotonic in distance", () => {
  const order = { hero: 0, impostor: 2, mid: 1 } as const;
  let previousRank = -1;

  for (let distance = 0; distance <= 60; distance += 1) {
    const lod = selectForestLod({ distance, previous: null, tier: "desktop" });
    assert.ok(order[lod] >= previousRank);
    previousRank = order[lod];
    assert.equal(
      lod,
      selectForestLod({ distance, previous: null, tier: "desktop" }),
    );
  }
});
