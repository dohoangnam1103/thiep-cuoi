"use client";

import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  DynamicDrawUsage,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  type Material,
  type Texture,
} from "three";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";

import type { ForestJourneyCueState } from "./forest-cue-state";

import {
  createForestContactCues,
  getForestBakedAoFactor,
  getForestEnvironmentLayerContract,
  getForestAtlasUvRect,
  type ForestMaterialAtlasName,
  type ForestPathSample,
  type ForestWorldPlacement,
  type ForestWorldPlacements,
} from "./forest-world-data";

export type ForestMaterialTexturePack = {
  readonly foliage: Texture;
  readonly ground: Texture;
  readonly petals: Texture;
  readonly wildflowers: Texture;
};

export type ForestEnvironmentProps = {
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly placements: ForestWorldPlacements;
  readonly reducedMotion: boolean;
  readonly texturePack: ForestMaterialTexturePack | null;
};

type RenderPlacement = {
  readonly atlasCell?: number;
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly scale: readonly [number, number, number];
  readonly tint: number;
  readonly windPhase: number;
};

type GeometryKind =
  | "atlas-card"
  | "branch"
  | "canopy"
  | "contact"
  | "far-trunk"
  | "flower-head"
  | "flower-bud"
  | "flower-stem"
  | "grass"
  | "petal"
  | "root"
  | "shrub"
  | "stone"
  | "trunk";

const ATLAS_VERTEX_SHADER = `
  attribute vec4 instanceAtlasRect;
  attribute vec3 instanceTint;
  attribute float instanceWindPhase;
  uniform float uTime;
  uniform float uWindStrength;
  varying vec2 vAtlasUv;
  varying vec3 vInstanceTint;

  void main() {
    vec3 transformed = position;
    float anchoredHeight = clamp(uv.y, 0.0, 1.0);
    transformed.x += sin(uTime * 0.72 + instanceWindPhase) * uWindStrength * anchoredHeight;
    vAtlasUv = instanceAtlasRect.xy + uv * instanceAtlasRect.zw;
    vInstanceTint = instanceTint;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
  }
`;

const ATLAS_FRAGMENT_SHADER = `
  uniform sampler2D uMap;
  varying vec2 vAtlasUv;
  varying vec3 vInstanceTint;

  void main() {
    vec4 texel = texture2D(uMap, vAtlasUv);
    if (texel.a < 0.12) discard;
    gl_FragColor = vec4(texel.rgb * vInstanceTint, texel.a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const SOLID_WIND_VERTEX_SHADER = `
  attribute vec3 instanceTint;
  attribute float instanceWindPhase;
  uniform float uTime;
  uniform float uWindStrength;
  varying vec3 vInstanceTint;
  varying float vShade;

  void main() {
    vec3 transformed = position;
    float anchoredHeight = clamp(position.y + 0.5, 0.0, 1.0);
    transformed.x += sin(uTime * 0.78 + instanceWindPhase) * uWindStrength * anchoredHeight;
    vInstanceTint = instanceTint;
    vShade = 0.78 + max(normal.y, 0.0) * 0.22;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
  }
