"use client";

import { useEffect, useMemo } from "react";
import {
  BackSide,
  CylinderGeometry,
  MeshBasicMaterial,
  type Texture,
} from "three";

import type { ForestPathSample } from "../forest-world-data";

export type ForestBackdropProps = {
  readonly pathCenterline: readonly ForestPathSample[];
  readonly texture: Texture;
};

const BACKDROP_RADIUS = 96;
const BACKDROP_HEIGHT = 74;

/**
 * The rail runs roughly 120m down −Z, so a cylinder pinned to the origin would
 * leave the camera hugging its wall by mid-journey and standing outside it by
 * the finale — which is what put an unpainted sky wedge above the treeline.
 * Following the path's centroid keeps every clearing near the middle of the
 * enclosure instead.
 */
export function getForestBackdropCenter(
  pathCenterline: readonly ForestPathSample[],
): readonly [number, number, number] {
  if (pathCenterline.length === 0) return [0, BACKDROP_HEIGHT * 0.32, 0];

  let sumX = 0;
  let sumZ = 0;
  for (const { position } of pathCenterline) {
    sumX += position[0];
    sumZ += position[2];
  }

  return [
    sumX / pathCenterline.length,
    BACKDROP_HEIGHT * 0.32,
    sumZ / pathCenterline.length,
  ];
}

export function ForestPhotorealBackdrop({
  pathCenterline,
  texture,
}: ForestBackdropProps) {
  const geometry = useMemo(
    () => new CylinderGeometry(
      BACKDROP_RADIUS,
      BACKDROP_RADIUS,
      BACKDROP_HEIGHT,
      48,
      1,
      true,
    ),
    [],
  );

  const material = useMemo(
    () => new MeshBasicMaterial({
      color: 0x9fb894,
      depthWrite: false,
      fog: false,
      map: texture,
      side: BackSide,
      toneMapped: true,
    }),
    [texture],
  );

  const center = useMemo(
    () => getForestBackdropCenter(pathCenterline),
    [pathCenterline],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  return (
    <mesh
      args={[geometry, material]}
      castShadow={false}
      frustumCulled={false}
      position={[center[0], center[1], center[2]]}
      receiveShadow={false}
      renderOrder={-1}
    />
  );
}
