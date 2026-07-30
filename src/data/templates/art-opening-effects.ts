import aoDaiHueAssets from "../../../public/chungdoi/images/themes/_decor/ao-dai-hue/opening-assets.json";
import artDecoGatsbyAssets from "../../../public/chungdoi/images/themes/_decor/art-deco-gatsby/opening-assets.json";
import auroraGlassDarkAssets from "../../../public/chungdoi/images/themes/_decor/aurora-glass-dark/opening-assets.json";
import batTrangBlueAssets from "../../../public/chungdoi/images/themes/_decor/bat-trang-blue/opening-assets.json";
import botanicalLavenderAssets from "../../../public/chungdoi/images/themes/_decor/botanical-lavender/opening-assets.json";
import rapHySaiGonAssets from "../../../public/chungdoi/images/themes/_decor/rap-hy-sai-gon/opening-assets.json";
import celestialMapAssets from "../../../public/chungdoi/images/themes/_decor/celestial-map/opening-assets.json";
import chimLacIvoryAssets from "../../../public/chungdoi/images/themes/_decor/chim-lac-ivory/opening-assets.json";
import ivorySignatureAssets from "../../../public/chungdoi/images/themes/_decor/ivory-signature/opening-assets.json";
import cinemaCreditAssets from "../../../public/chungdoi/images/themes/_decor/cinema-credit/opening-assets.json";
import coastalMediterraneanAssets from "../../../public/chungdoi/images/themes/_decor/coastal-mediterranean/opening-assets.json";
import dongHoFolkAssets from "../../../public/chungdoi/images/themes/_decor/dong-ho-folk/opening-assets.json";
import hangTrongFolkAssets from "../../../public/chungdoi/images/themes/_decor/hang-trong-folk/opening-assets.json";
import longPhungDecoAssets from "../../../public/chungdoi/images/themes/_decor/long-phung-deco/opening-assets.json";
import risoDuotoneAssets from "../../../public/chungdoi/images/themes/_decor/riso-duotone/opening-assets.json";
import senMonolineAssets from "../../../public/chungdoi/images/themes/_decor/sen-monoline/opening-assets.json";
import sonMaiLacquerAssets from "../../../public/chungdoi/images/themes/_decor/son-mai-lacquer/opening-assets.json";
import swissBrutalistAssets from "../../../public/chungdoi/images/themes/_decor/swiss-brutalist/opening-assets.json";
import thoCamHighlandAssets from "../../../public/chungdoi/images/themes/_decor/tho-cam-highland/opening-assets.json";
import trongDongDongSonAssets from "../../../public/chungdoi/images/themes/_decor/trong-dong-dong-son/opening-assets.json";
import trucChiMinimalAssets from "../../../public/chungdoi/images/themes/_decor/truc-chi-minimal/opening-assets.json";
import y2kChromeAssets from "../../../public/chungdoi/images/themes/_decor/y2k-chrome/opening-assets.json";

import {
  assertValidArtOpeningEffect,
  type ArtOpeningEffect,
  type OpeningEffectAssetManifest,
  type OpeningEffectLayer,
} from "./opening-effect";

type ExitTuple = readonly [
  xPercent: number,
  yPercent: number,
  scale: number,
  rotateDeg: number,
  blurPx: number,
];

type PeakOverride = {
  xPercent?: number;
  yPercent?: number;
  brightness?: number;
};

type MotionConfig = {
  durationMs: number;
  startOpacity?: number;
  exits: Readonly<Record<string, ExitTuple>>;
  peaks?: Readonly<Record<string, PeakOverride>>;
  origins?: Readonly<Record<string, OpeningEffectLayer["transformOrigin"]>>;
};

function asAssetManifest(value: unknown): OpeningEffectAssetManifest {
  return value as OpeningEffectAssetManifest;
}

function createArtOpeningEffect(
  slug: string,
  assets: OpeningEffectAssetManifest,
  config: MotionConfig,
): ArtOpeningEffect {
  const layers = assets.layers.map((asset, index) => {
    const exit = config.exits[asset.id];
    if (!exit) throw new Error(`${slug}: missing motion for ${asset.id}`);
    const peak = config.peaks?.[asset.id];
    const defaultOrigin = index === 0 ? "100% 50%" : index === 1 ? "0% 50%" : "50% 50%";

    return {
      ...asset,
      transformOrigin: config.origins?.[asset.id] ?? defaultOrigin,
      delayMs: 0,
      easing: "linear",
      startOpacity: config.startOpacity ?? 0.2,
      peak: {
        offset: 0.24 as const,
        xPercent: peak?.xPercent ?? 0,
        yPercent: peak?.yPercent ?? -4,
        scale: 1.28,
        rotateDeg: 0,
        blurPx: 0,
        brightness: peak?.brightness ?? 1.18,
        opacity: 0.95,
      },
      hold: {
        offset: 0.7 as const,
        xPercent: Math.round(exit[0] * 0.7),
        yPercent: Math.round(exit[1] * 0.7),
        scale: Math.round((1 + (exit[2] - 1) * 0.62) * 100) / 100,
        rotateDeg: Math.round(exit[3] * 0.67),
        blurPx: 0,
        brightness: Math.max(1.1, (peak?.brightness ?? 1.18) - 0.2),
        opacity: 0.92,
      },
      exit: {
        offset: 1 as const,
        xPercent: exit[0],
        yPercent: exit[1],
        scale: exit[2],
        rotateDeg: exit[3],
        blurPx: exit[4],
        brightness: 1.05,
        opacity: 0,
      },
      optional: true as const,
    } satisfies OpeningEffectLayer;
  });

  const effect: ArtOpeningEffect = {
    id: `${slug}-layered-opening`,
    canvas: assets.canvas,
    durationMs: config.durationMs,
    plateSrc: assets.plateSrc,
    layers,
    reducedMotion: { durationMs: 180 },
  };
  assertValidArtOpeningEffect(effect);
  return effect;
}

