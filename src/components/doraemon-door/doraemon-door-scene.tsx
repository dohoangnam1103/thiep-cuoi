"use client";

import { OrbitControls, RoundedBox, useTexture } from "@react-three/drei";
import {
  Canvas,
  useThree,
} from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import {
  BackSide,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  type Texture,
  type Vector3Tuple,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type {
  DoraemonDoorCharacterTarget,
  DoraemonDoorMotionTargets,
  DoraemonDoorSceneHandle,
} from "./doraemon-door-scene-types";
import { doraemonDoorPilot } from "@/data/doraemon-door-pilot";

type DoraemonDoorSceneProps = {
  isMobile: boolean;
  isOpening: boolean;
  onReady: () => void;
  onSceneHandle: (handle: DoraemonDoorSceneHandle) => void;
};

type CharacterKey =
  | "doraemon"
  | "jaian"
  | "nobita"
  | "shizuka"
  | "suneo";

type CharacterSpec = {
  aspect: number;
  finalPosition: Vector3Tuple;
  height: number;
  key: CharacterKey;
  renderOrder: number;
  texture: Texture;
};

const desktopCameraPosition: Vector3Tuple = [0, 0.15, 10.4];
const mobileCameraPosition: Vector3Tuple = [0, 0.1, 12.8];
const initialControlsTarget: Vector3Tuple = [0, -0.08, 0];
const initialCharacterPosition: Vector3Tuple = [0, -1.4, -0.18];

function CharacterPlane({
  groupRef,
  materialRef,
  spec,
}: {
  groupRef: RefObject<Group | null>;
  materialRef: RefObject<MeshBasicMaterial | null>;
  spec: CharacterSpec;
}) {
  return (
    <group
      ref={groupRef}
      position={initialCharacterPosition}
      scale={0.38}
    >
      <mesh renderOrder={spec.renderOrder}>
        <planeGeometry args={[spec.height * spec.aspect, spec.height]} />
        <meshBasicMaterial
          ref={materialRef}
          alphaTest={0.04}
          depthWrite={false}
          map={spec.texture}
          opacity={0}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

function PortalParticles({ isMobile }: { isMobile: boolean }) {
  const particles = useMemo(() => {
    const count = isMobile ? 18 : 28;
    return Array.from({ length: count }, (_, index) => {
      const ring = 0.45 + (index % 5) * 0.34;
      const angle = index * 2.399963;
      return {
        key: index,
        position: [
          Math.cos(angle) * ring,
          Math.sin(angle) * ring * 1.42,
          0.01 + (index % 3) * 0.015,
        ] as Vector3Tuple,
        scale: 0.024 + (index % 4) * 0.008,
      };
    });
  }, [isMobile]);

  return (
    <group>
      {particles.map((particle) => (
        <mesh
          key={particle.key}
          position={particle.position}
          scale={particle.scale}
        >
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial
            color={particle.key % 3 === 0 ? "#F4C84A" : "#FFF9EE"}
            opacity={0.78}
            toneMapped={false}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

function SkyCloud({
  position,
  scale,
}: {
  position: Vector3Tuple;
  scale: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[-0.55, 0, 0]}>
        <sphereGeometry args={[0.48, 20, 16]} />
        <meshBasicMaterial color="#FFFDF8" opacity={0.82} transparent />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <sphereGeometry args={[0.66, 20, 16]} />
        <meshBasicMaterial color="#FFFDF8" opacity={0.82} transparent />
      </mesh>
      <mesh position={[0.64, -0.02, 0]}>
        <sphereGeometry args={[0.43, 20, 16]} />
        <meshBasicMaterial color="#FFFDF8" opacity={0.82} transparent />
      </mesh>
    </group>
  );
}

function DoorWorld({
  isMobile,
  onReady,
  onSceneHandle,
}: Omit<DoraemonDoorSceneProps, "isOpening">) {
  const { camera, invalidate } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const rootRef = useRef<Group | null>(null);
  const doorPivotRef = useRef<Group | null>(null);
  const handlePivotRef = useRef<Group | null>(null);
  const portalGroupRef = useRef<Group | null>(null);
  const portalMaterialRef = useRef<MeshStandardMaterial | null>(null);
  const portalRingMaterialRef = useRef<MeshBasicMaterial | null>(null);

  const doraemonRef = useRef<Group | null>(null);
  const jaianRef = useRef<Group | null>(null);
  const nobitaRef = useRef<Group | null>(null);
  const shizukaRef = useRef<Group | null>(null);
  const suneoRef = useRef<Group | null>(null);
  const doraemonMaterialRef = useRef<MeshBasicMaterial | null>(null);
  const jaianMaterialRef = useRef<MeshBasicMaterial | null>(null);
  const nobitaMaterialRef = useRef<MeshBasicMaterial | null>(null);
  const shizukaMaterialRef = useRef<MeshBasicMaterial | null>(null);
  const suneoMaterialRef = useRef<MeshBasicMaterial | null>(null);

  const assetUrls = isMobile
    ? [
      doraemonDoorPilot.assets.doraemonMobile,
      doraemonDoorPilot.assets.jaianMobile,
      doraemonDoorPilot.assets.nobitaMobile,
      doraemonDoorPilot.assets.shizukaMobile,
      doraemonDoorPilot.assets.suneoMobile,
    ]
    : [
      doraemonDoorPilot.assets.doraemon,
      doraemonDoorPilot.assets.jaian,
      doraemonDoorPilot.assets.nobita,
      doraemonDoorPilot.assets.shizuka,
      doraemonDoorPilot.assets.suneo,
    ];
  const textures = useTexture(assetUrls);

  useEffect(() => {
    textures.forEach((texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 4;
      texture.needsUpdate = true;
    });
  }, [textures]);

  const characterSpecs = useMemo<Record<CharacterKey, CharacterSpec>>(() => {
    const positions = isMobile
      ? {
        doraemon: [0, -1.76, 0.84] as Vector3Tuple,
        jaian: [-1.48, -0.9, 0.16] as Vector3Tuple,
        nobita: [-0.56, -0.75, 0.5] as Vector3Tuple,
        shizuka: [0.55, -0.65, 0.46] as Vector3Tuple,
        suneo: [1.47, -0.92, 0.14] as Vector3Tuple,
      }
      : {
        doraemon: [0, -1.72, 0.9] as Vector3Tuple,
        jaian: [-3.33, -0.82, 0.1] as Vector3Tuple,
        nobita: [-1.18, -0.62, 0.52] as Vector3Tuple,
        shizuka: [1.12, -0.54, 0.48] as Vector3Tuple,
        suneo: [3.28, -0.88, 0.08] as Vector3Tuple,
      };
    const heights = isMobile
      ? {
        doraemon: 1.72,
        jaian: 3.18,
        nobita: 3.62,
        shizuka: 3.92,
        suneo: 3.08,
      }
      : {
        doraemon: 2.18,
        jaian: 4.05,
        nobita: 4.45,
        shizuka: 4.72,
        suneo: 3.88,
      };

    return {
      doraemon: {
        aspect: 638 / 1093,
        finalPosition: positions.doraemon,
        height: heights.doraemon,
        key: "doraemon",
        renderOrder: 8,
        texture: textures[0],
      },
      jaian: {
        aspect: 516 / 1200,
        finalPosition: positions.jaian,
        height: heights.jaian,
        key: "jaian",
        renderOrder: 3,
        texture: textures[1],
      },
      nobita: {
        aspect: 355 / 1200,
        finalPosition: positions.nobita,
        height: heights.nobita,
        key: "nobita",
        renderOrder: 6,
        texture: textures[2],
      },
      shizuka: {
        aspect: 472 / 1200,
        finalPosition: positions.shizuka,
        height: heights.shizuka,
        key: "shizuka",
        renderOrder: 5,
        texture: textures[3],
      },
      suneo: {
        aspect: 360 / 1200,
        finalPosition: positions.suneo,
        height: heights.suneo,
        key: "suneo",
        renderOrder: 2,
        texture: textures[4],
      },
    };
  }, [isMobile, textures]);

  useEffect(() => {
    const controls = controlsRef.current;
    const root = rootRef.current;
    const doorPivot = doorPivotRef.current;
    const handlePivot = handlePivotRef.current;
    const portalGroup = portalGroupRef.current;
    const portalMaterial = portalMaterialRef.current;
    const portalRingMaterial = portalRingMaterialRef.current;
    const perspectiveCamera = camera as PerspectiveCamera;

    const makeCharacterTarget = (
      group: Group | null,
      material: MeshBasicMaterial | null,
      finalPosition: Vector3Tuple,
    ): DoraemonDoorCharacterTarget | null => (
      group && material ? { finalPosition, group, material } : null
    );

    const doraemon = makeCharacterTarget(
      doraemonRef.current,
      doraemonMaterialRef.current,
      characterSpecs.doraemon.finalPosition,
    );
    const jaian = makeCharacterTarget(
      jaianRef.current,
      jaianMaterialRef.current,
      characterSpecs.jaian.finalPosition,
    );
    const nobita = makeCharacterTarget(
      nobitaRef.current,
      nobitaMaterialRef.current,
      characterSpecs.nobita.finalPosition,
    );
    const shizuka = makeCharacterTarget(
      shizukaRef.current,
      shizukaMaterialRef.current,
      characterSpecs.shizuka.finalPosition,
    );
    const suneo = makeCharacterTarget(
      suneoRef.current,
      suneoMaterialRef.current,
      characterSpecs.suneo.finalPosition,
    );

    if (
      !controls
      || !root
      || !doorPivot
      || !handlePivot
      || !portalGroup
      || !portalMaterial
      || !portalRingMaterial
      || !doraemon
      || !jaian
      || !nobita
      || !shizuka
      || !suneo
    ) {
      return;
    }

    const targets: DoraemonDoorMotionTargets = {
      camera: perspectiveCamera,
      characters: { doraemon, jaian, nobita, shizuka, suneo },
      controls,
      doorPivot,
      handlePivot,
      invalidate,
      portalGroup,
      portalMaterial,
      portalRingMaterial,
      root,
    };
    const initialCamera = isMobile
      ? mobileCameraPosition
      : desktopCameraPosition;

    const reset = () => {
      perspectiveCamera.position.set(...initialCamera);
      controls.target.set(...initialControlsTarget);
      controls.enabled = true;
      controls.update();
      root.rotation.set(0, 0, 0);
      doorPivot.rotation.set(0, 0, 0);
      handlePivot.rotation.set(0, 0, 0);
      portalGroup.scale.setScalar(0.94);
      portalGroup.rotation.set(0, 0, 0);
      portalMaterial.opacity = 0.7;
      portalMaterial.emissiveIntensity = 0.35;
      portalRingMaterial.opacity = 0.2;

      Object.values(targets.characters).forEach((character) => {
        character.group.position.set(...initialCharacterPosition);
        character.group.scale.setScalar(0.38);
        character.material.opacity = 0;
      });
      invalidate();
    };

    reset();
    onSceneHandle({
      getMotionTargets: () => targets,
      lockControls: () => {
        controls.enabled = false;
      },
      reset,
      snapshotPose: () => ({
        cameraPosition: perspectiveCamera.position.toArray(),
        controlsTarget: controls.target.toArray(),
        rootRotation: root.rotation.toArray().slice(0, 3) as Vector3Tuple,
      }),
      unlockControls: () => {
        controls.enabled = true;
      },
    });
    onReady();
  }, [
    camera,
    characterSpecs,
    invalidate,
    isMobile,
    onReady,
    onSceneHandle,
  ]);

  const frameScale = isMobile ? 0.88 : 1;

  return (
    <>
      <color attach="background" args={[doraemonDoorPilot.palette.sky]} />
      <fog attach="fog" args={[doraemonDoorPilot.palette.sky, 10, 20]} />
      <ambientLight intensity={1.5} />
      <directionalLight
        castShadow
        intensity={2.3}
        position={[-4.5, 7, 8]}
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
      />
      <pointLight
        color={doraemonDoorPilot.palette.yellow}
        intensity={7}
        position={[0, 0, 1.5]}
      />

      <SkyCloud position={[-4.8, 2.45, -1.8]} scale={1.2} />
      <SkyCloud position={[4.6, 2.2, -2]} scale={0.95} />
      <SkyCloud position={[-3.9, -1.6, -2.2]} scale={0.72} />

      <group ref={rootRef} scale={frameScale}>
        <group ref={portalGroupRef} position={[0, 0, -0.22]} scale={0.94}>
          <RoundedBox args={[3.72, 5.28, 0.12]} radius={0.18} smoothness={5}>
            <meshStandardMaterial
              ref={portalMaterialRef}
              color="#91E3FA"
              emissive={new Color("#39BCEB")}
              emissiveIntensity={0.35}
              opacity={0.7}
              roughness={0.5}
              transparent
            />
          </RoundedBox>
          <RoundedBox
            args={[3.34, 4.9, 0.08]}
            position={[0, 0, 0.09]}
            radius={0.16}
            smoothness={5}
          >
            <meshBasicMaterial
              ref={portalRingMaterialRef}
              color="#FFF9EE"
              opacity={0.2}
              side={BackSide}
              toneMapped={false}
              transparent
              wireframe
            />
          </RoundedBox>
          <PortalParticles isMobile={isMobile} />
        </group>

        <group>
          <RoundedBox
            args={[0.3, 5.76, 0.34]}
            position={[-2.03, 0, 0]}
            radius={0.12}
            smoothness={4}
          >
            <meshStandardMaterial color="#E96F9A" roughness={0.42} />
          </RoundedBox>
          <RoundedBox
            args={[0.3, 5.76, 0.34]}
            position={[2.03, 0, 0]}
            radius={0.12}
            smoothness={4}
          >
            <meshStandardMaterial color="#E96F9A" roughness={0.42} />
          </RoundedBox>
          <RoundedBox
            args={[4.34, 0.32, 0.34]}
            position={[0, 2.72, 0]}
            radius={0.12}
            smoothness={4}
          >
            <meshStandardMaterial color="#E96F9A" roughness={0.42} />
          </RoundedBox>

          <group ref={doorPivotRef} position={[-1.85, 0, 0.13]}>
            <group position={[1.85, 0, 0]}>
              <RoundedBox
                args={[3.7, 5.32, 0.2]}
                castShadow
                radius={0.18}
                smoothness={6}
              >
                <meshStandardMaterial
                  color="#E96F9A"
                  metalness={0.02}
                  roughness={0.38}
                />
              </RoundedBox>
              <RoundedBox
                args={[3.18, 4.78, 0.035]}
                position={[0, 0, 0.12]}
                radius={0.12}
                smoothness={5}
              >
                <meshStandardMaterial
                  color="#F47FA8"
                  metalness={0}
                  roughness={0.58}
                />
              </RoundedBox>
              <group ref={handlePivotRef} position={[1.24, -0.05, 0.25]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.16, 24, 20]} />
                  <meshStandardMaterial
                    color="#F4C84A"
                    metalness={0.26}
                    roughness={0.28}
                  />
                </mesh>
                <RoundedBox
                  args={[0.42, 0.12, 0.12]}
                  position={[0.14, 0, 0]}
                  radius={0.055}
                  smoothness={4}
                >
                  <meshStandardMaterial
                    color="#F4C84A"
                    metalness={0.26}
                    roughness={0.28}
                  />
                </RoundedBox>
              </group>
            </group>
          </group>
        </group>

        <CharacterPlane
          groupRef={jaianRef}
          materialRef={jaianMaterialRef}
          spec={characterSpecs.jaian}
        />
        <CharacterPlane
          groupRef={suneoRef}
          materialRef={suneoMaterialRef}
          spec={characterSpecs.suneo}
        />
        <CharacterPlane
          groupRef={shizukaRef}
          materialRef={shizukaMaterialRef}
          spec={characterSpecs.shizuka}
        />
        <CharacterPlane
          groupRef={nobitaRef}
          materialRef={nobitaMaterialRef}
          spec={characterSpecs.nobita}
        />
        <CharacterPlane
          groupRef={doraemonRef}
          materialRef={doraemonMaterialRef}
          spec={characterSpecs.doraemon}
        />
      </group>

      <mesh
        position={[0, -3.08, -0.5]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[6.8, 64]} />
        <meshStandardMaterial
          color="#FFF6E8"
          opacity={0.72}
          roughness={0.9}
          transparent
        />
      </mesh>

      <OrbitControls
        ref={controlsRef}
        dampingFactor={0.08}
        enableDamping
        enablePan={false}
        enableZoom={false}
        maxAzimuthAngle={MathUtils.degToRad(13)}
        maxPolarAngle={MathUtils.degToRad(99)}
        minAzimuthAngle={MathUtils.degToRad(-13)}
        minPolarAngle={MathUtils.degToRad(80)}
        onChange={() => invalidate()}
        target={initialControlsTarget}
      />
    </>
  );
}

export function DoraemonDoorScene({
  isMobile,
  isOpening,
  onReady,
  onSceneHandle,
}: DoraemonDoorSceneProps) {
  return (
    <Canvas
      camera={{
        far: 60,
        fov: isMobile ? 44 : 40,
        near: 0.1,
        position: isMobile ? mobileCameraPosition : desktopCameraPosition,
      }}
      dpr={[1, 1.5]}
      frameloop={isOpening ? "always" : "demand"}
      gl={{
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
      }}
      shadows="percentage"
    >
      <Suspense fallback={null}>
        <DoorWorld
          isMobile={isMobile}
          onReady={onReady}
          onSceneHandle={onSceneHandle}
        />
      </Suspense>
    </Canvas>
  );
}
