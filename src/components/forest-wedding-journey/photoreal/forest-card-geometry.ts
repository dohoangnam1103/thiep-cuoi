import {
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
} from "three";

import {
  getForestAtlasUvRect,
  type ForestMaterialAtlasName,
} from "../forest-world-data";

export const FOREST_CONIFER_CELL_COUNT = 4;
export const FOREST_BARK_UV_MIN = 0.5;

/**
 * Two quads crossed at 90°, pivoted at the base so instance scale reads as
 * height. Both quads share the same atlas cell so a single instanced draw
 * covers the whole tier.
 */
export function createForestCrossedCardGeometry(
  atlasName: ForestMaterialAtlasName,
  cell: number,
): BufferGeometry {
  const rect = getForestAtlasUvRect(atlasName, cell);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const quads = [
    { axis: "x", normal: [0, 0, 1] },
    { axis: "z", normal: [1, 0, 0] },
  ] as const;

  quads.forEach((quad, quadIndex) => {
    const corners = [
      [-0.5, 0],
      [0.5, 0],
      [0.5, 1],
      [-0.5, 1],
    ] as const;

    for (const [lateral, height] of corners) {
      if (quad.axis === "x") {
        positions.push(lateral, height, 0);
      } else {
        positions.push(0, height, lateral);
      }
      normals.push(...quad.normal);
      uvs.push(
        rect.offset[0] + (lateral + 0.5) * rect.repeat[0],
        rect.offset[1] + height * rect.repeat[1],
      );
    }

    const base = quadIndex * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("uv1", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Unit-height tapered trunk pivoted at the base, UV-mapped into the bark half
 * of the conifer atlas so trunks and branch cards share one material.
 */
export function createForestTrunkGeometry(
  radialSegments: number,
  uvRepeatY: number,
): BufferGeometry {
  const geometry = new CylinderGeometry(0.13, 0.31, 1, radialSegments, 1, false);
  geometry.translate(0, 0.5, 0);
  const uv = geometry.getAttribute("uv");
  const remapped = new Float32Array(uv.count * 2);

  for (let index = 0; index < uv.count; index += 1) {
    remapped[index * 2] =
      FOREST_BARK_UV_MIN + uv.getX(index) * (1 - FOREST_BARK_UV_MIN);
    remapped[index * 2 + 1] = uv.getY(index) * uvRepeatY;
  }

  geometry.setAttribute("uv", new Float32BufferAttribute(remapped, 2));
  geometry.setAttribute("uv1", new Float32BufferAttribute(remapped, 2));
  geometry.computeBoundingSphere();
  return geometry;
}
