import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY,
  FOREST_FOLIAGE_TRANSLUCENCY_POLICY,
  FOREST_PBR_SURFACE_POLICIES,
  getForestTextureColorSpacePolicy,
} from "./forest-material-policy";

test("ground and conifer surfaces require color, normal, and ARM maps", () => {
  for (const surface of ["conifer", "ground"] as const) {
    const policy = FOREST_PBR_SURFACE_POLICIES[surface];
    assert.deepEqual([...policy.requiredMaps].sort(), ["arm", "color", "normal"]);
  }
});

test("color maps decode as sRGB and data maps stay linear", () => {
  assert.equal(getForestTextureColorSpacePolicy("color"), "srgb");
  assert.equal(getForestTextureColorSpacePolicy("normal"), "no-color-space");
  assert.equal(getForestTextureColorSpacePolicy("arm"), "no-color-space");
});

test("alpha foliage uses alpha testing with depth writes instead of blending", () => {
  assert.ok(FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY.alphaTest >= 0.35);
  assert.equal(FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY.transparent, false);
  assert.equal(FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY.depthWrite, true);
});

test("terrain and path surfaces never rely on emissive flattening", () => {
  for (const surface of ["conifer", "ground"] as const) {
    assert.equal(FOREST_PBR_SURFACE_POLICIES[surface].emissiveIntensity, 0);
  }
});

test("foliage transmission stays subtle and rides the albedo", () => {
  // Distinct from the flattening the surface policies forbid above: this
  // emission is masked by the albedo, so it lifts the backlit canopy off the
  // tone curve's toe while keeping every needle's own shading variation. A
  // flat emissive at the same strength would erase that variation.
  assert.ok(FOREST_FOLIAGE_TRANSLUCENCY_POLICY.emissiveIntensity > 0);
  assert.ok(
    FOREST_FOLIAGE_TRANSLUCENCY_POLICY.emissiveIntensity <= 0.25,
    "stronger transmission reads as self-lit plastic rather than backlit leaves",
  );
  // White keeps the albedo's own hue; a tinted emissive would recolour it.
  assert.equal(FOREST_FOLIAGE_TRANSLUCENCY_POLICY.emissiveColor, 0xffffff);
});

test("alpha-tested foliage binds its emissive to the albedo, never a flat colour", () => {
  // MeshStandardMaterial models no leaf transmission, so a canopy card facing
  // away from the sun receives only the hemisphere's ground colour and ACES
  // crushes it to black — a void punched through the treeline. The fix must
  // stay masked by `map`: an `emissiveMap`-less lift would flatten the cards.
  const foliageSources = ["forest-tree-layers.tsx", "forest-undergrowth.tsx"];

  for (const fileName of foliageSources) {
    const source = readFileSync(path.join(import.meta.dirname, fileName), "utf8");
    assert.match(
      source,
      /^\s*emissiveMap:/m,
      `${fileName} must bind emissiveMap so the transmission carries needle detail`,
    );
    assert.match(
      source,
      /FOREST_FOLIAGE_TRANSLUCENCY_POLICY\.emissiveIntensity/,
      `${fileName} must take its transmission strength from the shared policy`,
    );
  }
});

test("policies are frozen so runtime code cannot drift them", () => {
  assert.ok(Object.isFrozen(FOREST_PBR_SURFACE_POLICIES));
  assert.ok(Object.isFrozen(FOREST_ALPHA_FOLIAGE_MATERIAL_POLICY));
  assert.ok(Object.isFrozen(FOREST_PBR_SURFACE_POLICIES.ground));
});

test("alpha-tested foliage materials never bind an alphaMap", () => {
  // three.js samples `alphaMap` from the GREEN channel, so pointing it at the
  // albedo replaces the atlas's real cutout with the albedo's green luminance.
  // On the conifer atlas that discarded 94% of legitimately opaque needle
  // pixels against alphaTest 0.42, punching black holes through the canopy.
  // `alphaTest` alone reads `map`'s own alpha, which is what these atlases ship.
  const foliageSources = [
    "forest-tree-layers.tsx",
    "forest-undergrowth.tsx",
    "forest-wildlife.tsx",
  ];

  for (const fileName of foliageSources) {
    const source = readFileSync(path.join(import.meta.dirname, fileName), "utf8");
    assert.equal(
      /^\s*alphaMap\s*:/m.test(source),
      false,
      `${fileName} must not bind alphaMap on an alpha-tested foliage material`,
    );
  }
});
