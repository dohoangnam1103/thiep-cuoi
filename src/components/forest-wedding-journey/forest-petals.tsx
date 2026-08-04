"use client";

import { useFrame } from "@react-three/fiber";
import {
  CircleGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  type BufferGeometry,
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
import { composeForestPetalInstance } from "./photoreal/forest-petal-instances";
import { sampleForestPetalMotion } from "./photoreal/forest-petal-motion";
import {
  getForestAtlasUvRect,
  type ForestPetalPlacement,
} from "./forest-world-data";

const PETAL_VERTEX_SHADER = `
  attribute vec4 instanceAtlasRect;
  attribute vec3 instanceTint;
  varying vec2 vAtlasUv;
  varying vec3 vInstanceTint;

  void main() {
    vAtlasUv = instanceAtlasRect.xy + uv * instanceAtlasRect.zw;
    vInstanceTint = instanceTint;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const PETAL_FRAGMENT_SHADER = `
  uniform sampler2D uMap;
  varying vec2 vAtlasUv;
  varying vec3 vInstanceTint;

  void main() {
    vec4 texel = texture2D(uMap, vAtlasUv);
    if (texel.a < 0.12) discard;
    gl_FragColor = vec4(texel.rgb * vInstanceTint, texel.a * 0.9);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function createTexturedPetalMaterial(texture: Texture): ShaderMaterial {
  return new ShaderMaterial({
    depthWrite: false,
    fragmentShader: PETAL_FRAGMENT_SHADER,
    side: DoubleSide,
    transparent: true,
    uniforms: { uMap: { value: texture } },
    vertexShader: PETAL_VERTEX_SHADER,
  });
}

function createPetalGeometry(
  placements: readonly ForestPetalPlacement[],
  textured: boolean,
): BufferGeometry {
  const geometry = textured ? new PlaneGeometry(1, 1) : new CircleGeometry(0.5, 5);
  if (!textured) return geometry;

  const atlasRects = new Float32Array(placements.length * 4);
  const tints = new Float32Array(placements.length * 3);
  const color = new Color();
  placements.forEach((placement, index) => {
    const rect = getForestAtlasUvRect("petal", placement.atlasCell);
    atlasRects.set([...rect.offset, ...rect.repeat], index * 4);
    color.setHex(placement.tint).toArray(tints, index * 3);
  });
  geometry.setAttribute("instanceAtlasRect", new InstancedBufferAttribute(atlasRects, 4));
  geometry.setAttribute("instanceTint", new InstancedBufferAttribute(tints, 3));
  return geometry;
}

type PetalScratch = {
  readonly color: Color;
  readonly object: Object3D;
};

function updatePetalMatrices(
  mesh: InstancedMesh | null,
  placements: readonly ForestPetalPlacement[],
  elapsedTime: number,
  reducedMotion: boolean,
  cue: ForestJourneyCueState,
  scratch: PetalScratch,
): void {
  if (!mesh) return;
  const { color, object } = scratch;

  for (let index = 0; index < placements.length; index += 1) {
    const petal = placements[index]!;
    const instance = composeForestPetalInstance(
      petal,
      sampleForestPetalMotion(index, elapsedTime, cue, reducedMotion),
      reducedMotion,
    );

    object.position.set(...instance.position);
    object.rotation.set(...instance.rotation);
    object.scale.set(instance.scale[0], instance.scale[1], 1);
    object.updateMatrix();
    mesh.setMatrixAt(index, object.matrix);
    if (!(mesh.material instanceof ShaderMaterial)) {
      mesh.setColorAt(index, color.setHex(petal.tint));
    }
  }
  mesh.count = placements.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

export type ForestPetalsProps = {
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly placements: readonly ForestPetalPlacement[];
  readonly reducedMotion: boolean;
  readonly texture: Texture | null;
};

export function ForestPetals({
  cueRef,
  placements,
  reducedMotion,
  texture,
}: ForestPetalsProps) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const scratch = useMemo<PetalScratch>(() => ({
    color: new Color(),
    object: new Object3D(),
  }), []);
  const geometry = useMemo(
    () => createPetalGeometry(placements, texture !== null),
    [placements, texture],
  );
  const material = useMemo<Material>(() => texture
    ? createTexturedPetalMaterial(texture)
    // No `vertexColors`: the tints ride on `instanceColor`, for which three.js
    // already defines `USE_COLOR`. Setting the flag as well emits
    // `vColor.rgb *= color` against a geometry `color` attribute this circle
    // never declares, so the default (0,0,0) blacks out every petal.
    : new MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.82,
        side: DoubleSide,
      }), [texture]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    updatePetalMatrices(
      mesh,
      placements,
      0,
      reducedMotion,
      cueRef.current,
      scratch,
    );
    mesh.computeBoundingSphere();
  }, [cueRef, placements, reducedMotion, scratch]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame(({ clock }) => {
    updatePetalMatrices(
      meshRef.current,
      placements,
      clock.elapsedTime,
      reducedMotion,
      cueRef.current,
      scratch,
    );
  });

  if (placements.length === 0) return null;
  return (
    <instancedMesh
      args={[geometry, material, placements.length]}
      frustumCulled={false}
      name="forest-authored-petals"
      ref={meshRef}
    />
  );
}
