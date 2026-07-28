import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import type { OpeningEffectAssetManifest } from "../src/data/templates/opening-effect";
import {
  assertOpeningForegroundAsset,
  assertOpeningPlateAsset,
} from "./validate-opening-effect-assets";

type PrepareLayerInput = {
  id: string;
  filePath: string;
};

export type PrepareOpeningAssetsInput = {
  slug: string;
  platePath: string;
  layers: readonly PrepareLayerInput[];
  publicRoot?: string;
};

function publicAssetPath(slug: string, fileName: string): string {
  return `/chungdoi/images/themes/_decor/${slug}/${fileName}`;
}

async function atomicRename(tempPath: string, outputPath: string): Promise<void> {
  await rename(tempPath, outputPath);
}

export async function prepareOpeningAssets({
  slug,
  platePath,
  layers,
  publicRoot = path.join(process.cwd(), "public"),
}: PrepareOpeningAssetsInput): Promise<OpeningEffectAssetManifest> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`invalid theme slug: ${slug}`);
  }
  if (layers.length === 0) throw new Error("at least one opening layer is required");

  const themeDirectory = path.join(
    publicRoot,
    "chungdoi/images/themes/_decor",
    slug,
  );
  const artworkPath = path.join(themeDirectory, "artwork.webp");
  const artworkMetadata = await sharp(artworkPath).metadata();
  if (!artworkMetadata.width || !artworkMetadata.height) {
    throw new Error(`${artworkPath}: artwork dimensions are unavailable`);
  }
  const canvas = {
    width: artworkMetadata.width,
    height: artworkMetadata.height,
  };

  await assertOpeningPlateAsset(platePath, canvas);
  await mkdir(themeDirectory, { recursive: true });

  const plateFileName = "opening-plate.webp";
  const plateOutputPath = path.join(themeDirectory, plateFileName);
  const plateTempPath = `${plateOutputPath}.${process.pid}.tmp`;
  await sharp(platePath)
    .webp({ quality: 96, alphaQuality: 100, smartSubsample: true })
    .toFile(plateTempPath);
  await atomicRename(plateTempPath, plateOutputPath);

  const seenIds = new Set<string>();
  const preparedLayers: OpeningEffectAssetManifest["layers"][number][] = [];

  for (const layer of layers) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(layer.id)) {
      throw new Error(`invalid opening layer id: ${layer.id}`);
    }
    if (seenIds.has(layer.id)) throw new Error(`duplicate opening layer id: ${layer.id}`);
    seenIds.add(layer.id);

    const sourceMetadata = await sharp(layer.filePath).metadata();
    if (
      sourceMetadata.width !== canvas.width ||
      sourceMetadata.height !== canvas.height
    ) {
      throw new Error(
        `${layer.filePath}: full-canvas layer dimensions must be ${canvas.width}x${canvas.height}`,
      );
    }
    await assertOpeningForegroundAsset(layer.filePath);

    const trimmed = await sharp(layer.filePath)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 2 })
      .png()
      .toBuffer({ resolveWithObject: true });
    const trimX = -(trimmed.info.trimOffsetLeft ?? 0);
    const trimY = -(trimmed.info.trimOffsetTop ?? 0);
    const left = Math.min(2, trimX);
    const top = Math.min(2, trimY);
    const right = Math.min(2, canvas.width - trimX - trimmed.info.width);
    const bottom = Math.min(2, canvas.height - trimY - trimmed.info.height);

    const fileName = `opening-${layer.id}.webp`;
    const outputPath = path.join(themeDirectory, fileName);
    const tempPath = `${outputPath}.${process.pid}.tmp`;
    await sharp(trimmed.data)
      .extend({
        left,
        top,
        right,
        bottom,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ lossless: true, alphaQuality: 100 })
      .toFile(tempPath);
    await atomicRename(tempPath, outputPath);

    preparedLayers.push({
      id: layer.id,
      src: publicAssetPath(slug, fileName),
      rect: {
        x: trimX - left,
        y: trimY - top,
        width: trimmed.info.width + left + right,
        height: trimmed.info.height + top + bottom,
      },
    });
  }

  const manifest: OpeningEffectAssetManifest = {
    canvas,
    plateSrc: publicAssetPath(slug, plateFileName),
    layers: preparedLayers,
  };
  const manifestPath = path.join(themeDirectory, "opening-assets.json");
  const manifestTempPath = `${manifestPath}.${process.pid}.tmp`;
  await writeFile(manifestTempPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await atomicRename(manifestTempPath, manifestPath);
  return manifest;
}

function optionValues(argv: readonly string[], option: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === option && argv[index + 1]) values.push(argv[index + 1]);
  }
  return values;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const slug = optionValues(argv, "--slug")[0];
  const platePath = optionValues(argv, "--plate")[0];
  const layerArgs = optionValues(argv, "--layer");
  if (!slug || !platePath || layerArgs.length === 0) {
    throw new Error(
      "usage: prepare-opening-assets --slug <slug> --plate <path> --layer <id>=<path>",
    );
  }

  const layers = layerArgs.map((value) => {
    const separator = value.indexOf("=");
    if (separator <= 0 || separator === value.length - 1) {
      throw new Error(`invalid --layer value: ${value}`);
    }
    return {
      id: value.slice(0, separator),
      filePath: path.resolve(value.slice(separator + 1)),
    };
  });
  const manifest = await prepareOpeningAssets({
    slug,
    platePath: path.resolve(platePath),
    layers,
  });
  process.stdout.write(
    `${slug}: prepared ${manifest.layers.length} transparent opening layers\n`,
  );
}

const entryPoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === entryPoint) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