const effectInputs = {
  "dong-ho-folk": [dongHoFolkAssets, {
    durationMs: 1420,
    exits: { "left-chicken": [-88, -28, 3, -9, 8], "right-chicken": [88, -24, 3, 9, 8], "center-lotus": [0, 72, 2.5, 3, 7] },
  }],
  "tho-cam-highland": [thoCamHighlandAssets, {
    durationMs: 1360,
    exits: { "upper-left-embroidery": [-72, -66, 2.7, -7, 7], "lower-right-embroidery": [76, 70, 2.8, 8, 7], stitches: [0, -45, 2.2, 12, 6] },
  }],
  "son-mai-lacquer": [sonMaiLacquerAssets, {
    durationMs: 1480,
    exits: { "left-crane": [-95, -36, 3.2, -12, 10], "right-crane": [96, -34, 3.2, 12, 10], "gold-clouds": [0, -82, 2.5, 0, 9] },
    peaks: { "gold-clouds": { brightness: 1.45 } },
  }],
  "bat-trang-blue": [batTrangBlueAssets, {
    durationMs: 1400,
    exits: { swallows: [0, -96, 3.1, -4, 9], lotus: [-72, 62, 2.7, -8, 8], "cobalt-medallion": [74, 14, 2.4, 8, 7] },
  }],
  "hang-trong-folk": [hangTrongFolkAssets, {
    durationMs: 1500,
    exits: { "left-peacock": [-96, -18, 3.3, -10, 10], "right-peacock": [98, -14, 3.1, 11, 10], peonies: [0, 78, 2.6, 4, 8] },
  }],
  "sen-monoline": [senMonolineAssets, {
    durationMs: 1340,
    exits: { "left-lotus": [-78, 50, 2.7, -8, 7], "right-lotus": [80, -48, 2.7, 8, 7], "leaf-pods": [0, -74, 2.3, 10, 6] },
  }],
  "truc-chi-minimal": [trucChiMinimalAssets, {
    durationMs: 1450,
    exits: { "bamboo-ring": [0, -12, 3, 16, 9], "bamboo-cluster": [-82, 68, 2.8, -10, 8], backlight: [0, 0, 3.6, 0, 14] },
    peaks: { backlight: { brightness: 1.45 } },
  }],
  "long-phung-deco": [longPhungDecoAssets, {
    durationMs: 1500,
    exits: { dragon: [-102, -30, 3.3, -11, 10], phoenix: [102, -28, 3.3, 11, 10], "foil-sun-frame": [0, -70, 2.7, 5, 9] },
    peaks: { "foil-sun-frame": { brightness: 1.45 } },
  }],
  "ao-dai-hue": [aoDaiHueAssets, {
    durationMs: 1380,
    exits: { "blue-silk": [-76, -6, 2.9, -6, 8], "coral-silk": [78, 10, 2.9, 6, 8], embroidery: [0, -72, 2.4, 0, 7] },
  }],
  "art-deco-gatsby": [artDecoGatsbyAssets, {
    durationMs: 1460,
    exits: { "fan-crown": [0, -92, 3, 0, 9], columns: [0, 60, 2.8, 0, 8], corners: [0, 0, 3.4, 14, 10] },
  }],
  "celestial-map": [celestialMapAssets, {
    durationMs: 1440,
    exits: { constellations: [0, -64, 3, 8, 9], moons: [0, 70, 2.8, -8, 8], "center-star": [0, 0, 4, 0, 14] },
  }],
  "coastal-mediterranean": [coastalMediterraneanAssets, {
    durationMs: 1350,
    exits: { vase: [0, 76, 2.8, 5, 8], "upper-olive": [-78, -62, 2.6, -8, 7], "lower-olive": [80, 58, 2.6, 8, 7] },
  }],
  "swiss-brutalist": [swissBrutalistAssets, {
    durationMs: 1300,
    exits: { "upper-black-block": [-100, -28, 2.8, -4, 6], "lower-blocks": [96, 54, 3, 5, 7], "red-axis": [0, -92, 2.4, 0, 5] },
  }],
  "riso-duotone": [risoDuotoneAssets, {
    durationMs: 1370,
    exits: { "coral-ink": [-84, 20, 2.8, -5, 7], "teal-ink": [82, -22, 2.8, 5, 7], "black-ink": [0, 74, 3, 2, 8] },
    peaks: { "coral-ink": { xPercent: -3, yPercent: 1 }, "teal-ink": { xPercent: 3, yPercent: -1 }, "black-ink": { xPercent: 0, yPercent: 2 } },
  }],
  "cinema-credit": [cinemaCreditAssets, {
    durationMs: 1490,
    exits: { couple: [0, -82, 3.3, 0, 11], "seat-rows": [0, 82, 2.9, 0, 9], "projector-light": [0, -40, 3.8, 0, 15] },
    peaks: { "projector-light": { brightness: 1.45 } },
    origins: { couple: "50% 100%", "seat-rows": "50% 100%", "projector-light": "50% 50%" },
  }],
  "aurora-glass-dark": [auroraGlassDarkAssets, {
    durationMs: 1410,
    exits: { "left-ribbon": [-96, -24, 3.1, -12, 11], "right-ribbon": [98, 26, 3.1, 12, 11], flare: [0, 0, 4.2, 0, 16] },
    peaks: { flare: { brightness: 1.45 } },
  }],
  "y2k-chrome": [y2kChromeAssets, {
    durationMs: 1390,
    exits: { "left-chrome": [-94, -18, 3.2, -13, 10], "right-chrome": [96, 28, 3.2, 13, 10], highlights: [0, -54, 3.5, 0, 14] },
    peaks: { highlights: { brightness: 1.45 } },
  }],
  "botanical-lavender": [botanicalLavenderAssets, {
    durationMs: 1430,
    exits: { lavender: [-84, -46, 2.9, -9, 8], "mustard-pods": [86, 48, 2.9, 9, 8], stems: [0, 78, 2.5, 6, 7] },
  }],
  "rap-hy-sai-gon": [rapHySaiGonAssets, {
    durationMs: 1480,
    startOpacity: 0.04,
    exits: { "left-curtain": [-106, -12, 3.2, -12, 10], "right-curtain": [106, -12, 3.2, 12, 10], "song-hy-marquee": [0, -88, 3.7, 0, 14] },
    peaks: { "left-curtain": { xPercent: -4, yPercent: 0 }, "right-curtain": { xPercent: 4, yPercent: 0 }, "song-hy-marquee": { brightness: 1.45 } },
    origins: { "left-curtain": "100% 50%", "right-curtain": "0% 50%", "song-hy-marquee": "50% 50%" },
  }],
  "trong-dong-dong-son": [trongDongDongSonAssets, {
    durationMs: 1470,
    exits: { "spiral-bands": [0, 0, 3.2, 22, 9], "lac-birds": [0, -86, 3, -14, 9], "sun-star": [0, 0, 4, 0, 14] },
    peaks: { "sun-star": { brightness: 1.45 } },
    origins: { "spiral-bands": "50% 50%", "lac-birds": "50% 50%", "sun-star": "50% 50%" },
  }],
  "chim-lac-ivory": [chimLacIvoryAssets, {
    durationMs: 1320,
    exits: { "bird-flock": [92, -70, 2.9, 10, 8], "drum-profile": [0, 80, 2.6, -4, 7], "frieze-bands": [0, 0, 3.1, 6, 8] },
    peaks: { "bird-flock": { xPercent: 4, yPercent: -3 } },
    origins: { "bird-flock": "50% 50%", "drum-profile": "50% 100%", "frieze-bands": "50% 50%" },
  }],
  "ivory-signature": [ivorySignatureAssets, {
    durationMs: 1420,
    exits: { "navy-liner": [0, -84, 2.7, -3, 8], "ivory-card": [0, -104, 3.1, 0, 8], "olive-pocket": [0, 82, 2.8, 4, 8], "champagne-seal": [0, 0, 3.8, -8, 12] },
    peaks: { "ivory-card": { yPercent: -8 }, "champagne-seal": { brightness: 1.4 } },
    origins: { "navy-liner": "50% 0%", "ivory-card": "50% 100%", "olive-pocket": "50% 100%", "champagne-seal": "50% 50%" },
  }],
} as const;

export type ArtOpeningEffectSlug = keyof typeof effectInputs;

export const artOpeningEffects = Object.fromEntries(
  Object.entries(effectInputs).map(([slug, [assets, config]]) => [
    slug,
    createArtOpeningEffect(slug, asAssetManifest(assets), config),
  ]),
) as Record<ArtOpeningEffectSlug, ArtOpeningEffect>;
