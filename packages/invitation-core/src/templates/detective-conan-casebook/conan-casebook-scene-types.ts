import type {
  Group,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Vector3Tuple,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export type ConanCasebookCoverContent = {
  backDate: string;
  backMessage: string;
  backNames: string;
  backTitle: string;
  caseNumber: string;
  conjunction: string;
  dateAndTime: string;
  firstName: string;
  kicker: string;
  secondName: string;
};

export type ConanCasebookPoseSnapshot = {
  cameraPosition: Vector3Tuple;
  controlsTarget: Vector3Tuple;
  firstPageRotation: Vector3Tuple;
  frontCoverRotation: Vector3Tuple;
  rootRotation: Vector3Tuple;
};

export type ConanCasebookMotionTargets = {
  camera: PerspectiveCamera;
  controls: OrbitControlsImpl;
  firstPageMaterial: MeshStandardMaterial;
  firstPagePivot: Group;
  frontCoverMaterial: MeshPhysicalMaterial;
  frontCoverPivot: Group;
  invalidate: () => void;
  pageBlock: Group;
  pageBlockMaterial: MeshStandardMaterial;
  portraitMaterial: MeshBasicMaterial;
  root: Group;
};

export type ConanCasebookSceneHandle = {
  getMotionTargets: () => ConanCasebookMotionTargets | null;
  lockControls: () => void;
  reset: () => void;
  setBackFaceVisible: (visible: boolean) => void;
  snapshotPose: () => ConanCasebookPoseSnapshot | null;
  unlockControls: () => void;
};
