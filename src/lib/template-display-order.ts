import { cache } from "react";

import { prisma } from "@/lib/prisma";

export type TemplateDisplayOrderMap = Record<string, number>;

export const getTemplateDisplayOrder = cache(
  async (): Promise<TemplateDisplayOrderMap> => {
    const rows = await prisma.templateDisplayOrder.findMany({
      select: { slug: true, sortOrder: true },
    });

    return Object.fromEntries(
      rows.map((row) => [row.slug, row.sortOrder]),
    );
  },
);

/** Public pages may render before the runtime database is available. */
export const getPublicTemplateDisplayOrder = cache(
  async (): Promise<TemplateDisplayOrderMap> => {
    try {
      return await getTemplateDisplayOrder();
    } catch {
      return {};
    }
  },
);

/**
 * Applies persisted positions first, then a stable built-in fallback. The
 * fallback keeps newly-added templates visible even before an admin reorders.
 */
export function sortByTemplateDisplayOrder<T>(
  items: readonly T[],
  displayOrder: TemplateDisplayOrderMap,
  getSlug: (item: T) => string,
  fallbackOrder: TemplateDisplayOrderMap = {},
): T[] {
  return items
    .map((item, index) => ({
      item,
      index,
      persisted: displayOrder[getSlug(item)],
      fallback: fallbackOrder[getSlug(item)],
    }))
    .sort((left, right) => {
      const leftOrder = left.persisted ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.persisted ?? Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;

      const leftFallback = left.fallback ?? Number.MAX_SAFE_INTEGER;
      const rightFallback = right.fallback ?? Number.MAX_SAFE_INTEGER;
      if (leftFallback !== rightFallback) return leftFallback - rightFallback;

      return left.index - right.index;
    })
    .map(({ item }) => item);
}
