"use client";

import { useFrame, useThree } from "@react-three/fiber";
import {
  CircleGeometry,
  Color,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  DynamicDrawUsage,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
} from "three";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";

import type { ForestJourneyCueState } from "./forest-cue-state";
import { FOREST_GATE_CENTER } from "./forest-world-data";

export const FOREST_GATE_ASSEMBLIES = [{ id: "opening-floral-gate" }] as const;
export const FOREST_GATE_POST_X = [-1.38, 1.38] as const;
export const FOREST_VOILE_PROJECTED_SIZE = { height: 432, width: 344 } as const;
const FOREST_VOILE_VIEWPORT_PADDING_PX = 48;

export type ForestVoileViewport = {
  readonly height: number;
  readonly width: number;
};

export function getForestVoileProjectedSize({
  height,
  width,
}: ForestVoileViewport): { readonly height: number; readonly width: number } {
  const safeHeight = Number.isFinite(height) ? Math.max(0, height) : 0;
  const safeWidth = Number.isFinite(width) ? Math.max(0, width) : 0;
  const scale = Math.min(
    1,
    Math.max(0, safeWidth - FOREST_VOILE_VIEWPORT_PADDING_PX)
      / FOREST_VOILE_PROJECTED_SIZE.width,
    Math.max(0, safeHeight - FOREST_VOILE_VIEWPORT_PADDING_PX)
      / FOREST_VOILE_PROJECTED_SIZE.height,
  );

  return {
    height: FOREST_VOILE_PROJECTED_SIZE.height * scale,
    width: FOREST_VOILE_PROJECTED_SIZE.width * scale,
  };
}

type GateSegment = {
  readonly end: readonly [number, number, number];
  readonly radius: number;
  readonly start: readonly [number, number, number];
};

type GateCluster = {
  readonly color: number;
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly scale: readonly [number, number, number];
};

export const FOREST_GATE_WOOD_SEGMENTS: readonly GateSegment[] = [
  { start: [-1.38, -0.05, 3.5], end: [-1.38, 3.12, 3.5], radius: 0.052 },
  { start: [1.38, -0.05, 3.5], end: [1.38, 3.04, 3.5], radius: 0.05 },
  { start: [-1.38, 3.06, 3.5], end: [-1.04, 3.37, 3.5], radius: 0.049 },
  { start: [-1.04, 3.37, 3.5], end: [-0.38, 3.4, 3.5], radius: 0.046 },
  { start: [-0.38, 3.4, 3.5], end: [0.38, 3.34, 3.5], radius: 0.044 },
  { start: [0.38, 3.34, 3.5], end: [1.38, 3.02, 3.5], radius: 0.048 },
  { start: [-1.34, 2.4, 3.5], end: [-0.92, 2.98, 3.5], radius: 0.038 },
  { start: [-1.12, 3.28, 3.5], end: [-1.5, 3.38, 3.5], radius: 0.035 },
  { start: [0.72, 3.23, 3.5], end: [1.5, 3.2, 3.5], radius: 0.038 },
  { start: [1.36, 0.62, 3.5], end: [1.14, 1.24, 3.5], radius: 0.036 },
  { start: [1.35, 1.08, 3.5], end: [1.57, 1.45, 3.5], radius: 0.035 },
  { start: [-1.37, 0.48, 3.5], end: [-1.52, 0.79, 3.5], radius: 0.035 },
] as const;

function cluster(
  center: readonly [number, number, number],
  count: number,
  spread: readonly [number, number],
  colors: readonly number[],
  flower: boolean,
): readonly GateCluster[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = index * 2.399963229728653;
    const radial = 0.28 + (index % 5) * 0.14;
    const scale = flower ? 0.095 + (index % 3) * 0.018 : 0.16 + (index % 4) * 0.035;
    return {
      color: colors[index % colors.length]!,
      position: [
        center[0] + Math.cos(angle) * spread[0] * radial,
        center[1] + Math.sin(angle) * spread[1] * radial,
        center[2] + ((index % 3) - 1) * 0.055,
      ],
      rotation: [angle * 0.14, angle, flower ? angle * 0.08 : angle * 0.42],
      scale: flower
        ? [scale, scale * (0.82 + (index % 2) * 0.16), scale]
        : [scale * 1.55, scale * 0.32, scale * 0.7],
    };
  });
}

const FOLIAGE_COLORS = [0x436949, 0x758b69] as const;
const FLOWER_COLORS = [0xfffdf4, 0xeee7d2, 0xdce2c5] as const;

