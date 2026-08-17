"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  Color,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  TextureLoader,
  Vector3,
  type Texture,
} from "three";
import { Water } from "three/examples/jsm/objects/Water.js";

import {
  BEACH_SHORE_CURVE_AMPLITUDE_METRES,
  BEACH_WATER_LEVEL_Y,
} from "../beach-shoreline";
import type { BeachWorldQualityTier } from "../beach-world-data";
import { BEACH_PHOTOREAL_ASSETS } from "./beach-asset-manifest";
import { BEACH_SUN_TINT } from "./beach-lighting";
import {
  BEACH_SAND_X_MAX_METRES,
  BEACH_SAND_X_MIN_METRES,
} from "./beach-terrain";

/**
 * Planar reflection re-renders the entire scene from a mirror camera every
 * frame, so this is a second full geometry pass. The class defaults to 512x512;
 * starting at 256 keeps that pass affordable, and `reflectionEnabled={false}`
 * drops to environment-map-only water when even that is too expensive.
 */
export const BEACH_WATER_REFLECTION_SIZE = 256;

const WATER_NORMAL_ASSET = BEACH_PHOTOREAL_ASSETS.find(
  ({ id }) => id === "waterNormal",
);
if (!WATER_NORMAL_ASSET) {
  throw new Error("Beach water normal map is missing from the manifest");
}

const WATER_NORMAL_SRC = WATER_NORMAL_ASSET.src;

/** How far seaward the water plane runs from its landward edge. */
export const WATER_SEAWARD_REACH_METRES = 900;

/**
 * How far landward of the *furthest landward* point of the waterline the plane
 * still runs.
 *
 * The waterline is a curve, not a line: `shorelineOffsetAt` swings across
 * +/-`BEACH_SHORE_CURVE_AMPLITUDE_METRES`, so the plane has to reach past the
 * whole swing or the submerged foreshore between the plane's edge and the
 * waterline is left dry and the edge cuts a hard seam. The extra overlap buys
 * margin for the swash, and it is hidden because the sand rises above
 * `BEACH_WATER_LEVEL_Y` everywhere landward of the waterline.
 */
export const WATER_LANDWARD_OVERLAP_METRES = 6;

/**
 * Feeds `material.uniforms.size`, which three 0.185.1's `Water` shader uses as
 * `getNoise( worldPosition.xz * size )` — a *frequency multiplier* on world
 * space, not a tile size. Larger values mean more wave detail per metre.
 */
export const WATER_NORMAL_FREQUENCY = 6;

/** Wave crawl speed. The swell is a scroll of the normal map, not geometry. */
const WATER_TIME_SCALE = 0.35;

/**
 * Sunrise sea: a mid teal, lifted from the golden-hour `#1d4b52`.
 *
 * The old value was tuned under a sun sitting 1.65deg above the horizon, where
 * almost no light reached the water and a very dark sea was correct. Under a
 * 12.8deg sun and the bright `puresky` environment, that same teal reads as a
 * slick of oil against pale sand; this keeps the hue and raises the value.
 */
const WATER_COLOR = "#2c6b74";

/**
 * Strength of the refraction offset. The class default of 20 is tuned for a
 * pool-sized plane; a plane this large needs far less, or the horizon smears.
 */
const WATER_DISTORTION_SCALE = 3.2;

const DISTORTION_BY_TIER: Record<BeachWorldQualityTier, number> = {
  desktop: WATER_DISTORTION_SCALE,
  mobile: WATER_DISTORTION_SCALE * 0.75,
  reduced: WATER_DISTORTION_SCALE * 0.5,
};

/** Along-shore overhang, so the plane never ends inside the frustum. */
const WATER_ALONGSHORE_MARGIN_METRES = 400;

/**
 * Applies the wrap modes the wave normal map needs.
 *
 * Exported and kept free of React, mirroring `configureBeachSandTextures`, so
 * the wrap modes can be asserted on a real `Texture`; the hook below is only
 * the `useLoader` plumbing around it.
 *
 * Both axes repeat: `Water`'s shader scrolls the sampled coordinate without
 * bound, so clamping either axis would smear one edge texel across the sea.
 * `repeat` stays at 1 because that shader samples `normalSampler` directly and
 * never applies the texture matrix — the tiling frequency lives in
 * `WATER_NORMAL_FREQUENCY` instead.
 */
