"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import {
  BoxGeometry,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type BufferGeometry,
  type Group,
  type Texture,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import type { BeachJourneyScene } from "@/data/beach-wedding-journey";

import type { BeachJourneyCueState } from "../beach-cue-state";
import {
  BEACH_GALLERY_PRINT_SIZE,
  getBeachFrameGeometry,
} from "../beach-frame-geometry";
import { estimateExactRgbaMipBytes } from "../beach-world-data";
import type { BeachPropMapSet } from "./beach-props";

/**
 * The frames are built here rather than loaded as models.
 *
 * The plan's Task 7 text says to load two glTF frames and bind the photograph
 * into a material named `artwork`. No such models exist: Task 1 shipped
 * `frame-01-*` and `frame-02-*` as 512px colour/normal/ARM texture sets (see
 * `beach-asset-manifest.ts`), and `public/chungdoi/labs/beach-wedding-journey/`
 * holds no `.glb` or `.gltf` at all. The decoded-texture ceiling is at 6%
 * headroom, so adding models was not an option either.
 *
 * So the moulding is procedural and the two shipped map sets are the two
 * variants. The brief's `boxGeometry` fallback becomes the primary geometry, and
 * its failure path moves down a level: if the wood maps fail to load the
 * moulding renders in flat colour and the photograph stays — which is what the
 * brief's constraint, "the photograph must never be the thing that disappears",
 * actually protects.
 */

/** Face width of the moulding bar, in metres. */
export const BEACH_FRAME_MOULDING_FACE_METRES = 0.06;

/** Front-to-back thickness of the moulding, in metres. */
export const BEACH_FRAME_MOULDING_DEPTH_METRES = 0.045;

/** How far the print is recessed behind the moulding's front face, in metres. */
export const BEACH_FRAME_PRINT_RECESS_METRES = 0.008;

/** Thickness of the backing board that closes the frame from behind. */
const BEACH_FRAME_BACKING_THICKNESS_METRES = 0.012;

/** The two shipped map sets, alternated along the walk. */
export const BEACH_FRAME_VARIANT_COUNT = 2;

/** Sway amplitude with no wind cue, in radians. */
export const BEACH_FRAME_SWAY_BASE_RADIANS = 0.012;

/** Extra sway amplitude at full wind cue, in radians. */
export const BEACH_FRAME_SWAY_WIND_GAIN_RADIANS = 0.03;

/** Angular rate of the pendulum, in radians per second. */
export const BEACH_FRAME_SWAY_RATE = 0.62;

const PRINT_ROUGHNESS = 0.62;
const MOULDING_FALLBACK_COLOR = "#b08c63";
const BACKING_FALLBACK_COLOR = "#6f5942";

export type BeachFramePlacement = {
  readonly photoSrc: string;
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
  readonly sceneId: string;
  readonly variantIndex: number;
};

/**
 * Which of the two shipped map sets a frame wears.
 *
 * Alternating by ordinal rather than at random keeps two neighbouring frames
 * from ever wearing the same wood, which is the only thing a two-variant set can
 * guarantee.
 */
export function getBeachFrameVariantIndex(index: number): number {
  return index % BEACH_FRAME_VARIANT_COUNT;
}

/**
 * Frame placements for the gallery scenes, in walk order.
 *
 * A gallery scene with no photograph produces no frame: an empty moulding hung
 * on the shore reads as a mistake, not as a missing photo.
 */
export function resolveBeachFramePlacements(
  scenes: readonly BeachJourneyScene[],
): readonly BeachFramePlacement[] {
  const gallery = scenes.filter(
    (scene) => scene.type === "gallery-photo" && scene.photo !== null,
  );

  return gallery.map((scene, index) => {
    const geometry = getBeachFrameGeometry(scene);
    return {
      // `photo` is non-null by the filter above; narrowing it here keeps the
      // placement type free of null.
      photoSrc: scene.photo!.src,
      position: geometry.position,
      rotationY: geometry.rotationY,
      sceneId: scene.id,
      variantIndex: getBeachFrameVariantIndex(index),
    };
  });
}

