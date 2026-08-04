import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { ClampToEdgeWrapping, PlaneGeometry, RepeatWrapping, Texture } from "three";

import { shorelineOffsetAt } from "../beach-shoreline";
import { BEACH_SUN_TINT } from "./beach-lighting";
import {
  BEACH_SAND_X_MAX_METRES,
  BEACH_SAND_X_MIN_METRES,
  BEACH_SAND_Z_MIN_METRES,
} from "./beach-terrain";
import {
  BEACH_WATER_REFLECTION_SIZE,
  WATER_NORMAL_FREQUENCY,
  configureBeachWaterNormalTexture,
  createBeachWater,
  createWaterGeometry,
} from "./beach-water";

const WATER_SOURCE = path.join(
  process.cwd(),
  "src/components/beach-wedding-journey/photoreal/beach-water.tsx",
);

const SUN_DIRECTION: readonly [number, number, number] = [-0.3225, 0.0288, -0.9461];

function buildWater() {
  return createBeachWater({
    distortionScale: 3.2,
    geometry: createWaterGeometry(),
    sunDirection: SUN_DIRECTION,
    waterNormals: configureBeachWaterNormalTexture(new Texture()),
  });
}

function waterPlaneBounds(geometry: PlaneGeometry): {
  readonly maxZ: number;
  readonly minZ: number;
} {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  assert.ok(box, "the water plane must have a bounding box");
  return { maxZ: box.max.z, minZ: box.min.z };
}

// Kept as a source-text assertion on purpose: the point is what the module
// graph is allowed to contain, and an import-time success proves nothing about
// the identifiers that must be absent.
test("water uses the WebGL Water class, never the WebGPU WaterMesh", () => {
  const source = readFileSync(WATER_SOURCE, "utf8");

  assert.ok(
    source.includes("three/examples/jsm/objects/Water.js"),
    "must import the WebGL Water class",
  );
  assert.ok(
    !source.includes("WaterMesh"),
    "WaterMesh requires WebGPURenderer and would fail at import in this WebGL app",
  );
  assert.ok(
    !source.includes("three/webgpu") && !source.includes("three/tsl"),
    "WebGPU-only entry points must not be imported",
  );
});

test("the reflection target is built at the declared size, at or below 256", () => {
  assert.ok(
    BEACH_WATER_REFLECTION_SIZE <= 256,
    "planar reflection re-renders the whole scene; anything above 256 is too "
      + `generous to start, got ${BEACH_WATER_REFLECTION_SIZE}`,
  );

  const water = buildWater();
  const target = water.material.uniforms.mirrorSampler.value.renderTarget;

  assert.equal(
    target.width,
    BEACH_WATER_REFLECTION_SIZE,
    "the mirror target must be built at the declared reflection size",
  );
  assert.equal(
    target.height,
    BEACH_WATER_REFLECTION_SIZE,
    "the mirror target must be square at the declared reflection size",
  );
});

// The reflection pass is a second full render of the scene. If the mirror
// camera's render target is never disposed it leaks a colour texture and a
// depth buffer for the lifetime of the tab. The Water instance exposes no
// property for that target; the handle runs through the `renderTarget`
// back-reference three 0.185's RenderTarget.js sets on each of the target's
// textures, reached via the mirrorSampler uniform. That back-reference is a
// three implementation detail, hence the optional chain at the call site.
test("the mirror render target is reachable and disposable through the uniform", () => {
  const water = buildWater();
  const target = water.material.uniforms.mirrorSampler.value.renderTarget;

  assert.ok(
    target,
    "the target must be reachable via mirrorSampler's renderTarget back-reference",
  );
  assert.equal(
    typeof target.dispose,
    "function",
    "the reachable target must be the disposable render target, not a bare texture",
  );

  assert.match(
    readFileSync(WATER_SOURCE, "utf8"),
    /mirrorSampler\.value\.renderTarget\?\.dispose\(\)/,
    "the unmount path must release the target through that same handle",
  );
});

