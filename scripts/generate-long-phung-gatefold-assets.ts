import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp, { type Sharp } from "sharp";

const TEMPLATE_SLUG = "long-phung-gatefold";
const LOCKED_PALETTE = {
  lacquerCrimson: "#5A0B12",
  deepCinnabar: "#7C1B1B",
  antiqueGold: "#B58A3A",
  warmIvory: "#EAD9B8",
  lacquerBlack: "#17110F",
} as const;

const projectRoot = process.cwd();
const assetRoot = path.join(
  projectRoot,
  "public/chungdoi/templates",
  TEMPLATE_SLUG,
);
const diagnosticRoot = path.join(assetRoot, "diagnostics");

type RgbaImage = {
  data: Buffer;
  width: number;
  height: number;
};

type TransparentRgbNormalization = {
  fullyTransparentPixels: number;
  pixelsChanged: number;
  rgbChannelValuesCleared: number;
};

type AlphaSummary = {
  min: number;
  max: number;
  visiblePixels: number;
  translucentPixels: number;
  fullyTransparentPixels: number;
  coverageRatio: number;
  visibleBounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null;
};

type OutputArtifact = {
  path: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: string;
};

type RuntimeSourceConfig = {
  id: string;
  source: string;
  output: string;
  mobileOutput: string;
  expectedWidth: number;
  expectedHeight: number;
  mobileWidth: number;
  status: "immutable-composite" | "lab-candidate";
};

type AuthorFileConfig = {
  id: string;
  file: string;
  kind: "animation-layer" | "mask" | "shadow";
  expectedWidth: number;
  expectedHeight: number;
};

type AuthorFileResult = {
  id: string;
  path: string;
  kind: AuthorFileConfig["kind"];
  status: "missing" | "valid" | "invalid";
  validation?: Record<string, number | string | boolean>;
  error?: string;
};

type RecompositionRecipe = {
  id: string;
  reference: string;
  layers: string[];
  expectedWidth: number;
  expectedHeight: number;
};

type RecompositionResult = {
  id: string;
  status: "blocked-missing-author-files" | "invalid" | "matched" | "mismatch";
  missingAuthorFiles?: string[];
  error?: string;
  reference?: string;
  layers?: string[];
  output?: OutputArtifact;
  diff?: OutputArtifact;
  maximumChannelDifference?: number;
  meanAbsoluteChannelDifference?: number;
  differingPixels?: number;
  totalPixels?: number;
};

const runtimeSources: RuntimeSourceConfig[] = [
  {
    id: "dragon-left-composite-v2",
    source: "source/dragon-left-master-v2.png",
    output: "cover/dragon-left-composite-v2.webp",
    mobileOutput: "cover/dragon-left-composite-v2.mobile.webp",
    expectedWidth: 887,
    expectedHeight: 1774,
    mobileWidth: 444,
    status: "immutable-composite",
  },
  {
    id: "phoenix-right-composite-v1",
    source: "source/phoenix-right-master-v1.png",
    output: "cover/phoenix-right-composite-v1.webp",
    mobileOutput: "cover/phoenix-right-composite-v1.mobile.webp",
    expectedWidth: 887,
    expectedHeight: 1774,
    mobileWidth: 444,
    status: "immutable-composite",
  },
  {
    id: "cloud-front-candidate-v1",
    source: "source/cloud-front-master-v1.png",
    output: "opening/cloud-front-candidate-v1.webp",
    mobileOutput: "opening/cloud-front-candidate-v1.mobile.webp",
    expectedWidth: 1254,
    expectedHeight: 1254,
    mobileWidth: 640,
    status: "lab-candidate",
  },
];

