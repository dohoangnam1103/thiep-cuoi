import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import {
  completedTemplateSlugs,
  hiddenTemplateSlugs,
  templateCategories,
  templateColors,
  templates,
} from "@/data/chungdoi";
import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";
import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";
import { heroImageCount } from "@/data/editor-template-capabilities";
import { vietnameseTemplateSlugs } from "@/data/template-route-slugs";
import { AUDITED_TEMPLATE_SLUGS } from "@/lib/audited-template-renderers";
import { ZODIAC_IDS, zodiacArtworkPath } from "@/lib/zodiac";
import {
  generatedListingMessages,
  generatedTemplateManifests,
  generatedTemplateSlugs,
} from "./generated-data";
import {
  TEMPLATE_MANIFEST_LOCALES,
  type TemplateManifest,
} from "./template-manifest";

const NEW_ART_TEMPLATE_SLUGS = [
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
  "cong-la-dua-mien-tay",
] as const;

const NEW_ART_TEMPLATE_HERO_COUNTS: Record<(typeof NEW_ART_TEMPLATE_SLUGS)[number], 1 | 2> = {
  "dong-ho-folk": 2,
  "tho-cam-highland": 1,
  "son-mai-lacquer": 1,
  "bat-trang-blue": 2,
  "hang-trong-folk": 2,
  "sen-monoline": 2,
  "truc-chi-minimal": 2,
  "long-phung-deco": 2,
  "ao-dai-hue": 1,
  "art-deco-gatsby": 2,
  "celestial-map": 1,
  "coastal-mediterranean": 1,
  "swiss-brutalist": 2,
  "riso-duotone": 2,
  "cinema-credit": 1,
  "aurora-glass-dark": 1,
  "y2k-chrome": 1,
  "botanical-lavender": 2,
  "rap-hy-sai-gon": 1,
  "trong-dong-dong-son": 2,
  "chim-lac-ivory": 1,
  "ivory-signature": 1,
  "hai-yen-thanh-thu": 1,
  "phong-thu-be": 1,
  "phong-thu-luc-pastel": 1,
  "phong-thu-do-pastel": 1,
  "phong-thu-lam-pastel": 1,
  "phong-thu-hong-pastel": 1,
  "hoa-thu-do-ruou-vang": 1,
  "hoa-thu-xanh-la": 1,
  "hoa-thu-hong": 1,
  "hoa-thu-xanh-duong": 1,
  "thanh-duong-anh-sang": 1,
  "cong-la-dua-mien-tay": 2,
};

