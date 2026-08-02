export type ForestPhotorealAsset = {
  readonly blocking: boolean;
  readonly group: "entry" | "wildlife";
  readonly height: number;
  readonly id: string;
  readonly src: string;
  readonly width: number;
};

export type ForestPhotorealAssetEstimate = {
  readonly assets: readonly ForestPhotorealAsset[];
  readonly compressedBytes: number;
  readonly decodedRgbaMipBytes: number;
};

const PHOTOREAL_ROOT =
  "/chungdoi/labs/forest-wedding-journey/photoreal";

function defineAsset(asset: ForestPhotorealAsset) {
  return Object.freeze(asset);
}

export const FOREST_PHOTOREAL_ASSETS = Object.freeze([
  defineAsset({
    blocking: true,
    group: "entry",
    height: 512,
    id: "groundColor",
    src: `${PHOTOREAL_ROOT}/ground-color.webp`,
    width: 512,
  }),
  defineAsset({
    blocking: true,
    group: "entry",
    height: 512,
    id: "groundNormal",
    src: `${PHOTOREAL_ROOT}/ground-normal.webp`,
    width: 512,
  }),
  defineAsset({
    blocking: true,
    group: "entry",
    height: 512,
    id: "groundArm",
    src: `${PHOTOREAL_ROOT}/ground-arm.webp`,
    width: 512,
  }),
  defineAsset({
    blocking: true,
    group: "entry",
    height: 512,
    id: "coniferColor",
    src: `${PHOTOREAL_ROOT}/conifer-color.webp`,
    width: 1024,
  }),
  defineAsset({
    blocking: true,
    group: "entry",
    height: 512,
    id: "coniferNormal",
    src: `${PHOTOREAL_ROOT}/conifer-normal.webp`,
    width: 1024,
  }),
  defineAsset({
    blocking: true,
    group: "entry",
    height: 512,
    id: "coniferArm",
    src: `${PHOTOREAL_ROOT}/conifer-arm.webp`,
    width: 1024,
  }),
  defineAsset({
    blocking: true,
    group: "entry",
    height: 512,
    id: "backdrop",
    src: `${PHOTOREAL_ROOT}/backdrop.webp`,
    width: 1024,
  }),
  defineAsset({
    blocking: false,
    group: "wildlife",
    height: 640,
    id: "wildlife",
    src: `${PHOTOREAL_ROOT}/wildlife.webp`,
    width: 960,
  }),
] satisfies readonly ForestPhotorealAsset[]);

const FOREST_PHOTOREAL_COMPRESSED_BYTES: Readonly<Record<string, number>> =
  Object.freeze({
    backdrop: 166_970,
    coniferArm: 49_748,
    coniferColor: 155_656,
    coniferNormal: 99_428,
    groundArm: 84_238,
    groundColor: 99_956,
    groundNormal: 139_296,
    wildlife: 62_566,
  });

function getDecodedRgbaMipBytes(asset: ForestPhotorealAsset) {
  return Math.ceil(asset.width * asset.height * 4 * 4 / 3);
}

export function getForestPhotorealAssetEstimate(
  group: "entry" | "shared",
): ForestPhotorealAssetEstimate {
  const assets = Object.freeze(
    FOREST_PHOTOREAL_ASSETS.filter(
      (asset) => group === "shared" || asset.group === "entry",
    ),
  );

  return Object.freeze({
    assets,
    compressedBytes: assets.reduce(
      (total, asset) =>
        total + FOREST_PHOTOREAL_COMPRESSED_BYTES[asset.id],
      0,
    ),
    decodedRgbaMipBytes: assets.reduce(
      (total, asset) => total + getDecodedRgbaMipBytes(asset),
      0,
    ),
  });
}