export const FOREST_GATE_FOLIAGE = [
  ...cluster([-0.93, 3.2, 3.5], 18, [0.78, 0.42], FOLIAGE_COLORS, false),
  ...cluster([0.72, 3.14, 3.5], 12, [0.68, 0.34], FOLIAGE_COLORS, false),
  ...cluster([1.33, 1.15, 3.5], 6, [0.3, 0.7], FOLIAGE_COLORS, false),
  ...cluster([-1.37, 0.67, 3.5], 2, [0.2, 0.24], FOLIAGE_COLORS, false),
] as const;

export const FOREST_GATE_FLOWERS = [
  ...cluster([-0.98, 3.24, 3.44], 12, [0.7, 0.34], FLOWER_COLORS, true),
  ...cluster([0.72, 3.15, 3.44], 8, [0.58, 0.28], FLOWER_COLORS, true),
  ...cluster([1.34, 1.18, 3.44], 4, [0.24, 0.55], FLOWER_COLORS, true),
  ...cluster([-1.38, 0.68, 3.44], 1, [0.1, 0.1], FLOWER_COLORS, true),
] as const;

export type ForestVoileProjectionInput = {
  readonly distance: number;
  readonly fovDegrees: number;
  readonly projectedHeightPx: number;
  readonly projectedWidthPx: number;
  readonly viewportHeightPx: number;
};

export function getForestVoileWorldSize({
  distance,
  fovDegrees,
  projectedHeightPx,
  projectedWidthPx,
  viewportHeightPx,
}: ForestVoileProjectionInput): { readonly height: number; readonly width: number } {
  const safeDistance = Number.isFinite(distance) ? Math.max(0, distance) : 0;
  const safeFov = Number.isFinite(fovDegrees) ? Math.max(1, Math.min(179, fovDegrees)) : 50;
  const safeViewportHeight = Number.isFinite(viewportHeightPx)
    ? Math.max(1, viewportHeightPx)
    : 1;
  const safeProjectedHeight = Number.isFinite(projectedHeightPx)
    ? Math.max(0, projectedHeightPx)
    : 0;
  const safeProjectedWidth = Number.isFinite(projectedWidthPx)
    ? Math.max(0, projectedWidthPx)
    : 0;
  const visibleWorldHeight = 2 * safeDistance * Math.tan(safeFov * Math.PI / 360);
  const height = visibleWorldHeight * safeProjectedHeight / safeViewportHeight;
  return {
    height,
    width: height * (safeProjectedWidth / Math.max(1, safeProjectedHeight)),
  };
}

type GateScratch = {
  readonly color: Color;
  readonly cornerBottomLeft: Vector3;
  readonly cornerBottomRight: Vector3;
  readonly cornerTopLeft: Vector3;
  readonly cornerTopRight: Vector3;
  readonly direction: Vector3;
  readonly end: Vector3;
  readonly instanceObject: Object3D;
  readonly midpoint: Vector3;
  readonly start: Vector3;
  readonly yAxis: Vector3;
};

type GateFrameValues = {
  cameraAspect: number;
  cameraFov: number;
  cameraPositionX: number;
  cameraPositionY: number;
  cameraPositionZ: number;
  cameraQuaternionW: number;
  cameraQuaternionX: number;
  cameraQuaternionY: number;
  cameraQuaternionZ: number;
  cameraZoom: number;
  lift: number;
  viewportHeight: number;
  viewportWidth: number;
};

function getForestGateDistance(position: Vector3): number {
  return Math.hypot(
    position.x - FOREST_GATE_CENTER[0],
    position.y - FOREST_GATE_CENTER[1],
    position.z - FOREST_GATE_CENTER[2],
  );
}

function writeVoileProjectionDiagnostic(
  wrapper: HTMLDivElement,
  key:
    | "voileProjectedHeight"
    | "voileProjectedLeft"
    | "voileProjectedTop"
    | "voileProjectedWidth",
  value: number,
): void {
  const nextValue = value.toFixed(3);
  if (wrapper.dataset[key] !== nextValue) wrapper.dataset[key] = nextValue;
}

export type ForestGateProps = {
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly departedRef: MutableRefObject<boolean>;
  readonly diagnosticsRef: MutableRefObject<HTMLDivElement | null>;
  readonly reducedMotion: boolean;
};