// three's Water builds with `fog: false` unless told otherwise. A beach scene
// with fog would show the water plane cutting a hard seam across a hazed
// horizon, so the option has to be passed explicitly rather than defaulted.
test("water opts into scene fog explicitly", () => {
  const water = buildWater();

  assert.equal(
    water.material.fog,
    true,
    "Water defaults options.fog to false; the horizon seams without it",
  );
});

test("the water plane covers the whole submerged bed, waterline to deep sea", () => {
  const { maxZ, minZ } = waterPlaneBounds(createWaterGeometry());

  // The waterline is a curve. Sample the sand's full x range and take the most
  // landward point the sea actually reaches.
  let furthestLandwardWaterlineZ = Number.NEGATIVE_INFINITY;
  const samples = 400;
  for (let index = 0; index <= samples; index += 1) {
    const x = BEACH_SAND_X_MIN_METRES
      + ((BEACH_SAND_X_MAX_METRES - BEACH_SAND_X_MIN_METRES) * index) / samples;
    furthestLandwardWaterlineZ = Math.max(
      furthestLandwardWaterlineZ,
      shorelineOffsetAt(x),
    );
  }

  assert.ok(
    maxZ > furthestLandwardWaterlineZ,
    "the plane's landward edge must sit landward of every point of the "
      + `waterline (${furthestLandwardWaterlineZ.toFixed(2)}m), otherwise the `
      + `submerged foreshore renders dry; got ${maxZ.toFixed(2)}m`,
  );

  assert.ok(
    minZ < BEACH_SAND_Z_MIN_METRES,
    "the plane's seaward edge must run past the sand's seaward edge "
      + `(${BEACH_SAND_Z_MIN_METRES}m) so the sea bed never ends in open air; `
      + `got ${minZ.toFixed(2)}m`,
  );

  // The horizon has to be sea, not the plane's own edge: from the rail the eye
  // is 1.62m up, so a plane ending a few hundred metres out would show its far
  // edge well inside the frustum.
  assert.ok(
    maxZ - minZ >= 800,
    `the plane must reach the horizon; span is only ${(maxZ - minZ).toFixed(0)}m`,
  );
});

test("water takes its specular tint from the lighting rig's measured sun", () => {
  const water = buildWater();
  const expected = BEACH_SUN_TINT.replace("#", "").toLowerCase();

  assert.equal(
    water.material.uniforms.sunColor.value.getHexString(),
    expected,
    "the highlight tint must be derived from BEACH_SUN_TINT, not a second "
      + "literal that can drift away from the key light",
  );
});

test("the wave normal map repeats on both axes at a repeat of one", () => {
  const texture = configureBeachWaterNormalTexture(new Texture());

  assert.equal(
    texture.wrapS,
    RepeatWrapping,
    "Water's shader scrolls U without bound; clamping smears an edge texel",
  );
  assert.notEqual(texture.wrapS, ClampToEdgeWrapping);
  assert.equal(
    texture.wrapT,
    RepeatWrapping,
    "Water's shader scrolls V without bound; clamping smears an edge texel",
  );
  assert.notEqual(texture.wrapT, ClampToEdgeWrapping);

  assert.equal(
    texture.repeat.x,
    1,
    "Water samples normalSampler without the texture matrix, so repeat must "
      + "stay 1 and the tiling frequency must live in the size uniform",
  );
  assert.equal(texture.repeat.y, 1);
});

test("the wave noise frequency reaches the size uniform unchanged", () => {
  const water = buildWater();

  assert.equal(
    water.material.uniforms.size.value,
    WATER_NORMAL_FREQUENCY,
    "uniforms.size is a world-space frequency multiplier; the constant must "
      + "arrive there verbatim",
  );
  assert.equal(
    WATER_NORMAL_FREQUENCY,
    6,
    "calibrated against the 4096px normal map at this plane size; changing it "
      + "changes the wave scale and needs a new visual pass",
  );
});
