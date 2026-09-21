import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  parseTemplateSeoOverrideRow,
  type TemplateSeoOverrideMap,
} from "@/lib/template-seo-override-schema";

export {
  isOverridableTemplateSlug,
  overrideContent,
  parseTemplateSeoOverrideRow,
  sanitizeRelatedSlugs,
  templateSeoOverrideContentSchema,
  templateSeoOverrideSchema,
  type TemplateSeoOverrideInput,
  type TemplateSeoOverrideMap,
} from "@/lib/template-seo-override-schema";

/**
 * Cache tag for the public template landing page copy. One tag for the whole
 * table rather than one per slug: `unstable_cache` invalidates per tag, and an
 * admin edit re-derives a handful of pages, not thousands, so the coarser
 * granularity costs nothing and keeps invalidation impossible to get wrong.
 */
export const TEMPLATE_SEO_OVERRIDE_TAG = "template-seo-override";
/**
 * Every valid override. `unstable_cache` (not React `cache`) so the whole table
 * is read once and shared across every page render until an admin edit calls
 * `updateTag`, instead of re-reading it on every ISR revalidation. Matches
 * `hero-typography-config.ts`.
 *
 * One tag for the whole table rather than one per slug: an admin edit
 * re-derives a handful of pages, not thousands, so the coarser granularity
 * costs nothing and keeps invalidation impossible to get wrong.
 */
export const getTemplateSeoOverrides = unstable_cache(
  async (): Promise<TemplateSeoOverrideMap> => {
    const rows = await prisma.templateSeoOverride.findMany({
      select: { slug: true, content: true, robots: true },
    });

    const overrides: TemplateSeoOverrideMap = {};
    for (const row of rows) {
      const parsed = parseTemplateSeoOverrideRow(row);
      if (parsed) overrides[row.slug] = parsed;
    }
    return overrides;
  },
  ["template-seo-overrides-v1"],
  { tags: [TEMPLATE_SEO_OVERRIDE_TAG], revalidate: 300 },
);

/**
 * Public marketing pages are prerendered before the runtime database exists in
 * a Docker build, and an unavailable database must not blank a landing page.
 * Mirrors `getPublicTemplateNameOverrides`. Memoised per request so a metadata
 * and a body render in the same pass share one try/catch.
 */
export const getPublicTemplateSeoOverrides = cache(
  async (): Promise<TemplateSeoOverrideMap> => {
    try {
      return await getTemplateSeoOverrides();
    } catch {
      return {};
    }
  },
);