/** Height of the hanger above the print's centre, in metres. */
export function getBeachFrameHangerRise(printHeight: number): number {
  return printHeight / 2 + BEACH_FRAME_MOULDING_FACE_METRES;
}

/**
 * Pendulum angle of a hanging frame.
 *
 * Reduced motion returns a hard zero rather than a small amplitude: the frames
 * are the one thing the guest reads text-sized detail from, and a slow wobble
 * under a reduced-motion preference is exactly the motion that preference asks
 * to be removed.
 */
export function beachFrameSwayRadians({
  phase,
  reducedMotion,
  time,
  windStrength,
}: {
  readonly phase: number;
  readonly reducedMotion: boolean;
  readonly time: number;
  readonly windStrength: number;
}): number {
  if (reducedMotion) return 0;

  const amplitude = BEACH_FRAME_SWAY_BASE_RADIANS
    + BEACH_FRAME_SWAY_WIND_GAIN_RADIANS * Math.min(Math.max(windStrength, 0), 1);
  return amplitude * Math.sin(time * BEACH_FRAME_SWAY_RATE + phase);
}

/**
 * Moulding plus backing board as one geometry, so a frame is one draw call.
 *
 * Pivoted at the hanger — the top edge of the moulding — rather than at the
 * print's centre, so the sway above reads as a frame swinging from a line and
 * not as a picture rotating in place.
 */
export function createBeachFrameMouldingGeometry(
  printWidth: number,
  printHeight: number,
): BufferGeometry {
  const face = BEACH_FRAME_MOULDING_FACE_METRES;
  const depth = BEACH_FRAME_MOULDING_DEPTH_METRES;
  const outerWidth = printWidth + face * 2;
  const halfPrintHeight = printHeight / 2;
  const barCentre = halfPrintHeight + face / 2;
  const halfPrintWidth = printWidth / 2;

  const parts = [
    { geometry: new BoxGeometry(outerWidth, face, depth), x: 0, y: barCentre, z: 0 },
    { geometry: new BoxGeometry(outerWidth, face, depth), x: 0, y: -barCentre, z: 0 },
    {
      geometry: new BoxGeometry(face, printHeight, depth),
      x: -(halfPrintWidth + face / 2),
      y: 0,
      z: 0,
    },
    {
      geometry: new BoxGeometry(face, printHeight, depth),
      x: halfPrintWidth + face / 2,
      y: 0,
      z: 0,
    },
    {
      geometry: new BoxGeometry(
        printWidth,
        printHeight,
        BEACH_FRAME_BACKING_THICKNESS_METRES,
      ),
      x: 0,
      y: 0,
      z: -(depth / 2) + BEACH_FRAME_BACKING_THICKNESS_METRES / 2,
    },
  ];

  const rise = getBeachFrameHangerRise(printHeight);
  for (const part of parts) {
    part.geometry.translate(part.x, part.y - rise, part.z);
  }

  const merged = mergeGeometries(parts.map(({ geometry }) => geometry));
  for (const part of parts) part.geometry.dispose();
  if (!merged) {
    throw new Error("Beach frame moulding geometry failed to merge");
  }
  merged.computeBoundingSphere();
  return merged;
}

