import { cache } from "react";

import {
  getSourceTemplateSlug,
  getVietnameseTemplateSlug,
} from "@/data/template-route-slugs";
import { prisma } from "@/lib/prisma";
import {
  isReservedTemplateRouteSlug,
  slugifyTemplateRoute,
} from "@/lib/template-route-slug";

/** Source template slug -> canonical public Vietnamese route slug. */
export type TemplateRouteSlugMap = Record<string, string>;

type TemplateRouteRegistry = {
  sourceSlugByAlias: Record<string, string>;
  canonicalSlugBySource: TemplateRouteSlugMap;
};

function canUseCanonicalSlug(
  routeSlug: string,
  sourceSlug: string,
  sourceSlugByAlias: Record<string, string>,
): boolean {
  if (!routeSlug || isReservedTemplateRouteSlug(routeSlug)) return false;

  const defaultRouteSlug = getVietnameseTemplateSlug(sourceSlug);
  const staticOwner = getSourceTemplateSlug(routeSlug);
  if (
    staticOwner
    && (staticOwner !== sourceSlug || routeSlug !== defaultRouteSlug)
  ) {
    return false;
  }

  const aliasOwner = sourceSlugByAlias[routeSlug];
  return !aliasOwner || aliasOwner === sourceSlug;
}

const getTemplateRouteRegistry = cache(
  async (): Promise<TemplateRouteRegistry> => {
    const [routeRows, labelRows] = await Promise.all([
      prisma.templateRouteAlias.findMany({
        select: { routeSlug: true, templateSlug: true, canonical: true },
      }),
      // Labels can predate the route-alias migration. Derive a virtual canonical
      // until the next rename persists it, so existing admin renames take effect
      // immediately after deployment instead of requiring a manual resubmit.
      prisma.templateLabel.findMany({
        orderBy: { slug: "asc" },
        select: { slug: true, name: true },
      }),
    ]);
    const sourceSlugByAlias: Record<string, string> = {};
    const canonicalSlugBySource: TemplateRouteSlugMap = {};

    for (const row of routeRows) {
      sourceSlugByAlias[row.routeSlug] = row.templateSlug;
    }
    for (const row of routeRows) {
      if (
        row.canonical
        && canUseCanonicalSlug(
          row.routeSlug,
          row.templateSlug,
          sourceSlugByAlias,
        )
      ) {
        canonicalSlugBySource[row.templateSlug] = row.routeSlug;
      }
    }

    for (const row of labelRows) {
      if (canonicalSlugBySource[row.slug]) continue;
      const routeSlug = slugifyTemplateRoute(row.name);
      if (!canUseCanonicalSlug(routeSlug, row.slug, sourceSlugByAlias)) continue;

      sourceSlugByAlias[routeSlug] = row.slug;
      canonicalSlugBySource[row.slug] = routeSlug;
    }

    return { sourceSlugByAlias, canonicalSlugBySource };
  },
);

export const getTemplateRouteOverrides = cache(
  async (): Promise<TemplateRouteSlugMap> =>
    (await getTemplateRouteRegistry()).canonicalSlugBySource,
);

/** Public pages can still render with built-in slugs if the runtime DB is unavailable. */
export const getPublicTemplateRouteOverrides = cache(
  async (): Promise<TemplateRouteSlugMap> => {
    try {
      return await getTemplateRouteOverrides();
    } catch {
      return {};
    }
  },
);

export function templateRouteSlugFromMap(
  overrides: TemplateRouteSlugMap,
  sourceSlug: string,
): string {
  return overrides[sourceSlug]?.trim() || getVietnameseTemplateSlug(sourceSlug);
}

export type ResolvedTemplateRoute = {
  sourceSlug: string;
  canonicalSlug: string;
};

/** Resolves built-in slugs and every persisted or pre-migration alias. */
export const resolvePublicTemplateRoute = cache(
  async (routeSlug: string): Promise<ResolvedTemplateRoute | null> => {
    let registry: TemplateRouteRegistry = {
      sourceSlugByAlias: {},
      canonicalSlugBySource: {},
    };
    try {
      registry = await getTemplateRouteRegistry();
    } catch {
      // Build-time and transient DB failures keep the built-in route registry usable.
    }

    const sourceSlug =
      getSourceTemplateSlug(routeSlug) ?? registry.sourceSlugByAlias[routeSlug];
    if (!sourceSlug) return null;

    return {
      sourceSlug,
      canonicalSlug: templateRouteSlugFromMap(
        registry.canonicalSlugBySource,
        sourceSlug,
      ),
    };
  },
);