const NEW_ART_TEMPLATE_FONTS = {
  "dong-ho-folk": ["UNI Chu truyen thong", "font-art-uni"],
  "tho-cam-highland": ["SVN-HC Haydon Brush", "font-art-haydon"],
  "son-mai-lacquer": ["DFVN New Eddy", "font-art-new-eddy"],
  "bat-trang-blue": ["Fz Qellia", "font-art-qellia"],
  "hang-trong-folk": ["Pattaya", "font-art-pattaya"],
  "sen-monoline": ["1FTV VIP Signora", "font-art-signora"],
  "truc-chi-minimal": ["Lora", "font-art-lora"],
  "long-phung-deco": ["Fz Aghita", "font-art-aghita"],
  "ao-dai-hue": ["The Nautigal", "font-art-nautigal"],
  "art-deco-gatsby": ["SVN-HC Built Titling", "font-art-built"],
  "celestial-map": ["Alex Brush", "font-art-alex"],
  "coastal-mediterranean": ["SVN-HC Pacifico", "font-art-pacifico"],
  "swiss-brutalist": ["HelveticaNeue", "font-art-helvetica"],
  "riso-duotone": ["SVN-HC Marvin Visions", "font-art-marvin"],
  "cinema-credit": ["Lora", "font-art-lora"],
  "aurora-glass-dark": ["Alex Brush", "font-art-alex"],
  "y2k-chrome": ["SVN-HC Marvin Visions", "font-art-marvin"],
  "botanical-lavender": ["1FTV VIP Signora", "font-art-signora"],
  "rap-hy-sai-gon": ["SVN-HC Marvin Visions", "font-art-marvin"],
  "trong-dong-dong-son": ["UNI Chu truyen thong", "font-art-uni"],
  "chim-lac-ivory": ["Fz Qellia", "font-art-qellia"],
  "ivory-signature": ["1FTV VIP Signora", "font-art-signora"],
  "hai-yen-thanh-thu": ["Alex Brush", "font-art-alex"],
  "phong-thu-be": ["The Nautigal", "font-art-nautigal"],
  "phong-thu-luc-pastel": ["Lora", "font-art-lora"],
  "phong-thu-do-pastel": ["1FTV VIP Signora", "font-art-signora"],
  "phong-thu-lam-pastel": ["Alex Brush", "font-art-alex"],
  "phong-thu-hong-pastel": ["Fz Aghita", "font-art-aghita"],
  "hoa-thu-do-ruou-vang": ["Fz Qellia", "font-art-qellia"],
  "hoa-thu-xanh-la": ["Fz Qellia", "font-art-qellia"],
  "hoa-thu-hong": ["Fz Qellia", "font-art-qellia"],
  "hoa-thu-xanh-duong": ["Fz Qellia", "font-art-qellia"],
  "thanh-duong-anh-sang": ["Fz Qellia", "font-art-qellia"],
  "cong-la-dua-mien-tay": ["1FTV VIP Signora", "font-art-signora"],
} as const satisfies Record<(typeof NEW_ART_TEMPLATE_SLUGS)[number], readonly [string, string]>;

const ZODIAC_TEMPLATE_SLUG = "thap-nhi-chi-do";
const ZODIAC_ARTWORK_IDS = [...ZODIAC_IDS, "phuong"] as const;
const ZODIAC_ARTWORK_ASSETS = ZODIAC_ARTWORK_IDS.flatMap((id) => [
  zodiacArtworkPath(id),
  zodiacArtworkPath(id, "line"),
]);
const ZODIAC_SHARED_ASSETS = [
  "/chungdoi/images/themes/songphung-red/NENGIAY.jpg",
  "/chungdoi/images/themes/songphung-red/HOA.webp",
  "/chungdoi/images/themes/songphung-red/CHU HY.webp",
  "/chungdoi/images/themes/_decor/songphung-red/HOA.webp",
  "/chungdoi/music/double-phoenix-red.mp3",
] as const;

async function loadZodiacTemplateManifest(): Promise<TemplateManifest> {
  const manifestPath = path.join(
    process.cwd(),
    "src",
    "data",
    "templates",
    `${ZODIAC_TEMPLATE_SLUG}.manifest.ts`,
  );
  assert.equal(existsSync(manifestPath), true, `${ZODIAC_TEMPLATE_SLUG}: manifest`);
  const loaded = (await import(pathToFileURL(manifestPath).href)) as {
    manifest?: TemplateManifest;
  };
  assert.ok(loaded.manifest, `${ZODIAC_TEMPLATE_SLUG}: manifest export`);
  return loaded.manifest;
}

