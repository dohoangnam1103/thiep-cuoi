import type {
  Group,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Vector3Tuple,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export type DoraemonDoorPoseSnapshot = {
  cameraPosition: Vector3Tuple;
  controlsTarget: Vector3Tuple;
  rootRotation: Vector3Tuple;
};

export type DoraemonDoorCharacterTarget = {
  finalPosition: Vector3Tuple;
  group: Group;
  material: MeshBasicMaterial;
};

export type DoraemonDoorMotionTargets = {
  camera: PerspectiveCamera;
  characters: {
    doraemon: DoraemonDoorCharacterTarget;
    jaian: DoraemonDoorCharacterTarget;
    nobita: DoraemonDoorCharacterTarget;
    shizuka: DoraemonDoorCharacterTarget;
    suneo: DoraemonDoorCharacterTarget;
  };
  controls: OrbitControlsImpl;
  doorPivot: Group;
  handlePivot: Group;
  invalidate: () => void;
  portalGroup: Group;
  portalMaterial: MeshStandardMaterial;
  portalRingMaterial: MeshBasicMaterial;
  root: Group;
};

export type DoraemonDoorSceneHandle = {
  getMotionTargets: () => DoraemonDoorMotionTargets | null;
  lockControls: () => void;
  reset: () => void;
  snapshotPose: () => DoraemonDoorPoseSnapshot | null;
  unlockControls: () => void;
};
