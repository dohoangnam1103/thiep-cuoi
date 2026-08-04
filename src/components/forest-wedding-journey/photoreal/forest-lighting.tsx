"use client";

import { ACESFilmicToneMapping } from "three";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { useForestSceneAtmosphere } from "../forest-scene-atmosphere";

/** Sky/haze colour the backdrop cylinder and the distance fog both resolve to. */
export const FOREST_PHOTOREAL_ATMOSPHERE = {
  color: "#8fae7f",
  far: 76,
  near: 14,
} as const;

export function ForestPhotorealLighting() {
  const renderer = useThree(({ gl }) => gl);

  useForestSceneAtmosphere(FOREST_PHOTOREAL_ATMOSPHERE);

  useEffect(() => {
    const previousToneMapping = renderer.toneMapping;
    const previousExposure = renderer.toneMappingExposure;
    // The photoreal skin needs filmic tone mapping, but the legacy skins must
    // keep the renderer they were authored against, so scope it to this mount
    // instead of configuring the shared Canvas.
    /* eslint-disable react-hooks/immutability */
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    return () => {
      renderer.toneMapping = previousToneMapping;
      renderer.toneMappingExposure = previousExposure;
    };
    /* eslint-enable react-hooks/immutability */
  }, [renderer]);

  return (
    <>
      <hemisphereLight args={["#e8f4c8", "#1f3320", 0.86]} />
      <ambientLight color="#cfe4b4" intensity={0.24} />
      <directionalLight
        color="#fff0c0"
        intensity={2.35}
        position={[8, 13, 4]}
      />
      <directionalLight
        color="#8fb98a"
        intensity={0.42}
        position={[-7, 6, -8]}
      />
    </>
  );
}
