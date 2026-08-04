"use client";

import { useEffect, useMemo } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  MeshStandardMaterial,
  RepeatWrapping,
  Vector3,
  type Texture,
} from "three";

import {
  getForestBakedAoFactor,
  type ForestPathSample,
} from "../forest-world-data";
import { FOREST_PBR_SURFACE_POLICIES } from "./forest-material-policy";

export type ForestTerrainProps = {
  readonly armMap: Texture;
  readonly colorMap: Texture;
  readonly normalMap: Texture;
  readonly pathCenterline: readonly ForestPathSample[];
};

export function createForestRibbonGeometry(
  path: readonly ForestPathSample[],
  width: number,
  uvWidth: number,
): BufferGeometry {
  const segmentCount = path.length - 1;
  const lateralSegmentCount = 4;
  const colors: number[] = [];
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let distance = 0;
  let previousPoint: Vector3 | null = null;

  for (let index = 0; index <= segmentCount; index += 1) {
    const progress = index / segmentCount;
    const sample = path[index]!;
    const point = new Vector3(...sample.position);
    const tangent = new Vector3(...sample.tangent).normalize();
    const across = new Vector3(-tangent.z, 0, tangent.x).normalize();
    if (previousPoint) distance += previousPoint.distanceTo(point);
    previousPoint = point;

    for (
      let lateralIndex = 0;
      lateralIndex <= lateralSegmentCount;
      lateralIndex += 1
    ) {
      const lateralProgress = lateralIndex / lateralSegmentCount;
      const lateralRatio = lateralProgress * 2 - 1;
      const vertex = point
        .clone()
        .addScaledVector(across, -lateralRatio * width * 0.5);
      const bakedAo = getForestBakedAoFactor(progress, lateralRatio);
      positions.push(vertex.x, vertex.y, vertex.z);
      colors.push(bakedAo, bakedAo, bakedAo);
      uvs.push((lateralProgress * width) / uvWidth, distance / uvWidth);
    }

    if (index < segmentCount) {
      const rowStart = index * (lateralSegmentCount + 1);
      const nextRowStart = rowStart + lateralSegmentCount + 1;
      for (
        let lateralIndex = 0;
        lateralIndex < lateralSegmentCount;
        lateralIndex += 1
      ) {
        const current = rowStart + lateralIndex;
        const next = nextRowStart + lateralIndex;
        indices.push(current, next, current + 1, next, next + 1, current + 1);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function ForestPhotorealTerrain({
  armMap,
  colorMap,
  normalMap,
  pathCenterline,
}: ForestTerrainProps) {
  const terrainGeometry = useMemo(
    () => createForestRibbonGeometry(pathCenterline, 68, 5.5),
    [pathCenterline],
  );
  const pathGeometry = useMemo(
    () => createForestRibbonGeometry(pathCenterline, 2.55, 2.2),
    [pathCenterline],
  );

  const terrainMaterial = useMemo(() => {
    for (const map of [armMap, colorMap, normalMap]) {
      map.wrapS = RepeatWrapping;
      map.wrapT = RepeatWrapping;
    }

    return new MeshStandardMaterial({
      aoMap: armMap,
      aoMapIntensity: 1,
      color: 0xdfe8cf,
      emissiveIntensity: FOREST_PBR_SURFACE_POLICIES.ground.emissiveIntensity,
      map: colorMap,
      metalness: FOREST_PBR_SURFACE_POLICIES.ground.metalness,
      normalMap,
      roughness: FOREST_PBR_SURFACE_POLICIES.ground.roughness,
      roughnessMap: armMap,
      vertexColors: true,
    });
  }, [armMap, colorMap, normalMap]);

  const pathMaterial = useMemo(() => new MeshStandardMaterial({
    aoMap: armMap,
    aoMapIntensity: 0.85,
    color: 0xb6a98a,
    emissiveIntensity: FOREST_PBR_SURFACE_POLICIES.ground.emissiveIntensity,
    map: colorMap,
    metalness: FOREST_PBR_SURFACE_POLICIES.ground.metalness,
    normalMap,
    roughness: FOREST_PBR_SURFACE_POLICIES.ground.roughness,
    roughnessMap: armMap,
    vertexColors: true,
  }), [armMap, colorMap, normalMap]);

  useEffect(() => () => {
    terrainGeometry.dispose();
    pathGeometry.dispose();
  }, [pathGeometry, terrainGeometry]);

  useEffect(() => () => {
    terrainMaterial.dispose();
    pathMaterial.dispose();
  }, [pathMaterial, terrainMaterial]);

  return (
    <group data-forest-photoreal-terrain>
      <mesh
        args={[terrainGeometry, terrainMaterial]}
        castShadow={false}
        receiveShadow={false}
      />
      <mesh
        args={[pathGeometry, pathMaterial]}
        castShadow={false}
        position={[0, 0.012, 0]}
        receiveShadow={false}
      />
    </group>
  );
}
