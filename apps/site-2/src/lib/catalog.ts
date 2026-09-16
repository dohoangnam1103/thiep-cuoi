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
import listingThumbnails from "../data/listing-thumbnails.json";

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

export function getTemplateMeta(slug: string): ChungDoiTemplate | null {
  return (
    getCatalogTemplates().find((template) => template.slug === slug) ?? null
  );
}

/* Vietnamese labels for the shared catalog categories. Categories come from
 * shared invitation-data (English); presentation on site 2 is Vietnamese.
 * Unknown values fall back to the raw category. */
const CATEGORY_VI: Record<string, string> = {
  Traditional: "Truyền thống",
  Floral: "Hoa văn",
  Modern: "Hiện đại",
  Royal: "Cung đình",
  Signature: "Signature",
  Botanical: "Thảo mộc",
  "Vietnamese Heritage": "Di sản Việt",
  Destination: "Điểm đến",
  Minimal: "Tối giản",
  Playful: "Vui nhộn",
};

export function categoryLabel(category: string): string {
  return CATEGORY_VI[category] ?? category;
}

type TemplateListingI18n = {
  i18n?: { vi?: { name?: string; description?: string } };
};

/* Generated manifests ship Vietnamese listing copy in i18n.vi; the shared
 * ChungDoiTemplate type does not expose it, so read it defensively. */
function listingViMeta(
  template: ChungDoiTemplate,
): { name?: string; description?: string } {
  return (template as TemplateListingI18n).i18n?.vi ?? {};
}

export type Site2ListingItem = {
  slug: string;
  name: string;
  descriptionVi: string | null;
  category: string;
  categoryVi: string;
  listing: string;
  portrait: string;
};

/** Listing card data with Vietnamese name, description and category label. */
export function toListingItem(template: ChungDoiTemplate): Site2ListingItem {
  const vi = listingViMeta(template);
  return {
    slug: template.slug,
    name: sanitizeListingText(vi.name ?? template.name),
    descriptionVi: vi.description ?? null,
    category: template.category,
    categoryVi: categoryLabel(template.category),
    listing: template.listing,
    portrait: template.portrait,
  };
}

/* The shared catalog predates the Vietnamese presentation layer: a stray
 * 囍 seal character still ships in some source strings. Presentation on
 * site 2 strips it so the character never leaks into Vietnamese copy.
 * Site-1 rendering is untouched. */
export function sanitizeListingText(value: string): string {
  return value.replace(/囍/g, "").replace(/\s{2,}/g, " ").trim();
}

/* The prepared listing thumbnails only cover sources with real local
 * artwork. Homepage surfaces (hero cover, curated mosaic) prefer those so a
 * missing preview file never renders a broken frame. */
export function hasListingThumbnail(listing: string): boolean {
  return Object.hasOwn(
    listingThumbnails as Record<string, unknown>,
    listing,
  );
}

/** Accept a source slug or a Vietnamese route alias, return the source slug. */
export function resolveCatalogSlug(input: string): string | null {  if (isTemplateAvailable("site-2", input)) return input;
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

import { toDemoContent } from "@chungdoi/invitation-core/demo-shell/to-demo-content";

/**
 * Demo content mirrors master: prefer the curated DB demo invitation
 * (`isDemo`), fall back to the static seed. Same data, same opening
 * choreography on both sites.
 */
export async function getDemoContent(
  slug: string,
): Promise<ChungDoiDemoContent> {
  try {
    const invitation = await prisma.invitation.findFirst({
      where: { isDemo: true, templateId: slug },
      include: {
        content: true,
        ceremonies: true,
        schedule: true,
        gallery: true,
        wishes: true,
      },
    });
    if (invitation) return toDemoContent(invitation);
  } catch {
    // Runtime database unavailable (e.g. build prerender) → static fallback.
  }
  return getDemoSeed(slug);
}

export function getDemoSeed(slug: string): ChungDoiDemoContent {
  const seed = (chungdoiDemoContent as Record<string, ChungDoiDemoContent>)[
    slug
  ];
  if (!seed) return { ...FALLBACK_DEMO, slug };
  return seed;
}