/** The print plane, recessed inside the moulding and pivoted at the hanger. */
export function createBeachFramePrintGeometry(
  printWidth: number,
  printHeight: number,
): BufferGeometry {
  const geometry = new PlaneGeometry(printWidth, printHeight);
  geometry.translate(
    0,
    -getBeachFrameHangerRise(printHeight),
    BEACH_FRAME_MOULDING_DEPTH_METRES / 2 - BEACH_FRAME_PRINT_RECESS_METRES,
  );
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Loads the couple's photographs as sRGB colour.
 *
 * A subclass rather than a post-load fixup: the colour space has to be set on
 * the texture before it is first uploaded, and a separate loader class also gives
 * the photographs their own `useLoader` cache entry, so they are never sharing a
 * failure or a cache slot with the shore's wood maps.
 */
class BeachPhotoTextureLoader extends TextureLoader {
  override load(
    url: string,
    onLoad?: (texture: Texture<HTMLImageElement>) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): Texture<HTMLImageElement> {
    return super.load(
      url,
      (texture) => {
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = 4;
        onLoad?.(texture);
      },
      onProgress,
      onError,
    );
  }
}

export type BeachPhotoDiagnostics = {
  readonly decodedRgbaMipBytes: number;
  readonly textureCount: number;
  readonly unmeasuredCount: number;
};

type TextureLike = {
  readonly source?: { readonly data?: unknown } | null;
};

function readTextureDimensions(
  texture: TextureLike,
): { readonly height: number; readonly width: number } | null {
  const data = texture.source?.data as
    | { height?: number; naturalHeight?: number; naturalWidth?: number; width?: number }
    | null
    | undefined;
  if (!data) return null;

  const width = data.naturalWidth ?? data.width;
  const height = data.naturalHeight ?? data.height;
  if (
    typeof width !== "number"
    || typeof height !== "number"
    || !Number.isInteger(width)
    || !Number.isInteger(height)
    || width < 1
    || height < 1
  ) {
    return null;
  }
  return { height, width };
}

/**
 * Decoded cost of the couple's photographs.
 *
 * The frame count is fixed at three by `getBeachWorldDensity`, and all three are
 * mounted for the whole walk, so there is nothing to evict and no cache here —
 * only a measurement, so the Task 8 diagnostics can report photograph bytes
 * against the same 64MiB ceiling the manifest is measured against. A texture
 * still decoding reports as unmeasured rather than as zero bytes, so an
 * in-flight decode is never mistaken for a free one.
 */
export function measureBeachPhotoTextures(
  textures: readonly TextureLike[],
): BeachPhotoDiagnostics {
  let decodedRgbaMipBytes = 0;
  let unmeasuredCount = 0;

  for (const texture of textures) {
    const dimensions = readTextureDimensions(texture);
    if (!dimensions) {
      unmeasuredCount += 1;
      continue;
    }
    decodedRgbaMipBytes += estimateExactRgbaMipBytes(
      dimensions.width,
      dimensions.height,
    );
  }

  return {
    decodedRgbaMipBytes,
    textureCount: textures.length,
    unmeasuredCount,
  };
}

export type BeachPhotoFramesProps = {
  readonly cueRef: MutableRefObject<BeachJourneyCueState>;
  readonly onPhotoDiagnosticsChange: (
    reader: (() => BeachPhotoDiagnostics) | null,
  ) => void;
  readonly reducedMotion: boolean;
  readonly scenes: readonly BeachJourneyScene[];
  /** The two shipped wood map sets, or null when they failed to load. */
  readonly woodMaps: readonly [BeachPropMapSet, BeachPropMapSet] | null;
};

function createMouldingMaterial(
  mapSet: BeachPropMapSet | null,
): MeshStandardMaterial {
  if (!mapSet) {
    return new MeshStandardMaterial({
      color: MOULDING_FALLBACK_COLOR,
      metalness: 0,
      roughness: 0.78,
    });
  }

  return new MeshStandardMaterial({
    aoMap: mapSet.arm,
    map: mapSet.color,
    metalness: 0,
    normalMap: mapSet.normal,
    roughness: 1,
    roughnessMap: mapSet.arm,
  });
}

function FramedPhotographs({
  cueRef,
  onPhotoDiagnosticsChange,
  placements,
  reducedMotion,
  woodMaps,
}: {
  readonly cueRef: MutableRefObject<BeachJourneyCueState>;
  readonly onPhotoDiagnosticsChange: BeachPhotoFramesProps["onPhotoDiagnosticsChange"];
  readonly placements: readonly BeachFramePlacement[];
  readonly reducedMotion: boolean;
  readonly woodMaps: BeachPhotoFramesProps["woodMaps"];
}) {
  const photoSrcs = useMemo(
    () => placements.map(({ photoSrc }) => photoSrc),
    [placements],
  );
  const loaded = useLoader(BeachPhotoTextureLoader, photoSrcs);
  const photos = useMemo(
    () => (Array.isArray(loaded) ? loaded : [loaded]) as readonly Texture[],
    [loaded],
  );

  const [printWidth, printHeight] = BEACH_GALLERY_PRINT_SIZE;

  const mouldingGeometry = useMemo(
    () => createBeachFrameMouldingGeometry(printWidth, printHeight),
    [printHeight, printWidth],
  );
  const printGeometry = useMemo(
    () => createBeachFramePrintGeometry(printWidth, printHeight),
    [printHeight, printWidth],
  );

  const mouldingMaterials = useMemo(
    () => [
      createMouldingMaterial(woodMaps ? woodMaps[0] : null),
      createMouldingMaterial(woodMaps ? woodMaps[1] : null),
    ],
    [woodMaps],
  );

  const printMaterials = useMemo(
    () => photos.map((photo) => new MeshStandardMaterial({
      map: photo,
      metalness: 0,
      roughness: PRINT_ROUGHNESS,
    })),
    [photos],
  );

  const backingMaterial = useMemo(
    () => new MeshStandardMaterial({
      color: BACKING_FALLBACK_COLOR,
      metalness: 0,
      roughness: 0.9,
    }),
    [],
  );

  useEffect(() => () => {
    mouldingGeometry.dispose();
    printGeometry.dispose();
  }, [mouldingGeometry, printGeometry]);

  useEffect(() => () => {
    for (const material of mouldingMaterials) material.dispose();
  }, [mouldingMaterials]);

  useEffect(() => () => {
    for (const material of printMaterials) material.dispose();
  }, [printMaterials]);

  useEffect(() => () => backingMaterial.dispose(), [backingMaterial]);

  useEffect(() => {
    const read = () => measureBeachPhotoTextures(photos);
    onPhotoDiagnosticsChange(read);
    return () => onPhotoDiagnosticsChange(null);
  }, [onPhotoDiagnosticsChange, photos]);

  const swayRefs = useRef<(Group | null)[]>([]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const windStrength = cueRef.current.windStrength;
    swayRefs.current.forEach((group, index) => {
      if (!group) return;
      group.rotation.z = beachFrameSwayRadians({
        phase: index * 1.7,
        reducedMotion,
        time,
        windStrength,
      });
    });
  });

  const rise = getBeachFrameHangerRise(printHeight);

  return (
    <group data-beach-photoreal-frames>
      {placements.map((placement, index) => (
        <group
          key={placement.sceneId}
          position={[
            placement.position[0],
            placement.position[1] + rise,
            placement.position[2],
          ]}
          rotation={[0, placement.rotationY, 0]}
        >
          <group
            ref={(group) => {
              swayRefs.current[index] = group;
            }}
          >
            <mesh
              args={[
                mouldingGeometry,
                mouldingMaterials[placement.variantIndex] ?? backingMaterial,
              ]}
              castShadow={false}
              receiveShadow={false}
            />
            {printMaterials[index] ? (
              <mesh
                args={[printGeometry, printMaterials[index]]}
                castShadow={false}
                receiveShadow={false}
              />
            ) : null}
          </group>
        </group>
      ))}
    </group>
  );
}

/**
 * Hanging photo frames for the gallery scenes.
 *
 * The photograph load is deliberately kept out of the prop-asset boundary that
 * covers the wood maps: a wood-map failure must degrade the moulding, not remove
 * the picture, so the two loads cannot share a failure path.
 */
export function BeachPhotoFrames({
  cueRef,
  onPhotoDiagnosticsChange,
  reducedMotion,
  scenes,
  woodMaps,
}: BeachPhotoFramesProps) {
  const placements = useMemo(
    () => resolveBeachFramePlacements(scenes),
    [scenes],
  );

  // `useLoader` with an empty source list has no defined result, so the hooks
  // live one level down and only mount once there is at least one photograph.
  if (placements.length === 0) return null;

  return (
    <FramedPhotographs
      cueRef={cueRef}
      onPhotoDiagnosticsChange={onPhotoDiagnosticsChange}
      placements={placements}
      reducedMotion={reducedMotion}
      woodMaps={woodMaps}
    />
  );
}
