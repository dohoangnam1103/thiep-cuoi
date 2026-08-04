import {
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Shape,
} from "three";

import { getForestPropBevelRadius } from "./photoreal/forest-prop-material-policy";

/**
 * Bevelled box props are shared across every scene assembly and live for the
 * whole session, so they are cached by dimension rather than rebuilt per mount.
 * Nothing disposes them: the set is bounded by the authored prop list, and a
 * ref-counted cache would cost more than the handful of kilobytes it saves.
 */
const bevelledBoxCache = new Map<string, BufferGeometry>();
const taperedWoodCache = new Map<string, BufferGeometry>();

function roundedRectShape(
  width: number,
  height: number,
  radius: number,
): Shape {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const shape = new Shape();

  shape.moveTo(-halfWidth + radius, -halfHeight);
  shape.lineTo(halfWidth - radius, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
  shape.lineTo(halfWidth, halfHeight - radius);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
  shape.lineTo(-halfWidth + radius, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
  shape.lineTo(-halfWidth, -halfHeight + radius);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);

  return shape;
}

/**
 * A box with softened edges, centred on its own origin so it drops in wherever
 * a `boxGeometry` used to sit. The bevel exists to catch a highlight along each
 * edge: without shadow maps that edge light is the only thing separating one
 * ivory prop from the next.
 */
export function createForestBevelledBoxGeometry(
  width: number,
  height: number,
  depth: number,
): BufferGeometry {
  const key = `${width}:${height}:${depth}`;
  const cached = bevelledBoxCache.get(key);
  if (cached) return cached;

  const bevel = getForestPropBevelRadius(width, height, depth);
  const cornerRadius = Math.min(bevel * 2, Math.min(width, height) * 0.24);
  // The extrusion consumes bevel from both faces, so the profile depth shrinks
  // by twice the bevel to keep the finished prop at its authored size.
  const profileDepth = Math.max(depth - bevel * 2, depth * 0.2);

  const geometry = new ExtrudeGeometry(
    roundedRectShape(width, height, Math.max(cornerRadius, 0.0001)),
    {
      bevelEnabled: bevel > 0,
      bevelSegments: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: 2,
      depth: profileDepth,
      steps: 1,
    },
  );

  geometry.translate(0, 0, -profileDepth / 2);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const uv = geometry.getAttribute("uv");
  if (uv) geometry.setAttribute("uv1", uv);

  bevelledBoxCache.set(key, geometry);
  return geometry;
}

/**
 * A wooden member of unit length pivoted at its centre, tapered toward the top
 * so it reads as cut timber instead of extruded pipe. Instance or mesh scale
 * supplies the real length.
 */
export function createForestTaperedWoodGeometry(
  baseRadius: number,
  taper: number,
  radialSegments: number,
): BufferGeometry {
  const key = `${baseRadius}:${taper}:${radialSegments}`;
  const cached = taperedWoodCache.get(key);
  if (cached) return cached;

  const geometry = new CylinderGeometry(
    baseRadius * taper,
    baseRadius,
    1,
    radialSegments,
  );
  geometry.computeBoundingSphere();
  const uv = geometry.getAttribute("uv");
  if (uv) geometry.setAttribute("uv1", uv);

  taperedWoodCache.set(key, geometry);
  return geometry;
}
