import { completedTemplates, retiredTemplateSlugs, templates, type ChungDoiTemplate } from "@/data/chungdoi";

export type TemplateSeoDetailContent = {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  intro: string;
  highlights: string[];
  suitableFor: string[];
  features: string[];
  steps: string[];
  faq: Array<{ question: string; answer: string }>;
  imageAlt: string;
  relatedSlugs: string[];
  relatedBlogSlugs: string[];
};

export const templateSeoDetailPilotSlugs = [
  "song-hy-red",
  "minimalism-red",
  "minimalism-dark-red",
  "hoa-mai-thuy-mac",
  "hong-van-rose",
] as const;

export type TemplateSeoDetailStatus = "enabled" | "not-enabled" | "retired" | "unknown";

/** All completed, non-retired templates have a generated detail contract. */
export const templateSeoDetailEnabledSlugs = completedTemplates
  .filter((template) => !retiredTemplateSlugs.has(template.slug))
  .map((template) => template.slug);

export function templateSeoDetailStatus(
  sourceSlug: string,
  pilotSlugs: readonly string[] = templateSeoDetailPilotSlugs,
): TemplateSeoDetailStatus {
  if (retiredTemplateSlugs.has(sourceSlug)) return "retired";
  if (!templates.some((template) => template.slug === sourceSlug)) return "unknown";
  if (!completedTemplates.some((template) => template.slug === sourceSlug)) return "not-enabled";
  const enabledSlugs = pilotSlugs === templateSeoDetailPilotSlugs
    ? templateSeoDetailEnabledSlugs
    : pilotSlugs;
  return enabledSlugs.includes(sourceSlug) ? "enabled" : "not-enabled";
}

export function templateSeoDetailKey(template: ChungDoiTemplate): string {
  return `items.${template.slug}`;
}

export function assertRelatedTemplateSlugs(
  sourceSlug: string,
  relatedSlugs: readonly string[],
): void {
  const known = new Set(
    completedTemplates
      .filter((template) => !retiredTemplateSlugs.has(template.slug))
      .map((template) => template.slug),
  );
  if (relatedSlugs.includes(sourceSlug)) {
    throw new Error(`Template ${sourceSlug} cannot relate to itself`);
  }
  for (const slug of relatedSlugs) {
    if (!known.has(slug)) throw new Error(`Unknown related template slug: ${slug}`);
  }
}


/** Shared by server rendering and the catalog gate; invalid content never falls back. */
export function assertTemplateSeoDetailContent(
  sourceSlug: string,
  value: unknown,
): asserts value is TemplateSeoDetailContent {
  function fail(key: string): never {
    throw new Error(`Missing or invalid templateSeoDetails.items.${sourceSlug}.${key}`);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("content");
  const content = value as Record<string, unknown>;
  const isText = (item: unknown): item is string => typeof item === "string" && item.trim().length > 0;
  for (const key of ["metaTitle", "metaDescription", "heading", "intro", "imageAlt"]) {
    if (!isText(content[key])) fail(key);
  }
  for (const key of ["highlights", "suitableFor", "features", "steps", "relatedSlugs", "relatedBlogSlugs"]) {
    const items = content[key];
    if (!Array.isArray(items) || !items.every(isText)) fail(key);
    if (key !== "relatedBlogSlugs" && items.length === 0) fail(key);
    if (key === "steps" && items.length !== 3) fail(key);
  }
  const faq = content.faq;
  if (!Array.isArray(faq) || faq.length < 2 || !faq.every((item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const entry = item as Record<string, unknown>;
    return isText(entry.question) && isText(entry.answer);
  })) fail("faq");
  assertRelatedTemplateSlugs(sourceSlug, content.relatedSlugs as string[]);
}

/**
 * Build a complete detail payload from the template registry when a locale
 * catalog does not yet contain a dedicated entry. Every value is derived from
 * the validated ChungDoi template record so the fallback stays deterministic.
 */
export function createTemplateSeoDetailFallback(template: ChungDoiTemplate): TemplateSeoDetailContent {
  const text = (value: string, fallback: string) => value.trim() || fallback;
  const name = text(template.name, template.slug);
  const title = text(template.title, name);
  const description = text(template.description, title);
  const seoTitle = `Mẫu thiệp cưới ${name} | Thiệp Mừng Online`;
  const metaTitle = seoTitle.length <= 60
    ? seoTitle
    : `${name} | Thiệp Mừng Online`.slice(0, 60);
  const metaDescriptionSource = `Mẫu thiệp cưới ${name}, phong cách ${text(template.category, "thanh lịch")}, gam màu ${text(template.color, "hài hòa")}. ${description} Tạo thiệp cưới online theo cách riêng của bạn.`;
  const metaDescription = metaDescriptionSource.length >= 140
    ? `${metaDescriptionSource.slice(0, 157).trimEnd()}...`
    : `${metaDescriptionSource} Thiết kế trực tuyến dễ dàng.`.slice(0, 160);
  const highlights = template.highlights.map((item) => item.trim()).filter(Boolean);
  const usableHighlights = highlights.length > 0 ? highlights : [description];
  const intro = `Mẫu thiệp cưới ${name} kết hợp phong cách ${text(template.category, "thanh lịch")} với gam màu ${text(template.color, "hài hòa")}. ${description}`;
  const relatedSlugs = completedTemplates
    .filter((candidate) => candidate.slug !== template.slug && !retiredTemplateSlugs.has(candidate.slug))
    .map((candidate) => candidate.slug)
    .sort()
    .slice(0, 3);

  return {
    metaTitle,
    metaDescription,
    heading: name,
    intro,
    highlights: usableHighlights.map((item) => `Điểm nhấn của mẫu: ${item}`),
    suitableFor: [`Đám cưới theo phong cách ${text(template.category, "thanh lịch")}`, `Cặp đôi yêu gam màu ${text(template.color, "hài hòa")}`],
    features: usableHighlights.map((item) => `Bố cục và artwork: ${item}`),
    steps: [`Chọn mẫu ${name} và xem trước bố cục.`, `Thay nội dung thiệp bằng thông tin của bạn; phần mô tả mẫu: ${description}`, "Mở bản xem trước, kiểm tra trên điện thoại rồi tạo thiệp cưới online."],
    faq: [
      { question: `Mẫu thiệp cưới ${name} có phong cách gì?`, answer: `Mẫu thuộc nhóm ${text(template.category, "thanh lịch")} và sử dụng gam màu ${text(template.color, "hài hòa")}. ${description}` },
      { question: `Tôi có thể bắt đầu tạo thiệp cưới online từ mẫu ${name} không?`, answer: `Có. Hãy mở bản xem trước, sau đó chọn nút tạo thiệp để tùy chỉnh nội dung theo thông tin của bạn.` },
    ],
    imageAlt: `Ảnh xem trước mẫu thiệp cưới ${name}`,
    relatedSlugs,
    relatedBlogSlugs: [],
  };
}

/**
 * Resolve locale-provided detail copy, retaining strict validation for the
 * explicit pilot catalog and supplying deterministic metadata for other
 * completed templates.
 */
export function resolveTemplateSeoDetailContent(
  template: ChungDoiTemplate,
  explicitContent?: unknown,
): TemplateSeoDetailContent {
  if (explicitContent !== undefined) {
    // Locale entries are authored data. Keep the existing fail-fast contract
    // for malformed entries rather than masking a catalog regression.
    assertTemplateSeoDetailContent(template.slug, explicitContent);
    return explicitContent;
  }
  const fallback = createTemplateSeoDetailFallback(template);
  assertTemplateSeoDetailContent(template.slug, fallback);
  return fallback;
}
