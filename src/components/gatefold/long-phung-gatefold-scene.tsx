"use client";

import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useTexture,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useCallback,
  forwardRef,
  Suspense,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import {
  CanvasTexture,
  DoubleSide,
  Group,
  MeshBasicMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  Texture,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { gsap } from "gsap";

import { longPhungGatefoldPilot } from "@/data/long-phung-gatefold-pilot";

const CENTER_WIDTH = 3;
const WING_WIDTH = CENTER_WIDTH / 2;
const BOARD_HEIGHT = 4.38;
const BOARD_DEPTH = 0.09;
const INITIAL_CAMERA_POSITION: [number, number, number] = [0, 0.06, 10.35];

export const GATEFOLD_CENTER_SHEET_HEIGHT = BOARD_HEIGHT - 0.34;
export const GATEFOLD_CENTER_SHEET_HANDOFF_Z =
  0.1 + BOARD_DEPTH / 2 + 0.006;

export type GatefoldPoseSnapshot = {
  cameraPosition: [number, number, number];
  controlsTarget: [number, number, number];
  rootRotation: [number, number, number];
};

export type GatefoldMotionTargets = {
  camera: PerspectiveCamera;
  controls: OrbitControlsImpl;
  root: Group;
  leftWingPivot: Group;
  rightWingPivot: Group;
  leftClasp: Group;
  rightClasp: Group;
  centerSheet: Group;
  cloudFront: Group;
  cloudFrontMaterial: MeshBasicMaterial;
  invalidate: () => void;
};

export type LongPhungGatefoldSceneHandle = {
  getMotionTargets: () => GatefoldMotionTargets | null;
  lockControls: () => void;
  unlockControls: () => void;
  setBackFaceVisible: (visible: boolean) => void;
  reset: () => void;
  snapshotPose: () => GatefoldPoseSnapshot | null;
};

type LongPhungGatefoldSceneProps = {
  innerSheet: GatefoldInnerSheetContent;
  isOpening: boolean;
  onReady: () => void;
  onSceneHandle: (handle: LongPhungGatefoldSceneHandle) => void;
};

export type GatefoldInnerSheetContent = {
  kicker: string;
  firstName: string;
  conjunction: string;
  secondName: string;
  dateAndTime: string;
  message: string;
  backTitle: string;
  backDate: string;
  backNames: string;
  backMessage: string;
};

function configureColorTexture(texture: Texture): Texture {
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function GoldBorder({ width, height }: { width: number; height: number }) {
  const { antiqueGold } = longPhungGatefoldPilot.palette;
  const inset = 0.18;
  const line = 0.025;

  return (
    <group position={[0, 0, -BOARD_DEPTH / 2 - 0.008]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, height / 2 - inset, 0]}>
        <boxGeometry args={[width - inset * 2, line, line]} />
        <meshStandardMaterial color={antiqueGold} metalness={0.64} roughness={0.34} />
      </mesh>
      <mesh position={[0, -height / 2 + inset, 0]}>
        <boxGeometry args={[width - inset * 2, line, line]} />
        <meshStandardMaterial color={antiqueGold} metalness={0.64} roughness={0.34} />
      </mesh>
      <mesh position={[-width / 2 + inset, 0, 0]}>
        <boxGeometry args={[line, height - inset * 2, line]} />
        <meshStandardMaterial color={antiqueGold} metalness={0.64} roughness={0.34} />
      </mesh>
      <mesh position={[width / 2 - inset, 0, 0]}>
        <boxGeometry args={[line, height - inset * 2, line]} />
        <meshStandardMaterial color={antiqueGold} metalness={0.64} roughness={0.34} />
      </mesh>
      <mesh position={[0, -height * 0.3, 0.004]}>
        <torusGeometry args={[0.23, 0.025, 10, 40]} />
        <meshStandardMaterial color={antiqueGold} metalness={0.68} roughness={0.3} />
      </mesh>
    </group>
  );
}

function ArtworkPlane({
  texture,
  position,
  role,
}: {
  texture: Texture;
  position: [number, number, number];
  role: "dragon-composite-fallback" | "phoenix-composite-fallback";
}) {
  return (
    <mesh
      position={position}
      raycast={() => null}
      userData={{
        assetRole: role,
        semanticLayersReady: false,
      }}
    >
      <planeGeometry args={[1.09, 2.18]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        side={DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function FoilGlint({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number];
}) {
  const materialRef = useRef<MeshBasicMaterial>(null);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");

    if (context) {
      const gradient = context.createLinearGradient(0, canvas.height, canvas.width, 0);
      gradient.addColorStop(0, "rgba(181, 138, 58, 0)");
      gradient.addColorStop(0.36, "rgba(181, 138, 58, 0)");
      gradient.addColorStop(0.5, "rgba(255, 233, 176, 0.9)");
      gradient.addColorStop(0.6, "rgba(181, 138, 58, 0.28)");
      gradient.addColorStop(0.76, "rgba(181, 138, 58, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.colorSpace = SRGBColorSpace;
    return nextTexture;
  }, []);

  useFrame(({ camera }) => {
    const material = materialRef.current;
    if (!material) return;

    const rotationGlint = Math.min(
      0.12,
      0.025 + (Math.abs(camera.position.x) / Math.max(camera.position.z, 0.001)) * 0.18,
    );
    material.opacity = rotationGlint;
  });

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={position} raycast={() => null} renderOrder={3}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        ref={materialRef}
        depthWrite={false}
        map={texture}
        opacity={0.025}
        toneMapped={false}
        transparent
      />
    </mesh>
  );
}

function drawWrappedCenteredText({
  context,
  text,
  x,
  y,
  maxWidth,
  lineHeight,
  maxLines,
}: {
  context: CanvasRenderingContext2D;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
  maxLines: number;
}) {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) lines.push(line);
    if (lines.length >= maxLines) break;
  }

  lines.slice(0, maxLines).forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}

function InnerSheetPrint({
  content,
}: {
  content: GatefoldInnerSheetContent;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1340;
    canvas.height = 2020;
    const context = canvas.getContext("2d");

    if (context) {
      context.textAlign = "center";
      context.textBaseline = "middle";

      context.strokeStyle = longPhungGatefoldPilot.palette.antiqueGold;
      context.lineWidth = 4;
      context.strokeRect(78, 78, canvas.width - 156, canvas.height - 156);
      context.lineWidth = 1.5;
      context.strokeRect(98, 98, canvas.width - 196, canvas.height - 196);

      context.fillStyle = longPhungGatefoldPilot.palette.deepCinnabar;
      context.font = '600 34px "Lora", "Times New Roman", serif';
      context.letterSpacing = "7px";
      context.fillText(content.kicker.toLocaleUpperCase(), canvas.width / 2, 430);

      context.font = '112px "UNI Chu truyen thong", "Fz Qellia", serif';
      context.letterSpacing = "0px";
      drawWrappedCenteredText({
        context,
        text: content.firstName,
        x: canvas.width / 2,
        y: 650,
        maxWidth: 980,
        lineHeight: 132,
        maxLines: 2,
      });

      context.fillStyle = longPhungGatefoldPilot.palette.antiqueGold;
      context.font = 'italic 34px "Lora", "Times New Roman", serif';
      context.fillText(content.conjunction, canvas.width / 2, 790);

      context.fillStyle = longPhungGatefoldPilot.palette.deepCinnabar;
      context.font = '112px "UNI Chu truyen thong", "Fz Qellia", serif';
      drawWrappedCenteredText({
        context,
        text: content.secondName,
        x: canvas.width / 2,
        y: 920,
        maxWidth: 980,
        lineHeight: 132,
        maxLines: 2,
      });

      context.fillStyle = longPhungGatefoldPilot.palette.antiqueGold;
      context.fillRect(canvas.width / 2 - 90, 1050, 180, 3);

      context.fillStyle = longPhungGatefoldPilot.palette.deepCinnabar;
      context.font = '600 40px "Lora", "Times New Roman", serif';
      context.letterSpacing = "8px";
      drawWrappedCenteredText({
        context,
        text: content.dateAndTime,
        x: canvas.width / 2,
        y: 1170,
        maxWidth: 1040,
        lineHeight: 58,
        maxLines: 2,
      });

      context.fillStyle = "#3B2117";
      context.font = '38px "Lora", "Times New Roman", serif';
      context.letterSpacing = "0px";
      drawWrappedCenteredText({
        context,
        text: content.message,
        x: canvas.width / 2,
        y: 1405,
        maxWidth: 900,
        lineHeight: 58,
        maxLines: 5,
      });
    }

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.colorSpace = SRGBColorSpace;
    nextTexture.anisotropy = 4;
    return nextTexture;
  }, [content]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, 0, BOARD_DEPTH / 2 + 0.018]} raycast={() => null}>
      <planeGeometry args={[CENTER_WIDTH - 0.32, GATEFOLD_CENTER_SHEET_HEIGHT]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function BackBoardPrint({
  content,
}: {
  content: GatefoldInnerSheetContent;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1760;
    const context = canvas.getContext("2d");

    if (context) {
      const background = context.createRadialGradient(
        canvas.width * 0.36,
        canvas.height * 0.2,
        20,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.84,
      );
      background.addColorStop(0, longPhungGatefoldPilot.palette.deepCinnabar);
      background.addColorStop(0.52, longPhungGatefoldPilot.palette.lacquerBlack);
      background.addColorStop(1, "#0d0908");
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.strokeStyle = longPhungGatefoldPilot.palette.antiqueGold;
      context.lineWidth = 5;
      context.strokeRect(72, 72, canvas.width - 144, canvas.height - 144);
      context.lineWidth = 2;
      context.strokeRect(100, 100, canvas.width - 200, canvas.height - 200);

      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = longPhungGatefoldPilot.palette.warmIvory;
      context.font = '600 32px "Lora", "Times New Roman", serif';
      context.letterSpacing = "8px";
      context.fillText(content.backTitle.toLocaleUpperCase(), canvas.width / 2, 490);

      context.fillStyle = longPhungGatefoldPilot.palette.antiqueGold;
      context.fillRect(canvas.width / 2 - 78, 620, 156, 3);

      context.fillStyle = longPhungGatefoldPilot.palette.warmIvory;
      context.font = '96px "UNI Chu truyen thong", "Fz Qellia", serif';
      context.letterSpacing = "0px";
      drawWrappedCenteredText({
        context,
        text: content.backDate,
        x: canvas.width / 2,
        y: 760,
        maxWidth: 980,
        lineHeight: 122,
        maxLines: 2,
      });

      context.fillStyle = longPhungGatefoldPilot.palette.antiqueGold;
      context.font = 'italic 34px "Lora", "Times New Roman", serif';
      context.fillText(content.backNames, canvas.width / 2, 930);

      context.fillStyle = "rgba(234, 217, 184, 0.76)";
      context.font = '32px "Lora", "Times New Roman", serif';
      context.letterSpacing = "0px";
      drawWrappedCenteredText({
        context,
        text: content.backMessage,
        x: canvas.width / 2,
        y: 1120,
        maxWidth: 760,
        lineHeight: 52,
        maxLines: 3,
      });

      context.fillStyle = "rgba(181, 138, 58, 0.68)";
      context.beginPath();
      context.arc(canvas.width / 2, 1415, 66, 0, Math.PI * 2);
      context.strokeStyle = "rgba(181, 138, 58, 0.72)";
      context.lineWidth = 3;
      context.stroke();
      context.font = '28px "Lora", "Times New Roman", serif';
      context.fillText("✦", canvas.width / 2, 1415);
    }

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.colorSpace = SRGBColorSpace;
    nextTexture.anisotropy = 4;
    return nextTexture;
  }, [content]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh
      position={[0, 0, -BOARD_DEPTH / 2 - 0.012]}
      rotation={[0, Math.PI, 0]}
      raycast={() => null}
    >
      <planeGeometry args={[CENTER_WIDTH - 0.12, BOARD_HEIGHT - 0.12]} />
      <meshBasicMaterial
        map={texture}
        side={DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function ForegroundClouds({
  texture,
  groupRef,
  materialRef,
}: {
  texture: Texture;
  groupRef: RefObject<Group | null>;
  materialRef: RefObject<MeshBasicMaterial | null>;
}) {
  return (
    <group ref={groupRef} position={[0, -0.34, BOARD_DEPTH * 2.5]}>
      <mesh renderOrder={4} raycast={() => null}>
        <planeGeometry args={[2.82, 2.82]} />
        <meshBasicMaterial
          ref={materialRef}
          depthWrite={false}
          map={texture}
          opacity={0}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

function Wing({
  side,
  texture,
  pivotRef,
}: {
  side: "left" | "right";
  texture: Texture;
  pivotRef: RefObject<Group | null>;
}) {
  const { deepCinnabar, lacquerCrimson, warmIvory } = longPhungGatefoldPilot.palette;
  const pivotX = side === "left" ? -CENTER_WIDTH / 2 : CENTER_WIDTH / 2;
  const boardOffsetX = side === "left" ? WING_WIDTH / 2 : -WING_WIDTH / 2;

  return (
    <group ref={pivotRef} position={[pivotX, 0, BOARD_DEPTH]}>
      <mesh position={[boardOffsetX, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[WING_WIDTH, BOARD_HEIGHT, BOARD_DEPTH]} />
        <meshPhysicalMaterial
          color={deepCinnabar}
          clearcoat={0.28}
          clearcoatRoughness={0.35}
          metalness={0.05}
          roughness={0.44}
        />
      </mesh>
      <mesh position={[boardOffsetX, 0, BOARD_DEPTH / 2 + 0.003]}>
        <planeGeometry args={[WING_WIDTH - 0.05, BOARD_HEIGHT - 0.05]} />
        <meshPhysicalMaterial
          color={lacquerCrimson}
          clearcoat={0.32}
          clearcoatRoughness={0.34}
          metalness={0.06}
          roughness={0.42}
        />
      </mesh>
      <mesh
        position={[boardOffsetX, 0, -BOARD_DEPTH / 2 - 0.003]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[WING_WIDTH - 0.05, BOARD_HEIGHT - 0.05]} />
        <meshStandardMaterial color={warmIvory} roughness={0.89} />
      </mesh>
      <ArtworkPlane
        texture={texture}
        position={[boardOffsetX, 0.02, BOARD_DEPTH / 2 + 0.008]}
        role={side === "left" ? "dragon-composite-fallback" : "phoenix-composite-fallback"}
      />
      <FoilGlint
        position={[boardOffsetX, 0.02, BOARD_DEPTH / 2 + 0.014]}
        size={[WING_WIDTH - 0.14, BOARD_HEIGHT - 0.32]}
      />
    </group>
  );
}

const GatefoldSceneContent = forwardRef<
  LongPhungGatefoldSceneHandle,
  LongPhungGatefoldSceneProps
>(function GatefoldSceneContent({
  innerSheet,
  isOpening,
  onReady,
  onSceneHandle,
}, ref) {
  const { camera, invalidate, size } = useThree();
  const rootRef = useRef<Group>(null);
  const leftWingPivotRef = useRef<Group>(null);
  const rightWingPivotRef = useRef<Group>(null);
  const leftClaspRef = useRef<Group>(null);
  const rightClaspRef = useRef<Group>(null);
  const centerSheetRef = useRef<Group>(null);
  const cloudFrontRef = useRef<Group>(null);
  const cloudFrontMaterialRef = useRef<MeshBasicMaterial>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const backFaceTweenRef = useRef<gsap.core.Tween | null>(null);
  const initialCameraDistanceRef = useRef(INITIAL_CAMERA_POSITION[2]);
  const textures = useTexture([
    longPhungGatefoldPilot.assets.dragon,
    longPhungGatefoldPilot.assets.phoenix,
    longPhungGatefoldPilot.assets.cloudFront,
  ]);
  const [dragonTexture, phoenixTexture, cloudFrontTexture] = textures;
  const targetClosedWidth = Math.max(1, Math.min(size.width * 0.82, 29 * 16));
  const initialCameraDistance =
    (CENTER_WIDTH * size.height)
    / (2 * targetClosedWidth * Math.tan((28 * Math.PI) / 360));

  useEffect(() => {
    initialCameraDistanceRef.current = initialCameraDistance;
  }, [initialCameraDistance]);

  useEffect(() => {
    configureColorTexture(dragonTexture);
    configureColorTexture(phoenixTexture);
    configureColorTexture(cloudFrontTexture);
  }, [cloudFrontTexture, dragonTexture, phoenixTexture]);

  const reset = useCallback(() => {
    const perspectiveCamera = camera as PerspectiveCamera;
    const controls = controlsRef.current;

    backFaceTweenRef.current?.kill();
    backFaceTweenRef.current = null;
    rootRef.current?.rotation.set(0, 0, 0);
    leftWingPivotRef.current?.rotation.set(0, 0, 0);
    rightWingPivotRef.current?.rotation.set(0, 0, 0);
    leftClaspRef.current?.position.set(0, 0, BOARD_DEPTH * 2.1);
    rightClaspRef.current?.position.set(0, 0, BOARD_DEPTH * 2.1);
    centerSheetRef.current?.position.set(0, 0, 0);
    cloudFrontRef.current?.position.set(0, -0.34, BOARD_DEPTH * 2.5);
    cloudFrontRef.current?.rotation.set(0, 0, 0);
    cloudFrontRef.current?.scale.set(1, 1, 1);
    if (cloudFrontMaterialRef.current) {
      cloudFrontMaterialRef.current.opacity = 0;
    }
    perspectiveCamera.position.set(0, 0.06, initialCameraDistanceRef.current);
    controls?.target.set(0, 0, 0);
    controls?.update();
    invalidate();
  }, [camera, invalidate]);

  const sceneHandle = useMemo<LongPhungGatefoldSceneHandle>(() => ({
    getMotionTargets: () => {
      const controls = controlsRef.current;
      const root = rootRef.current;
      const leftWingPivot = leftWingPivotRef.current;
      const rightWingPivot = rightWingPivotRef.current;
      const leftClasp = leftClaspRef.current;
      const rightClasp = rightClaspRef.current;
      const centerSheet = centerSheetRef.current;
      const cloudFront = cloudFrontRef.current;
      const cloudFrontMaterial = cloudFrontMaterialRef.current;

      if (
        !controls ||
        !root ||
        !leftWingPivot ||
        !rightWingPivot ||
        !leftClasp ||
        !rightClasp ||
        !centerSheet ||
        !cloudFront ||
        !cloudFrontMaterial
      ) {
        return null;
      }

      return {
        camera: camera as PerspectiveCamera,
        controls,
        root,
        leftWingPivot,
        rightWingPivot,
        leftClasp,
        rightClasp,
        centerSheet,
        cloudFront,
        cloudFrontMaterial,
        invalidate,
      };
    },
    lockControls: () => {
      const controls = controlsRef.current;
      if (!controls) return;

      controls.enabled = false;
      controls.enableDamping = false;
      controls.update();
      invalidate();
    },
    unlockControls: () => {
      const controls = controlsRef.current;
      if (!controls) return;

      controls.enableDamping = true;
      controls.enabled = true;
    },
    setBackFaceVisible: (visible: boolean) => {
      const root = rootRef.current;
      if (!root) return;

      backFaceTweenRef.current?.kill();
      const controls = controlsRef.current;
      if (controls) controls.enabled = false;
      backFaceTweenRef.current = gsap.to(root.rotation, {
        duration: 0.72,
        ease: "power3.inOut",
        onComplete: () => {
          backFaceTweenRef.current = null;
          if (controls) controls.enabled = true;
          invalidate();
        },
        onUpdate: invalidate,
        y: visible ? Math.PI : 0,
      });
    },
    reset,
    snapshotPose: () => {
      const controls = controlsRef.current;
      const root = rootRef.current;
      const perspectiveCamera = camera as PerspectiveCamera;
      if (!controls || !root) return null;

      return {
        cameraPosition: [
          perspectiveCamera.position.x,
          perspectiveCamera.position.y,
          perspectiveCamera.position.z,
        ],
        controlsTarget: [controls.target.x, controls.target.y, controls.target.z],
        rootRotation: [root.rotation.x, root.rotation.y, root.rotation.z],
      };
    },
  }), [camera, invalidate, reset]);

  useImperativeHandle(ref, () => sceneHandle, [sceneHandle]);

  useEffect(() => {
    reset();
    onSceneHandle(sceneHandle);
    onReady();
  }, [onReady, onSceneHandle, reset, sceneHandle]);

  const { antiqueGold, deepCinnabar, lacquerBlack, warmIvory } =
    longPhungGatefoldPilot.palette;

  return (
    <>
      <ambientLight intensity={1.45} />
      <Environment
        environmentIntensity={0.72}
        frames={1}
        resolution={64}
      >
        <Lightformer
          color="#ffe5b0"
          form="rect"
          intensity={3.2}
          position={[-4, 4, 4]}
          scale={[5, 5, 1]}
        />
        <Lightformer
          color="#f6dcc4"
          form="rect"
          intensity={1.8}
          position={[4, 1, -3]}
          scale={[4, 4, 1]}
        />
      </Environment>
      <directionalLight
        position={[-4.5, 5.5, 7]}
        intensity={2.4}
        color="#ffe5b0"
        castShadow
      />
      <directionalLight position={[5, 2, -4]} intensity={1.1} color="#f6dcc4" />
      <group ref={rootRef}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[CENTER_WIDTH, BOARD_HEIGHT, BOARD_DEPTH]} />
          <meshPhysicalMaterial
            color={deepCinnabar}
            clearcoat={0.25}
            clearcoatRoughness={0.35}
            metalness={0.04}
            roughness={0.45}
          />
        </mesh>
        <group ref={centerSheetRef}>
          <mesh position={[0, 0, BOARD_DEPTH / 2 + 0.006]} receiveShadow>
            <planeGeometry args={[CENTER_WIDTH - 0.32, GATEFOLD_CENTER_SHEET_HEIGHT]} />
            <meshStandardMaterial color={warmIvory} roughness={0.91} />
          </mesh>
          <mesh position={[0, 0, BOARD_DEPTH / 2 + 0.012]} raycast={() => null}>
            <planeGeometry args={[CENTER_WIDTH - 0.52, BOARD_HEIGHT - 0.56]} />
            <meshBasicMaterial color="#e5c689" transparent opacity={0.14} />
          </mesh>
          <InnerSheetPrint content={innerSheet} />
        </group>
        <mesh position={[0, 0, -BOARD_DEPTH / 2 - 0.003]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[CENTER_WIDTH - 0.05, BOARD_HEIGHT - 0.05]} />
          <meshPhysicalMaterial
            color={lacquerBlack}
            clearcoat={0.22}
            clearcoatRoughness={0.4}
            roughness={0.51}
          />
        </mesh>
        <BackBoardPrint content={innerSheet} />
        <GoldBorder width={CENTER_WIDTH} height={BOARD_HEIGHT} />
        <Wing side="left" texture={dragonTexture} pivotRef={leftWingPivotRef} />
        <Wing side="right" texture={phoenixTexture} pivotRef={rightWingPivotRef} />
        <ForegroundClouds
          groupRef={cloudFrontRef}
          materialRef={cloudFrontMaterialRef}
          texture={cloudFrontTexture}
        />
        <group ref={leftClaspRef} position={[0, 0, BOARD_DEPTH * 2.1]}>
          <mesh castShadow>
            <circleGeometry args={[0.235, 48, Math.PI / 2, Math.PI]} />
            <meshPhysicalMaterial
              color={antiqueGold}
              metalness={0.78}
              roughness={0.29}
              clearcoat={0.18}
            />
          </mesh>
        </group>
        <group ref={rightClaspRef} position={[0, 0, BOARD_DEPTH * 2.1]}>
          <mesh castShadow>
            <circleGeometry args={[0.235, 48, -Math.PI / 2, Math.PI]} />
            <meshPhysicalMaterial
              color={antiqueGold}
              metalness={0.78}
              roughness={0.29}
              clearcoat={0.18}
            />
          </mesh>
        </group>
      </group>
      <ContactShadows
        position={[0, -2.5, 0]}
        opacity={0.34}
        scale={9.5}
        blur={2.4}
        far={4.4}
        frames={isOpening ? Infinity : 1}
      />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        minPolarAngle={0.52}
        maxPolarAngle={2.62}
        onChange={() => invalidate()}
      />
    </>
  );
});

export const LongPhungGatefoldScene = forwardRef<
  LongPhungGatefoldSceneHandle,
  LongPhungGatefoldSceneProps
>(function LongPhungGatefoldScene({
  innerSheet,
  isOpening,
  onReady,
  onSceneHandle,
}, ref) {
  return (
    <Canvas
      camera={{ position: INITIAL_CAMERA_POSITION, fov: 28 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      shadows
    >
      <color attach="background" args={[longPhungGatefoldPilot.palette.lacquerBlack]} />
      <Suspense fallback={null}>
        <GatefoldSceneContent
          ref={ref}
          innerSheet={innerSheet}
          isOpening={isOpening}
          onReady={onReady}
          onSceneHandle={onSceneHandle}
        />
      </Suspense>
    </Canvas>
  );
});