test("thap-nhi-chi-do manifest preserves the Phoenix envelope with dynamic zodiac artwork", async () => {
  const manifest = await loadZodiacTemplateManifest();

  assert.equal(manifest.slug, ZODIAC_TEMPLATE_SLUG);
  assert.equal(manifest.viRouteSlug, ZODIAC_TEMPLATE_SLUG);
  assert.equal(manifest.rendererExport, "ThapNhiChiInvitation");
  assert.equal(manifest.heroImageCount, 0);
  assert.equal(manifest.catalog.category, "Vietnamese Zodiac");
  assert.equal(manifest.catalog.color, "Lacquer Red");
  assert.equal(manifest.catalog.isNew, true);
  assert.equal(new Set<string>(NEW_ART_TEMPLATE_SLUGS).has(manifest.slug), false);
  assert.deepEqual(Object.keys(manifest.i18n).sort(), [...TEMPLATE_MANIFEST_LOCALES].sort());
  for (const locale of TEMPLATE_MANIFEST_LOCALES) {
    assert.ok(manifest.i18n[locale].name, `${locale}: name`);
    assert.ok(manifest.i18n[locale].description, `${locale}: description`);
  }

  assert.deepEqual(manifest.theme.decorations.cardImages, [
    {
      src: "{{brideZodiac}}",
      className:
        "w-[112px] md:w-[170px] top-[8px] left-[8px] md:top-[20px] md:left-[20px] opacity-90 rotate-3",
      flyOnOpen: true,
    },
    {
      src: "{{groomZodiac}}",
      className:
        "w-[112px] md:w-[170px] bottom-[8px] right-[8px] md:bottom-[20px] md:right-[20px] opacity-90 -scale-x-100 -rotate-3",
      flyOnOpen: true,
    },
    {
      src: "/chungdoi/images/themes/_decor/songphung-red/HOA.webp",
      className:
        "w-[120px] md:w-[160px] -bottom-[20px] -left-[20px] md:-bottom-[30px] md:-left-[30px] opacity-60",
      flyOnOpen: false,
    },
    {
      src: "/chungdoi/images/themes/_decor/songphung-red/HOA.webp",
      className:
        "w-[100px] md:w-[140px] -top-[15px] -right-[15px] md:-top-[20px] md:-right-[20px] opacity-60 rotate-180",
      flyOnOpen: false,
    },
  ]);

  const declaredZodiacAssets = manifest.assets.filter((asset) =>
    asset.startsWith("/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-"),
  );
  assert.equal(declaredZodiacAssets.length, 26);
  assert.deepEqual(declaredZodiacAssets, ZODIAC_ARTWORK_ASSETS);
  assert.deepEqual(manifest.assets, [
    ...ZODIAC_ARTWORK_ASSETS,
    ...ZODIAC_SHARED_ASSETS,
  ]);
  assert.equal(manifest.demoContent.couple.brideZodiac, "meo");
  assert.equal(manifest.demoContent.couple.groomZodiac, "rong");
});

test("thap-nhi-chi-do has dimensioned alpha masks and all three captured previews", async () => {
  await loadZodiacTemplateManifest();

  for (const asset of ZODIAC_ARTWORK_ASSETS) {
    const absolutePath = path.join(process.cwd(), "public", asset.slice(1));
    assert.equal(existsSync(absolutePath), true, `${asset}: exists`);
    const metadata = await sharp(absolutePath).metadata();
    const isLine = asset.endsWith("-line.webp");
    assert.equal(metadata.width, isLine ? 1966 : 1952, `${asset}: width`);
    assert.equal(metadata.height, isLine ? 4119 : 4105, `${asset}: height`);
    assert.equal(metadata.hasAlpha, true, `${asset}: alpha`);
  }

  const previewStem = ZODIAC_TEMPLATE_SLUG.replaceAll("-", "_");
  for (const [kind, minimumBytes] of [
    ["listing", 20_000],
    ["portrait", 10_000],
    ["landscape", 10_000],
  ] as const) {
    const previewPath = path.join(
      process.cwd(),
      "public",
      "chungdoi",
      "images",
      "template-previews",
      "en",
      kind,
      `${previewStem}.webp`,
    );
    assert.equal(existsSync(previewPath), true, `${kind}: preview`);
    assert.ok(statSync(previewPath).size >= minimumBytes, `${kind}: preview size`);
  }
});

