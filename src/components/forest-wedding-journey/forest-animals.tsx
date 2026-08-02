"use client";

import { useFrame, useThree } from "@react-three/fiber";
import {
  CircleGeometry,
  DoubleSide,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from "three";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";

import type { ForestJourneyCueState } from "./forest-cue-state";

export type ForestAnimalPlacement = {
  readonly id: string;
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
};

export type ForestAnimalViewport = {
  readonly height: number;
  readonly width: number;
};

const FOREST_ANIMAL_MOBILE_MAX_WIDTH_PX = 767;
const FOREST_ANIMAL_FULL_SPREAD_ASPECT = 0.8;
const FOREST_ANIMAL_MIN_HORIZONTAL_SCALE = 0.56;

export function getForestOpeningAnimalHorizontalScale({
  height,
  width,
}: ForestAnimalViewport): number {
  if (
    !Number.isFinite(height)
    || !Number.isFinite(width)
    || height <= 0
    || width <= 0
    || width > FOREST_ANIMAL_MOBILE_MAX_WIDTH_PX
  ) {
    return 1;
  }

  const aspectScale = width / height / FOREST_ANIMAL_FULL_SPREAD_ASPECT;
  return Math.max(
    FOREST_ANIMAL_MIN_HORIZONTAL_SCALE,
    Math.min(1, aspectScale),
  );
}

export const FOREST_RABBIT_PLACEMENTS = [
  { id: "rabbit-guide", position: [-0.9, 0.03, 3.7], rotationY: 0.28 },
  { id: "rabbit-companion", position: [0.86, 0.03, 3.55], rotationY: -0.34 },
] as const satisfies readonly ForestAnimalPlacement[];

export const FOREST_GATE_DOVE_PLACEMENTS = [
  { id: "gate-dove-left", position: [-0.58, 3.05, 3.5], rotationY: -0.18 },
  { id: "gate-dove-right", position: [0.7, 2.95, 3.5], rotationY: 0.24 },
] as const satisfies readonly ForestAnimalPlacement[];

export const FOREST_FINALE_DOVE_PLACEMENTS = [
  { id: "finale-dove-left", position: [-0.82, 0.15, -115.1], rotationY: -0.18 },
  { id: "finale-dove-center", position: [0.04, 0.15, -115.35], rotationY: 0.06 },
  { id: "finale-dove-right", position: [0.88, 0.15, -115.08], rotationY: 0.2 },
] as const satisfies readonly ForestAnimalPlacement[];

type AnimalKind = "finale-dove" | "gate-dove" | "rabbit";

type AnimalPart = {
  readonly animalIndex: number;
  readonly animalKind: AnimalKind;
  readonly part: "body" | "ear-left" | "ear-right" | "head" | "leg" | "tail" | "wing-left" | "wing-right";
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly scale: readonly [number, number, number];
};

type EyePart = {
  readonly animalIndex: number;
  readonly animalKind: AnimalKind;
  readonly position: readonly [number, number, number];
  readonly scale: readonly [number, number, number];
};

type ContactPart = {
  readonly animalIndex: number;
  readonly animalKind: AnimalKind;
  readonly position: readonly [number, number, number];
  readonly scale: readonly [number, number, number];
};

function rabbitParts(animalIndex: number): readonly AnimalPart[] {
  return [
    { animalIndex, animalKind: "rabbit", part: "body", position: [0, 0.2, 0], rotation: [0, 0, 0], scale: [0.34, 0.23, 0.25] },
    { animalIndex, animalKind: "rabbit", part: "head", position: [0, 0.37, 0.18], rotation: [0, 0, 0], scale: [0.2, 0.18, 0.18] },
    { animalIndex, animalKind: "rabbit", part: "ear-left", position: [-0.075, 0.58, 0.16], rotation: [0.06, 0, -0.12], scale: [0.058, 0.18, 0.052] },
    { animalIndex, animalKind: "rabbit", part: "ear-right", position: [0.075, 0.58, 0.16], rotation: [-0.06, 0, 0.12], scale: [0.058, 0.18, 0.052] },
    { animalIndex, animalKind: "rabbit", part: "leg", position: [-0.18, 0.08, 0.09], rotation: [0, 0, 0], scale: [0.13, 0.075, 0.15] },
    { animalIndex, animalKind: "rabbit", part: "leg", position: [0.18, 0.08, 0.09], rotation: [0, 0, 0], scale: [0.13, 0.075, 0.15] },
    { animalIndex, animalKind: "rabbit", part: "tail", position: [0, 0.24, -0.23], rotation: [0, 0, 0], scale: [0.11, 0.11, 0.11] },
  ];
}

function doveParts(animalKind: "finale-dove" | "gate-dove", animalIndex: number): readonly AnimalPart[] {
  return [
    { animalIndex, animalKind, part: "body", position: [0, 0, 0], rotation: [0, 0, 0], scale: [0.24, 0.13, 0.14] },
    { animalIndex, animalKind, part: "head", position: [0, 0.075, 0.16], rotation: [0, 0, 0], scale: [0.11, 0.1, 0.1] },
    { animalIndex, animalKind, part: "tail", position: [0, -0.015, -0.2], rotation: [0, 0, 0], scale: [0.12, 0.045, 0.19] },
    { animalIndex, animalKind, part: "wing-left", position: [-0.15, 0.035, -0.015], rotation: [0, 0.1, -0.18], scale: [0.2, 0.045, 0.12] },
    { animalIndex, animalKind, part: "wing-right", position: [0.15, 0.035, -0.015], rotation: [0, -0.1, 0.18], scale: [0.2, 0.045, 0.12] },
  ];
}

const ANIMAL_PARTS: readonly AnimalPart[] = [
  ...rabbitParts(0),
  ...rabbitParts(1),
  ...doveParts("gate-dove", 0),
  ...doveParts("gate-dove", 1),
  ...doveParts("finale-dove", 0),
  ...doveParts("finale-dove", 1),
  ...doveParts("finale-dove", 2),
];

const EYE_PARTS: readonly EyePart[] = [
  ...FOREST_RABBIT_PLACEMENTS.flatMap((_, animalIndex) => [
    { animalIndex, animalKind: "rabbit" as const, position: [-0.075, 0.4, 0.335] as const, scale: [0.024, 0.026, 0.018] as const },
    { animalIndex, animalKind: "rabbit" as const, position: [0.075, 0.4, 0.335] as const, scale: [0.024, 0.026, 0.018] as const },
  ]),
  ...FOREST_GATE_DOVE_PLACEMENTS.map((_, animalIndex) => ({
    animalIndex,
    animalKind: "gate-dove" as const,
    position: [animalIndex === 0 ? -0.055 : 0.055, 0.095, 0.245] as const,
    scale: [0.018, 0.018, 0.014] as const,
  })),
  ...FOREST_FINALE_DOVE_PLACEMENTS.map((_, animalIndex) => ({
    animalIndex,
    animalKind: "finale-dove" as const,
    position: [animalIndex === 0 ? -0.055 : 0.055, 0.095, 0.245] as const,
    scale: [0.018, 0.018, 0.014] as const,
  })),
];

const CONTACT_PARTS: readonly ContactPart[] = [
  ...FOREST_RABBIT_PLACEMENTS.map((_, animalIndex) => ({
    animalIndex,
    animalKind: "rabbit" as const,
    position: [0, 0.006, 0] as const,
    scale: [0.36, 0.24, 1] as const,
  })),
  ...FOREST_GATE_DOVE_PLACEMENTS.map((_, animalIndex) => ({
    animalIndex,
    animalKind: "gate-dove" as const,
    position: [0, -0.1, 0] as const,
    scale: [0.2, 0.1, 1] as const,
  })),
  ...FOREST_FINALE_DOVE_PLACEMENTS.map((_, animalIndex) => ({
    animalIndex,
    animalKind: "finale-dove" as const,
    position: [0, -0.135, 0] as const,
    scale: [0.21, 0.12, 1] as const,
  })),
];

type ActorFrame = {
  readonly cue: ForestJourneyCueState;
  readonly departed: boolean;
  readonly finaleCueActive: boolean;
  readonly openingHorizontalScale: number;
  readonly reducedMotion: boolean;
};

type AnimalScratch = {
  readonly contact: Object3D;
  readonly eye: Object3D;
  readonly finalMatrix: Matrix4;
  readonly parent: Object3D;
  readonly part: Object3D;
};

type AnimalFrameValues = {
  departed: boolean;
  finaleDoveFlight: number;
  gateDoveFlight: number;
  openingHorizontalScale: number;
  rabbitGuide: number;
  reducedMotion: boolean;
};

function placementFor(kind: AnimalKind, index: number): ForestAnimalPlacement {
  if (kind === "rabbit") return FOREST_RABBIT_PLACEMENTS[index]!;
  if (kind === "gate-dove") return FOREST_GATE_DOVE_PLACEMENTS[index]!;
  return FOREST_FINALE_DOVE_PLACEMENTS[index]!;
}

function updateParentTransform(
  object: Object3D,
  kind: AnimalKind,
  index: number,
  frame: ActorFrame,
): void {
  const placement = placementFor(kind, index);
  object.position.set(...placement.position);
  if (kind !== "finale-dove") {
    object.position.x *= frame.openingHorizontalScale;
  }
  object.rotation.set(0, placement.rotationY, 0);
  object.scale.set(1, 1, 1);

  if (kind === "rabbit") {
    const guide = frame.reducedMotion ? 0 : frame.cue.rabbitGuide;
    if (index === 0) {
      object.position.x -= guide * 0.18;
      object.position.y += Math.sin(Math.min(1, guide / 0.68) * Math.PI) * 0.22;
      object.position.z -= guide * 0.14;
      object.rotation.y -= guide * 0.28;
    } else {
      object.rotation.y += guide * 0.22;
    }
  } else {
    const flight = kind === "gate-dove"
      ? frame.departed ? 1 : frame.finaleCueActive ? 0 : frame.cue.doveFlight
      : frame.finaleCueActive ? frame.cue.doveFlight : 0;
    const direction = index % 2 === 0 ? -1 : 1;
    object.position.x += direction * flight * (kind === "gate-dove" ? 1.48 : 1.05);
    object.position.y += flight * (kind === "gate-dove" ? 1.52 : 1.12)
      + Math.sin(flight * Math.PI) * 0.16;
    object.position.z -= flight * (0.72 + index * 0.08);
    object.rotation.z = direction * flight * 0.24;
  }

  object.updateMatrix();
}

function updatePartMesh(
  mesh: InstancedMesh | null,
  parts: readonly AnimalPart[],
  frame: ActorFrame,
  scratch: AnimalScratch,
): void {
  if (!mesh) return;
  const { finalMatrix, parent, part: partObject } = scratch;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]!;
    updateParentTransform(parent, part.animalKind, part.animalIndex, frame);
    partObject.position.set(...part.position);
    partObject.rotation.set(...part.rotation);
    partObject.scale.set(...part.scale);

    if (part.animalKind === "rabbit") {
      const guide = frame.reducedMotion ? 0 : frame.cue.rabbitGuide;
      if (part.part === "head") partObject.rotation.y += (part.animalIndex === 0 ? -1 : 1) * guide * 0.36;
      if (part.part === "ear-left") partObject.rotation.z -= guide * 0.24;
      if (part.part === "ear-right") partObject.rotation.z += guide * 0.18;
    } else if (part.part === "wing-left" || part.part === "wing-right") {
      const flight = part.animalKind === "gate-dove"
        ? frame.departed ? 1 : frame.finaleCueActive ? 0 : frame.cue.doveFlight
        : frame.finaleCueActive ? frame.cue.doveFlight : 0;
      const flap = Math.sin(flight * Math.PI * 5) * 0.62 + flight * 0.28;
      partObject.rotation.z += part.part === "wing-left" ? -flap : flap;
    }

    partObject.updateMatrix();
    finalMatrix.multiplyMatrices(parent.matrix, partObject.matrix);
    mesh.setMatrixAt(index, finalMatrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function updateEyeMesh(
  mesh: InstancedMesh | null,
  parts: readonly EyePart[],
  frame: ActorFrame,
  scratch: AnimalScratch,
): void {
  if (!mesh) return;
  const { eye, finalMatrix, parent } = scratch;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]!;
    updateParentTransform(parent, part.animalKind, part.animalIndex, frame);
    eye.position.set(...part.position);
    eye.scale.set(...part.scale);
    eye.updateMatrix();
    finalMatrix.multiplyMatrices(parent.matrix, eye.matrix);
    mesh.setMatrixAt(index, finalMatrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function updateContactMesh(
  mesh: InstancedMesh | null,
  parts: readonly ContactPart[],
  frame: ActorFrame,
  scratch: AnimalScratch,
): void {
  if (!mesh) return;
  const { contact, finalMatrix, parent } = scratch;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]!;
    updateParentTransform(parent, part.animalKind, part.animalIndex, frame);
    const flight = part.animalKind === "gate-dove"
      ? frame.departed ? 1 : frame.finaleCueActive ? 0 : frame.cue.doveFlight
      : part.animalKind === "finale-dove" && frame.finaleCueActive
        ? frame.cue.doveFlight
        : 0;
    const restingScale = Math.max(0.001, 1 - flight * 1.5);
    contact.position.set(...part.position);
    contact.rotation.set(-Math.PI / 2, 0, 0);
    contact.scale.set(
      part.scale[0] * restingScale,
      part.scale[1] * restingScale,
      part.scale[2],
    );
    contact.updateMatrix();
    finalMatrix.multiplyMatrices(parent.matrix, contact.matrix);
    mesh.setMatrixAt(index, finalMatrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function hasAnimalFrameChanged(
  previous: AnimalFrameValues,
  cue: ForestJourneyCueState,
  departed: boolean,
  finaleCueActive: boolean,
  openingHorizontalScale: number,
  reducedMotion: boolean,
): boolean {
  return previous.departed !== departed
    || previous.finaleDoveFlight !== (
      finaleCueActive && !reducedMotion ? cue.doveFlight : 0
    )
    || previous.gateDoveFlight !== (
      departed ? 1 : finaleCueActive || reducedMotion ? 0 : cue.doveFlight
    )
    || previous.openingHorizontalScale !== openingHorizontalScale
    || previous.rabbitGuide !== (reducedMotion ? 0 : cue.rabbitGuide)
    || previous.reducedMotion !== reducedMotion;
}

function recordAnimalFrame(
  target: AnimalFrameValues,
  frame: ActorFrame,
): void {
  target.departed = frame.departed;
  target.finaleDoveFlight = frame.finaleCueActive && !frame.reducedMotion
    ? frame.cue.doveFlight
    : 0;
  target.gateDoveFlight = frame.departed
    ? 1
    : frame.finaleCueActive || frame.reducedMotion ? 0 : frame.cue.doveFlight;
  target.openingHorizontalScale = frame.openingHorizontalScale;
  target.rabbitGuide = frame.reducedMotion ? 0 : frame.cue.rabbitGuide;
  target.reducedMotion = frame.reducedMotion;
}

export type ForestAnimalsProps = {
  readonly cueRef: MutableRefObject<ForestJourneyCueState>;
  readonly gateDepartedRef: MutableRefObject<boolean>;
  readonly finaleCueActive: boolean;
  readonly reducedMotion: boolean;
};

export function ForestAnimals({
  cueRef,
  gateDepartedRef,
  finaleCueActive,
  reducedMotion,
}: ForestAnimalsProps) {
  const viewportSize = useThree(({ size }) => size);
  const openingHorizontalScale = getForestOpeningAnimalHorizontalScale(viewportSize);
  const bodyRef = useRef<InstancedMesh | null>(null);
  const eyeRef = useRef<InstancedMesh | null>(null);
  const contactRef = useRef<InstancedMesh | null>(null);
  const lastFrameRef = useRef<AnimalFrameValues>({
    departed: false,
    finaleDoveFlight: Number.NaN,
    gateDoveFlight: Number.NaN,
    openingHorizontalScale: Number.NaN,
    rabbitGuide: Number.NaN,
    reducedMotion: false,
  });
  const scratch = useMemo<AnimalScratch>(() => ({
    contact: new Object3D(),
    eye: new Object3D(),
    finalMatrix: new Matrix4(),
    parent: new Object3D(),
    part: new Object3D(),
  }), []);
  const bodyGeometry = useMemo(() => new SphereGeometry(0.5, 7, 5), []);
  const eyeGeometry = useMemo(() => new SphereGeometry(0.5, 5, 3), []);
  const contactGeometry = useMemo(() => new CircleGeometry(1, 12), []);
  const bodyMaterial = useMemo(() => new MeshStandardMaterial({
    color: 0xfffdf4,
    roughness: 0.8,
  }), []);
  const eyeMaterial = useMemo(() => new MeshBasicMaterial({ color: 0x243a2a }), []);
  const contactMaterial = useMemo(() => new MeshBasicMaterial({
    color: 0x243a2a,
    depthWrite: false,
    opacity: 0.14,
    side: DoubleSide,
    transparent: true,
  }), []);

  useLayoutEffect(() => {
    bodyRef.current?.instanceMatrix.setUsage(DynamicDrawUsage);
    eyeRef.current?.instanceMatrix.setUsage(DynamicDrawUsage);
    contactRef.current?.instanceMatrix.setUsage(DynamicDrawUsage);
    const frame = {
      cue: cueRef.current,
      departed: gateDepartedRef.current,
      finaleCueActive,
      openingHorizontalScale,
      reducedMotion,
    };
    updatePartMesh(bodyRef.current, ANIMAL_PARTS, frame, scratch);
    updateEyeMesh(eyeRef.current, EYE_PARTS, frame, scratch);
    updateContactMesh(contactRef.current, CONTACT_PARTS, frame, scratch);
    recordAnimalFrame(lastFrameRef.current, frame);
    bodyRef.current?.computeBoundingSphere();
    eyeRef.current?.computeBoundingSphere();
    contactRef.current?.computeBoundingSphere();
  }, [
    cueRef,
    finaleCueActive,
    gateDepartedRef,
    openingHorizontalScale,
    reducedMotion,
    scratch,
  ]);

  useEffect(() => () => {
    bodyGeometry.dispose();
    eyeGeometry.dispose();
    contactGeometry.dispose();
    bodyMaterial.dispose();
    eyeMaterial.dispose();
    contactMaterial.dispose();
  }, [
    bodyGeometry,
    bodyMaterial,
    contactGeometry,
    contactMaterial,
    eyeGeometry,
    eyeMaterial,
  ]);

  useFrame(() => {
    const cue = cueRef.current;
    const departed = gateDepartedRef.current;
    if (!hasAnimalFrameChanged(
      lastFrameRef.current,
      cue,
      departed,
      finaleCueActive,
      openingHorizontalScale,
      reducedMotion,
    )) return;

    const frame = {
      cue,
      departed,
      finaleCueActive,
      openingHorizontalScale,
      reducedMotion,
    };

    updatePartMesh(bodyRef.current, ANIMAL_PARTS, frame, scratch);
    updateEyeMesh(eyeRef.current, EYE_PARTS, frame, scratch);
    updateContactMesh(contactRef.current, CONTACT_PARTS, frame, scratch);
    recordAnimalFrame(lastFrameRef.current, frame);
  });

  return (
    <group name="forest-wedding-animals">
      <instancedMesh
        args={[bodyGeometry, bodyMaterial, ANIMAL_PARTS.length]}
        frustumCulled={false}
        ref={bodyRef}
      />
      <instancedMesh
        args={[eyeGeometry, eyeMaterial, EYE_PARTS.length]}
        frustumCulled={false}
        ref={eyeRef}
      />
      <instancedMesh
        args={[contactGeometry, contactMaterial, CONTACT_PARTS.length]}
        frustumCulled={false}
        ref={contactRef}
      />
    </group>
  );
}