export function ForestGate({
  cueRef,
  departedRef,
  diagnosticsRef,
  reducedMotion,
}: ForestGateProps) {
  const camera = useThree(({ camera: activeCamera }) => activeCamera);
  const size = useThree(({ size: viewportSize }) => viewportSize);
  const woodRef = useRef<InstancedMesh | null>(null);
  const foliageRef = useRef<InstancedMesh | null>(null);
  const flowerRef = useRef<InstancedMesh | null>(null);
  const contactRef = useRef<InstancedMesh | null>(null);
  const voileRef = useRef<Mesh<PlaneGeometry, MeshPhysicalMaterial> | null>(null);
  const scratch = useMemo<GateScratch>(() => ({
    color: new Color(),
    cornerBottomLeft: new Vector3(),
    cornerBottomRight: new Vector3(),
    cornerTopLeft: new Vector3(),
    cornerTopRight: new Vector3(),
    direction: new Vector3(),
    end: new Vector3(),
    instanceObject: new Object3D(),
    midpoint: new Vector3(),
    start: new Vector3(),
    yAxis: new Vector3(0, 1, 0),
  }), []);
  const lastFrameRef = useRef<GateFrameValues>({
    cameraAspect: Number.NaN,
    cameraFov: Number.NaN,
    cameraPositionX: Number.NaN,
    cameraPositionY: Number.NaN,
    cameraPositionZ: Number.NaN,
    cameraQuaternionW: Number.NaN,
    cameraQuaternionX: Number.NaN,
    cameraQuaternionY: Number.NaN,
    cameraQuaternionZ: Number.NaN,
    cameraZoom: Number.NaN,
    lift: Number.NaN,
    viewportHeight: Number.NaN,
    viewportWidth: Number.NaN,
  });
  const woodGeometry = useMemo(() => new CylinderGeometry(1, 1, 1, 7), []);
  const foliageGeometry = useMemo(() => new SphereGeometry(0.5, 6, 4), []);
  const flowerGeometry = useMemo(() => new DodecahedronGeometry(0.5, 0), []);
  const contactGeometry = useMemo(() => new CircleGeometry(1, 12), []);
  const voileGeometry = useMemo(() => new PlaneGeometry(1, 1, 1, 1), []);
  const woodMaterial = useMemo(() => new MeshStandardMaterial({
    color: 0x80664f,
    roughness: 0.9,
  }), []);
  const foliageMaterial = useMemo(() => new MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x436949,
    emissiveIntensity: 0.65,
    roughness: 0.88,
    vertexColors: true,
  }), []);
  const flowerMaterial = useMemo(() => new MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x3a392f,
    emissiveIntensity: 0.18,
    roughness: 0.78,
    vertexColors: true,
  }), []);
  const contactMaterial = useMemo(() => new MeshBasicMaterial({
    color: 0x243a2a,
    depthWrite: false,
    opacity: 0.15,
    side: DoubleSide,
    transparent: true,
  }), []);
  const voileMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: 0xf4f0e2,
    depthWrite: false,
    opacity: 0.58,
    roughness: 0.84,
    side: DoubleSide,
    thickness: 0.025,
    transparent: true,
  }), []);
  const fovDegrees = camera instanceof PerspectiveCamera ? camera.fov : 50;
  const distance = getForestGateDistance(camera.position);
  const projectedSize = getForestVoileProjectedSize(size);
  const voileSize = getForestVoileWorldSize({
    distance,
    fovDegrees,
    projectedHeightPx: projectedSize.height,
    projectedWidthPx: projectedSize.width,
    viewportHeightPx: size.height,
  });

  useLayoutEffect(() => {
    const wood = woodRef.current;
    if (wood) {
      FOREST_GATE_WOOD_SEGMENTS.forEach((segment, index) => {
        scratch.start.set(...segment.start);
        scratch.end.set(...segment.end);
        scratch.direction.subVectors(scratch.end, scratch.start);
        const length = scratch.direction.length();
        scratch.midpoint.addVectors(scratch.start, scratch.end).multiplyScalar(0.5);
        scratch.instanceObject.position.copy(scratch.midpoint);
        scratch.instanceObject.quaternion.setFromUnitVectors(
          scratch.yAxis,
          scratch.direction.multiplyScalar(1 / length),
        );
        scratch.instanceObject.scale.set(segment.radius, length, segment.radius);
        scratch.instanceObject.updateMatrix();
        wood.setMatrixAt(index, scratch.instanceObject.matrix);
      });
      wood.instanceMatrix.setUsage(DynamicDrawUsage);
      wood.instanceMatrix.needsUpdate = true;
      wood.computeBoundingSphere();
    }

    const foliage = foliageRef.current;
    if (foliage) {
      for (let index = 0; index < FOREST_GATE_FOLIAGE.length; index += 1) {
        const placement = FOREST_GATE_FOLIAGE[index]!;
        scratch.instanceObject.position.set(...placement.position);
        scratch.instanceObject.rotation.set(...placement.rotation);
        scratch.instanceObject.scale.set(...placement.scale);
        scratch.instanceObject.updateMatrix();
        foliage.setMatrixAt(index, scratch.instanceObject.matrix);
        foliage.setColorAt(index, scratch.color.setHex(placement.color));
      }
      foliage.instanceMatrix.setUsage(DynamicDrawUsage);
      foliage.instanceMatrix.needsUpdate = true;
      if (foliage.instanceColor) foliage.instanceColor.needsUpdate = true;
      foliage.computeBoundingSphere();
    }

    const flowers = flowerRef.current;
    if (flowers) {
      for (let index = 0; index < FOREST_GATE_FLOWERS.length; index += 1) {
        const placement = FOREST_GATE_FLOWERS[index]!;
        scratch.instanceObject.position.set(...placement.position);
        scratch.instanceObject.rotation.set(...placement.rotation);
        scratch.instanceObject.scale.set(...placement.scale);
        scratch.instanceObject.updateMatrix();
        flowers.setMatrixAt(index, scratch.instanceObject.matrix);
        flowers.setColorAt(index, scratch.color.setHex(placement.color));
      }
      flowers.instanceMatrix.setUsage(DynamicDrawUsage);
      flowers.instanceMatrix.needsUpdate = true;
      if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
      flowers.computeBoundingSphere();
    }

    const contacts = contactRef.current;
    if (contacts) {
      FOREST_GATE_POST_X.forEach((x, index) => {
        scratch.instanceObject.position.set(x, 0.008, FOREST_GATE_CENTER[2]);
        scratch.instanceObject.rotation.set(-Math.PI / 2, 0, 0);
        scratch.instanceObject.scale.set(0.16, 0.13, 1);
        scratch.instanceObject.updateMatrix();
        contacts.setMatrixAt(index, scratch.instanceObject.matrix);
      });
      contacts.instanceMatrix.needsUpdate = true;
      contacts.computeBoundingSphere();
    }

    const voile = voileRef.current;
    if (voile) {
      voile.position.set(...FOREST_GATE_CENTER);
      voile.scale.set(voileSize.width, voileSize.height, 1);
      voile.lookAt(camera.position);
      voile.updateMatrixWorld(true);
    }
  }, [camera, scratch, voileSize.height, voileSize.width]);

  useEffect(() => () => {
    woodGeometry.dispose();
    foliageGeometry.dispose();
    flowerGeometry.dispose();
    contactGeometry.dispose();
    voileGeometry.dispose();
    woodMaterial.dispose();
    foliageMaterial.dispose();
    flowerMaterial.dispose();
    contactMaterial.dispose();
    voileMaterial.dispose();
  }, [
    contactGeometry,
    contactMaterial,
    flowerGeometry,
    flowerMaterial,
    foliageGeometry,
    foliageMaterial,
    voileGeometry,
    voileMaterial,
    woodGeometry,
    woodMaterial,
  ]);

  useFrame(() => {
    const voile = voileRef.current;
    if (!voile) return;
    const lift = departedRef.current ? 1 : reducedMotion ? 0 : cueRef.current.voileLift;
    const cameraAspect = camera instanceof PerspectiveCamera
      ? camera.aspect
      : size.width / Math.max(1, size.height);
    const lastFrame = lastFrameRef.current;
    const cameraFov = camera instanceof PerspectiveCamera ? camera.fov : 50;
    const cameraZoom = camera instanceof PerspectiveCamera ? camera.zoom : 1;
    const cameraChanged = lastFrame.cameraAspect !== cameraAspect
      || lastFrame.cameraFov !== cameraFov
      || lastFrame.cameraPositionX !== camera.position.x
      || lastFrame.cameraPositionY !== camera.position.y
      || lastFrame.cameraPositionZ !== camera.position.z
      || lastFrame.cameraQuaternionW !== camera.quaternion.w
      || lastFrame.cameraQuaternionX !== camera.quaternion.x
      || lastFrame.cameraQuaternionY !== camera.quaternion.y
      || lastFrame.cameraQuaternionZ !== camera.quaternion.z
      || lastFrame.cameraZoom !== cameraZoom;
    const viewportChanged = lastFrame.viewportHeight !== size.height
      || lastFrame.viewportWidth !== size.width;
    const needsUpdate = cameraChanged || viewportChanged || lastFrame.lift !== lift;
    if (!needsUpdate) return;

    if (cameraChanged || viewportChanged) {
      const projectedSize = getForestVoileProjectedSize({
        height: size.height,
        width: size.width,
      });
      const worldSize = getForestVoileWorldSize({
        distance: getForestGateDistance(camera.position),
        fovDegrees: cameraFov,
        projectedHeightPx: projectedSize.height,
        projectedWidthPx: projectedSize.width,
        viewportHeightPx: size.height,
      });
      voile.scale.set(worldSize.width, worldSize.height, 1);
      voile.lookAt(camera.position);
    }

    voile.position.y = FOREST_GATE_CENTER[1] + lift * 2.12;
    voile.visible = lift < 0.995;
    voile.material.opacity = 0.58 * Math.max(0, 1 - lift * 0.92);
    voile.updateMatrixWorld(true);

    lastFrame.cameraAspect = cameraAspect;
    lastFrame.cameraFov = cameraFov;
    lastFrame.cameraPositionX = camera.position.x;
    lastFrame.cameraPositionY = camera.position.y;
    lastFrame.cameraPositionZ = camera.position.z;
    lastFrame.cameraQuaternionW = camera.quaternion.w;
    lastFrame.cameraQuaternionX = camera.quaternion.x;
    lastFrame.cameraQuaternionY = camera.quaternion.y;
    lastFrame.cameraQuaternionZ = camera.quaternion.z;
    lastFrame.cameraZoom = cameraZoom;
    lastFrame.lift = lift;
    lastFrame.viewportHeight = size.height;
    lastFrame.viewportWidth = size.width;

    const wrapper = diagnosticsRef.current;
    if (!wrapper || !voile.visible) return;
    const bottomLeft = voile.localToWorld(
      scratch.cornerBottomLeft.set(-0.5, -0.5, 0),
    ).project(camera);
    const bottomRight = voile.localToWorld(
      scratch.cornerBottomRight.set(0.5, -0.5, 0),
    ).project(camera);
    const topRight = voile.localToWorld(
      scratch.cornerTopRight.set(0.5, 0.5, 0),
    ).project(camera);
    const topLeft = voile.localToWorld(
      scratch.cornerTopLeft.set(-0.5, 0.5, 0),
    ).project(camera);
    const bottomLeftX = (bottomLeft.x + 1) * size.width * 0.5;
    const bottomLeftY = (1 - bottomLeft.y) * size.height * 0.5;
    const bottomRightX = (bottomRight.x + 1) * size.width * 0.5;
    const bottomRightY = (1 - bottomRight.y) * size.height * 0.5;
    const topRightX = (topRight.x + 1) * size.width * 0.5;
    const topRightY = (1 - topRight.y) * size.height * 0.5;
    const topLeftX = (topLeft.x + 1) * size.width * 0.5;
    const topLeftY = (1 - topLeft.y) * size.height * 0.5;
    const left = Math.min(bottomLeftX, bottomRightX, topRightX, topLeftX);
    const right = Math.max(bottomLeftX, bottomRightX, topRightX, topLeftX);
    const top = Math.min(bottomLeftY, bottomRightY, topRightY, topLeftY);
    const bottom = Math.max(bottomLeftY, bottomRightY, topRightY, topLeftY);
    writeVoileProjectionDiagnostic(wrapper, "voileProjectedLeft", left);
    writeVoileProjectionDiagnostic(wrapper, "voileProjectedTop", top);
    writeVoileProjectionDiagnostic(wrapper, "voileProjectedWidth", right - left);
    writeVoileProjectionDiagnostic(wrapper, "voileProjectedHeight", bottom - top);
  });

  return (
    <group name="forest-authored-floral-gate">
      <instancedMesh
        args={[woodGeometry, woodMaterial, FOREST_GATE_WOOD_SEGMENTS.length]}
        ref={woodRef}
      />
      <instancedMesh
        args={[foliageGeometry, foliageMaterial, FOREST_GATE_FOLIAGE.length]}
        ref={foliageRef}
      />
      <instancedMesh
        args={[flowerGeometry, flowerMaterial, FOREST_GATE_FLOWERS.length]}
        ref={flowerRef}
      />
      <instancedMesh
        args={[contactGeometry, contactMaterial, FOREST_GATE_POST_X.length]}
        ref={contactRef}
      />
      <mesh
        geometry={voileGeometry}
        material={voileMaterial}
        ref={voileRef}
      />
    </group>
  );
}