`;

const SOLID_WIND_FRAGMENT_SHADER = `
  varying vec3 vInstanceTint;
  varying float vShade;

  void main() {
    gl_FragColor = vec4(vInstanceTint * vShade, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function createGeometry(kind: GeometryKind): BufferGeometry {
  switch (kind) {
    case "atlas-card":
      return new PlaneGeometry(1, 1);
    case "branch":
      return new CylinderGeometry(0.055, 0.09, 1.7, 5);
    case "canopy":
      return new DodecahedronGeometry(1, 0);
    case "contact":
      return new CircleGeometry(1, 12);
    case "far-trunk":
      return new CylinderGeometry(0.13, 0.23, 4.8, 5);
    case "flower-head":
      return new PlaneGeometry(1, 1);
    case "flower-bud":
      return new DodecahedronGeometry(0.13, 0);
    case "flower-stem":
      return new CylinderGeometry(0.018, 0.025, 0.72, 5);
    case "grass":
      return new ConeGeometry(0.12, 0.66, 3);
    case "petal":
      return new CircleGeometry(0.5, 5);
    case "root":
      return new CylinderGeometry(0.055, 0.09, 1.35, 5);
    case "shrub":
      return new DodecahedronGeometry(0.65, 0);
    case "stone":
      return new DodecahedronGeometry(0.38, 0);
    case "trunk":
      return new CylinderGeometry(0.22, 0.36, 4.45, 7);
  }
}

function createRibbonGeometry(
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

    for (let lateralIndex = 0; lateralIndex <= lateralSegmentCount; lateralIndex += 1) {
      const lateralProgress = lateralIndex / lateralSegmentCount;
      const lateralRatio = lateralProgress * 2 - 1;
      const vertex = point.clone().addScaledVector(across, -lateralRatio * width * 0.5);
      const bakedAo = getForestBakedAoFactor(progress, lateralRatio);
      positions.push(vertex.x, vertex.y, vertex.z);
      colors.push(bakedAo, bakedAo, bakedAo);
      uvs.push(lateralProgress * width / uvWidth, distance / uvWidth);
    }

    if (index < segmentCount) {
      const rowStart = index * (lateralSegmentCount + 1);
      const nextRowStart = rowStart + lateralSegmentCount + 1;
      for (let lateralIndex = 0; lateralIndex < lateralSegmentCount; lateralIndex += 1) {
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

function makeAtlasMaterial(texture: Texture): ShaderMaterial {
  return new ShaderMaterial({
    fragmentShader: ATLAS_FRAGMENT_SHADER,
    side: DoubleSide,
    transparent: true,
    uniforms: {
      uMap: { value: texture },
      uTime: { value: 0 },
      uWindStrength: { value: 0 },
    },
    vertexShader: ATLAS_VERTEX_SHADER,
  });
}

function makeSolidWindMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    fragmentShader: SOLID_WIND_FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uWindStrength: { value: 0 },
    },
    vertexShader: SOLID_WIND_VERTEX_SHADER,
  });
}

function addShaderAttributes(
  geometry: BufferGeometry,
  placements: readonly RenderPlacement[],
  atlasName: ForestMaterialAtlasName | null,
) {
  const tintValues = new Float32Array(placements.length * 3);
  const windValues = new Float32Array(placements.length);
  const atlasValues = atlasName ? new Float32Array(placements.length * 4) : null;
  const color = new Color();

  placements.forEach((placement, index) => {
    color.setHex(placement.tint);
    color.toArray(tintValues, index * 3);
    windValues[index] = placement.windPhase;

    if (atlasValues && atlasName) {
      const rect = getForestAtlasUvRect(atlasName, placement.atlasCell ?? 0);
      atlasValues.set([...rect.offset, ...rect.repeat], index * 4);
    }
  });

  geometry.setAttribute("instanceTint", new InstancedBufferAttribute(tintValues, 3));
  geometry.setAttribute("instanceWindPhase", new InstancedBufferAttribute(windValues, 1));
  if (atlasValues) {
    geometry.setAttribute("instanceAtlasRect", new InstancedBufferAttribute(atlasValues, 4));
  }
}

function ForestInstances({
  atlasName = null,
  kind,
  material,
  placements,
  shaderAttributes = false,
}: {
  readonly atlasName?: ForestMaterialAtlasName | null;
  readonly kind: GeometryKind;
  readonly material: Material;
  readonly placements: readonly RenderPlacement[];
  readonly shaderAttributes?: boolean;
}) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const geometry = useMemo(() => {
    const nextGeometry = createGeometry(kind);
    if (shaderAttributes) addShaderAttributes(nextGeometry, placements, atlasName);
    return nextGeometry;
  }, [atlasName, kind, placements, shaderAttributes]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const object = new Object3D();
    const color = new Color();

    placements.forEach((placement, index) => {
      object.position.set(...placement.position);
      object.rotation.set(...placement.rotation);
      object.scale.set(...placement.scale);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
      if (!shaderAttributes) mesh.setColorAt(index, color.setHex(placement.tint));
    });
    mesh.count = placements.length;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements, shaderAttributes]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (placements.length === 0) return null;
  return (
    <instancedMesh
      args={[geometry, material, placements.length]}
      castShadow={false}
      frustumCulled
      receiveShadow={false}
      ref={meshRef}
    />
  );
}

function toRenderPlacement(
  placement: ForestWorldPlacement,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number],
  scale: readonly [number, number, number],
  tint = placement.tint,
  atlasCell?: number,
): RenderPlacement {
  return {
    atlasCell,
    position,
    rotation,
    scale,
    tint,
    windPhase: placement.windPhase,
  };
}

function disposeMaterials(materials: readonly Material[]) {
  for (const material of materials) material.dispose();
}

