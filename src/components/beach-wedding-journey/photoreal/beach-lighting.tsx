"use client";

import { Environment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { ACESFilmicToneMapping, Euler, Vector3 } from "three";

import type { BeachWorldQualityTier } from "../beach-world-data";
import { BEACH_PHOTOREAL_ASSETS } from "./beach-asset-manifest";

const SKY_ASSET = BEACH_PHOTOREAL_ASSETS.find(({ id }) => id === "sky");
if (!SKY_ASSET) throw new Error("Beach sky HDRI is missing from the manifest");

export const BEACH_SKY_SRC = SKY_ASSET.src;

/**
 * Direction of the HDRI's sun in the panorama's own frame, measured from
 * `sky.hdr` itself: peak luminance 5529.5 at pixel (614.4, 250.8), which is
 * elevation +1.652deg, azimuth +36.176deg. Unit length.
 *
 * This is the *map-space* measurement. The environment is rotated (see
 * `BEACH_ENVIRONMENT_ROTATION_Y_DEGREES`), so the vector to actually place a
 * light on is `BEACH_SUN_WORLD_DIRECTION`.
 */
export const BEACH_SUN_DIRECTION: readonly [number, number, number] = [
  0.8069, 0.0288, 0.5900,
];

/**
 * Yaw applied to both the background and the environment map, in degrees.
 *
 * The HDRI is a real location, so only one sector of its horizon is open
 * water; the rest is broken coastline. Measured per-azimuth roughness of the
 * below-horizon band is lowest between map azimuth +45deg and +75deg (0.0556
 * and 0.0505, against 0.062 to 0.080 elsewhere). The sea in this scene is at
 * -z from the rail, i.e. world azimuth -90deg.
 *
 * three samples the environment as `envMapRotation * worldDirection`, which
 * works out to `mapAzimuth = worldAzimuth + yaw`. At +145deg, world -90deg
 * samples map +55deg — the middle of the smooth sector. Checked by sweeping
 * yaw against the measured 1-degree roughness bins: +145deg gives a seaward
 * hemisphere mean of 0.0360 against 0.0489 landward (ratio 0.737), where
 * leaving it at 0 gives 0.0459 seaward against 0.0388 landward (ratio 1.183) —
 * that is, unrotated the scene would face the broken coastline.
 */
export const BEACH_ENVIRONMENT_ROTATION_Y_DEGREES = 145;

/**
 * The sun direction after the environment rotation, so the directional light
 * agrees with the sky it came from.
 *
 * The rotation carries the sun to world azimuth -108.8deg, which puts it low
 * over the water 95.1deg off the camera's down-shore view axis (-13.74deg):
 * a raking side-light off the sea. The addendum's "49.9deg off the view axis"
 * describes the same sun measured before the rotation; rotating the sky
 * without rotating the light is what would make the specular highlight and the
 * sky disagree, so both move together.
 *
 * TODO(Task 10): 95.1deg is close to a pure cross-light, which is the one
 * geometry that can leave faces edge-lit and the frames rim-lit on one side
 * only. The relationship is pinned by test so it cannot drift silently, but
 * whether it *reads* well needs confirming on real frames in the visual pass.
 */
export const BEACH_SUN_WORLD_DIRECTION: readonly [number, number, number] = [
  -0.3225, 0.0288, -0.9461,
];

/** Distance at which the sun proxy is placed. Only the direction matters. */
const BEACH_SUN_DISTANCE_METRES = 120;

/** Sampled at the HDRI's sun centroid: linear RGB 14006.7 / 3598.1 / 0. */
export const BEACH_SUN_TINT = "#ff8e1b";

/** Sampled below the horizon; stands in for bounce off wet sand and water. */
const BEACH_BOUNCE_TINT = "#9e8a7f";

/**
 * Key-light intensity, tier-independent.
 *
 * The sun is the same physical light on every tier — only the environment mip
 * budget and the fill below it change — so this is one constant rather than a
 * per-tier record that pretended to vary.
 */
const SUN_INTENSITY = 2.4;

/**
 * The HDRI already carries the ambient term, so the hemisphere light only
 * fills the shadow side. Lower tiers lean on it slightly harder because they
 * see fewer environment mip levels.
 */
const BOUNCE_INTENSITY: Record<BeachWorldQualityTier, number> = {
  desktop: 0.35,
  mobile: 0.45,
  reduced: 0.55,
};

export type BeachLightingProps = {
  readonly qualityTier: BeachWorldQualityTier;
};

export function BeachLighting({ qualityTier }: BeachLightingProps) {
  const renderer = useThree(({ gl }) => gl);

  useEffect(() => {
    const previousToneMapping = renderer.toneMapping;
    const previousExposure = renderer.toneMappingExposure;
    /* eslint-disable react-hooks/immutability */
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    return () => {
      renderer.toneMapping = previousToneMapping;
      renderer.toneMappingExposure = previousExposure;
    };
    /* eslint-enable react-hooks/immutability */
  }, [renderer]);

  const rotation = useMemo(
    () => new Euler(0, (BEACH_ENVIRONMENT_ROTATION_Y_DEGREES * Math.PI) / 180, 0),
    [],
  );

  const sunPosition = useMemo(
    () =>
      new Vector3(...BEACH_SUN_WORLD_DIRECTION).multiplyScalar(
        BEACH_SUN_DISTANCE_METRES,
      ),
    [],
  );

  return (
    <group data-beach-photoreal-lighting>
      <Environment
        backgroundRotation={rotation}
        environmentRotation={rotation}
        files={BEACH_SKY_SRC}
        background
      />
      {/* No shadow map: a 1.65-degree sun casts shadows longer than the sand
          plane, and the frames read from the environment term instead. */}
      <directionalLight
        castShadow={false}
        color={BEACH_SUN_TINT}
        intensity={SUN_INTENSITY}
        position={sunPosition}
      />
      <hemisphereLight
        groundColor={BEACH_BOUNCE_TINT}
        intensity={BOUNCE_INTENSITY[qualityTier]}
      />
    </group>
  );
}
