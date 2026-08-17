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
 * `sky.hdr` itself: peak luminance 65539.6 at pixel (652.5, 219.5), which is
 * elevation +12.832deg, azimuth +49.395deg. Unit length.
 *
 * This is the *map-space* measurement. The environment is rotated (see
 * `BEACH_ENVIRONMENT_ROTATION_Y_DEGREES`), so the vector to actually place a
 * light on is `BEACH_SUN_WORLD_DIRECTION`.
 */
export const BEACH_SUN_DIRECTION: readonly [number, number, number] = [
  0.6346, 0.2221, 0.7402,
];

/**
 * Yaw applied to both the background and the environment map, in degrees.
 *
 * `table_mountain_1_puresky` is a pure sky with no horizon geography, so unlike
 * the coastal HDRI it replaced there is no "open water sector" to aim at — every
 * azimuth is equally usable. That frees the rotation to do the thing the scene
 * actually needs: put the sun where the guest can see it.
 *
 * three samples the environment as `envMapRotation * worldDirection`, which works
 * out to `worldAzimuth = mapAzimuth - yaw`. At +67.395deg the measured map
 * azimuth +49.395deg lands at world -18deg. The camera walks the rail looking
 * down-shore at azimuth -13.74deg, and the horizontal half-FOV is 12.16deg on the
 * authored 390x844 mobile view and 36.73deg at 1280x800, so a sun 4.3deg off the
 * view axis is inside the frame on both — which is what "bright sunrise with a
 * visible sun" requires. Its 12.83deg elevation also clears the frames' 1.42m
 * centre height, so the glare sits in open sky rather than behind a photograph.
 */
export const BEACH_ENVIRONMENT_ROTATION_Y_DEGREES = 67.395;

/**
 * The sun direction after the environment rotation, so the directional light
 * agrees with the sky it came from.
 *
 * World azimuth -18deg, elevation +12.832deg. This is a near-frontal key light
 * 4.3deg off the camera's down-shore view axis, replacing the 95.1deg
 * cross-light the coastal HDRI forced: the old geometry raked the frames from
 * the side and left them rim-lit on one edge, which is the risk the previous
 * TODO here was raised against. Rotating the sky without rotating the light is
 * what would make the specular highlight and the sky disagree, so both move
 * together.
 */
export const BEACH_SUN_WORLD_DIRECTION: readonly [number, number, number] = [
  0.9273, 0.2221, -0.3013,
];

/** Distance at which the sun proxy is placed. Only the direction matters. */
const BEACH_SUN_DISTANCE_METRES = 120;

/**
 * Sampled at the HDRI's sun centroid: linear RGB 61837.4 / 54352.6 / 35893.0,
 * normalised to the brightest channel.
 *
 * Warm white rather than the orange the previous HDRI's horizon sun gave
 * (`#ff8e1b`, from a sun sitting 1.65deg above the horizon with zero blue
 * channel). A 12.8deg sun has climbed out of the deep atmospheric reddening, and
 * a near-orange key would re-stain the sand this change exists to make white.
 */
export const BEACH_SUN_TINT = "#fff1c8";

/** Stands in for bounce off pale dry sand and water under a high-key sky. */
const BEACH_BOUNCE_TINT = "#b9a894";

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
      {/* No shadow map: at 12.83deg the sun still throws shadows roughly 4.4x
          each object's height, which overruns the sand plane, and the frames
          read from the environment term instead. */}
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
