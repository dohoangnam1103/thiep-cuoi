import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BEACH_SUN_TINT,
  BEACH_SUN_WORLD_DIRECTION,
} from "@/components/beach-wedding-journey/photoreal/beach-lighting";
import {
  createBeachSunRaySurface,
  driveBeachSunRays,
} from "@/components/beach-wedding-journey/photoreal/beach-sun-rays";

/**
 * The visible sun and its rays.
 *
 * The point of this file is that the billboard stays *decoration*: the HDRI is
 * the light, and nothing here may change the scene's exposure or occlude it. The
 * disk exists because `table_mountain_1_puresky`'s sun is 2 pixels wide at 1k, so
 * an unaided sky has no sun to look at.
 */

test("the sun billboard never occludes or lights the scene", () => {
  const { material } = createBeachSunRaySurface("desktop");

  // Additive, so it can only ever add light to the sky it is drawn over.
  assert.equal(material.transparent, true);
  // Depth-writing would punch a hole in the planar water reflection, which
  // renders the whole scene a second time.
  assert.equal(material.depthWrite, false);
  assert.equal(material.depthTest, false);
  material.dispose();
});

test("the disk takes its colour from the same measured sun as the key light", () => {
  const { material } = createBeachSunRaySurface("desktop");
  const colorUniform = material.uniforms.uColor;

  assert.ok(colorUniform);
  // A disk that drifted off the key light's tint would read as a second sun.
  assert.equal(
    `#${colorUniform.value.getHexString()}`,
    BEACH_SUN_TINT.toLowerCase(),
  );
  material.dispose();
});

test("the disk sits inside its glow, and both inside the quad", () => {
  const { material } = createBeachSunRaySurface("desktop");
  const disk = material.uniforms.uDiskRadius?.value as number;
  const glow = material.uniforms.uGlowRadius?.value as number;

  assert.ok(disk > 0, "a zero-radius disk is an invisible sun");
  assert.ok(glow > disk, "the glow has to reach past the disk it surrounds");
  // The shader discards outside radius 1, so a glow past 1 would be clipped into
  // a visible circular edge against the sky.
  assert.ok(glow < 1);
  material.dispose();
});

test("lower tiers dim the rays without removing the sun", () => {
  const tiers = (["desktop", "mobile", "reduced"] as const).map((tier) => {
    const { material } = createBeachSunRaySurface(tier);
    const opacity = material.uniforms.uOpacity?.value as number;
    material.dispose();
    return opacity;
  });

  assert.ok(tiers[0]! > tiers[1]!);
  assert.ok(tiers[1]! > tiers[2]!);
  // Even the reduced tier keeps a sun: it is the subject of "bright sunrise",
  // not the decoration that a slow device gives up.
  assert.ok(tiers[2]! > 0);
});

test("reduced motion freezes the rays instead of drifting them", () => {
  const surface = createBeachSunRaySurface("desktop");

  driveBeachSunRays(surface, 12.5, false);
  const moving = surface.phase.value;
  assert.ok(moving > 0, "the rays breathe when motion is allowed");

  driveBeachSunRays(surface, 61.25, true);
  assert.equal(
    surface.phase.value,
    moving,
    "reduced motion must hold the phase where it was, not reset or advance it",
  );
  surface.material.dispose();
});

test("a missing surface is a no-op rather than a crash", () => {
  assert.doesNotThrow(() => driveBeachSunRays(null, 3, false));
});

test("the sun is drawn where the key light shines from", () => {
  // The billboard is placed along `BEACH_SUN_WORLD_DIRECTION` by the component,
  // so that vector must be usable as a direction: unit length and above the
  // horizon, or the sun would be drawn under the sand.
  const [x, y, z] = BEACH_SUN_WORLD_DIRECTION;

  assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-3);
  assert.ok(y > 0, "a sun below the horizon cannot be the visible sunrise");
});
