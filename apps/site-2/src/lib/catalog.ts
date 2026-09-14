import {
  completedTemplates,
  retiredTemplateSlugs,
  type ChungDoiTemplate,
} from "@chungdoi/invitation-data/catalog";
import { generatedTemplates } from "@chungdoi/invitation-data/generated";
import { getSourceTemplateSlug } from "@chungdoi/invitation-data/route-slugs";
import {
  chungdoiDemoContent,
  type ChungDoiDemoContent,
} from "@chungdoi/invitation-data/demo-content";
import { isTemplateAvailable } from "@chungdoi/invitation-data";

import { prisma } from "./prisma";

export type { ChungDoiTemplate };

/** Full site-2 catalog: every template with a shared renderer, minus retired. */
export function getCatalogTemplates(): ChungDoiTemplate[] {
  const seen = new Set<string>();
  const out: ChungDoiTemplate[] = [];
  for (const template of [...completedTemplates, ...generatedTemplates]) {
    if (retiredTemplateSlugs.has(template.slug) || seen.has(template.slug)) {
      continue;
    }
    seen.add(template.slug);
    out.push(template);
  }
  return out;
}

export async function getVisibleCatalogTemplates(): Promise<ChungDoiTemplate[]> {
  const catalog = getCatalogTemplates();
  let hidden = new Set<string>();
  try {
    const rows = await prisma.templateVisibility.findMany({
      select: { slug: true, isVisible: true },
    });
    hidden = new Set(
      rows.filter((row) => row.isVisible === false).map((row) => row.slug),
    );
  } catch {
    hidden = new Set();
  }
  return catalog.filter((template) => !hidden.has(template.slug));
}

/** Accept a source slug or a Vietnamese route alias, return the source slug. */
export function resolveCatalogSlug(input: string): string | null {
  if (isTemplateAvailable("site-2", input)) return input;
  const source = getSourceTemplateSlug(input);
  if (source && isTemplateAvailable("site-2", source)) return source;
  return null;
}

const FALLBACK_DEMO: ChungDoiDemoContent = {
  slug: "fallback",
  invitationId: "site2-fallback-demo",
  theme: {
    primaryColor: "#9a6a42",
    userFontFamily: null,
    fontFamily: null,
    assetFolder: null,
    assets: [],
  },
  couple: {
    brideFullName: "Nguyễn Mai Lan",
    groomFullName: "Trần Đức Minh",
    brideShortName: "Mai Lan",
    groomShortName: "Đức Minh",
    brideFirst: true,
    date: "2026-11-22",
    time: "10:30",
    ceremonyDate: "2026-11-22",
    ceremonyTime: "09:00",
    ceremonyHeader: "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA",
    openingMessage: "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI.",
  },
  families: {
    brideFather: "Nguyễn Văn An",
    brideMother: "Phạm Thị Hoa",
    brideAddress: "Hà Nội",
    groomFather: "Trần Văn Bình",
    groomMother: "Lê Thị Cúc",
    groomAddress: "Hồ Chí Minh",
    brideParentTitle: "Ông Bà",
    groomParentTitle: "Ông Bà",
  },
  venue: {
    address: "Trung tâm tiệc cưới, Hà Nội",
    mapAddress: "",
    banquetTime: "11:00",
  },
  schedule: [
    { time: "09:00", label: "Lễ thành hôn" },
    { time: "11:00", label: "Tiệc cưới" },
  ],
  gallery: [],
  wishes: [],
  bank: {
    brideBankName: "",
    brideAccountNumber: "",
    brideAccountName: "",
    groomBankName: "",
    groomAccountNumber: "",
    groomAccountName: "",
  },
  music: null,
};

export function getDemoSeed(slug: string): ChungDoiDemoContent {
  const seed = (chungdoiDemoContent as Record<string, ChungDoiDemoContent>)[
    slug
  ];
  if (!seed) return { ...FALLBACK_DEMO, slug };
  return seed;
}
