"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  type Mesh,
} from "three";

import type { BeachWorldQualityTier } from "../beach-world-data";
import {
  BEACH_SUN_TINT,
  BEACH_SUN_WORLD_DIRECTION,
} from "./beach-lighting";

/**
 * The visible sun disk and its rays.
 *
 * The HDRI carries the sun as light but not as a *sight*: at 1k the disk of
 * `table_mountain_1_puresky` measures 2 pixels above 5% of peak luminance, so
 * after ACES tone-mapping it is a bright smudge a few pixels across — the
 * environment is what lights the beach, not what shows a sunrise. Drawing the
 * disk and its rays here is therefore additive detail over a sky that is already
 * correct, not a second light source: nothing in this file contributes to the PBR
 * solution, and removing it changes the exposure of the scene not at all.
 *
 * A billboard rather than post-processing. Screen-space god rays need a depth
 * prepass and a blur chain, which is a second and third full-screen pass on a
 * scene that already spends one on the planar water reflection — and the beach's
 * own adaptive tier exists because devices here fail the frame budget. One
 * additive quad costs a single draw call.
 */

/**
 * How far out the billboard sits, in metres.
 *
 * Beyond the water plane's reach but inside the camera's 320m far plane, so the
 * quad is always drawn and never clipped by the horizon geometry.
 */
const SUN_DISTANCE_METRES = 260;

/**
 * Half-width of the billboard, in metres.
 *
 * At 260m this subtends `2 * atan(46/260)` = 20.1deg, which is where the rays
 * fade out — the disk itself is a small fraction of that. Sized in world units
 * rather than screen units so the sun keeps its place against the sky as the
 * camera turns down the shore.
 */
const SUN_HALF_SIZE_METRES = 46;

/**
 * Angular radius of the disk, as a fraction of the billboard's half-size.
 *
 * The real sun is about 0.27deg of arc. A disk that small is a dot on a phone, so
 * this is deliberately larger — the scene is a wedding invitation, not an
 * ephemeris — but kept small enough that it reads as the sun rather than as a
 * lens flare.
 */
const SUN_DISK_RADIUS = 0.085;

/** Where the surrounding glow falls to nothing, in the same units. */
const SUN_GLOW_RADIUS = 0.46;

/** Number of rays. Prime, so the pattern does not align with the disk's edge. */
const RAY_COUNT = 17;

/**
 * Peak opacity of the disk and of the rays, per tier.
 *
 * The reduced tier draws the disk but almost no rays: it is the tier that already
 * failed the frame budget, and the rays are the part of this effect that is
 * decoration rather than subject.
 */
const RAY_OPACITY: Record<BeachWorldQualityTier, number> = {
  desktop: 0.5,
  mobile: 0.42,
  reduced: 0.16,
};

/** How fast the rays breathe, in radians per second. */
const RAY_DRIFT_SPEED = 0.22;

const VERTEX_SHADER = /* glsl */ `
varying vec2 vBeachSunUv;

void main() {
  vBeachSunUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Disk plus rays, in polar coordinates around the quad's centre.
 *
 * The disk is a smoothstep with a hot core so ACES has something above 1.0 to
 * roll off — a disk at exactly 1.0 tone-maps to grey. The rays are a cosine comb
 * in angle, multiplied by a radial falloff so they emanate from the disk instead
 * of striping the whole quad, and each ray's length is modulated by a second,
 * slower comb so they are not all identical.
 */
const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vBeachSunUv;

uniform float uDiskRadius;
uniform float uGlowRadius;
uniform float uOpacity;
uniform float uRayCount;
uniform float uTime;
uniform vec3 uColor;

void main() {
  vec2 centred = vBeachSunUv * 2.0 - 1.0;
  float radius = length(centred);
  if (radius > 1.0) discard;

  // Hot core, so the tone-mapping curve resolves a disk rather than a flat patch.
  float disk = 1.0 - smoothstep(uDiskRadius * 0.55, uDiskRadius, radius);
  float core = disk * 2.4;

  float glow = 1.0 - smoothstep(uDiskRadius, uGlowRadius, radius);
  glow = pow(glow, 2.2) * 0.55;

  float angle = atan(centred.y, centred.x);
  float comb = cos(angle * uRayCount + uTime);
  // Only the crests become rays; the troughs are empty sky.
  comb = pow(max(comb, 0.0), 5.0);
  // A slower second comb varies ray length so they are not a uniform starburst.
  float lengthVariation = 0.6 + 0.4 * cos(angle * 5.0 - uTime * 0.6);
  float rayFalloff = 1.0 - smoothstep(uDiskRadius, lengthVariation, radius);
  float rays = comb * rayFalloff * 0.7;

  float intensity = (core + glow + rays) * uOpacity;
  // Additive: the alpha channel carries nothing, the colour is the contribution.
  gl_FragColor = vec4(uColor * intensity, 1.0);
}
`;

