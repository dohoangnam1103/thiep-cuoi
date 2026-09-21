import { z } from "zod";

import { completedTemplates, retiredTemplateSlugs } from "@/data/chungdoi";
import type { TemplateSeoDetailContent } from "@/data/template-seo-details";

/**
 * Upper bounds chosen so a single row cannot balloon the SQLite page into
 * megabyte-scale HTML: 120/320 characters cover what Google renders, and the
 * array caps match the largest authored catalog entries with headroom.
 */
const TEXT_MAX = 400;
const LONG_TEXT_MAX = 4000;
const META_TITLE_MAX = 120;
const META_DESCRIPTION_MAX = 320;
const ARRAY_MAX = 12;
const FAQ_MAX = 12;

const plainText = (max: number) => z.string().trim().min(1, "Không được để trống").max(max, `Tối đa ${max} ký tự`);

/**
 * The public page derives its JSON-LD `FAQPage` from `faq`, so an empty entry
 * would emit an invalid Question node. Both fields are therefore required.
 */
const faqEntrySchema = z.object({
  question: plainText(TEXT_MAX),
  answer: plainText(LONG_TEXT_MAX),
});

/**
 * Zod mirror of `assertTemplateSeoDetailContent`. The data-module assertion is
 * allowed to throw because it guards authored catalog data; this schema is the
 * boundary for whatever an admin types, so it returns issues instead.
 */
export const templateSeoOverrideContentSchema = z.object({
  metaTitle: plainText(META_TITLE_MAX),
  metaDescription: plainText(META_DESCRIPTION_MAX),
  heading: plainText(TEXT_MAX),
  intro: plainText(LONG_TEXT_MAX),
  highlights: z.array(plainText(TEXT_MAX)).min(1, "Cần ít nhất 1 mục").max(ARRAY_MAX, `Tối đa ${ARRAY_MAX} mục`),
  suitableFor: z.array(plainText(TEXT_MAX)).min(1, "Cần ít nhất 1 mục").max(ARRAY_MAX, `Tối đa ${ARRAY_MAX} mục`),
  features: z.array(plainText(TEXT_MAX)).min(1, "Cần ít nhất 1 mục").max(ARRAY_MAX, `Tối đa ${ARRAY_MAX} mục`),
  // The catalog contract pins exactly three steps; the view renders an ordered
  // list, so a different count is a content shape change, not a formatting one.
  steps: z.array(plainText(TEXT_MAX)).length(3, "Phải có đúng 3 bước"),
  faq: z.array(faqEntrySchema).min(1, "Cần ít nhất 1 câu hỏi").max(FAQ_MAX, `Tối đa ${FAQ_MAX} câu hỏi`),
  imageAlt: plainText(TEXT_MAX),
  relatedSlugs: z.array(z.string().trim().min(1)).max(3, "Tối đa 3 mẫu liên quan"),
  relatedBlogSlugs: z.array(z.string().trim().min(1)).max(6, "Tối đa 6 bài viết liên quan"),
});

export const templateSeoOverrideSchema = z.object({
  slug: z.string().trim().min(1),
  robots: z.enum(["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"]),
  content: templateSeoOverrideContentSchema,
});

export type TemplateSeoOverrideInput = z.infer<typeof templateSeoOverrideSchema>;

/** Slug -> parsed override. Rows that fail validation are dropped, not thrown. */
export type TemplateSeoOverrideMap = Record<string, TemplateSeoOverrideInput>;

/**
 * Parses one stored row. Returns null instead of throwing so a malformed row
 * (hand-edited database, half-finished schema migration) degrades to the
 * built-in catalog copy for that single template.
 */
export function parseTemplateSeoOverrideRow(row: {
  slug: string;
  content: string;
  robots: string;
}): TemplateSeoOverrideInput | null {
  let raw: unknown;
  try {
    raw = JSON.parse(row.content);
  } catch {
    return null;
  }
  const parsed = templateSeoOverrideSchema.safeParse({
    slug: row.slug,
    robots: row.robots,
    content: raw,
  });
  return parsed.success ? parsed.data : null;
}

/**
 * Related slugs are admin-authored, so an entry can point at a template that
 * was retired or never completed after the override was written. Filtering here
 * keeps `TemplateSeoDetailView` from rendering a link to a 404.
 */
export function sanitizeRelatedSlugs(
  sourceSlug: string,
  relatedSlugs: readonly string[],
  relatedBlogSlugs: readonly string[],
): { relatedSlugs: string[]; relatedBlogSlugs: string[] } {
  const known = new Set(
    completedTemplates
      .filter((template) => !retiredTemplateSlugs.has(template.slug))
      .map((template) => template.slug),
  );
  return {
    relatedSlugs: relatedSlugs.filter((slug) => slug !== sourceSlug && known.has(slug)),
    relatedBlogSlugs: [...relatedBlogSlugs],
  };
}

/** True when the slug is a completed, non-retired template with a detail page. */
export function isOverridableTemplateSlug(slug: string): boolean {
  return completedTemplates.some(
    (template) => template.slug === slug && !retiredTemplateSlugs.has(template.slug),
  );
}

/** The stored JSON is the content object; this is the cast the page consumes. */
export function overrideContent(override: TemplateSeoOverrideInput): TemplateSeoDetailContent {
  return override.content as TemplateSeoDetailContent;
}
