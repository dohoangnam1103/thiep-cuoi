"use client";

import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  RoundedBox,
  useTexture,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import {
  forwardRef,
  memo,
  Suspense,
  useCallback,
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
  MathUtils,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  type Texture,
  type Vector3Tuple,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type {
  ConanCasebookCoverContent,
  ConanCasebookMotionTargets,
  ConanCasebookSceneHandle,
} from "./conan-casebook-scene-types";

const BOOK_WIDTH = 3.42;
const BOOK_HEIGHT = 4.88;
const COVER_DEPTH = 0.12;
const PAGE_BLOCK_DEPTH = 0.23;
const CLOSED_ROOT_ROTATION: Vector3Tuple = [
  MathUtils.degToRad(2.5),
  MathUtils.degToRad(-7),
  MathUtils.degToRad(-0.8),
];
const DESKTOP_CAMERA_POSITION: Vector3Tuple = [0, 0.03, 9.65];
const MOBILE_CAMERA_POSITION: Vector3Tuple = [0, 0.04, 12.65];
const CONTROLS_TARGET: Vector3Tuple = [0, -0.02, 0];
const COUPLE_ASSET =
  "/chungdoi/templates/detective-conan-casebook/characters/shinichi-ran-wedding.webp";
const COUPLE_MOBILE_ASSET =
  "/chungdoi/templates/detective-conan-casebook/characters/shinichi-ran-wedding.mobile.webp";

export const CONAN_CASEBOOK_PAGE_HEIGHT = BOOK_HEIGHT - 0.24;
export const CONAN_CASEBOOK_PAGE_HANDOFF_Z =
  PAGE_BLOCK_DEPTH / 2 + COVER_DEPTH + 0.025;
export const CASEBOOK_PAGE_HEIGHT = CONAN_CASEBOOK_PAGE_HEIGHT;
export const CASEBOOK_PAGE_HANDOFF_Z = CONAN_CASEBOOK_PAGE_HANDOFF_Z;

export type DetectiveConanCasebookSceneProps = {
  coverContent: ConanCasebookCoverContent;
  isMobile: boolean;
  isOpening: boolean;
  onBackFaceChange: (visible: boolean) => void;
  onReady: () => void;
  onSceneHandle: (handle: ConanCasebookSceneHandle) => void;
};

function fitTextSize(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minimumSize: number,
  fontFamily: string,
): number {
  let size = startSize;

  while (size > minimumSize) {
    context.font = `700 ${size}px ${fontFamily}`;
    if (context.measureText(text).width <= maxWidth) break;
    size -= 2;
  }

  return size;
}

function makeCoverTexture(content: ConanCasebookCoverContent): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1700;
  const context = canvas.getContext("2d");

  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.strokeStyle = "rgba(214, 221, 224, 0.82)";
    context.lineWidth = 3;
    context.strokeRect(66, 66, 1068, 1568);
    context.strokeStyle = "rgba(209, 43, 55, 0.92)";
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(67, 232);
    context.lineTo(390, 232);
    context.stroke();

    context.fillStyle = "#D12B37";
    context.font = '700 28px "Helvetica Neue", Arial, sans-serif';
    context.letterSpacing = "10px";
    context.fillText(content.kicker.toLocaleUpperCase(), 600, 168);

    context.fillStyle = "rgba(245, 241, 226, 0.94)";
    context.font = '800 86px "Helvetica Neue", Arial, sans-serif';
    context.letterSpacing = "4px";
    context.fillText(content.caseNumber, 600, 282);

    // Cỡ chữ tên cô dâu và chú rể phải luôn bằng nhau: đo riêng từng tên thì tên
    // ngắn giữ nguyên 82px còn tên dài bị co xuống, hai dòng lệch cỡ. Lấy cỡ nhỏ
    // nhất để cả hai vừa khung và cùng cỡ.
    const nameFontFamily = '"Helvetica Neue", Arial, sans-serif';
    const coupleNameSize = Math.min(
      fitTextSize(context, content.firstName, 900, 82, 10, nameFontFamily),
      fitTextSize(context, content.secondName, 900, 82, 10, nameFontFamily),
    );

    context.fillStyle = "#F5F1E2";
    context.font = `700 ${coupleNameSize}px ${nameFontFamily}`;
    context.fillText(content.firstName, 600, 1192);

    context.fillStyle = "#D12B37";
    context.font = 'italic 31px Georgia, "Times New Roman", serif';
    context.fillText(content.conjunction, 600, 1274);

    context.fillStyle = "#F5F1E2";
    context.font = `700 ${coupleNameSize}px ${nameFontFamily}`;
    context.fillText(content.secondName, 600, 1365);

    context.fillStyle = "rgba(245, 241, 226, 0.78)";
    context.font = '500 28px "Helvetica Neue", Arial, sans-serif';
    context.letterSpacing = "4px";
    context.fillText(content.dateAndTime, 600, 1510);

    context.strokeStyle = "rgba(209, 43, 55, 0.9)";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(1000, 1510, 58, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(1040, 1552);
    context.lineTo(1090, 1602);
    context.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function makeBackTexture(content: ConanCasebookCoverContent): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1700;
  const context = canvas.getContext("2d");

  if (context) {
    context.fillStyle = "#101B2A";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.strokeStyle = "rgba(209, 43, 55, 0.86)";
    context.lineWidth = 5;
    context.strokeRect(72, 72, 1056, 1556);
    context.strokeStyle = "rgba(245, 241, 226, 0.22)";
    context.lineWidth = 2;
    context.strokeRect(94, 94, 1012, 1512);

    context.fillStyle = "#D12B37";
    context.font = '700 27px "Helvetica Neue", Arial, sans-serif';
    context.letterSpacing = "9px";
    context.fillText(content.backTitle.toLocaleUpperCase(), 600, 442);

    context.fillStyle = "#F5F1E2";
    const namesSize = fitTextSize(
      context,
      content.backNames,
      860,
      70,
      10,
      '"Helvetica Neue", Arial, sans-serif',
    );
    context.font =
      `700 ${namesSize}px "Helvetica Neue", Arial, sans-serif`;
    context.fillText(content.backNames, 600, 622);

    context.fillStyle = "rgba(245, 241, 226, 0.82)";
    context.font = '500 31px "Helvetica Neue", Arial, sans-serif';
    context.letterSpacing = "4px";
    context.fillText(content.backDate, 600, 760);

    context.fillStyle = "rgba(245, 241, 226, 0.66)";
    context.font = '400 27px Georgia, "Times New Roman", serif';
    const words = content.backMessage.trim().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > 780) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);

    lines.slice(0, 4).forEach((messageLine, index) => {
      context.fillText(messageLine, 600, 930 + index * 48);
    });

    context.strokeStyle = "rgba(209, 43, 55, 0.88)";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(600, 1295, 108, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "#D12B37";
    context.font = '800 40px "Helvetica Neue", Arial, sans-serif';
    context.fillText(content.caseNumber, 600, 1296);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function makeFirstPageTexture(content: ConanCasebookCoverContent): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1100;
  canvas.height = 1580;
  const context = canvas.getContext("2d");

  if (context) {
    context.fillStyle = "#F3EFE3";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.strokeStyle = "rgba(18, 31, 48, 0.2)";
    context.lineWidth = 2;
    context.strokeRect(62, 62, 976, 1456);

    context.fillStyle = "#D12B37";
    context.font = '700 28px "Helvetica Neue", Arial, sans-serif';
    context.letterSpacing = "8px";
    context.fillText(content.kicker.toLocaleUpperCase(), 550, 515);

    context.fillStyle = "#121F30";
    context.font = '800 82px "Helvetica Neue", Arial, sans-serif';
    context.fillText(content.caseNumber, 550, 655);

    context.fillStyle = "rgba(18, 31, 48, 0.72)";
    context.font = '500 30px "Helvetica Neue", Arial, sans-serif';
    context.letterSpacing = "4px";
    context.fillText(content.dateAndTime, 550, 810);

    context.strokeStyle = "rgba(209, 43, 55, 0.8)";
    context.lineWidth = 5;
    context.beginPath();
    context.arc(550, 1040, 86, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(610, 1102);
    context.lineTo(680, 1172);
    context.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function CoverArtwork({
  coverTexture,
  portraitMaterialRef,
  portraitTexture,
}: {
  coverTexture: Texture;
  portraitMaterialRef: RefObject<MeshBasicMaterial | null>;
  portraitTexture: Texture;
}) {
  return (
    <>
      <mesh position={[0.08, 0.24, COVER_DEPTH / 2 + 0.012]} raycast={() => null}>
        <planeGeometry args={[1.49, 3.14]} />
        <meshBasicMaterial
          ref={portraitMaterialRef}
          alphaTest={0.035}
          depthWrite={false}
          map={portraitTexture}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh position={[0, 0, COVER_DEPTH / 2 + 0.022]} raycast={() => null}>
        <planeGeometry args={[BOOK_WIDTH - 0.16, BOOK_HEIGHT - 0.16]} />
        <meshBasicMaterial
          alphaTest={0.01}
          depthWrite={false}
          map={coverTexture}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh
        position={[0, 0, -COVER_DEPTH / 2 - 0.008]}
        raycast={() => null}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[BOOK_WIDTH - 0.2, BOOK_HEIGHT - 0.2]} />
        <meshBasicMaterial
          color="#E9E3D5"
          opacity={0.98}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
    </>
  );
}

const CasebookWorld = forwardRef<
  ConanCasebookSceneHandle,
  DetectiveConanCasebookSceneProps
>(function CasebookWorld({
  coverContent,
  isMobile,
  isOpening,
  onBackFaceChange,
  onReady,
  onSceneHandle,
}, ref) {
  const { camera, invalidate } = useThree();
  const rootRef = useRef<Group>(null);
  const pageBlockRef = useRef<Group>(null);
  const frontCoverPivotRef = useRef<Group>(null);
  const firstPagePivotRef = useRef<Group>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const frontCoverMaterialRef = useRef<MeshPhysicalMaterial>(null);
  const pageBlockMaterialRef = useRef<MeshStandardMaterial>(null);
  const firstPageMaterialRef = useRef<MeshStandardMaterial>(null);
  const portraitMaterialRef = useRef<MeshBasicMaterial>(null);
  const backFaceTweenRef = useRef<gsap.core.Tween | null>(null);
  const isOpeningRef = useRef(isOpening);
  const lastBackFaceVisibleRef = useRef(false);
  const sourcePortraitTexture = useTexture(
    isMobile ? COUPLE_MOBILE_ASSET : COUPLE_ASSET,
  );
  const portraitTexture = useMemo(() => {
    const texture = sourcePortraitTexture.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }, [sourcePortraitTexture]);

  const coverTexture = useMemo(
    () => makeCoverTexture(coverContent),
    [coverContent],
  );
  const backTexture = useMemo(
    () => makeBackTexture(coverContent),
    [coverContent],
  );
  const firstPageTexture = useMemo(
    () => makeFirstPageTexture(coverContent),
    [coverContent],
  );

  useEffect(
    () => () => {
      coverTexture.dispose();
      backTexture.dispose();
      firstPageTexture.dispose();
      portraitTexture.dispose();
    },
    [backTexture, coverTexture, firstPageTexture, portraitTexture],
  );

  useEffect(() => {
    isOpeningRef.current = isOpening;
  }, [isOpening]);

  const reset = useCallback(() => {
    const root = rootRef.current;
    const frontCoverPivot = frontCoverPivotRef.current;
    const firstPagePivot = firstPagePivotRef.current;
    const pageBlock = pageBlockRef.current;
    const controls = controlsRef.current;
    const perspectiveCamera = camera as PerspectiveCamera;

    backFaceTweenRef.current?.kill();
    backFaceTweenRef.current = null;
    root?.position.set(0, 0, 0);
    root?.rotation.set(...CLOSED_ROOT_ROTATION);
    root?.scale.setScalar(1);
    frontCoverPivot?.rotation.set(0, 0, 0);
    frontCoverPivot?.scale.setScalar(1);
    firstPagePivot?.rotation.set(0, 0, 0);
    firstPagePivot?.scale.setScalar(1);
    pageBlock?.position.set(0.045, -0.015, -0.025);
    pageBlock?.rotation.set(0, 0, 0);
    pageBlock?.scale.setScalar(1);
    if (frontCoverMaterialRef.current) {
      frontCoverMaterialRef.current.opacity = 1;
    }
    if (pageBlockMaterialRef.current) {
      pageBlockMaterialRef.current.opacity = 1;
    }
    if (firstPageMaterialRef.current) {
      firstPageMaterialRef.current.opacity = 1;
    }
    if (portraitMaterialRef.current) {
      portraitMaterialRef.current.opacity = 1;
    }
    perspectiveCamera.position.set(
      ...(isMobile ? MOBILE_CAMERA_POSITION : DESKTOP_CAMERA_POSITION),
    );
    controls?.target.set(...CONTROLS_TARGET);
    if (controls) {
      controls.enabled = true;
      controls.enableDamping = true;
      controls.update();
    }
    lastBackFaceVisibleRef.current = false;
    onBackFaceChange(false);
    invalidate();
  }, [camera, invalidate, isMobile, onBackFaceChange]);

  const handleControlsChange = useCallback(() => {
    invalidate();
  }, [invalidate]);

  const sceneHandle = useMemo<ConanCasebookSceneHandle>(() => ({
    getMotionTargets: () => {
      const root = rootRef.current;
      const pageBlock = pageBlockRef.current;
      const frontCoverPivot = frontCoverPivotRef.current;
      const firstPagePivot = firstPagePivotRef.current;
      const controls = controlsRef.current;
      const frontCoverMaterial = frontCoverMaterialRef.current;
      const pageBlockMaterial = pageBlockMaterialRef.current;
      const firstPageMaterial = firstPageMaterialRef.current;
      const portraitMaterial = portraitMaterialRef.current;

      if (
        !root
        || !pageBlock
        || !frontCoverPivot
        || !firstPagePivot
        || !controls
        || !frontCoverMaterial
        || !pageBlockMaterial
        || !firstPageMaterial
        || !portraitMaterial
      ) {
        return null;
      }

      const targets: ConanCasebookMotionTargets = {
        camera: camera as PerspectiveCamera,
        controls,
        firstPageMaterial,
        firstPagePivot,
        frontCoverMaterial,
        frontCoverPivot,
        invalidate,
        pageBlock,
        pageBlockMaterial,
        portraitMaterial,
        root,
      };

      return targets;
    },
    lockControls: () => {
      const controls = controlsRef.current;
      if (!controls) return;

      controls.enabled = false;
      controls.enableDamping = false;
      controls.update();
      invalidate();
    },
    reset,
    setBackFaceVisible: (visible: boolean) => {
      const root = rootRef.current;
      const controls = controlsRef.current;
      if (!root) return;

      backFaceTweenRef.current?.kill();
      if (controls) controls.enabled = false;
      backFaceTweenRef.current = gsap.to(root.rotation, {
        duration: 0.74,
        ease: "power3.inOut",
        onComplete: () => {
          backFaceTweenRef.current = null;
          if (controls && !isOpeningRef.current) controls.enabled = true;
          lastBackFaceVisibleRef.current = visible;
          onBackFaceChange(visible);
          invalidate();
        },
        onUpdate: invalidate,
        y: visible
          ? CLOSED_ROOT_ROTATION[1] + Math.PI
          : CLOSED_ROOT_ROTATION[1],
      });
    },
    snapshotPose: () => {
      const root = rootRef.current;
      const frontCoverPivot = frontCoverPivotRef.current;
      const firstPagePivot = firstPagePivotRef.current;
      const controls = controlsRef.current;
      const perspectiveCamera = camera as PerspectiveCamera;

      if (!root || !frontCoverPivot || !firstPagePivot || !controls) {
        return null;
      }

      return {
        cameraPosition: perspectiveCamera.position.toArray(),
        controlsTarget: controls.target.toArray(),
        firstPageRotation: firstPagePivot.rotation
          .toArray()
          .slice(0, 3) as Vector3Tuple,
        frontCoverRotation: frontCoverPivot.rotation
          .toArray()
          .slice(0, 3) as Vector3Tuple,
        rootRotation: root.rotation.toArray().slice(0, 3) as Vector3Tuple,
      };
    },
    unlockControls: () => {
      const controls = controlsRef.current;
      if (!controls) return;

      controls.enableDamping = true;
      controls.enabled = true;
      controls.update();
      invalidate();
    },
  }), [
    camera,
    invalidate,
    onBackFaceChange,
    reset,
  ]);

  useImperativeHandle(ref, () => sceneHandle, [sceneHandle]);

  useEffect(() => {
    reset();
    onSceneHandle(sceneHandle);
    onReady();
  }, [onReady, onSceneHandle, reset, sceneHandle]);

  useEffect(
    () => () => {
      backFaceTweenRef.current?.kill();
    },
    [],
  );

  return (
    <>
      <ambientLight intensity={1.15} />
      <Environment environmentIntensity={0.62} frames={1} resolution={64}>
        <Lightformer
          color="#F2EBDD"
          form="rect"
          intensity={3.5}
          position={[-4, 5, 6]}
          scale={[5, 5, 1]}
        />
        <Lightformer
          color="#8FA7BE"
          form="rect"
          intensity={1.6}
          position={[4, 1, -4]}
          scale={[4, 5, 1]}
        />
      </Environment>
      <directionalLight
        color="#F7EBDD"
        intensity={2.1}
        position={[-4.5, 5.5, 7]}
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
      />
      <directionalLight
        color="#678099"
        intensity={0.9}
        position={[4.5, -0.5, -4]}
      />

      <group ref={rootRef} rotation={CLOSED_ROOT_ROTATION}>
        <group
          ref={pageBlockRef}
          position={[0.045, -0.015, -0.025]}
        >
          <RoundedBox
            args={[
              BOOK_WIDTH - 0.2,
              BOOK_HEIGHT - 0.18,
              PAGE_BLOCK_DEPTH,
            ]}
            radius={0.055}
            smoothness={4}
          >
            <meshStandardMaterial
              ref={pageBlockMaterialRef}
              color="#E8E2D4"
              roughness={0.92}
            />
          </RoundedBox>
          {Array.from({ length: 7 }, (_, index) => (
            <mesh
              key={index}
              position={[
                BOOK_WIDTH / 2 - 0.085,
                0,
                -PAGE_BLOCK_DEPTH / 2 + 0.025 + index * 0.029,
              ]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <planeGeometry args={[BOOK_HEIGHT - 0.28, 0.015]} />
              <meshBasicMaterial
                color={index % 2 === 0 ? "#C7BFAE" : "#DDD6C8"}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>

        <RoundedBox
          args={[BOOK_WIDTH, BOOK_HEIGHT, COVER_DEPTH]}
          position={[0, 0, -PAGE_BLOCK_DEPTH / 2 - 0.07]}
          radius={0.08}
          smoothness={5}
        >
          <meshPhysicalMaterial
            clearcoat={0.22}
            clearcoatRoughness={0.45}
            color="#101B2A"
            roughness={0.55}
          />
        </RoundedBox>
        <mesh
          position={[0, 0, -PAGE_BLOCK_DEPTH / 2 - 0.136]}
          rotation={[0, Math.PI, 0]}
          raycast={() => null}
        >
          <planeGeometry args={[BOOK_WIDTH - 0.15, BOOK_HEIGHT - 0.15]} />
          <meshBasicMaterial
            map={backTexture}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>

        <RoundedBox
          args={[0.24, BOOK_HEIGHT + 0.03, PAGE_BLOCK_DEPTH + 0.2]}
          position={[-BOOK_WIDTH / 2 - 0.015, 0, -0.01]}
          radius={0.07}
          smoothness={5}
        >
          <meshPhysicalMaterial
            clearcoat={0.2}
            clearcoatRoughness={0.48}
            color="#0B1420"
            roughness={0.5}
          />
        </RoundedBox>

        <group
          ref={firstPagePivotRef}
          position={[-BOOK_WIDTH / 2 + 0.09, 0, PAGE_BLOCK_DEPTH / 2 + 0.012]}
        >
          <group position={[BOOK_WIDTH / 2 - 0.09, 0, 0]}>
            <RoundedBox
              args={[
                BOOK_WIDTH - 0.25,
                CONAN_CASEBOOK_PAGE_HEIGHT,
                0.025,
              ]}
              radius={0.035}
              smoothness={3}
            >
              <meshStandardMaterial
                ref={firstPageMaterialRef}
                color="#F3EFE3"
                roughness={0.96}
              />
            </RoundedBox>
            <mesh position={[0, 0, 0.016]} raycast={() => null}>
              <planeGeometry
                args={[BOOK_WIDTH - 0.34, CONAN_CASEBOOK_PAGE_HEIGHT - 0.12]}
              />
              <meshBasicMaterial
                map={firstPageTexture}
                side={DoubleSide}
                toneMapped={false}
              />
            </mesh>
          </group>
        </group>

        <group
          ref={frontCoverPivotRef}
          position={[-BOOK_WIDTH / 2, 0, PAGE_BLOCK_DEPTH / 2 + 0.085]}
        >
          <group position={[BOOK_WIDTH / 2, 0, 0]}>
            <RoundedBox
              args={[BOOK_WIDTH, BOOK_HEIGHT, COVER_DEPTH]}
              radius={0.08}
              smoothness={5}
            >
              <meshPhysicalMaterial
                ref={frontCoverMaterialRef}
                clearcoat={0.3}
                clearcoatRoughness={0.42}
                color="#101B2A"
                metalness={0.02}
                roughness={0.48}
              />
            </RoundedBox>
            <CoverArtwork
              coverTexture={coverTexture}
              portraitMaterialRef={portraitMaterialRef}
              portraitTexture={portraitTexture}
            />
          </group>
        </group>
      </group>

      <ContactShadows
        blur={2.8}
        far={4.5}
        frames={1}
        opacity={0.34}
        position={[0, -2.67, 0]}
        scale={9}
      />
      <OrbitControls
        ref={controlsRef}
        dampingFactor={0.08}
        enableDamping
        enablePan={false}
        enableZoom={false}
        maxAzimuthAngle={MathUtils.degToRad(56)}
        maxPolarAngle={MathUtils.degToRad(108)}
        minAzimuthAngle={MathUtils.degToRad(-56)}
        minPolarAngle={MathUtils.degToRad(72)}
        onChange={handleControlsChange}
        rotateSpeed={0.55}
        target={CONTROLS_TARGET}
      />
    </>
  );
});

const DetectiveConanCasebookSceneComponent = forwardRef<
  ConanCasebookSceneHandle,
  DetectiveConanCasebookSceneProps
>(function DetectiveConanCasebookScene(props, ref) {
  const { isMobile } = props;

  return (
    <div
      className="absolute inset-0"
      data-testid="detective-conan-casebook-canvas"
    >
      <Canvas
        camera={{
          far: 60,
          fov: isMobile ? 38 : 30,
          near: 0.1,
          position: isMobile
            ? MOBILE_CAMERA_POSITION
            : DESKTOP_CAMERA_POSITION,
        }}
        dpr={isMobile ? 1 : [1, 1.25]}
        frameloop="demand"
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        shadows={false}
      >
        <Suspense fallback={null}>
          <CasebookWorld ref={ref} {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
});

export const DetectiveConanCasebookScene = memo(
  DetectiveConanCasebookSceneComponent,
);