export type BeachSunRaysProps = {
  readonly qualityTier: BeachWorldQualityTier;
  readonly reducedMotion: boolean;
};

export type BeachSunRaySurface = {
  readonly material: ShaderMaterial;
  readonly phase: { value: number };
};

/**
 * Builds the billboard material and hands back its animated uniform.
 *
 * Split out of the component, and paired with `driveBeachSunRays` below, for the
 * same reason `attachBeachWind`/`driveBeachWind` are split in `beach-props.tsx`:
 * the frame loop has to advance a uniform every frame, and neither a memoised
 * object's field nor a ref's `current` may be written during or after render
 * without tripping the immutability and refs rules. Passing the uniform through
 * a plain function keeps the mutation where it belongs — outside React's model —
 * and makes the material testable without mounting a canvas.
 */
export function createBeachSunRaySurface(
  qualityTier: BeachWorldQualityTier,
): BeachSunRaySurface {
  const phase = { value: 0 };
  const material = new ShaderMaterial({
    blending: AdditiveBlending,
    // Additive over the sky, so it must not occlude anything and must not write
    // depth — the water reflection renders the scene a second time and a
    // depth-writing billboard would punch a hole in it.
    depthTest: false,
    depthWrite: false,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    uniforms: {
      uColor: { value: new Color(BEACH_SUN_TINT) },
      uDiskRadius: { value: SUN_DISK_RADIUS },
      uGlowRadius: { value: SUN_GLOW_RADIUS },
      uOpacity: { value: RAY_OPACITY[qualityTier] },
      uRayCount: { value: RAY_COUNT },
      uTime: phase,
    },
    vertexShader: VERTEX_SHADER,
  });

  return { material, phase };
}

/** Advances the ray phase, or holds it still under reduced motion. */
export function driveBeachSunRays(
  surface: BeachSunRaySurface | null,
  time: number,
  reducedMotion: boolean,
): void {
  if (!surface || reducedMotion) return;
  surface.phase.value = time * RAY_DRIFT_SPEED;
}

export function BeachSunRays({
  qualityTier,
  reducedMotion,
}: BeachSunRaysProps) {
  const meshRef = useRef<Mesh | null>(null);

  const geometry = useMemo(
    () => new PlaneGeometry(SUN_HALF_SIZE_METRES * 2, SUN_HALF_SIZE_METRES * 2),
    [],
  );

  const surface = useMemo(
    () => createBeachSunRaySurface(qualityTier),
    [qualityTier],
  );

  const position = useMemo(
    () =>
      new Vector3(...BEACH_SUN_WORLD_DIRECTION)
        .normalize()
        .multiplyScalar(SUN_DISTANCE_METRES),
    [],
  );

  useFrame(({ camera, clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // The sun sits at a fixed *direction*, so it rides with the camera along the
    // shore instead of being a landmark the walk passes: an object 260m away that
    // stayed put would visibly shift against the sky over the 128m walk, and the
    // sun does not do that.
    mesh.position.copy(camera.position).add(position);
    mesh.quaternion.copy(camera.quaternion);

    driveBeachSunRays(surface, clock.getElapsedTime(), reducedMotion);
  });

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => surface.material.dispose(), [surface]);

  return (
    <mesh
      args={[geometry, surface.material]}
      castShadow={false}
      frustumCulled={false}
      name="beach-sun-rays"
      receiveShadow={false}
      ref={meshRef}
      // Drawn after the sky and the water so the additive blend lands on top of
      // both; the sky is the background and has no render order of its own.
      renderOrder={10}
    />
  );
}
