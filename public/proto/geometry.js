// Geometry builders for the forest prototype.
// Each helper returns plain BufferGeometry so the same approach can drop into
// the production instanced meshes without extra dependencies.

import * as THREE from "./three.module.js";

// Three intersecting quads. Reads as a tuft from any angle, unlike the
// 3-sided cone currently used in the lab.
export function createGrassClumpGeometry({ planes = 3, width = 1, height = 1 } = {}) {
  const geometries = [];
  for (let index = 0; index < planes; index += 1) {
    const plane = new THREE.PlaneGeometry(width, height, 1, 3);
    plane.translate(0, height * 0.5, 0);
    plane.rotateY((Math.PI / planes) * index);
    geometries.push(plane);
  }
  return mergeGeometries(geometries);
}

// Bark cylinder that tapers and kinks slightly so it does not read as a pipe.
export function createTrunkGeometry({
  height = 5.6,
  radiusBottom = 0.42,
  radiusTop = 0.16,
  radialSegments = 10,
  heightSegments = 8,
  lean = 0.16,
} = {}) {
  const geometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    radialSegments,
    heightSegments,
    true,
  );
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index);
    const t = (vertex.y + height * 0.5) / height;
    // Gentle S-curve plus a swelling root flare.
    vertex.x += Math.sin(t * Math.PI * 1.15) * lean;
    vertex.z += Math.cos(t * Math.PI * 0.85) * lean * 0.45;
    const flare = Math.max(0, 1 - t * 5.5) * 0.22;
    vertex.x *= 1 + flare;
    vertex.z *= 1 + flare;
    position.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }

  geometry.translate(0, height * 0.5, 0);
  geometry.computeVertexNormals();
  return geometry;
}

// Radial spray of billboard cards forming one conifer branch tier.
export function createBranchTierGeometry({
  cards = 7,
  radius = 1,
  cardWidth = 1.15,
  cardHeight = 0.95,
  droop = 0.22,
} = {}) {
  const geometries = [];
  for (let index = 0; index < cards; index += 1) {
    const angle = (Math.PI * 2 * index) / cards + (index % 2) * 0.18;
    const card = new THREE.PlaneGeometry(cardWidth, cardHeight, 1, 2);
    card.translate(0, cardHeight * 0.35, 0);
    card.rotateX(-Math.PI * 0.5 + droop);
    card.rotateY(angle);
    card.translate(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
    geometries.push(card);
  }
  return mergeGeometries(geometries);
}

// Ground plane carrying baked ambient occlusion in vertex colours.
export function createGroundGeometry({
  size = 60,
  segments = 96,
  hedgeDistance = 15,
} = {}) {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI * 0.5);

  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);

    // Low-frequency undulation keeps the ground from looking like a table.
    const height =
      Math.sin(x * 0.16) * 0.16 +
      Math.cos(z * 0.13) * 0.14 +
      Math.sin((x + z) * 0.07) * 0.1;
    position.setY(index, height);

    // Baked occlusion: darkens as the ground approaches the hedge wall, which
    // is what reads as "the hedge casts a shadow" without a shadow map.
    const distanceToHedge = Math.abs(hedgeDistance - z);
    const hedgeOcclusion = THREE.MathUtils.clamp(
      1 - Math.exp(-distanceToHedge * 0.16),
      0.32,
      1,
    );
    const dapple =
      0.9 + Math.sin(x * 0.38) * 0.05 + Math.cos(z * 0.44 + x * 0.12) * 0.05;

    const shade = hedgeOcclusion * dapple;
    color.setHSL(0.24, 0.3, 0.2 + shade * 0.16);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// Minimal merge so the prototype avoids pulling in BufferGeometryUtils.
function mergeGeometries(geometries) {
  const merged = new THREE.BufferGeometry();
  const attributeNames = ["position", "normal", "uv"];
  const totals = { position: 0, normal: 0, uv: 0 };
  let indexTotal = 0;

  for (const geometry of geometries) {
    for (const name of attributeNames) {
      totals[name] += geometry.attributes[name].array.length;
    }
    indexTotal += geometry.index ? geometry.index.count : 0;
  }

  const arrays = {
    position: new Float32Array(totals.position),
    normal: new Float32Array(totals.normal),
    uv: new Float32Array(totals.uv),
  };
  const indices = new Uint32Array(indexTotal);
  const offsets = { position: 0, normal: 0, uv: 0 };
  let indexOffset = 0;
  let vertexOffset = 0;

  for (const geometry of geometries) {
    for (const name of attributeNames) {
      arrays[name].set(geometry.attributes[name].array, offsets[name]);
      offsets[name] += geometry.attributes[name].array.length;
    }
    if (geometry.index) {
      for (let index = 0; index < geometry.index.count; index += 1) {
        indices[indexOffset + index] = geometry.index.getX(index) + vertexOffset;
      }
      indexOffset += geometry.index.count;
    }
    vertexOffset += geometry.attributes.position.count;
    geometry.dispose();
  }

  merged.setAttribute("position", new THREE.BufferAttribute(arrays.position, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(arrays.normal, 3));
  merged.setAttribute("uv", new THREE.BufferAttribute(arrays.uv, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  return merged;
}