const authorFiles: AuthorFileConfig[] = [
  {
    id: "dragon-body-left",
    file: "source/dragon-body-left.png",
    kind: "animation-layer",
    expectedWidth: 887,
    expectedHeight: 1774,
  },
  {
    id: "dragon-whiskers-left",
    file: "source/dragon-whiskers-left.png",
    kind: "animation-layer",
    expectedWidth: 887,
    expectedHeight: 1774,
  },
  {
    id: "dragon-foil-mask",
    file: "source/dragon-foil-mask.png",
    kind: "mask",
    expectedWidth: 887,
    expectedHeight: 1774,
  },
  {
    id: "dragon-emboss-mask",
    file: "source/dragon-emboss-mask.png",
    kind: "mask",
    expectedWidth: 887,
    expectedHeight: 1774,
  },
  {
    id: "dragon-shadow",
    file: "source/dragon-shadow.png",
    kind: "shadow",
    expectedWidth: 887,
    expectedHeight: 1774,
  },
  {
    id: "phoenix-body-right",
    file: "source/phoenix-body-right.png",
    kind: "animation-layer",
    expectedWidth: 887,
    expectedHeight: 1774,
  },
  {
    id: "phoenix-wing-front-right",
    file: "source/phoenix-wing-front-right.png",
    kind: "animation-layer",
    expectedWidth: 887,
    expectedHeight: 1774,
  },
  {
    id: "phoenix-tail-front-right",
    file: "source/phoenix-tail-front-right.png",
    kind: "animation-layer",
    expectedWidth: 887,
    expectedHeight: 1774,
  },
  {
    id: "phoenix-foil-mask",
    file: "source/phoenix-foil-mask.png",
    kind: "mask",
    expectedWidth: 887,
    expectedHeight: 1774,
  },
  {
    id: "phoenix-emboss-mask",
    file: "source/phoenix-emboss-mask.png",
    kind: "mask",
    expectedWidth: 887,
    expectedHeight: 1774,
  },
  {
    id: "phoenix-shadow",
    file: "source/phoenix-shadow.png",
    kind: "shadow",
    expectedWidth: 887,
    expectedHeight: 1774,
  },
  {
    id: "cloud-back",
    file: "source/cloud-back.png",
    kind: "animation-layer",
    expectedWidth: 3072,
    expectedHeight: 3072,
  },
];

const recompositionRecipes: RecompositionRecipe[] = [
  {
    id: "dragon-left",
    reference: "source/dragon-left-master-v2.png",
    layers: [
      "source/dragon-body-left.png",
      "source/dragon-whiskers-left.png",
    ],
    expectedWidth: 887,
    expectedHeight: 1774,
  },
  {
    id: "phoenix-right",
    reference: "source/phoenix-right-master-v1.png",
    layers: [
      "source/phoenix-body-right.png",
      "source/phoenix-wing-front-right.png",
      "source/phoenix-tail-front-right.png",
    ],
    expectedWidth: 887,
    expectedHeight: 1774,
  },
];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function relativeToAssetRoot(filePath: string): string {
  return path.relative(assetRoot, filePath).split(path.sep).join("/");
}

function absoluteAssetPath(relativePath: string): string {
  return path.join(assetRoot, relativePath);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function atomicWrite(filePath: string, data: Buffer | string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, data);
  await rename(temporaryPath, filePath);
}

async function sha256(filePath: string): Promise<string> {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

async function describeArtifact(filePath: string): Promise<OutputArtifact> {
  const [fileStat, metadata, digest] = await Promise.all([
    stat(filePath),
    sharp(filePath).metadata(),
    sha256(filePath),
  ]);
  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error(`${filePath}: generated image metadata is incomplete`);
  }
  return {
    path: relativeToAssetRoot(filePath),
    bytes: fileStat.size,
    sha256: digest,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  };
}

function normalizeTransparentRgb(data: Buffer): TransparentRgbNormalization {
  let fullyTransparentPixels = 0;
  let pixelsChanged = 0;
  let rgbChannelValuesCleared = 0;
  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3] !== 0) continue;
    fullyTransparentPixels += 1;
    let changed = false;
    for (let channel = 0; channel < 3; channel += 1) {
      if (data[offset + channel] === 0) continue;
      data[offset + channel] = 0;
      rgbChannelValuesCleared += 1;
      changed = true;
    }
    if (changed) pixelsChanged += 1;
  }
  return {
    fullyTransparentPixels,
    pixelsChanged,
    rgbChannelValuesCleared,
  };
}

async function loadNormalizedRgba(filePath: string): Promise<{
  image: RgbaImage;
  normalization: TransparentRgbNormalization;
}> {
  const raw = await sharp(filePath, {
    failOn: "error",
    limitInputPixels: 40_000_000,
  })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (raw.info.channels !== 4) {
    throw new Error(`${filePath}: expected RGBA data after alpha normalization`);
  }
  const data = Buffer.from(raw.data);
  return {
    image: {
      data,
      width: raw.info.width,
      height: raw.info.height,
    },
    normalization: normalizeTransparentRgb(data),
  };
}