test("generated template manifests are wired through every public data registry", () => {
  const catalogSlugs = new Set(templates.map((template) => template.slug));
  const routeSlugs = new Set(vietnameseTemplateSlugs.map(([slug]) => slug));
  const auditedSlugs = new Set<string>(AUDITED_TEMPLATE_SLUGS);

  assert.ok(generatedTemplateManifests.length >= 22);
  assert.equal(new Set(generatedTemplateSlugs).size, generatedTemplateSlugs.length);

  for (const manifest of generatedTemplateManifests) {
    assert.equal(catalogSlugs.has(manifest.slug), true, `${manifest.slug}: catalog`);
    assert.equal(
      completedTemplateSlugs.has(manifest.slug),
      !hiddenTemplateSlugs.has(manifest.slug),
      `${manifest.slug}: completed unless hidden`,
    );
    assert.equal(routeSlugs.has(manifest.slug), true, `${manifest.slug}: route`);
    assert.equal(auditedSlugs.has(manifest.slug), true, `${manifest.slug}: renderer`);
    assert.equal(chungdoiDemoContent[manifest.slug]?.slug, manifest.slug, `${manifest.slug}: demo`);
    assert.ok(chungdoiThemeConfig[manifest.slug], `${manifest.slug}: theme`);

    for (const locale of TEMPLATE_MANIFEST_LOCALES) {
      assert.ok(generatedListingMessages[locale][manifest.slug].name);
      assert.ok(generatedListingMessages[locale][manifest.slug].description);
    }

    for (const asset of manifest.assets) {
      assert.equal(
        existsSync(path.join(process.cwd(), "public", asset.slice(1))),
        true,
        `${manifest.slug}: ${asset}`,
      );
    }
  }
});

