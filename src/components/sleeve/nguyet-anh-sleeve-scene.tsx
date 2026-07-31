"use client";

import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useTexture,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import {
  forwardRef,
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
  MeshBasicMaterial,
  PerspectiveCamera,
  Quaternion,
  SRGBColorSpace,
  Texture,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { nguyetAnhSleevePilot } from "@/data/nguyet-anh-sleeve-pilot";

const SLEEVE_WIDTH = 3.16;
const SLEEVE_HEIGHT = 4.72;
const SLEEVE_DEPTH = 0.18;
const FILM_CARD_WIDTH = 2.86;
const FILM_CARD_HEIGHT = 4.18;
const FILM_CARD_DEPTH = 0.055;
const INITIAL_CAMERA_POSITION: [number, number, number] = [0, 0.04, 10.6];

export const SLEEVE_FILM_CARD_HEIGHT = FILM_CARD_HEIGHT;
export const SLEEVE_FILM_CARD_HANDOFF_Z = 0.34;

export type SleevePoseSnapshot = {
  cameraPosition: [number, number, number];
  controlsTarget: [number, number, number];
  rootRotation: [number, number, number];
};

export type SleeveMotionTargets = {
  aperture: Group;
  camera: PerspectiveCamera;
  controls: OrbitControlsImpl;
  filmCard: Group;
  invalidate: () => void;
  root: Group;
  sleeve: Group;
  slotLightMaterial: MeshBasicMaterial;
};

export type NguyetAnhSleeveSceneHandle = {
  getMotionTargets: () => SleeveMotionTargets | null;
  lockControls: () => void;
  reset: () => void;
  setBackFaceVisible: (visible: boolean) => void;
  snapshotPose: () => SleevePoseSnapshot | null;
  unlockControls: () => void;
};

export type SleeveFilmCardContent = {
  backDate: string;
  backMessage: string;
  backNames: string;
  backTitle: string;
  conjunction: string;
  dateAndTime: string;
  firstName: string;
  kicker: string;
  message: string;
  secondName: string;
};

type NguyetAnhSleeveSceneProps = {
  cardContent: SleeveFilmCardContent;
  isOpening: boolean;
  onBackFaceChange: (visible: boolean) => void;
  onReady: () => void;
  onSceneHandle: (handle: NguyetAnhSleeveSceneHandle) => void;
};

function configureColorTexture(texture: Texture): Texture {
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function fitCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialSize: number,
  minimumSize: number,
  family: string,
): number {
  let size = initialSize;
  while (size > minimumSize) {
    context.font = `300 ${size}px ${family}`;
    if (context.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  return text
    .split("\n")
    .flatMap((paragraph) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (!words.length) return [];

      const lines: string[] = [];
      let currentLine = words[0];
      for (const word of words.slice(1)) {
        const candidate = `${currentLine} ${word}`;
        if (context.measureText(candidate).width <= maxWidth) {
          currentLine = candidate;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    });
}

function makeCardPrintTexture(
  content: SleeveFilmCardContent,
  side: "front" | "back",
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1536;
  const context = canvas.getContext("2d");

  if (!context) return new CanvasTexture(canvas);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = "center";
  context.textBaseline = "middle";

  if (side === "front") {
    const vignette = context.createLinearGradient(0, 420, 0, 1120);
    vignette.addColorStop(0, "rgba(7,16,21,0.08)");
    vignette.addColorStop(0.35, "rgba(7,16,21,0.78)");
    vignette.addColorStop(0.72, "rgba(7,16,21,0.82)");
    vignette.addColorStop(1, "rgba(7,16,21,0.14)");
    context.fillStyle = vignette;
    context.fillRect(90, 420, 844, 700);

    context.strokeStyle = "rgba(120,199,215,0.62)";
    context.lineWidth = 2;
    context.strokeRect(84, 66, 856, 1404);

    context.fillStyle = "#78C7D7";
    context.font = '600 26px "Helvetica Neue", Arial, sans-serif';
    context.letterSpacing = "8px";
    context.fillText(content.kicker.toLocaleUpperCase(), 512, 508);

    const names = [content.firstName, content.secondName];
    const firstSize = fitCanvasText(
      context,
      names[0],
      760,
      104,
      56,
      '"Helvetica Neue", Arial, sans-serif',
    );
    context.fillStyle = "#D7E4EA";
    context.font = `300 ${firstSize}px "Helvetica Neue", Arial, sans-serif`;
    context.fillText(names[0], 512, 650);

    context.fillStyle = "#78C7D7";
    context.font = 'italic 32px "Helvetica Neue", Arial, sans-serif';
    context.fillText(content.conjunction, 512, 744);

    const secondSize = fitCanvasText(
      context,
      names[1],
      760,
      104,
      56,
      '"Helvetica Neue", Arial, sans-serif',
    );
    context.fillStyle = "#D7E4EA";
    context.font = `300 ${secondSize}px "Helvetica Neue", Arial, sans-serif`;
    context.fillText(names[1], 512, 846);

    context.fillStyle = "#D7E4EA";
    context.font = '500 27px "Helvetica Neue", Arial, sans-serif';
    context.fillText(content.dateAndTime, 512, 972);

    context.fillStyle = "rgba(215,228,234,0.78)";
    context.font = '400 25px "Helvetica Neue", Arial, sans-serif';
    const messageLines = wrapCanvasText(context, content.message, 720);
    messageLines.slice(0, 3).forEach((line, index) => {
      context.fillText(line, 512, 1055 + index * 38);
    });
  } else {
    context.fillStyle = "#0B1116";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(120,199,215,0.58)";
    context.lineWidth = 3;
    context.strokeRect(76, 72, 872, 1392);

    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        context.strokeStyle = "rgba(215,228,234,0.14)";
        context.lineWidth = 2;
        context.strokeRect(118 + column * 267, 154 + row * 236, 218, 172);
      }
    }

    context.fillStyle = "#78C7D7";
    context.font = '600 28px "Helvetica Neue", Arial, sans-serif';
    context.fillText(content.backTitle.toLocaleUpperCase(), 512, 1122);

    const backNameSize = fitCanvasText(
      context,
      content.backNames,
      780,
      70,
      42,
      '"Helvetica Neue", Arial, sans-serif',
    );
    context.fillStyle = "#D7E4EA";
    context.font = `300 ${backNameSize}px "Helvetica Neue", Arial, sans-serif`;
    context.fillText(content.backNames, 512, 1216);

    context.fillStyle = "#D7E4EA";
    context.font = '500 30px "Helvetica Neue", Arial, sans-serif';
    context.fillText(content.backDate, 512, 1294);

    context.fillStyle = "rgba(215,228,234,0.72)";
    context.font = '400 24px "Helvetica Neue", Arial, sans-serif';
    wrapCanvasText(context, content.backMessage, 720)
      .slice(0, 2)
      .forEach((line, index) => {
        context.fillText(line, 512, 1350 + index * 34);
      });
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function CardPrint({
  content,
  side,
}: {
  content: SleeveFilmCardContent;
  side: "front" | "back";
}) {
  const texture = useMemo(
    () => makeCardPrintTexture(content, side),
    [content, side],
  );

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh
      position={[
        0,
        0,
        side === "front"
          ? FILM_CARD_DEPTH / 2 + 0.014
          : -FILM_CARD_DEPTH / 2 - 0.014,
      ]}
      rotation={side === "back" ? [0, Math.PI, 0] : [0, 0, 0]}
      raycast={() => null}
    >
      <planeGeometry args={[FILM_CARD_WIDTH - 0.12, FILM_CARD_HEIGHT - 0.12]} />
      <meshBasicMaterial
        depthWrite={false}
        map={texture}
        side={DoubleSide}
        transparent
      />
    </mesh>
  );
}

function FilmPerforations() {
  const holes = Array.from({ length: 12 }, (_, index) => (
    -FILM_CARD_HEIGHT / 2 + 0.28 + index * ((FILM_CARD_HEIGHT - 0.56) / 11)
  ));

  return (
    <>
      {[-1, 1].flatMap((side) => (
        holes.map((y, index) => (
          <mesh
            key={`${side}-${index}`}
            position={[
              side * (FILM_CARD_WIDTH / 2 - 0.105),
              y,
              FILM_CARD_DEPTH / 2 + 0.021,
            ]}
            raycast={() => null}
          >
            <boxGeometry args={[0.095, 0.16, 0.018]} />
            <meshBasicMaterial color="#071015" />
          </mesh>
        ))
      ))}
    </>
  );
}

function FilmCard({
  cardContent,
  cardRef,
  photogram,
}: {
  cardContent: SleeveFilmCardContent;
  cardRef: RefObject<Group | null>;
  photogram: Texture;
}) {
  return (
    <group ref={cardRef}>
      <mesh castShadow receiveShadow>
        <boxGeometry
          args={[FILM_CARD_WIDTH, FILM_CARD_HEIGHT, FILM_CARD_DEPTH]}
        />
        <meshStandardMaterial
          color="#D7E4EA"
          metalness={0.05}
          roughness={0.74}
        />
      </mesh>
      <mesh
        position={[0, 0, FILM_CARD_DEPTH / 2 + 0.006]}
        raycast={() => null}
      >
        <planeGeometry args={[FILM_CARD_WIDTH - 0.08, FILM_CARD_HEIGHT - 0.08]} />
        <meshStandardMaterial
          map={photogram}
          metalness={0.03}
          roughness={0.78}
        />
      </mesh>
      <CardPrint content={cardContent} side="front" />
      <CardPrint content={cardContent} side="back" />
      <FilmPerforations />
    </group>
  );
}

function SleeveBody({
  apertureRef,
  sleeveRef,
  slotLightMaterialRef,
}: {
  apertureRef: RefObject<Group | null>;
  sleeveRef: RefObject<Group | null>;
  slotLightMaterialRef: RefObject<MeshBasicMaterial | null>;
}) {
  const { graphite, moonCyan, silver, smoke } = nguyetAnhSleevePilot.palette;

  return (
    <group ref={sleeveRef}>
      <mesh position={[0, 0, -SLEEVE_DEPTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[SLEEVE_WIDTH, SLEEVE_HEIGHT, SLEEVE_DEPTH]} />
        <meshPhysicalMaterial
          clearcoat={0.18}
          clearcoatRoughness={0.5}
          color={graphite}
          metalness={0.06}
          roughness={0.48}
        />
      </mesh>
      <mesh position={[0, -0.03, SLEEVE_DEPTH / 2 + 0.02]}>
        <planeGeometry args={[SLEEVE_WIDTH - 0.14, SLEEVE_HEIGHT - 0.2]} />
        <meshPhysicalMaterial
          clearcoat={0.38}
          clearcoatRoughness={0.32}
          color={smoke}
          depthWrite={false}
          opacity={0.4}
          roughness={0.3}
          transparent
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (SLEEVE_WIDTH / 2 - 0.055), 0, 0.055]}
          castShadow
        >
          <boxGeometry args={[0.11, SLEEVE_HEIGHT, 0.16]} />
          <meshStandardMaterial color={silver} metalness={0.68} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, -SLEEVE_HEIGHT / 2 + 0.06, 0.055]} castShadow>
        <boxGeometry args={[SLEEVE_WIDTH, 0.12, 0.16]} />
        <meshStandardMaterial color={silver} metalness={0.65} roughness={0.32} />
      </mesh>
      <mesh position={[0, SLEEVE_HEIGHT / 2 - 0.065, 0.07]}>
        <boxGeometry args={[SLEEVE_WIDTH - 0.2, 0.11, 0.13]} />
        <meshStandardMaterial color={graphite} metalness={0.1} roughness={0.52} />
      </mesh>
      <mesh
        position={[0, SLEEVE_HEIGHT / 2 - 0.1, 0.16]}
        raycast={() => null}
      >
        <planeGeometry args={[SLEEVE_WIDTH - 0.4, 0.14]} />
        <meshBasicMaterial
          ref={slotLightMaterialRef}
          color={moonCyan}
          opacity={0.05}
          transparent
        />
      </mesh>
      <group ref={apertureRef} position={[0, -1.46, 0.24]}>
        <mesh castShadow>
          <torusGeometry args={[0.33, 0.045, 16, 72]} />
          <meshStandardMaterial color={silver} metalness={0.78} roughness={0.24} />
        </mesh>
        <mesh position={[0, 0, -0.012]} raycast={() => null}>
          <circleGeometry args={[0.275, 48]} />
          <meshBasicMaterial color={graphite} opacity={0.88} transparent />
        </mesh>
        {Array.from({ length: 6 }, (_, index) => (
          <mesh
            key={index}
            position={[0, 0, 0.012 + index * 0.0002]}
            rotation={[0, 0, index * (Math.PI / 3)]}
            raycast={() => null}
          >
            <planeGeometry args={[0.035, 0.46]} />
            <meshBasicMaterial color={moonCyan} opacity={0.35} transparent />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function BackFacePrint({
  cardContent,
}: {
  cardContent: SleeveFilmCardContent;
}) {
  const texture = useMemo(
    () => makeCardPrintTexture(cardContent, "back"),
    [cardContent],
  );

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh
      position={[0, 0, -SLEEVE_DEPTH - 0.006]}
      rotation={[0, Math.PI, 0]}
      raycast={() => null}
    >
      <planeGeometry args={[SLEEVE_WIDTH - 0.18, SLEEVE_HEIGHT - 0.18]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

const SleeveSceneContent = forwardRef<
  NguyetAnhSleeveSceneHandle,
  NguyetAnhSleeveSceneProps
>(function SleeveSceneContent(
  {
    cardContent,
    isOpening,
    onBackFaceChange,
    onReady,
    onSceneHandle,
  },
  ref,
) {
  const { camera, invalidate, size } = useThree();
  const rootRef = useRef<Group>(null);
  const sleeveRef = useRef<Group>(null);
  const filmCardRef = useRef<Group>(null);
  const apertureRef = useRef<Group>(null);
  const slotLightMaterialRef = useRef<MeshBasicMaterial>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const backFaceTweenRef = useRef<gsap.core.Tween | null>(null);
  const initialCameraDistanceRef = useRef(INITIAL_CAMERA_POSITION[2]);
  const lastBackFaceRef = useRef(false);
  const frontNormal = useMemo(() => new Vector3(), []);
  const rootPosition = useMemo(() => new Vector3(), []);
  const rootQuaternion = useMemo(() => new Quaternion(), []);
  const viewVector = useMemo(() => new Vector3(), []);
  const imagePath = size.width < 768
    ? nguyetAnhSleevePilot.assets.photogramMobile
    : nguyetAnhSleevePilot.assets.photogram;
  const photogram = useTexture(imagePath);
  const targetClosedWidth = Math.max(1, Math.min(size.width * 0.78, 28 * 16));
  const initialCameraDistance =
    (SLEEVE_WIDTH * size.height)
    / (2 * targetClosedWidth * Math.tan((28 * Math.PI) / 360));

  useEffect(() => {
    initialCameraDistanceRef.current = initialCameraDistance;
  }, [initialCameraDistance]);

  useEffect(() => {
    configureColorTexture(photogram);
  }, [photogram]);

  const reportBackFace = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    root.getWorldPosition(rootPosition);
    root.getWorldQuaternion(rootQuaternion);
    frontNormal.set(0, 0, 1).applyQuaternion(rootQuaternion);
    viewVector.copy((camera as PerspectiveCamera).position).sub(rootPosition);
    const nextBackFace = frontNormal.dot(viewVector) <= 0;
    if (nextBackFace === lastBackFaceRef.current) return;

    lastBackFaceRef.current = nextBackFace;
    onBackFaceChange(nextBackFace);
  }, [
    camera,
    frontNormal,
    onBackFaceChange,
    rootPosition,
    rootQuaternion,
    viewVector,
  ]);

  const reset = useCallback(() => {
    const perspectiveCamera = camera as PerspectiveCamera;
    const controls = controlsRef.current;

    backFaceTweenRef.current?.kill();
    backFaceTweenRef.current = null;
    rootRef.current?.rotation.set(0, 0, 0);
    sleeveRef.current?.position.set(0, 0, 0);
    sleeveRef.current?.rotation.set(0, 0, 0);
    filmCardRef.current?.position.set(0, -0.08, 0.045);
    filmCardRef.current?.rotation.set(0, 0, 0);
    apertureRef.current?.rotation.set(0, 0, 0);
    apertureRef.current?.scale.set(1, 1, 1);
    if (slotLightMaterialRef.current) {
      slotLightMaterialRef.current.opacity = 0.05;
    }
    perspectiveCamera.position.set(0, 0.04, initialCameraDistanceRef.current);
    controls?.target.set(0, 0, 0);
    controls?.update();
    lastBackFaceRef.current = false;
    onBackFaceChange(false);
    invalidate();
  }, [camera, invalidate, onBackFaceChange]);

  const sceneHandle = useMemo<NguyetAnhSleeveSceneHandle>(() => ({
    getMotionTargets: () => {
      const aperture = apertureRef.current;
      const controls = controlsRef.current;
      const filmCard = filmCardRef.current;
      const root = rootRef.current;
      const sleeve = sleeveRef.current;
      const slotLightMaterial = slotLightMaterialRef.current;

      if (
        !aperture
        || !controls
        || !filmCard
        || !root
        || !sleeve
        || !slotLightMaterial
      ) {
        return null;
      }

      return {
        aperture,
        camera: camera as PerspectiveCamera,
        controls,
        filmCard,
        invalidate,
        root,
        sleeve,
        slotLightMaterial,
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
    reset,
    setBackFaceVisible: (visible: boolean) => {
      const root = rootRef.current;
      if (!root) return;

      backFaceTweenRef.current?.kill();
      const controls = controlsRef.current;
      if (controls) controls.enabled = false;
      backFaceTweenRef.current = gsap.to(root.rotation, {
        duration: 0.78,
        ease: "power4.inOut",
        onComplete: () => {
          backFaceTweenRef.current = null;
          if (controls) controls.enabled = true;
          reportBackFace();
          invalidate();
        },
        onUpdate: () => {
          reportBackFace();
          invalidate();
        },
        y: visible ? Math.PI : 0,
      });
    },
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
        controlsTarget: [
          controls.target.x,
          controls.target.y,
          controls.target.z,
        ],
        rootRotation: [
          root.rotation.x,
          root.rotation.y,
          root.rotation.z,
        ],
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
    reportBackFace,
    reset,
  ]);

  useImperativeHandle(ref, () => sceneHandle, [sceneHandle]);

  useEffect(() => {
    reset();
    onSceneHandle(sceneHandle);
    onReady();
  }, [onReady, onSceneHandle, reset, sceneHandle]);

  return (
    <>
      <ambientLight intensity={1.2} />
      <Environment environmentIntensity={0.62} frames={1} resolution={64}>
        <Lightformer
          color="#d9f5fb"
          form="rect"
          intensity={3}
          position={[-4, 5, 5]}
          scale={[4, 5, 1]}
        />
        <Lightformer
          color="#89c6d2"
          form="rect"
          intensity={1.6}
          position={[4, 0, -3]}
          scale={[3, 5, 1]}
        />
      </Environment>
      <directionalLight
        castShadow
        color="#d9f5fb"
        intensity={2.1}
        position={[-4.5, 5.5, 7]}
      />
      <directionalLight
        color="#89c6d2"
        intensity={0.9}
        position={[5, 1, -4]}
      />
      <group ref={rootRef}>
        <FilmCard
          cardContent={cardContent}
          cardRef={filmCardRef}
          photogram={photogram}
        />
        <SleeveBody
          apertureRef={apertureRef}
          sleeveRef={sleeveRef}
          slotLightMaterialRef={slotLightMaterialRef}
        />
        <BackFacePrint cardContent={cardContent} />
      </group>
      <ContactShadows
        blur={2.6}
        far={4.6}
        frames={isOpening ? Infinity : 1}
        opacity={0.3}
        position={[0, -2.6, 0]}
        scale={9}
      />
      <OrbitControls
        ref={controlsRef}
        dampingFactor={0.075}
        enableDamping
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={2.62}
        minPolarAngle={0.52}
        onChange={() => {
          reportBackFace();
          invalidate();
        }}
        rotateSpeed={0.52}
      />
    </>
  );
});

export const NguyetAnhSleeveScene = forwardRef<
  NguyetAnhSleeveSceneHandle,
  NguyetAnhSleeveSceneProps
>(function NguyetAnhSleeveScene(
  {
    cardContent,
    isOpening,
    onBackFaceChange,
    onReady,
    onSceneHandle,
  },
  ref,
) {
  return (
    <Canvas
      camera={{ fov: 28, position: INITIAL_CAMERA_POSITION }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      }}
      shadows
    >
      <color attach="background" args={[nguyetAnhSleevePilot.palette.graphite]} />
      <Suspense fallback={null}>
        <SleeveSceneContent
          ref={ref}
          cardContent={cardContent}
          isOpening={isOpening}
          onBackFaceChange={onBackFaceChange}
          onReady={onReady}
          onSceneHandle={onSceneHandle}
        />
      </Suspense>
    </Canvas>
  );
});
