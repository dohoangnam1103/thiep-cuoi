export type BeachPhotorealAsset = {
  readonly blocking: boolean;
  readonly group: "entry" | "props";
  readonly height: number;
  readonly id: string;
  readonly src: string;
  readonly width: number;
};

export type BeachPhotorealAssetEstimate = {
  readonly assets: readonly BeachPhotorealAsset[];
  readonly compressedBytes: number;
  readonly decodedRgbaMipBytes: number;
};

const PHOTOREAL_ROOT =
  "/chungdoi/labs/beach-wedding-journey/photoreal";

function defineAsset(asset: BeachPhotorealAsset) {
  return Object.freeze(asset);
}

export const BEACH_PHOTOREAL_ASSETS = Object.freeze([
  defineAsset({
    blocking: true,
    group: "entry",
    height: 1024,
    id: "sandColor",
    src: `${PHOTOREAL_ROOT}/sand-color.webp`,
    width: 1024,
  }),
  defineAsset({
    blocking: true,
    group: "entry",
    height: 1024,
    id: "sandNormal",
    src: `${PHOTOREAL_ROOT}/sand-normal.webp`,
    width: 1024,
  }),
  defineAsset({
    blocking: true,
    group: "entry",
    height: 1024,
    id: "sandArm",
    src: `${PHOTOREAL_ROOT}/sand-arm.webp`,
    width: 1024,
  }),
  defineAsset({
    blocking: true,
    group: "entry",
    height: 512,
    id: "waterNormal",
    src: `${PHOTOREAL_ROOT}/water-normal.webp`,
    width: 512,
  }),
  defineAsset({
    blocking: true,
    group: "entry",
    height: 512,
    id: "sky",
    src: `${PHOTOREAL_ROOT}/sky.hdr`,
    width: 1024,
  }),
  defineAsset({
    blocking: false,
    group: "props",
    height: 512,
    id: "driftwoodColor",
    src: `${PHOTOREAL_ROOT}/driftwood-color.webp`,
    width: 512,
  }),
  defineAsset({
    blocking: false,
    group: "props",
    height: 512,
    id: "driftwoodNormal",
    src: `${PHOTOREAL_ROOT}/driftwood-normal.webp`,
    width: 512,
  }),
  defineAsset({
    blocking: false,
    group: "props",
    height: 512,
    id: "driftwoodArm",
    src: `${PHOTOREAL_ROOT}/driftwood-arm.webp`,
    width: 512,
  }),
  defineAsset({
    blocking: false,
    group: "props",
    height: 512,
    id: "frame01Color",
    src: `${PHOTOREAL_ROOT}/frame-01-color.webp`,
    width: 512,
  }),
  defineAsset({
    blocking: false,
    group: "props",
    height: 512,
    id: "frame01Normal",
    src: `${PHOTOREAL_ROOT}/frame-01-normal.webp`,
    width: 512,
  }),
  defineAsset({
    blocking: false,
    group: "props",
    height: 512,
    id: "frame01Arm",
    src: `${PHOTOREAL_ROOT}/frame-01-arm.webp`,
    width: 512,
  }),
  defineAsset({
    blocking: false,
    group: "props",
    height: 512,
    id: "frame02Color",
    src: `${PHOTOREAL_ROOT}/frame-02-color.webp`,
    width: 512,
  }),
  defineAsset({
    blocking: false,
    group: "props",
    height: 512,
    id: "frame02Normal",
    src: `${PHOTOREAL_ROOT}/frame-02-normal.webp`,
    width: 512,
  }),
  defineAsset({
    blocking: false,
    group: "props",
    height: 512,
    id: "frame02Arm",
    src: `${PHOTOREAL_ROOT}/frame-02-arm.webp`,
    width: 512,
  }),
] satisfies readonly BeachPhotorealAsset[]);

const BEACH_PHOTOREAL_COMPRESSED_BYTES: Readonly<Record<string, number>> =
  Object.freeze({
    driftwoodArm: 38_236,
    driftwoodColor: 64_118,
    driftwoodNormal: 85_528,
    frame01Arm: 13_518,
    frame01Color: 12_426,
    frame01Normal: 4_630,
    frame02Arm: 14_638,
    frame02Color: 24_326,
    frame02Normal: 6_598,
    sandArm: 63_890,
    sandColor: 284_316,
    sandNormal: 218_418,
    sky: 1_381_374,
    waterNormal: 113_206,
  });

function getDecodedRgbaMipBytes(asset: BeachPhotorealAsset) {
  return Math.ceil(asset.width * asset.height * 4 * 4 / 3);
}

export function getBeachPhotorealAssetEstimate(
  group: "entry" | "shared",
): BeachPhotorealAssetEstimate {
  const assets = Object.freeze(
    BEACH_PHOTOREAL_ASSETS.filter(
      (asset) => group === "shared" || asset.group === "entry",
    ),
  );

  return Object.freeze({
    assets,
    compressedBytes: assets.reduce(
      (total, asset) => total + BEACH_PHOTOREAL_COMPRESSED_BYTES[asset.id],
      0,
    ),
    decodedRgbaMipBytes: assets.reduce(
      (total, asset) => total + getDecodedRgbaMipBytes(asset),
      0,
    ),
  });
}
