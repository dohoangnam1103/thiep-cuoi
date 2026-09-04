import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

import {
  assertValidArtOpeningEffect,
  type ArtOpeningEffect,
} from "./opening-effect";
import {
  assertOpeningForegroundAsset,
  assertOpeningPlateAsset,
  validateOpeningAssetSet,
} from "../../../scripts/validate-opening-effect-assets";
import { prepareOpeningAssets } from "../../../scripts/prepare-opening-assets";
import { artOpeningEffects } from "./art-opening-effects";

const artThemeDurations = {
  "dong-ho-folk": 1420,
  "tho-cam-highland": 1360,
  "son-mai-lacquer": 1480,
  "bat-trang-blue": 1400,
  "hang-trong-folk": 1500,
  "sen-monoline": 1340,
  "truc-chi-minimal": 1450,
  "long-phung-deco": 1500,
  "ao-dai-hue": 1380,
  "art-deco-gatsby": 1460,
  "celestial-map": 1440,
  "coastal-mediterranean": 1350,
  "swiss-brutalist": 1300,
  "riso-duotone": 1370,
  "cinema-credit": 1490,
  "aurora-glass-dark": 1410,
  "y2k-chrome": 1390,
  "botanical-lavender": 1430,
  "rap-hy-sai-gon": 1480,
  "trong-dong-dong-son": 1470,
  "chim-lac-ivory": 1320,
  "ivory-signature": 1420,
  "hai-yen-thanh-thu": 1400,
  "phong-thu-be": 1440,
  "phong-thu-luc-pastel": 1440,
  "phong-thu-do-pastel": 1440,
  "phong-thu-lam-pastel": 1440,
  "phong-thu-hong-pastel": 1440,
  "hoa-thu-do-ruou-vang": 1470,
  "hoa-thu-xanh-la": 1470,
  "hoa-thu-hong": 1470,
  "hoa-thu-xanh-duong": 1470,
  "thanh-duong-anh-sang": 1400,
  "cong-la-dua-mien-tay": 1380,
  "nguyet-bach": 1440,
} as const;

function createEffect(): ArtOpeningEffect {
  const makeLayer = (id: string, x: number) => ({
    id,
    src: `/chungdoi/images/themes/_decor/test/opening-${id}.webp`,
    rect: { x, y: 20, width: 120, height: 180 },
    transformOrigin: "50% 50%" as const,
    delayMs: 0,
    easing: "ease-out",
    startOpacity: 0.2,
    peak: {
      offset: 0.24 as const,
      xPercent: 0,
      yPercent: -4,
      scale: 1.2,
      rotateDeg: 0,
      blurPx: 0,
      brightness: 1.1,
      opacity: 0.9,
    },
    hold: {
      offset: 0.7 as const,
      xPercent: 35,
      yPercent: -14,
      scale: 2.1,
      rotateDeg: 5,
      blurPx: 0,
      brightness: 1.1,
      opacity: 0.92,
    },
    exit: {
      offset: 1 as const,
      xPercent: 50,
      yPercent: -20,
      scale: 3,
      rotateDeg: 8,
      blurPx: 8,
      brightness: 1,
      opacity: 0,
    },
    optional: true as const,
  });

  return {
    id: "test-opening",
    canvas: { width: 600, height: 900 },
    durationMs: 1400,
    plateSrc: "/chungdoi/images/themes/_decor/test/opening-plate.webp",
    layers: [makeLayer("left", 10), makeLayer("right", 190), makeLayer("center", 360)],
    reducedMotion: { durationMs: 180 },
  };
}

test("assertValidArtOpeningEffect accepts the approved contract", () => {
  assert.doesNotThrow(() => assertValidArtOpeningEffect(createEffect()));
});

test("assertValidArtOpeningEffect rejects invalid duration and layer count", () => {
  const short = { ...createEffect(), durationMs: 1299 };
  assert.throws(() => assertValidArtOpeningEffect(short), /1300.*1500/);

  const twoLayers = { ...createEffect(), layers: createEffect().layers.slice(0, 2) };
  assert.throws(() => assertValidArtOpeningEffect(twoLayers), /3.*4/);
});

test("assertValidArtOpeningEffect rejects duplicate IDs and out-of-canvas rects", () => {
  const duplicateBase = createEffect();
  const duplicate: ArtOpeningEffect = {
    ...duplicateBase,
    layers: duplicateBase.layers.map((layer, index) =>
      index === 1 ? { ...layer, id: duplicateBase.layers[0].id } : layer,
    ),
  };
  assert.throws(() => assertValidArtOpeningEffect(duplicate), /duplicate layer id/);

  const outsideBase = createEffect();
  const outside: ArtOpeningEffect = {
    ...outsideBase,
    layers: outsideBase.layers.map((layer, index) =>
      index === 2
        ? { ...layer, rect: { x: 550, y: 20, width: 120, height: 180 } }
        : layer,
    ),
  };
  assert.throws(() => assertValidArtOpeningEffect(outside), /outside canvas/);
});

