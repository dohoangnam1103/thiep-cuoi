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
    height: 1024,
    id: "pierPlanksColor",
    src: `${PHOTOREAL_ROOT}/pier-planks-color.webp`,
    width: 1024,
  }),
  defineAsset({
    blocking: false,
    group: "props",
    height: 1024,
    id: "pierPlanksNormal",
    src: `${PHOTOREAL_ROOT}/pier-planks-normal.webp`,
    width: 1024,
  }),
  defineAsset({
    blocking: false,
    group: "props",
    height: 1024,
    id: "pierPlanksArm",
    src: `${PHOTOREAL_ROOT}/pier-planks-arm.webp`,
    width: 1024,
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
    frame01Arm: 13_518,
    frame01Color: 13_108,
    frame01Normal: 4_630,
    frame02Arm: 14_638,
    frame02Color: 24_276,
    frame02Normal: 6_598,
    pierPlanksArm: 149_712,
    pierPlanksColor: 240_960,
    pierPlanksNormal: 349_958,
    sandArm: 80_544,
    sandColor: 340_406,
    sandNormal: 396_396,
    sky: 1_577_804,
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