export function configureBeachWaterNormalTexture(texture: Texture): Texture {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

/**
 * The sea plane.
 *
 * Anchored on the waterline, not on the sand's seaward edge: the sea bed is
 * modelled all the way up to `shorelineOffsetAt`, so a plane that stopped at
 * `BEACH_SAND_Z_MIN_METRES` would leave the whole submerged foreshore dry.
 */
export function createWaterGeometry(): PlaneGeometry {
  const width = BEACH_SAND_X_MAX_METRES
    - BEACH_SAND_X_MIN_METRES
    + WATER_ALONGSHORE_MARGIN_METRES * 2;
  const landwardEdgeZ = BEACH_SHORE_CURVE_AMPLITUDE_METRES
    + WATER_LANDWARD_OVERLAP_METRES;

  const geometry = new PlaneGeometry(width, WATER_SEAWARD_REACH_METRES);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(
    (BEACH_SAND_X_MIN_METRES + BEACH_SAND_X_MAX_METRES) / 2,
    BEACH_WATER_LEVEL_Y,
    landwardEdgeZ - WATER_SEAWARD_REACH_METRES / 2,
  );
  return geometry;
}

export type CreateBeachWaterOptions = {
  readonly distortionScale: number;
  readonly geometry: PlaneGeometry;
  readonly sunDirection: readonly [number, number, number];
  readonly waterNormals: Texture;
};

/**
 * Builds the `Water` instance.
 *
 * Exported so the options that are easy to get silently wrong — the fog opt-in,
 * the sun tint shared with the lighting rig, the reflection target size and the
 * normal frequency — can be asserted on a real instance under node.
 */
export function createBeachWater({
  distortionScale,
  geometry,
  sunDirection,
  waterNormals,
}: CreateBeachWaterOptions): Water {
  const instance = new Water(geometry, {
    alpha: 1,
    distortionScale,
    // Water builds with `options.fog` false unless told otherwise, and a
    // default-built plane would cut a hard seam across a hazed horizon.
    fog: true,
    // The same measured HDRI sun tint the directional light uses; a separate
    // literal here would let the specular highlight drift off the key light.
    sunColor: new Color(BEACH_SUN_TINT).getHex(),
    sunDirection: new Vector3(...sunDirection).normalize(),
    textureHeight: BEACH_WATER_REFLECTION_SIZE,
    textureWidth: BEACH_WATER_REFLECTION_SIZE,
    waterColor: new Color(WATER_COLOR).getHex(),
    waterNormals,
  });
  instance.material.uniforms.size.value = WATER_NORMAL_FREQUENCY;
  return instance;
}

function useWaterNormalTexture(): Texture {
  const texture = useLoader(TextureLoader, WATER_NORMAL_SRC) as Texture;

  // Configured in place: three owns the object and expects the flags set on
  // it, the same way the sand terrain and the forest scene do it.
  return useMemo(() => configureBeachWaterNormalTexture(texture), [texture]);
}

export type BeachWaterProps = {
  readonly qualityTier: BeachWorldQualityTier;
  readonly reflectionEnabled: boolean;
  readonly sunDirection: readonly [number, number, number];
};

export function BeachWater({
  qualityTier,
  reflectionEnabled,
  sunDirection,
}: BeachWaterProps) {
  const normalTexture = useWaterNormalTexture();
  const environment = useThree(({ scene }) => scene.environment);
  const reducedMotion = qualityTier === "reduced";

  const geometry = useMemo(() => createWaterGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const water = useMemo(() => {
    if (!reflectionEnabled) return null;

    return createBeachWater({
      distortionScale: DISTORTION_BY_TIER[qualityTier],
      geometry,
      sunDirection,
      waterNormals: normalTexture,
    });
  }, [
    geometry,
    normalTexture,
    qualityTier,
    reflectionEnabled,
    sunDirection,
  ]);

  useEffect(() => {
    if (!water) return;
    return () => {
      // The mirror camera's WebGLRenderTarget is not exposed as a property of
      // the Water instance, but three 0.185's RenderTarget.js sets a
      // `renderTarget` back-reference on each of the target's textures, so the
      // texture bound to the mirrorSampler uniform reaches it. Optional-chained
      // because that back-reference is a three implementation detail, not part
      // of the documented Water API, and may not survive an upgrade.
      water.material.uniforms.mirrorSampler.value.renderTarget?.dispose();
      water.material.dispose();
    };
  }, [water]);

  useFrame((_state, delta) => {
    if (!water || reducedMotion) return;
    // Advancing a shader uniform is the only way to animate the Water class;
    // the instance is scene state we own, not React state.
    /* eslint-disable-next-line react-hooks/immutability */
    water.material.uniforms.time.value += delta * WATER_TIME_SCALE;
  });

  const fallbackMaterial = useMemo(() => {
    if (reflectionEnabled) return null;
    return new MeshStandardMaterial({
      color: WATER_COLOR,
      envMap: environment,
      metalness: 0.9,
      normalMap: normalTexture,
      roughness: 0.08,
    });
  }, [environment, normalTexture, reflectionEnabled]);

  useEffect(() => {
    if (!fallbackMaterial) return;
    return () => fallbackMaterial.dispose();
  }, [fallbackMaterial]);

  // Exactly one of the two is non-null: both branch on `reflectionEnabled`.
  return (
    <group data-beach-photoreal-water>
      {water ? <primitive object={water} /> : null}
      {fallbackMaterial
        ? (
          <mesh
            args={[geometry, fallbackMaterial]}
            castShadow={false}
            receiveShadow={false}
          />
        )
        : null}
    </group>
  );
}