function summarizeAlpha(image: RgbaImage): AlphaSummary {
  let min = 255;
  let max = 0;
  let visiblePixels = 0;
  let translucentPixels = 0;
  let fullyTransparentPixels = 0;
  let left = image.width;
  let right = -1;
  let top = image.height;
  let bottom = -1;

  for (let pixel = 0; pixel < image.width * image.height; pixel += 1) {
    const alpha = image.data[pixel * 4 + 3];
    min = Math.min(min, alpha);
    max = Math.max(max, alpha);
    if (alpha === 0) {
      fullyTransparentPixels += 1;
      continue;
    }
    visiblePixels += 1;
    if (alpha < 255) translucentPixels += 1;
    const x = pixel % image.width;
    const y = Math.floor(pixel / image.width);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }

  return {
    min,
    max,
    visiblePixels,
    translucentPixels,
    fullyTransparentPixels,
    coverageRatio: visiblePixels / (image.width * image.height),
    visibleBounds:
      right >= left && bottom >= top
        ? {
            left,
            top,
            width: right - left + 1,
            height: bottom - top + 1,
          }
        : null,
  };
}

function rawRgba(image: RgbaImage): Sharp {
  return sharp(image.data, {
    raw: {
      width: image.width,
      height: image.height,
      channels: 4,
    },
  });
}