test("foreground validation rejects opaque rectangles and accepts genuine alpha", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "opening-assets-"));
  try {
    const opaque = path.join(directory, "opaque.webp");
    await sharp({
      create: { width: 24, height: 24, channels: 3, background: "#9d261e" },
    }).webp().toFile(opaque);

    await assert.rejects(() => assertOpeningForegroundAsset(opaque), /alpha/);

    const transparent = path.join(directory, "transparent.webp");
    const pixels = Buffer.alloc(24 * 24 * 4, 0);
    for (let y = 6; y < 18; y += 1) {
      for (let x = 6; x < 18; x += 1) {
        const offset = (y * 24 + x) * 4;
        pixels[offset] = 157;
        pixels[offset + 1] = 38;
        pixels[offset + 2] = 30;
        pixels[offset + 3] = 255;
      }
    }
    await sharp(pixels, { raw: { width: 24, height: 24, channels: 4 } })
      .webp({ lossless: true })
      .toFile(transparent);

    await assert.doesNotReject(() => assertOpeningForegroundAsset(transparent));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("plate validation requires the original canvas dimensions", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "opening-plate-"));
  try {
    const plate = path.join(directory, "plate.webp");
    await sharp({
      create: { width: 100, height: 120, channels: 3, background: "#f1ddb0" },
    }).webp().toFile(plate);

    await assert.rejects(
      () => assertOpeningPlateAsset(plate, { width: 1122, height: 1402 }),
      /dimensions/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("prepareOpeningAssets emits tight alpha crops with exact canvas coordinates", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "opening-prepare-"));
  const publicRoot = path.join(directory, "public");
  const themeDirectory = path.join(
    publicRoot,
    "chungdoi/images/themes/_decor/test-theme",
  );
  await mkdir(themeDirectory, { recursive: true });

  try {
    const artworkPath = path.join(themeDirectory, "artwork.webp");
    const platePath = path.join(directory, "plate.png");
    await sharp({
      create: { width: 24, height: 24, channels: 3, background: "#f1ddb0" },
    }).webp().toFile(artworkPath);
    await sharp({
      create: { width: 24, height: 24, channels: 3, background: "#ead39f" },
    }).png().toFile(platePath);

    const subjectPath = path.join(directory, "subject.png");
    const pixels = Buffer.alloc(24 * 24 * 4, 0);
    for (let y = 5; y < 16; y += 1) {
      for (let x = 6; x < 18; x += 1) {
        const offset = (y * 24 + x) * 4;
        pixels[offset] = 38;
        pixels[offset + 1] = 50;
        pixels[offset + 2] = 33;
        pixels[offset + 3] = 255;
      }
    }
    await sharp(pixels, { raw: { width: 24, height: 24, channels: 4 } })
      .png()
      .toFile(subjectPath);

    const manifest = await prepareOpeningAssets({
      slug: "test-theme",
      platePath,
      publicRoot,
      layers: [{ id: "subject", filePath: subjectPath }],
    });

    assert.deepEqual(manifest.canvas, { width: 24, height: 24 });
    assert.equal(
      manifest.plateSrc,
      "/chungdoi/images/themes/_decor/test-theme/opening-plate.webp",
    );
    assert.deepEqual(manifest.layers, [
      {
        id: "subject",
        src: "/chungdoi/images/themes/_decor/test-theme/opening-subject.webp",
        rect: { x: 4, y: 3, width: 16, height: 15 },
      },
    ]);

    const writtenManifest = JSON.parse(
      await readFile(path.join(themeDirectory, "opening-assets.json"), "utf8"),
    ) as unknown;
    assert.deepEqual(writtenManifest, manifest);
    await assertOpeningForegroundAsset(
      path.join(themeDirectory, "opening-subject.webp"),
    );
    await assertOpeningPlateAsset(path.join(themeDirectory, "opening-plate.webp"), {
      width: 24,
      height: 24,
    });
    await assert.doesNotReject(() => validateOpeningAssetSet(themeDirectory));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("all art themes register unique clean layered opening effects", () => {
  const ids = new Set<string>();
  assert.deepEqual(Object.keys(artOpeningEffects).sort(), Object.keys(artThemeDurations).sort());

  for (const slug of Object.keys(artThemeDurations) as Array<keyof typeof artThemeDurations>) {
    const durationMs = artThemeDurations[slug];
    const effect = artOpeningEffects[slug];
    assert.equal(effect.durationMs, durationMs);
    assert.ok(
      effect.layers.length >= 3 && effect.layers.length <= 4,
      `${slug}: opening effect must contain 3 or 4 layers`,
    );
    assert.doesNotThrow(() => assertValidArtOpeningEffect(effect));
    assert.equal(ids.has(effect.id), false, `duplicate effect id: ${effect.id}`);
    ids.add(effect.id);

    const sources = [effect.plateSrc, ...effect.layers.map((layer) => layer.src)];
    for (const source of sources) {
      assert.equal(source.endsWith("/artwork.webp"), false);
      assert.equal(existsSync(path.join(process.cwd(), "public", source.slice(1))), true, source);
    }
  }
});