test("new art templates have localized renderers and captured preview variants", () => {
  const catalogBySlug = new Map(templates.map((template) => [template.slug, template]));

  for (const slug of NEW_ART_TEMPLATE_SLUGS) {
    assert.equal(heroImageCount(slug), NEW_ART_TEMPLATE_HERO_COUNTS[slug], `${slug}: hero uploads`);
    const rendererPath = path.join(
      process.cwd(),
      "src",
      "components",
      `chungdoi-tpl-${slug}.tsx`,
    );
    const rendererSource = readFileSync(rendererPath, "utf8");
    assert.match(rendererSource, /useTranslations\("invitationTemplate"\)/, `${slug}: i18n`);
    assert.doesNotMatch(rendererSource, /style=\{/, `${slug}: inline style`);
    const [fontFamily, displayFontClass] = NEW_ART_TEMPLATE_FONTS[slug];
    assert.equal(chungdoiDemoContent[slug]?.theme.fontFamily, fontFamily, `${slug}: font family`);
    assert.match(rendererSource, new RegExp(`displayFontClass: "${displayFontClass}"`));
    assert.doesNotMatch(rendererSource, /(?:coupleClass|headingClass): "[^"]*font-(?:sans|serif)/);

    const template = catalogBySlug.get(slug);
    assert.ok(template, `${slug}: catalog entry`);
    for (const [kind, minimumBytes] of [
      ["listing", 20_000],
      ["portrait", 10_000],
      ["landscape", 10_000],
    ] as const) {
      const previewPath = template[kind];
      const absolutePreviewPath = path.join(process.cwd(), "public", previewPath.slice(1));
      assert.ok(existsSync(absolutePreviewPath), `${slug}: ${kind} preview`);
      assert.ok(statSync(absolutePreviewPath).size >= minimumBytes, `${slug}: ${kind} size`);
    }
  }

  const sharedRendererSource = readFileSync(
    path.join(process.cwd(), "src", "components", "chungdoi-tpl-art-invitation.tsx"),
    "utf8",
  );
  assert.match(sharedRendererSource, /data-invitation-column="true"/);
  assert.match(sharedRendererSource, /max-w-\[900px\]/);
  assert.match(sharedRendererSource, /max-w-\[760px\]/);
  assert.doesNotMatch(sharedRendererSource, /(?:sm|md|lg|xl):grid-cols/);
  assert.match(sharedRendererSource, /relative z-40 min-h-\[100dvh\]/);
  assert.match(sharedRendererSource, /data-artwork-hero="true"/);
  assert.match(
    sharedRendererSource,
    /min-h-\[clamp\(760px,100svh,1080px\)\]/,
  );
  assert.doesNotMatch(
    sharedRendererSource,
    /h-\[(?:150|180|220|260)px\]/,
    "the shared hero must not regress to a shallow artwork strip",
  );
  assert.match(sharedRendererSource, /invitation-parallax-motif/);
  assert.match(sharedRendererSource, /data-parallax="artwork"/);
  assert.match(sharedRendererSource, /pointer-events-none fixed/);
  assert.match(sharedRendererSource, /max-w-\[760px\].*text-center/);
  assert.match(sharedRendererSource, /SharedWishForm accent=\{config\.accentHex\} centered/);
  assert.doesNotMatch(sharedRendererSource, /text-left/);
  assert.doesNotMatch(sharedRendererSource, /space-y-5 px-4 pb-8", config\.surfaceClass/);
  assert.doesNotMatch(sharedRendererSource, /px-6 py-10 text-center sm:px-9 sm:py-12", config\.surfaceClass/);
  assert.match(sharedRendererSource, /function contentRadiusClass\(\)/);
  assert.match(sharedRendererSource, /return "rounded-\[1\.5rem\]"/);
  assert.doesNotMatch(sharedRendererSource, /contentRadiusClass\(config\)/);
  assert.doesNotMatch(
    sharedRendererSource,
    /config\.radiusClass === "rounded-(?:none|\[2px\]|\[3px\])"/,
  );
  assert.match(sharedRendererSource, /AlbumGallery[\s\S]*radiusClass=\{contentRadiusClass\(\)\}/);
  assert.match(sharedRendererSource, /GiftQrGrid[\s\S]*radiusClass=\{contentRadiusClass\(\)\}/);
  assert.match(sharedRendererSource, /displayFontClass: string/);
  assert.match(sharedRendererSource, /resolveArtDisplayFontClass/);
  assert.match(sharedRendererSource, /config\.displayFontClass/);
  assert.ok(
    [...sharedRendererSource.matchAll(/contentRadiusClass\(\)/g)].length >= 8,
    "large content surfaces must use the shared 24px radius",
  );

  const sharedComponentsSource = readFileSync(
    path.join(process.cwd(), "src", "components", "chungdoi-tpl-shared.tsx"),
    "utf8",
  );
  assert.match(sharedComponentsSource, /radiusClass = "rounded-xl"/);
  assert.match(sharedComponentsSource, /cn\("size-32 bg-white/);

  const globalStyles = readFileSync(
    path.join(process.cwd(), "src", "app", "globals.css"),
    "utf8",
  );
  for (const className of [
    "font-art-uni", "font-art-haydon", "font-art-new-eddy", "font-art-qellia",
    "font-art-pattaya", "font-art-signora", "font-art-lora", "font-art-aghita",
    "font-art-nautigal", "font-art-built", "font-art-alex", "font-art-pacifico",
    "font-art-helvetica", "font-art-marvin",
  ]) {
    assert.match(globalStyles, new RegExp(`\\.${className}\\s*\\{`));
  }
  assert.match(globalStyles, /invitation-parallax-drift/);
  assert.match(globalStyles, /\.invitation-hero-artwork\s*\{/);
  assert.match(globalStyles, /opacity:\s*0\.32/);
  assert.match(globalStyles, /mask-image:\s*linear-gradient/);
  assert.match(globalStyles, /#000 42%/);
  assert.match(globalStyles, /transparent 88%/);
  assert.match(globalStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("demo invitations leave music empty so the shared default track is used", () => {
  for (const [slug, content] of Object.entries(chungdoiDemoContent)) {
    assert.equal(content.music, null, `${slug}: demo music must use the shared default`);
  }
});

test("every catalog category and color has a Vietnamese listing label", () => {
  const messages = JSON.parse(
    readFileSync(path.join(process.cwd(), "messages", "vi.json"), "utf8"),
  ) as { listing: { categories: Record<string, string>; colors: Record<string, string> } };

  for (const category of templateCategories) {
    assert.ok(messages.listing.categories[category], `listing.categories.${category} thiếu bản dịch`);
  }
  for (const color of templateColors) {
    assert.ok(messages.listing.colors[color], `listing.colors.${color} thiếu bản dịch`);
  }
});
