"use client";

import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  useEffect,
  useState,
} from "react";
import * as THREE from "three";

import type {
  ForestJourneyContent,
  ForestJourneyScene,
} from "@/data/forest-wedding-journey";

import { getForestGalleryGeometry } from "./forest-gallery-geometry";
import {
  ForestSceneContent,
  type ForestSceneLabels,
} from "./forest-scene-content";
import type { ForestClearingSlot } from "./forest-world-data";

const FOREST_PHOTO_ANISOTROPY_LIMIT = 4;

export type ForestPhotoTextureState =
  | { status: "loading"; texture: null }
  | { status: "ready"; texture: THREE.Texture }
  | { status: "error"; texture: null };

import {
  ForestPhotoTextureCache,
  type ForestPhotoTextureLease,
} from "./forest-photo-texture-cache";

export { ForestPhotoTextureCache } from "./forest-photo-texture-cache";

function useForestPhotoTexture(
  src: string,
  cache: ForestPhotoTextureCache,
): ForestPhotoTextureState {
  const gl = useThree(({ gl: renderer }) => renderer);
  const invalidate = useThree(({ invalidate: requestFrame }) => requestFrame);
  const [state, setState] = useState<ForestPhotoTextureState>(() => {
    const cached = cache.peek(src);
    return cached
      ? { status: "ready", texture: cached }
      : { status: "loading", texture: null };
  });

  useEffect(() => {
    let active = true;
    let lease: ForestPhotoTextureLease | null = null;
    let completed = false;
    let pendingTexture: THREE.Texture | null = null;
    let pendingTextureDisposed = false;
    const disposePendingTexture = (texture = pendingTexture) => {
      if (!texture || pendingTextureDisposed) return;
      pendingTextureDisposed = true;
      texture.dispose();
    };
    const cachedLease = cache.acquire(src);

    if (cachedLease) {
      lease = cachedLease;
      invalidate();
      return () => {
        active = false;
        lease?.release();
      };
    }

    const loader = new THREE.TextureLoader();
    pendingTexture = loader.load(
      src,
      (texture) => {
        completed = true;
        if (!active) {
          disposePendingTexture(texture);
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.max(
          1,
          Math.min(
            FOREST_PHOTO_ANISOTROPY_LIMIT,
            gl.capabilities.getMaxAnisotropy(),
          ),
        );
        texture.needsUpdate = true;
        lease = cache.storeAndAcquire(src, texture);
        setState({ status: "ready", texture: lease.texture });
        invalidate();
      },
      undefined,
      () => {
        completed = true;
        disposePendingTexture();
        if (!active) return;
        setState({ status: "error", texture: null });
        invalidate();
      },
    );

    return () => {
      active = false;
      lease?.release();
      if (!completed && !lease) disposePendingTexture();
    };
  }, [cache, gl, invalidate, src]);

  return state;
}

export type ForestGallerySceneProps = {
  readonly active: boolean;
  readonly cache: ForestPhotoTextureCache;
  readonly clearing: ForestClearingSlot;
  readonly content: ForestJourneyContent;
  readonly labels: ForestSceneLabels;
  readonly scene: ForestJourneyScene;
  readonly sceneName: string;
  readonly settled: boolean;
};

export function ForestGalleryScene({
  active,
  cache,
  clearing,
  content,
  labels,
  scene,
  sceneName,
  settled,
}: ForestGallerySceneProps) {
  const photoSrc = scene.photo?.src ?? "";
  const textureState = useForestPhotoTexture(photoSrc, cache);
  const geometry = getForestGalleryGeometry(scene, clearing);

  if (scene.type !== "gallery-photo" || !scene.photo) return null;

  return (
    <group position={geometry.position} rotation={[0, geometry.rotationY, 0]}>
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.56, 18]} />
        <meshBasicMaterial
          color="#28412f"
          depthWrite={false}
          opacity={0.18}
          transparent
        />
      </mesh>
      {[-0.27, 0.27].map((x) => (
        <mesh key={x} position={[x, 0.57, -0.04]} rotation={[0, 0, x * -0.18]}>
          <boxGeometry args={[0.055, 1.14, 0.055]} />
          <meshStandardMaterial color="#c79a65" roughness={0.88} />
        </mesh>
      ))}
      <mesh position={[0, 0.48, -0.035]}>
        <boxGeometry args={[0.62, 0.055, 0.055]} />
        <meshStandardMaterial color="#bd8e5b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[0.76, 1.06, 0.06]} />
        <meshStandardMaterial color="#fff9e8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.02, 0.036]}>
        <planeGeometry args={geometry.printSize} />
        {textureState.status === "ready" ? (
          <meshStandardMaterial
            color="#ffffff"
            key="forest-gallery-photo-ready"
            map={textureState.texture}
            roughness={0.88}
          />
        ) : (
          <meshStandardMaterial
            color="#eee7d4"
            key="forest-gallery-photo-placeholder"
            roughness={0.98}
          />
        )}
      </mesh>
      {[-0.36, -0.18, 0.02, 0.2, 0.38].map((x, index) => (
        <mesh key={x} position={[x, 0.1 + (index % 2) * 0.035, 0.12]}>
          <dodecahedronGeometry args={[0.065 + (index % 3) * 0.008, 0]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? "#f8f3df" : "#cfd9bc"}
            roughness={0.9}
          />
        </mesh>
      ))}
      <Html
        center
        distanceFactor={0.95}
        pointerEvents={active && settled ? "auto" : "none"}
        position={[0, 1.02, 0.055]}
        transform
        zIndexRange={[8, 1]}
      >
        <ForestSceneContent
          active={active}
          content={content}
          labels={labels}
          photoStatus={textureState.status}
          rendererMode="webgl"
          scene={scene}
          sceneName={sceneName}
          settled={settled}
        />
      </Html>
    </group>
  );
}