async function writeRuntimeWebp(
  image: RgbaImage,
  outputPath: string,
  width?: number,
): Promise<OutputArtifact> {
  const target = width
    ? rawRgba(image).resize({
        width,
        fit: "inside",
        withoutEnlargement: true,
        kernel: "lanczos3",
      })
    : rawRgba(image);
  const encoded = await target
    .webp({
      quality: width ? 88 : 92,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer();
  await atomicWrite(outputPath, encoded);

  const decoded = await loadNormalizedRgba(outputPath);
  const decodedAlpha = summarizeAlpha(decoded.image);
  if (decodedAlpha.max === 0) {
    throw new Error(
      `${outputPath}: encoded runtime asset contains no visible pixels`,
    );
  }
  return describeArtifact(outputPath);
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`invalid six-digit hex color: ${hex}`);
  return {
    r: Number.parseInt(match[1].slice(0, 2), 16),
    g: Number.parseInt(match[1].slice(2, 4), 16),
    b: Number.parseInt(match[1].slice(4, 6), 16),
  };
}

async function writeFourBackgroundDiagnostic(
  image: RgbaImage,
  outputPath: string,
): Promise<OutputArtifact> {
  const cellWidth = Math.min(image.width, 480);
  const cellHeight = Math.max(
    1,
    Math.round((image.height / image.width) * cellWidth),
  );
  const subject = await rawRgba(image)
    .resize({
      width: cellWidth,
      height: cellHeight,
      fit: "fill",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();
  const backgrounds = [
    LOCKED_PALETTE.lacquerBlack,
    LOCKED_PALETTE.warmIvory,
    LOCKED_PALETTE.lacquerCrimson,
    "#00FF00",
  ].map(parseHexColor);

  const cells = await Promise.all(
    backgrounds.map((background) =>
      sharp({
        create: {
          width: cellWidth,
          height: cellHeight,
          channels: 4,
          background: { ...background, alpha: 1 },
        },
      })
        .composite([{ input: subject, blend: "over" }])
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer(),
    ),
  );

  const diagnostic = await sharp({
    create: {
      width: cellWidth * 2,
      height: cellHeight * 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([
      { input: cells[0], left: 0, top: 0 },
      { input: cells[1], left: cellWidth, top: 0 },
      { input: cells[2], left: 0, top: cellHeight },
      { input: cells[3], left: cellWidth, top: cellHeight },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  await atomicWrite(outputPath, diagnostic);
  return describeArtifact(outputPath);
}

function deterministicNoiseValue(x: number, y: number, seed: number): number {
  let hash =
    Math.imul(x + seed * 17, 374_761_393) +
    Math.imul(y + seed * 31, 668_265_263);
  hash = Math.imul(hash ^ (hash >>> 13), 1_274_126_177);
  hash ^= hash >>> 16;
  return ((hash >>> 0) / 4_294_967_295) * 2 - 1;
}

function smoothStep(value: number): number {
  return value * value * (3 - 2 * value);
}

function addTileableValueNoise(
  field: Float32Array,
  width: number,
  height: number,
  cellsX: number,
  cellsY: number,
  seed: number,
  amplitude: number,
): void {
  const grid = new Float32Array(cellsX * cellsY);
  for (let gridY = 0; gridY < cellsY; gridY += 1) {
    for (let gridX = 0; gridX < cellsX; gridX += 1) {
      grid[gridY * cellsX + gridX] = deterministicNoiseValue(
        gridX,
        gridY,
        seed,
      );
    }
  }

  const xCell = new Uint16Array(width);
  const xNext = new Uint16Array(width);
  const xBlend = new Float32Array(width);
  for (let x = 0; x < width; x += 1) {
    const coordinate = (x * cellsX) / width;
    const cell = Math.floor(coordinate);
    xCell[x] = cell;
    xNext[x] = (cell + 1) % cellsX;
    xBlend[x] = smoothStep(coordinate - cell);
  }

  for (let y = 0; y < height; y += 1) {
    const coordinateY = (y * cellsY) / height;
    const cellY = Math.floor(coordinateY);
    const nextY = (cellY + 1) % cellsY;
    const blendY = smoothStep(coordinateY - cellY);
    const rowOffset = y * width;
    for (let x = 0; x < width; x += 1) {
      const cellX = xCell[x];
      const nextX = xNext[x];
      const topLeft = grid[cellY * cellsX + cellX];
      const topRight = grid[cellY * cellsX + nextX];
      const bottomLeft = grid[nextY * cellsX + cellX];
      const bottomRight = grid[nextY * cellsX + nextX];
      const top = topLeft + (topRight - topLeft) * xBlend[x];
      const bottom = bottomLeft + (bottomRight - bottomLeft) * xBlend[x];
      field[rowOffset + x] +=
        (top + (bottom - top) * blendY) * amplitude;
    }
  }
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

async function writeRawWebp(
  data: Buffer,
  width: number,
  height: number,
  channels: 3,
  outputPath: string,
  lossless: boolean,
): Promise<OutputArtifact> {
  const encoded = await sharp(data, {
    raw: { width, height, channels },
  })
    .webp(
      lossless
        ? { lossless: true, effort: 6 }
        : { quality: 92, effort: 6, smartSubsample: true },
    )
    .toBuffer();
  await atomicWrite(outputPath, encoded);
  return describeArtifact(outputPath);
}

async function generatePaperMaterials(): Promise<{
  paperColor: OutputArtifact;
  paperNormal: OutputArtifact;
  foilRoughness: OutputArtifact;
}> {
  const paperWidth = 2048;
  const paperHeight = 2048;
  const height = new Float32Array(paperWidth * paperHeight);
  addTileableValueNoise(height, paperWidth, paperHeight, 7, 9, 11, 0.17);
  addTileableValueNoise(height, paperWidth, paperHeight, 19, 23, 23, 0.11);
  addTileableValueNoise(height, paperWidth, paperHeight, 57, 71, 41, 0.06);
  addTileableValueNoise(height, paperWidth, paperHeight, 180, 220, 67, 0.028);
  addTileableValueNoise(height, paperWidth, paperHeight, 48, 360, 89, 0.018);
  addTileableValueNoise(height, paperWidth, paperHeight, 380, 52, 101, 0.014);
  const paperBase = parseHexColor(LOCKED_PALETTE.warmIvory);
  const colorData = Buffer.allocUnsafe(paperWidth * paperHeight * 3);
  const normalData = Buffer.allocUnsafe(paperWidth * paperHeight * 3);

  for (let y = 0; y < paperHeight; y += 1) {
    const previousY = (y - 1 + paperHeight) % paperHeight;
    const nextY = (y + 1) % paperHeight;
    for (let x = 0; x < paperWidth; x += 1) {
      const previousX = (x - 1 + paperWidth) % paperWidth;
      const nextX = (x + 1) % paperWidth;
      const pixel = y * paperWidth + x;
      const outputOffset = pixel * 3;
      const value = height[pixel];
      const warmVariation = value * 3.2;
      colorData[outputOffset] = clampByte(paperBase.r + warmVariation);
      colorData[outputOffset + 1] = clampByte(
        paperBase.g + warmVariation * 0.92,
      );
      colorData[outputOffset + 2] = clampByte(
        paperBase.b + warmVariation * 0.76,
      );

      const dx =
        height[y * paperWidth + nextX] -
        height[y * paperWidth + previousX];
      const dy =
        height[nextY * paperWidth + x] -
        height[previousY * paperWidth + x];
      const normalX = -dx * 7;
      const normalY = -dy * 7;
      const inverseLength =
        1 / Math.sqrt(normalX * normalX + normalY * normalY + 1);
      normalData[outputOffset] = clampByte(
        (normalX * inverseLength * 0.5 + 0.5) * 255,
      );
      normalData[outputOffset + 1] = clampByte(
        (normalY * inverseLength * 0.5 + 0.5) * 255,
      );
      normalData[outputOffset + 2] = clampByte(inverseLength * 255);
    }
  }

  const roughnessWidth = 1024;
  const roughnessHeight = 1024;
  const roughnessField = new Float32Array(
    roughnessWidth * roughnessHeight,
  );
  addTileableValueNoise(
    roughnessField,
    roughnessWidth,
    roughnessHeight,
    6,
    7,
    131,
    0.48,
  );
  addTileableValueNoise(
    roughnessField,
    roughnessWidth,
    roughnessHeight,
    24,
    29,
    149,
    0.25,
  );
  addTileableValueNoise(
    roughnessField,
    roughnessWidth,
    roughnessHeight,
    96,
    113,
    173,
    0.12,
  );
  const roughnessData = Buffer.allocUnsafe(
    roughnessWidth * roughnessHeight * 3,
  );
  for (let pixel = 0; pixel < roughnessWidth * roughnessHeight; pixel += 1) {
    const value = clampByte(82 + roughnessField[pixel] * 18);
    const offset = pixel * 3;
    roughnessData[offset] = value;
    roughnessData[offset + 1] = value;
    roughnessData[offset + 2] = value;
  }

  const materialRoot = path.join(assetRoot, "materials");
  const [paperColor, paperNormal, foilRoughness] = await Promise.all([
    writeRawWebp(
      colorData,
      paperWidth,
      paperHeight,
      3,
      path.join(materialRoot, "paper-color.webp"),
      false,
    ),
    writeRawWebp(
      normalData,
      paperWidth,
      paperHeight,
      3,
      path.join(materialRoot, "paper-normal.webp"),
      false,
    ),
    writeRawWebp(
      roughnessData,
      roughnessWidth,
      roughnessHeight,
      3,
      path.join(materialRoot, "foil-roughness.webp"),
      true,
    ),
  ]);
  return { paperColor, paperNormal, foilRoughness };
}

async function validateTransparentAuthorFile(
  filePath: string,
  config: AuthorFileConfig,
): Promise<Record<string, number | string | boolean>> {
  const metadata = await sharp(filePath).metadata();
  if (
    metadata.width !== config.expectedWidth ||
    metadata.height !== config.expectedHeight
  ) {
    throw new Error(
      `expected ${config.expectedWidth}x${config.expectedHeight}, received ${metadata.width ?? "?"}x${metadata.height ?? "?"}`,
    );
  }
  if (!metadata.hasAlpha) {
    throw new Error("transparent author layer must contain an alpha channel");
  }
  const { image, normalization } = await loadNormalizedRgba(filePath);
  const alpha = summarizeAlpha(image);
  if (alpha.min !== 0 || alpha.max === 0) {
    throw new Error("alpha must contain transparent and visible pixels");
  }
  return {
    width: image.width,
    height: image.height,
    alphaMin: alpha.min,
    alphaMax: alpha.max,
    visiblePixels: alpha.visiblePixels,
    fullyTransparentRgbPixelsToNormalize: normalization.pixelsChanged,
  };
}

async function validateMaskAuthorFile(
  filePath: string,
  config: AuthorFileConfig,
): Promise<Record<string, number | string | boolean>> {
  const metadata = await sharp(filePath).metadata();
  if (
    metadata.width !== config.expectedWidth ||
    metadata.height !== config.expectedHeight
  ) {
    throw new Error(
      `expected ${config.expectedWidth}x${config.expectedHeight}, received ${metadata.width ?? "?"}x${metadata.height ?? "?"}`,
    );
  }
  const raw = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });
  const channels = raw.info.channels;
  let minimum = 255;
  let maximum = 0;
  let coloredPixels = 0;
  const pixelCount = raw.info.width * raw.info.height;
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * channels;
    const red = raw.data[offset];
    const green = channels >= 3 ? raw.data[offset + 1] : red;
    const blue = channels >= 3 ? raw.data[offset + 2] : red;
    minimum = Math.min(minimum, red, green, blue);
    maximum = Math.max(maximum, red, green, blue);
    if (
      Math.abs(red - green) > 1 ||
      Math.abs(red - blue) > 1 ||
      Math.abs(green - blue) > 1
    ) {
      coloredPixels += 1;
    }
  }
  if (minimum === maximum) {
    throw new Error("mask must contain a non-constant grayscale signal");
  }
  if (coloredPixels > 0) {
    throw new Error(
      `mask contains ${coloredPixels} colored pixels; material masks must be grayscale data`,
    );
  }
  return {
    width: raw.info.width,
    height: raw.info.height,
    channels,
    minimum,
    maximum,
    coloredPixels,
  };
}

async function inspectAuthorFiles(): Promise<AuthorFileResult[]> {
  const results: AuthorFileResult[] = [];
  for (const config of authorFiles) {
    const filePath = absoluteAssetPath(config.file);
    if (!(await fileExists(filePath))) {
      results.push({
        id: config.id,
        path: config.file,
        kind: config.kind,
        status: "missing",
      });
      continue;
    }
    try {
      const validation =
        config.kind === "mask"
          ? await validateMaskAuthorFile(filePath, config)
          : await validateTransparentAuthorFile(filePath, config);
      results.push({
        id: config.id,
        path: config.file,
        kind: config.kind,
        status: "valid",
        validation,
      });
    } catch (error) {
      results.push({
        id: config.id,
        path: config.file,
        kind: config.kind,
        status: "invalid",
        error: errorMessage(error),
      });
    }
  }
  return results;
}

async function compareRecomposition(
  recipe: RecompositionRecipe,
): Promise<RecompositionResult> {
  const missingAuthorFiles: string[] = [];
  for (const layer of recipe.layers) {
    if (!(await fileExists(absoluteAssetPath(layer)))) {
      missingAuthorFiles.push(layer);
    }
  }
  if (missingAuthorFiles.length > 0) {
    return {
      id: recipe.id,
      status: "blocked-missing-author-files",
      missingAuthorFiles,
    };
  }

  try {
    const referencePath = absoluteAssetPath(recipe.reference);
    const { image: reference } = await loadNormalizedRgba(referencePath);
    if (
      reference.width !== recipe.expectedWidth ||
      reference.height !== recipe.expectedHeight
    ) {
      throw new Error(
        `reference must be ${recipe.expectedWidth}x${recipe.expectedHeight}`,
      );
    }

    for (const layer of recipe.layers) {
      const metadata = await sharp(absoluteAssetPath(layer)).metadata();
      if (
        metadata.width !== recipe.expectedWidth ||
        metadata.height !== recipe.expectedHeight ||
        !metadata.hasAlpha
      ) {
        throw new Error(
          `${layer}: recomposition layers must be full-canvas RGBA ${recipe.expectedWidth}x${recipe.expectedHeight}`,
        );
      }
    }

    const recomposedPng = await sharp({
      create: {
        width: recipe.expectedWidth,
        height: recipe.expectedHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(
        recipe.layers.map((layer) => ({
          input: absoluteAssetPath(layer),
          left: 0,
          top: 0,
          blend: "over" as const,
        })),
      )
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
    const recomposedRaw = await sharp(recomposedPng)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const recomposedData = Buffer.from(recomposedRaw.data);
    normalizeTransparentRgb(recomposedData);

    const diff = Buffer.allocUnsafe(reference.width * reference.height * 4);
    let maximumChannelDifference = 0;
    let totalChannelDifference = 0;
    let differingPixels = 0;
    for (let pixel = 0; pixel < reference.width * reference.height; pixel += 1) {
      const offset = pixel * 4;
      let pixelDifference = 0;
      for (let channel = 0; channel < 4; channel += 1) {
        const difference = Math.abs(
          reference.data[offset + channel] - recomposedData[offset + channel],
        );
        maximumChannelDifference = Math.max(
          maximumChannelDifference,
          difference,
        );
        totalChannelDifference += difference;
        pixelDifference = Math.max(pixelDifference, difference);
        if (channel < 3) diff[offset + channel] = Math.min(255, difference * 6);
      }
      diff[offset + 3] = 255;
      if (pixelDifference > 1) differingPixels += 1;
    }

    const outputPath = path.join(
      diagnosticRoot,
      `${recipe.id}-author-recomposition.png`,
    );
    const diffPath = path.join(
      diagnosticRoot,
      `${recipe.id}-author-recomposition-diff.png`,
    );
    await Promise.all([
      atomicWrite(outputPath, recomposedPng),
      rawRgba({
        data: diff,
        width: reference.width,
        height: reference.height,
      })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer()
        .then((buffer) => atomicWrite(diffPath, buffer)),
    ]);
    const [output, diffArtifact] = await Promise.all([
      describeArtifact(outputPath),
      describeArtifact(diffPath),
    ]);
    return {
      id: recipe.id,
      status: differingPixels === 0 ? "matched" : "mismatch",
      reference: recipe.reference,
      layers: recipe.layers,
      output,
      diff: diffArtifact,
      maximumChannelDifference,
      meanAbsoluteChannelDifference:
        totalChannelDifference / (reference.width * reference.height * 4),
      differingPixels,
      totalPixels: reference.width * reference.height,
    };
  } catch (error) {
    return {
      id: recipe.id,
      status: "invalid",
      error: errorMessage(error),
    };
  }
}

async function processRuntimeSource(config: RuntimeSourceConfig): Promise<{
  id: string;
  status: RuntimeSourceConfig["status"];
  source: OutputArtifact;
  alpha: AlphaSummary;
  transparentRgbNormalization: TransparentRgbNormalization;
  runtime: OutputArtifact;
  mobileRuntime: OutputArtifact;
  fourBackgroundDiagnostic: OutputArtifact;
}> {
  const sourcePath = absoluteAssetPath(config.source);
  const sourceMetadata = await sharp(sourcePath).metadata();
  if (
    sourceMetadata.width !== config.expectedWidth ||
    sourceMetadata.height !== config.expectedHeight
  ) {
    throw new Error(
      `${sourcePath}: expected ${config.expectedWidth}x${config.expectedHeight}, received ${sourceMetadata.width ?? "?"}x${sourceMetadata.height ?? "?"}`,
    );
  }
  if (!sourceMetadata.hasAlpha) {
    throw new Error(`${sourcePath}: source master must contain genuine alpha`);
  }

  const { image, normalization } = await loadNormalizedRgba(sourcePath);
  const alpha = summarizeAlpha(image);
  if (alpha.min !== 0 || alpha.max === 0) {
    throw new Error(
      `${sourcePath}: source alpha must contain transparent and visible pixels`,
    );
  }

  const runtimePath = absoluteAssetPath(config.output);
  const mobilePath = absoluteAssetPath(config.mobileOutput);
  const diagnosticPath = path.join(
    diagnosticRoot,
    `${config.id}-four-background.png`,
  );
  const [runtime, mobileRuntime, fourBackgroundDiagnostic, source] =
    await Promise.all([
      writeRuntimeWebp(image, runtimePath),
      writeRuntimeWebp(image, mobilePath, config.mobileWidth),
      writeFourBackgroundDiagnostic(image, diagnosticPath),
      describeArtifact(sourcePath),
    ]);
  return {
    id: config.id,
    status: config.status,
    source,
    alpha,
    transparentRgbNormalization: normalization,
    runtime,
    mobileRuntime,
    fourBackgroundDiagnostic,
  };
}

async function main(): Promise<void> {
  const strictAuthoring = process.argv.slice(2).includes("--strict-authoring");
  await mkdir(diagnosticRoot, { recursive: true });

  const processedSources = [];
  for (const config of runtimeSources) {
    processedSources.push(await processRuntimeSource(config));
  }
  const [materials, authoringFiles, recompositions] = await Promise.all([
    generatePaperMaterials(),
    inspectAuthorFiles(),
    Promise.all(recompositionRecipes.map(compareRecomposition)),
  ]);

  const missingAuthorMasks = authoringFiles
    .filter((file) => file.kind === "mask" && file.status === "missing")
    .map((file) => file.path);
  const invalidAuthorMasks = authoringFiles
    .filter((file) => file.kind === "mask" && file.status === "invalid")
    .map((file) => file.path);
  const missingAuthorLayers = authoringFiles
    .filter(
      (file) =>
        file.kind !== "mask" &&
        file.status === "missing",
    )
    .map((file) => file.path);
  const invalidAuthorLayers = authoringFiles
    .filter(
      (file) =>
        file.kind !== "mask" &&
        file.status === "invalid",
    )
    .map((file) => file.path);
  const recompositionReady = recompositions.every(
    (result) => result.status === "matched",
  );
  const readyForSemanticPromotion =
    missingAuthorMasks.length === 0 &&
    invalidAuthorMasks.length === 0 &&
    missingAuthorLayers.length === 0 &&
    invalidAuthorLayers.length === 0 &&
    recompositionReady;

  const imageArtifacts = [
    ...processedSources.flatMap((source) => [
      source.runtime,
      source.mobileRuntime,
      source.fourBackgroundDiagnostic,
    ]),
    materials.paperColor,
    materials.paperNormal,
    materials.foilRoughness,
    ...recompositions.flatMap((result) =>
      result.output && result.diff ? [result.output, result.diff] : [],
    ),
  ];
  const report = {
    schemaVersion: 1,
    templateSlug: TEMPLATE_SLUG,
    palette: LOCKED_PALETTE,
    policy: {
      sourceMastersAreImmutable: true,
      semanticLayerSynthesis: "forbidden",
      transparentRgbRule:
        "RGB is zeroed before encoding only where alpha is exactly zero; antialiased visible edge pixels are preserved. Hidden RGB decoded from WebP is unspecified by the format and is not treated as visible image data.",
      fullCanvasRegistration:
        "Mascot runtime composites and all future author layers stay on their declared full canvas; the pipeline never trims them.",
      diagnosticLayout:
        "2x2: lacquer black, warm ivory, lacquer crimson, QA-only chroma green.",
      promotionRule:
        "Composite and candidate WebP files are safe for the isolated lab only. Production body/wing/tail/whisker names remain blocked until authored full-canvas files exist and recomposition matches the master.",
    },
    sources: processedSources,
    materials: {
      provenance:
        "Deterministic periodic fields generated by this script; no AI color image is interpreted as PBR data.",
      paperColorBase: LOCKED_PALETTE.warmIvory,
      paperColor: materials.paperColor,
      paperNormal: materials.paperNormal,
      foilRoughness: materials.foilRoughness,
    },
    authoringReadiness: {
      readyForSemanticPromotion,
      files: authoringFiles,
      missingAuthorMasks,
      invalidAuthorMasks,
      missingAuthorLayers,
      invalidAuthorLayers,
      recompositions,
    },
    byteReport: {
      generatedImageBytes: imageArtifacts.reduce(
        (total, artifact) => total + artifact.bytes,
        0,
      ),
      artifacts: imageArtifacts
        .map((artifact) => ({
          path: artifact.path,
          bytes: artifact.bytes,
          sha256: artifact.sha256,
        }))
        .sort((left, right) => left.path.localeCompare(right.path)),
    },
  };

  const reportPath = path.join(assetRoot, "asset-pipeline-report.json");
  await atomicWrite(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  process.stdout.write(
    `${TEMPLATE_SLUG}: generated ${imageArtifacts.length} deterministic artifacts\n`,
  );
  process.stdout.write(
    `${TEMPLATE_SLUG}: semantic promotion ${readyForSemanticPromotion ? "READY" : "BLOCKED"}\n`,
  );
  if (missingAuthorMasks.length > 0) {
    process.stdout.write(
      `missing author masks:\n${missingAuthorMasks.map((file) => `- ${file}`).join("\n")}\n`,
    );
  }
  if (missingAuthorLayers.length > 0) {
    process.stdout.write(
      `missing author layers/shadows:\n${missingAuthorLayers.map((file) => `- ${file}`).join("\n")}\n`,
    );
  }
  process.stdout.write(
    `report: ${relativeToAssetRoot(reportPath)}\n`,
  );

  if (strictAuthoring && !readyForSemanticPromotion) {
    process.exitCode = 2;
  }
}

const entryPoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";
if (import.meta.url === entryPoint) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