export function ForestEnvironment({
  cueRef,
  placements,
  reducedMotion,
  texturePack,
}: ForestEnvironmentProps) {
  const layerContract = useMemo(
    () => getForestEnvironmentLayerContract(texturePack ? "textured" : "procedural"),
    [texturePack],
  );
  const terrainGeometry = useMemo(
    () => createRibbonGeometry(placements.pathCenterline, 68, 6),
    [placements.pathCenterline],
  );
  const pathGeometry = useMemo(
    () => createRibbonGeometry(placements.pathCenterline, 2.55, 2.55),
    [placements.pathCenterline],
  );

  const groundMaterial = useMemo(() => new MeshStandardMaterial({
    color: texturePack ? 0xffffff : 0x718558,
    emissive: texturePack ? 0x526747 : 0x000000,
    emissiveIntensity: texturePack ? 0.22 : 0,
    map: texturePack?.ground ?? null,
    roughness: 1,
    vertexColors: true,
  }), [texturePack]);
  const pathMaterial = useMemo(() => new MeshStandardMaterial({
    color: texturePack ? 0xc8d4a2 : 0x7f9463,
    emissive: texturePack ? 0x53633e : 0x000000,
    emissiveIntensity: texturePack ? 0.46 : 0,
    map: texturePack?.ground ?? null,
    roughness: 1,
    vertexColors: true,
  }), [texturePack]);
  const woodMaterial = useMemo(() => new MeshStandardMaterial({
    color: 0xfff1df,
    emissive: 0x513828,
    emissiveIntensity: 0.3,
    roughness: 0.94,
    vertexColors: true,
  }), []);
  const stemMaterial = useMemo(() => new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    vertexColors: true,
  }), []);
  const stoneMaterial = useMemo(() => new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    vertexColors: true,
  }), []);
  const contactMaterial = useMemo(() => new MeshBasicMaterial({
    color: 0x263a27,
    depthWrite: false,
    opacity: 0.16,
    side: DoubleSide,
    transparent: true,
  }), []);
  const foliageMaterial = useMemo(
    () => texturePack ? makeAtlasMaterial(texturePack.foliage) : makeSolidWindMaterial(),
    [texturePack],
  );
  const flowerMaterial = useMemo(
    () => texturePack ? makeAtlasMaterial(texturePack.wildflowers) : makeSolidWindMaterial(),
    [texturePack],
  );
  const grassMaterial = useMemo(() => makeSolidWindMaterial(), []);
  const canopyMaterial = useMemo(() => makeSolidWindMaterial(), []);
  const shrubMaterial = useMemo(() => makeSolidWindMaterial(), []);
  const animatedMaterialsRef = useRef({
    canopy: canopyMaterial,
    flower: flowerMaterial,
    foliage: foliageMaterial,
    grass: grassMaterial,
    shrub: shrubMaterial,
  });

  useEffect(() => {
    animatedMaterialsRef.current = {
      canopy: canopyMaterial,
      flower: flowerMaterial,
      foliage: foliageMaterial,
      grass: grassMaterial,
      shrub: shrubMaterial,
    };
  }, [canopyMaterial, flowerMaterial, foliageMaterial, grassMaterial, shrubMaterial]);

  useEffect(() => () => {
    terrainGeometry.dispose();
    pathGeometry.dispose();
  }, [pathGeometry, terrainGeometry]);

  useEffect(() => () => disposeMaterials([
    groundMaterial,
    pathMaterial,
    woodMaterial,
    stemMaterial,
    stoneMaterial,
    contactMaterial,
    foliageMaterial,
    flowerMaterial,
    grassMaterial,
    canopyMaterial,
    shrubMaterial,
  ]), [
    canopyMaterial,
    contactMaterial,
    flowerMaterial,
    foliageMaterial,
    grassMaterial,
    groundMaterial,
    pathMaterial,
    shrubMaterial,
    stemMaterial,
    stoneMaterial,
    woodMaterial,
  ]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const strength = reducedMotion ? 0 : 1;
    const cueWind = reducedMotion ? 0 : cueRef.current.windStrength;
    const materials = animatedMaterialsRef.current;
    materials.foliage.uniforms.uTime.value = time;
    materials.foliage.uniforms.uWindStrength.value = strength * (0.055 + cueWind * 0.035);
    materials.flower.uniforms.uTime.value = time;
    materials.flower.uniforms.uWindStrength.value = strength * (0.075 + cueWind * 0.055);
    materials.grass.uniforms.uTime.value = time;
    materials.grass.uniforms.uWindStrength.value = strength * (0.065 + cueWind * 0.045);
    materials.canopy.uniforms.uTime.value = time;
    materials.canopy.uniforms.uWindStrength.value = strength * (0.035 + cueWind * 0.025);
    materials.shrub.uniforms.uTime.value = time;
    materials.shrub.uniforms.uWindStrength.value = strength * (0.028 + cueWind * 0.02);
  });

  const heroTrunks = useMemo(() => placements.heroTrees.map((tree) => toRenderPlacement(
    tree,
    [tree.position[0], tree.position[1] + 2.2 * tree.scale, tree.position[2]],
    tree.rotation,
    [tree.scale * 0.88, tree.scale, tree.scale * 0.88],
    0x92735a,
  )), [placements.heroTrees]);
  const heroBranches = useMemo(() => placements.heroTrees.flatMap((tree, index) => (
    [-1, 1] as const
  ).map((direction) => toRenderPlacement(
    tree,
    [
      tree.position[0] + direction * 0.38 * tree.scale,
      tree.position[1] + (2.85 + (index % 3) * 0.18) * tree.scale,
      tree.position[2],
    ],
    [direction * 0.15, tree.rotation[1] + direction * 0.72, direction * 0.94],
    [tree.scale * 0.82, tree.scale * 0.88, tree.scale * 0.82],
    0x8c6d55,
  ))), [placements.heroTrees]);
  const heroCanopies = useMemo(() => placements.heroTrees.flatMap((tree, index) => (
    [-1, 0, 1] as const
  ).map((offset) => toRenderPlacement(
    tree,
    [
      tree.position[0] + offset * 0.72 * tree.scale,
      tree.position[1] + (4.38 + (index % 2) * 0.18 - Math.abs(offset) * 0.2) * tree.scale,
      tree.position[2] + (offset === 0 ? 0 : (index % 2 === 0 ? 0.28 : -0.28)),
    ],
    tree.rotation,
    [1.32 * tree.scale, 0.94 * tree.scale, 1.16 * tree.scale],
    tree.tint,
  ))), [placements.heroTrees]);
  const midTrunks = useMemo(() => placements.midTrees.map((tree) => toRenderPlacement(
    tree,
    [tree.position[0], tree.position[1] + 1.75 * tree.scale, tree.position[2]],
    tree.rotation,
    [0.68 * tree.scale, 0.82 * tree.scale, 0.68 * tree.scale],
    0x876a53,
  )), [placements.midTrees]);
  const midCanopies = useMemo(() => placements.midTrees.map((tree) => toRenderPlacement(
    tree,
    [tree.position[0], tree.position[1] + 3.65 * tree.scale, tree.position[2]],
    layerContract.midCanopies.geometry === "atlas-card"
      ? [0, 0, tree.rotation[2] * 0.35]
      : tree.rotation,
    layerContract.midCanopies.geometry === "atlas-card"
      ? [3.25 * tree.scale, 2.7 * tree.scale, 1]
      : [1.2 * tree.scale, 0.92 * tree.scale, 1.08 * tree.scale],
    tree.tint,
    tree.atlasCell,
  )), [layerContract.midCanopies.geometry, placements.midTrees]);
  const grass = useMemo(() => placements.grass.map((item) => toRenderPlacement(
    item,
    [item.position[0], item.position[1] + 0.3 * item.scale, item.position[2]],
    item.rotation,
    [item.scale, item.scale, item.scale],
  )), [placements.grass]);
  const flowerStems = useMemo(() => placements.wildflowers.map((flower) => toRenderPlacement(
    flower,
    [flower.position[0], flower.position[1] + 0.34 * flower.scale, flower.position[2]],
    flower.rotation,
    [flower.scale, flower.scale, flower.scale],
    0x66825b,
  )), [placements.wildflowers]);
  const flowerHeads = useMemo(() => placements.wildflowers.map((flower) => toRenderPlacement(
    flower,
    [flower.position[0], flower.position[1] + 0.82 * flower.scale, flower.position[2]],
    [0, 0, flower.rotation[2] * 0.4],
    [0.6 * flower.scale, 0.78 * flower.scale, 0.6 * flower.scale],
    flower.tint,
    flower.atlasCell,
  )), [placements.wildflowers]);
  const shrubs = useMemo(() => placements.shrubs.map((item) => toRenderPlacement(
    item,
    [item.position[0], item.position[1] + 0.42 * item.scale, item.position[2]],
    item.rotation,
    [1.2 * item.scale, 0.72 * item.scale, item.scale],
  )), [placements.shrubs]);
  const roots = useMemo(() => placements.roots.map((item) => toRenderPlacement(
    item,
    [item.position[0], item.position[1] + 0.07, item.position[2]],
    [Math.PI / 2 + item.rotation[0], item.rotation[1], item.rotation[2]],
    [item.scale, item.scale, item.scale],
  )), [placements.roots]);
  const stones = useMemo(() => placements.stones.map((item) => toRenderPlacement(
    item,
    [item.position[0], item.position[1] + 0.19 * item.scale, item.position[2]],
    item.rotation,
    [1.2 * item.scale, 0.68 * item.scale, item.scale],
  )), [placements.stones]);
  const contacts = useMemo(() => createForestContactCues(placements).map((cue): RenderPlacement => ({
    position: cue.position,
    rotation: [-Math.PI / 2, 0, cue.rotationY],
    scale: [cue.scale[0], cue.scale[1], 1],
    tint: 0x263a27,
    windPhase: 0,
  })), [placements]);

  const farBands = useMemo(() => ([0, 1, 2] as const).map((depthBand) => {
    const band = placements.farTrees.filter((tree) => tree.depthBand === depthBand);
    return {
      canopies: band.map((tree) => toRenderPlacement(
        tree,
        [tree.position[0], tree.position[1] + (4.6 + depthBand * 0.42) * tree.scale, tree.position[2]],
        [0, 0, 0],
        [
          (4.5 + depthBand * 0.7) * tree.scale,
          (4.2 + depthBand * 0.55) * tree.scale,
          1,
        ],
        tree.tint,
        tree.atlasCell,
      )),
      depthBand,
      trunks: band.map((tree) => toRenderPlacement(
        tree,
        [tree.position[0], tree.position[1] + 2.35 * tree.scale, tree.position[2]],
        tree.rotation,
        [tree.scale, tree.scale, tree.scale],
        0x7d6957,
      )),
    };
  }), [placements.farTrees]);

  return (
    <group name="forest-wedding-continuous-environment">
      <mesh geometry={terrainGeometry} material={groundMaterial} receiveShadow={false} />
      <mesh
        geometry={pathGeometry}
        material={pathMaterial}
        position={[0, 0.028, 0]}
        receiveShadow={false}
      />

      <ForestInstances kind="trunk" material={woodMaterial} placements={heroTrunks} />
      <ForestInstances kind="branch" material={woodMaterial} placements={heroBranches} />
      <ForestInstances
        kind={layerContract.heroCanopies.geometry}
        material={canopyMaterial}
        placements={heroCanopies}
        shaderAttributes
      />

      <ForestInstances kind="trunk" material={woodMaterial} placements={midTrunks} />
      <ForestInstances
        atlasName={layerContract.midCanopies.atlasName}
        kind={layerContract.midCanopies.geometry}
        material={texturePack ? foliageMaterial : canopyMaterial}
        placements={midCanopies}
        shaderAttributes
      />

      {farBands.map((band) => (
        <group key={band.depthBand} name={`forest-far-band-${band.depthBand + 1}`}>
          <ForestInstances kind="far-trunk" material={woodMaterial} placements={band.trunks} />
          <ForestInstances
            atlasName={texturePack ? "foliage" : null}
            kind={texturePack ? "atlas-card" : "canopy"}
            material={foliageMaterial}
            placements={band.canopies}
            shaderAttributes
          />
        </group>
      ))}

      <ForestInstances
        kind="grass"
        material={grassMaterial}
        placements={grass}
        shaderAttributes
      />
      <ForestInstances kind="flower-stem" material={stemMaterial} placements={flowerStems} />
      <ForestInstances
        atlasName={layerContract.wildflowerHeads.atlasName}
        kind={texturePack ? "flower-head" : layerContract.wildflowerHeads.geometry}
        material={flowerMaterial}
        placements={flowerHeads}
        shaderAttributes
      />
      <ForestInstances
        kind="shrub"
        material={shrubMaterial}
        placements={shrubs}
        shaderAttributes
      />
      <ForestInstances kind="root" material={woodMaterial} placements={roots} />
      <ForestInstances kind="stone" material={stoneMaterial} placements={stones} />
      <ForestInstances kind="contact" material={contactMaterial} placements={contacts} />
    </group>
  );
}
