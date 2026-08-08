import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import type { OpeningEffectAssetManifest } from "../src/data/templates/opening-effect";

const ART_OPENING_THEME_SLUGS = [
  "dong-ho-folk",
  "tho-cam-highland",
  "son-mai-lacquer",
  "bat-trang-blue",
  "hang-trong-folk",
  "sen-monoline",
  "truc-chi-minimal",
  "long-phung-deco",
  "ao-dai-hue",
  "art-deco-gatsby",
  "celestial-map",
  "coastal-mediterranean",
  "swiss-brutalist",
  "riso-duotone",
  "cinema-credit",
  "aurora-glass-dark",
  "y2k-chrome",
  "botanical-lavender",
  "rap-hy-sai-gon",
  "trong-dong-dong-son",
  "chim-lac-ivory",
  "ivory-signature",
  "hai-yen-thanh-thu",
  "phong-thu-be",
  "phong-thu-luc-pastel",
  "phong-thu-do-pastel",
  "phong-thu-lam-pastel",
  "phong-thu-hong-pastel",
  "hoa-thu-do-ruou-vang",
  "hoa-thu-xanh-la",
  "hoa-thu-hong",
  "hoa-thu-xanh-duong",
  "thanh-duong-anh-sang",
] as const;

export async function assertOpeningForegroundAsset(filePath: string): Promise<void> {
  const image = sharp(filePath);
  const metadata = await image.metadata();
  if (!metadata.hasAlpha || metadata.channels !== 4) {
    throw new Error(`${filePath}: foreground must contain genuine alpha`);
  }

  const stats = await image.stats();
  const alpha = stats.channels[3];
  if (!alpha || alpha.min !== 0 || alpha.max === 0) {
    throw new Error(`${filePath}: foreground alpha must contain transparent and visible pixels`);
  }
}

export async function assertOpeningPlateAsset(
  filePath: string,
  canvas: { width: number; height: number },
): Promise<void> {
  const metadata = await sharp(filePath).metadata();
  if (metadata.width !== canvas.width || metadata.height !== canvas.height) {
    throw new Error(
      `${filePath}: plate dimensions must be ${canvas.width}x${canvas.height}`,
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readAssetManifest(value: unknown, filePath: string): OpeningEffectAssetManifest {
  if (!isRecord(value) || !isRecord(value.canvas) || !Array.isArray(value.layers)) {
    throw new Error(`${filePath}: invalid opening asset manifest`);
  }
  const { width, height } = value.canvas;
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    typeof value.plateSrc !== "string"
  ) {
    throw new Error(`${filePath}: invalid canvas or plate source`);
  }

  const layers = value.layers.map((entry, index) => {
    if (
      !isRecord(entry) ||
      typeof entry.id !== "string" ||
      typeof entry.src !== "string" ||
      !isRecord(entry.rect)
    ) {
      throw new Error(`${filePath}: invalid layer at index ${index}`);
    }
    const rect = entry.rect;
    if (
      typeof rect.x !== "number" ||
      typeof rect.y !== "number" ||
      typeof rect.width !== "number" ||
      typeof rect.height !== "number"
    ) {
      throw new Error(`${filePath}: invalid rect for ${entry.id}`);
    }
    return {
      id: entry.id,
      src: entry.src,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
    };
  });

  return {
    canvas: { width, height },
    plateSrc: value.plateSrc,
    layers,
  };
}

function resolveThemeAsset(
  themeDirectory: string,
  slug: string,
  publicPath: string,
): string {
  const prefix = `/chungdoi/images/themes/_decor/${slug}/`;
  if (!publicPath.startsWith(prefix) || publicPath.endsWith("/artwork.webp")) {
    throw new Error(`${publicPath}: opening asset must stay inside ${prefix}`);
  }
  const fileName = publicPath.slice(prefix.length);
  if (!fileName || fileName.includes("/") || fileName.includes("..")) {
    throw new Error(`${publicPath}: invalid opening asset path`);
  }
  return path.join(themeDirectory, fileName);
}

export async function validateOpeningAssetSet(
  themeDirectory: string,
): Promise<OpeningEffectAssetManifest> {
  const slug = path.basename(themeDirectory);
  const manifestPath = path.join(themeDirectory, "opening-assets.json");
  const manifest = readAssetManifest(
    JSON.parse(await readFile(manifestPath, "utf8")) as unknown,
    manifestPath,
  );
  const artworkMetadata = await sharp(path.join(themeDirectory, "artwork.webp")).metadata();
  if (
    artworkMetadata.width !== manifest.canvas.width ||
    artworkMetadata.height !== manifest.canvas.height
  ) {
    throw new Error(`${manifestPath}: canvas must match artwork dimensions`);
  }

  await assertOpeningPlateAsset(
    resolveThemeAsset(themeDirectory, slug, manifest.plateSrc),
    manifest.canvas,
  );

  const ids = new Set<string>();
  const sources = new Set<string>();
  for (const layer of manifest.layers) {
    if (ids.has(layer.id)) throw new Error(`${manifestPath}: duplicate layer id ${layer.id}`);
    if (sources.has(layer.src)) {
      throw new Error(`${manifestPath}: duplicate layer source ${layer.src}`);
    }
    ids.add(layer.id);
    sources.add(layer.src);

    const { x, y, width, height } = layer.rect;
    if (
      x < 0 ||
      y < 0 ||
      width <= 0 ||
      height <= 0 ||
      x + width > manifest.canvas.width ||
      y + height > manifest.canvas.height
    ) {
      throw new Error(`${manifestPath}: ${layer.id} rect is outside canvas`);
    }
    await assertOpeningForegroundAsset(
      resolveThemeAsset(themeDirectory, slug, layer.src),
    );
  }
  return manifest;
}

function selectedSlugs(argv: readonly string[]): readonly string[] {
  const index = argv.indexOf("--slugs");
  if (index === -1) return ART_OPENING_THEME_SLUGS;
  const value = argv[index + 1];
  if (!value) throw new Error("--slugs requires a comma-separated value");
  const slugs = value.split(",").map((slug) => slug.trim()).filter(Boolean);
  for (const slug of slugs) {
    if (!ART_OPENING_THEME_SLUGS.includes(slug as (typeof ART_OPENING_THEME_SLUGS)[number])) {
      throw new Error(`unknown art opening theme: ${slug}`);
    }
  }
  return slugs;
}

async function main(): Promise<void> {
  const slugs = selectedSlugs(process.argv.slice(2));
  const decorRoot = path.join(
    process.cwd(),
    "public/chungdoi/images/themes/_decor",
  );
  for (const slug of slugs) {
    const manifest = await validateOpeningAssetSet(path.join(decorRoot, slug));
    process.stdout.write(`${slug}: ${manifest.layers.length} clean alpha layers valid\n`);
  }
  process.stdout.write(`${slugs.length}/${slugs.length} opening-effect asset sets valid\n`);
}

const entryPoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === entryPoint) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
