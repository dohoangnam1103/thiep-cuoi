import { cache } from "react";

import { prisma } from "@/lib/prisma";

export type TemplateVisibilityMap = Record<string, boolean>;

export const getTemplateVisibilityOverrides = cache(
  async (): Promise<TemplateVisibilityMap> => {
    const rows = await prisma.templateVisibility.findMany({
      select: { slug: true, isVisible: true },
    });

    return Object.fromEntries(
      rows.map((row) => [row.slug, row.isVisible]),
    );
  },
);

/** Public pages may render before the runtime database is available. */
export const getPublicTemplateVisibilityOverrides = cache(
  async (): Promise<TemplateVisibilityMap> => {
    try {
      return await getTemplateVisibilityOverrides();
    } catch {
      return {};
    }
  },
);

/** Missing overrides preserve the existing behavior: templates are visible. */
export function isTemplateVisible(
  visibility: TemplateVisibilityMap,
  slug: string,
): boolean {
  return visibility[slug] !== false;
}
