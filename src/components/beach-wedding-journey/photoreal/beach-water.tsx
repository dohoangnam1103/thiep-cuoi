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

import { BEACH_WATER_LEVEL_Y } from "../beach-shoreline";
import type { BeachWorldQualityTier } from "../beach-world-data";
import { BEACH_PHOTOREAL_ASSETS } from "./beach-asset-manifest";
import {
  BEACH_SAND_X_MAX_METRES,
  BEACH_SAND_X_MIN_METRES,
  BEACH_SAND_Z_MIN_METRES,
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

/** How far seaward of the sand's near edge the water plane runs. */
const WATER_SEAWARD_REACH_METRES = 900;

/** Along-shore overhang, so the plane never ends inside the frustum. */
const WATER_ALONGSHORE_MARGIN_METRES = 400;

/** Metres of world space per tile of the wave normal map. */
const WATER_NORMAL_TILE_METRES = 6;

/** Wave crawl speed. The swell is a scroll of the normal map, not geometry. */
const WATER_TIME_SCALE = 0.35;

/** Golden-hour sea: a deep teal that the warm sun reads against. */
const WATER_COLOR = "#1d4b52";

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

function useWaterNormalTexture(): Texture {
  const texture = useLoader(TextureLoader, WATER_NORMAL_SRC) as Texture;

  return useMemo(() => {
    // Same in-place texture configuration the sand terrain and the forest
    // scene use: three owns the object and expects the flags set on it.
    /* eslint-disable react-hooks/immutability */
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.needsUpdate = true;
    /* eslint-enable react-hooks/immutability */
    return texture;
  }, [texture]);
}

function createWaterGeometry(): PlaneGeometry {
  const width = BEACH_SAND_X_MAX_METRES
    - BEACH_SAND_X_MIN_METRES
    + WATER_ALONGSHORE_MARGIN_METRES * 2;
  const geometry = new PlaneGeometry(width, WATER_SEAWARD_REACH_METRES);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(
    (BEACH_SAND_X_MIN_METRES + BEACH_SAND_X_MAX_METRES) / 2,
    BEACH_WATER_LEVEL_Y,
    BEACH_SAND_Z_MIN_METRES - WATER_SEAWARD_REACH_METRES / 2,
  );
  return geometry;
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

    const instance = new Water(geometry, {
      alpha: 1,
      distortionScale: DISTORTION_BY_TIER[qualityTier],
      // Water builds with `options.fog` false unless told otherwise, and a
      // default-built plane would cut a hard seam across a hazed horizon.
      fog: true,
      sunColor: 0xff8e1b,
      sunDirection: new Vector3(...sunDirection).normalize(),
      textureHeight: BEACH_WATER_REFLECTION_SIZE,
      textureWidth: BEACH_WATER_REFLECTION_SIZE,
      waterColor: new Color(WATER_COLOR).getHex(),
      waterNormals: normalTexture,
    });
    instance.material.uniforms.size.value = WATER_NORMAL_TILE_METRES;
    return instance;
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
      // The mirror camera's WebGLRenderTarget is closure-private on the Water
      // class in this three version, so the only handle on it is the texture
      // bound to the mirrorSampler uniform, which keeps a `renderTarget`
      // back-reference. Guarded because that back-reference is an
      // implementation detail and may not survive a three upgrade.
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

  return (
    <group data-beach-photoreal-water>
      {water
        ? <primitive object={water} />
        : fallbackMaterial
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
