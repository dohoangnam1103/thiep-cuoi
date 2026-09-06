import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

import {
  createTemplateDemoContent,
  defineTemplateManifest,
  type TemplateManifest,
} from "./template-manifest";

type PorcelainManifestInput = {
  slug: string;
  viRouteSlug: string;
  rendererExport: string;
  name: string;
  title: string;
  description: string;
  color: string;
  highlights: string[];
  layout: "classic" | "v2";
  primary: string;
  secondary: string;
  paper: string;
  buttonBg?: string;
  galleryCount: number;
  galleryExtension: "jpg" | "webp";
  themeFiles: readonly string[];
  fontFamily: string;
  fontAssets: readonly string[];
  music?: string;
  couple: ChungDoiDemoContent["couple"];
  families: ChungDoiDemoContent["families"];
  venue: ChungDoiDemoContent["venue"];
  schedule: ChungDoiDemoContent["schedule"];
  dressCodeColors: string;
  wishes: ChungDoiDemoContent["wishes"];
  bank: ChungDoiDemoContent["bank"];
};

export function createPorcelainTemplateManifest({
  slug,
  viRouteSlug,
  rendererExport,
  name,
  title,
  description,
  color,
  highlights,
  layout,
  primary,
  secondary,
  paper,
  buttonBg = primary,
  galleryCount,
  galleryExtension,
  themeFiles,
  fontFamily,
  fontAssets,
  music = "/chungdoi/music/a-thousand-years.mp3",
  couple,
  families,
  venue,
  schedule,
  dressCodeColors,
  wishes,
  bank,
}: PorcelainManifestInput): TemplateManifest {
  const themeRoot = `/chungdoi/images/themes/${slug}`;
  const themeAssets = themeFiles.map((file) => `${themeRoot}/${file}`);
  const gallery = Array.from(
    { length: galleryCount },
    (_, index) => `/chungdoi/images/gallery/${slug}/${String(index + 1).padStart(2, "0")}.${galleryExtension}`,
  );
  const giftAsset = `/chungdoi/images/envelope/${slug.replaceAll("-", "_")}.webp`;
  const base = createTemplateDemoContent({
    slug,
    primaryColor: primary,
    fontFamily,
    music,
    galleryCount: 0,
    groomFullName: couple.groomFullName,
    groomShortName: couple.groomShortName,
    brideFullName: couple.brideFullName,
    brideShortName: couple.brideShortName,
    date: couple.date,
    time: couple.time,
  });

  return defineTemplateManifest({
    slug,
    viRouteSlug,
    rendererExport,
    ceremonyRendering: "inline-all",
    heroImageCount: 0,
    catalog: {
      name,
      title,
      description,
      category: "Traditional",
      color,
      isNew: true,
      highlights,
    },
    theme: {
      theme: {
        background: `linear-gradient(to right, transparent calc(50% - 451px), ${primary} calc(50% - 451px), ${primary} calc(50% - 449px), transparent calc(50% - 449px), transparent calc(50% + 449px), ${primary} calc(50% + 449px), ${primary} calc(50% + 451px), transparent calc(50% + 451px)), linear-gradient(to right, ${paper} calc(50% - 450px), transparent calc(50% - 450px), transparent calc(50% + 450px), ${paper} calc(50% + 450px)), url("${themeRoot}/floral-tile.webp") 0 0 / 450px auto repeat, ${paper}`,
        cardBg: paper,
        textPrimary: primary,
        textSecondary: secondary,
        accent: primary,
        dividerFrom: "transparent",
        dividerTo: primary,
        buttonBg,
        buttonText: paper,
        guestBoxBg: "transparent",
        guestBoxBorder: `${primary}33`,
        particleColors: [primary, secondary, paper],
        particleType: "flowers",
      },
      fonts: {
        couple: layout === "v2" ? '"Alex Brush", "Viaoda Libre", cursive' : '"Viaoda Libre", "Times New Roman", serif',
        ampersand: layout === "v2" ? '"Alex Brush", "Times New Roman", cursive' : '"Viaoda Libre", "Times New Roman", serif',
      },
      sealType: "heart",
      decorations: { cardImages: [] },
    },
    demoContent: {
      ...base,
      theme: {
        ...base.theme,
        assetFolder: slug,
        assets: themeAssets,
      },
      couple,
      families,
      venue,
      schedule,
      portraits: {
        groom: gallery[0] ?? "",
        bride: gallery[1] ?? gallery[0] ?? "",
      },
      gallery,
      heroImage: gallery[0],
      heroImage2: gallery[1],
      showHeroImage: false,
      albumLayout: layout === "v2" ? "coverflow" : "grid",
      dressCodeColors,
      wishes,
      bank,
    },
    i18n: {
      vi: { name, description },
    },
    assets: [
      ...themeAssets,
      ...gallery,
      giftAsset,
      ...fontAssets,
    ],
  });
}
