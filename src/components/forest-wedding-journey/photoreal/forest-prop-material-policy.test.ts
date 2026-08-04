import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  FOREST_CLOTH_MIN_DROP,
  FOREST_PROP_MIN_TAPER,
  FOREST_PROP_SURFACE_POLICIES,
  getForestClothDrape,
  getForestPropBevelRadius,
  getForestWoodTaper,
} from "./forest-prop-material-policy";

const PROP_SOURCES = [
  "forest-gate.tsx",
  "forest-gallery-scene.tsx",
  "forest-static-scenes.tsx",
] as const;

function readPropSource(file: string): string {
  return readFileSync(
    join(process.cwd(), "src/components/forest-wedding-journey", file),
    "utf8",
  );
}

test("every prop surface is non-emissive and non-metallic", () => {
  const surfaces = Object.entries(FOREST_PROP_SURFACE_POLICIES);
  assert.equal(surfaces.length, 5);

  for (const [name, policy] of surfaces) {
    assert.equal(policy.emissiveIntensity, 0, `${name} must not glow`);
    assert.equal(policy.metalness, 0, `${name} must stay dielectric`);
    assert.ok(
      policy.roughness > 0.5 && policy.roughness <= 1,
      `${name} roughness ${policy.roughness} is not a matte wedding surface`,
    );
  }
});

test("wood tapers more the longer the member is, and never to a needle", () => {
  const shortTaper = getForestWoodTaper(0.5);
  const longTaper = getForestWoodTaper(3.2);

  assert.ok(longTaper < shortTaper, `${longTaper} is not tighter than ${shortTaper}`);
  for (const length of [0, 0.2, 1, 3.2, 12, Number.NaN]) {
    const taper = getForestWoodTaper(length);
    assert.ok(Number.isFinite(taper));
    assert.ok(taper >= FOREST_PROP_MIN_TAPER && taper <= 1, `taper ${taper} is out of range`);
  }
});

test("bevels stay a fraction of the smallest face and survive thin panels", () => {
  const panel = getForestPropBevelRadius(1.18, 1.3, 0.045);
  assert.ok(panel > 0 && panel <= 0.045 * 0.25, `panel bevel ${panel} is too large`);

  const post = getForestPropBevelRadius(0.09, 1.28, 0.09);
  assert.ok(post > 0 && post < 0.09 * 0.5);

  assert.equal(getForestPropBevelRadius(0, 1, 1), 0);
  assert.equal(getForestPropBevelRadius(Number.NaN, 1, 1), 0);
});

test("cloth drapes visibly past the table and carries a hem", () => {
  for (const tableHeight of [0.44, 0.54, 0.68]) {
    const drape = getForestClothDrape(tableHeight);
    assert.ok(
      drape.dropMetres >= FOREST_CLOTH_MIN_DROP,
      `drop ${drape.dropMetres} is not visible fabric`,
    );
    assert.ok(drape.hemMetres > 0 && drape.hemMetres < drape.dropMetres);
    assert.ok(
      drape.thicknessMetres > 0 && drape.thicknessMetres < drape.dropMetres,
      "cloth must have thickness without becoming a slab",
    );
  }

  const tallDrape = getForestClothDrape(0.68);
  const shortDrape = getForestClothDrape(0.44);
  assert.ok(tallDrape.dropMetres > shortDrape.dropMetres);
  assert.equal(getForestClothDrape(0).dropMetres, FOREST_CLOTH_MIN_DROP);
});

test("no prop material paints itself with emissive light", () => {
  for (const file of PROP_SOURCES) {
    const source = readPropSource(file);
    assert.ok(
      !/emissive/.test(source),
      `${file} still uses emissive paint instead of lit PBR surfaces`,
    );
  }
});

test("props take their roughness from the shared policy", () => {
  for (const file of PROP_SOURCES) {
    const source = readPropSource(file);
    // `forestPropMaterial` is the only sanctioned way into
    // FOREST_PROP_SURFACE_POLICIES, so requiring the call site keeps every prop
    // on one roughness/metalness world.
    assert.ok(
      source.includes("forestPropMaterial"),
      `${file} must reuse the shared prop surface policy`,
    );
    assert.ok(
      !/roughness=\{?[01]?\.\d/.test(source),
      `${file} still hardcodes a roughness literal`,
    );
  }
});

test("cloth props drape with real geometry instead of a flat lid", () => {
  const source = readPropSource("forest-static-scenes.tsx");
  assert.ok(
    source.includes("getForestClothDrape"),
    "static scene cloth must be built from the shared drape solver",
  );
});

test("wooden members taper and bevel through the shared helpers", () => {
  assert.ok(readPropSource("forest-gate.tsx").includes("getForestWoodTaper"));
  assert.ok(
    readPropSource("forest-gallery-scene.tsx").includes(
      "createForestBevelledBoxGeometry",
    ),
  );
});
