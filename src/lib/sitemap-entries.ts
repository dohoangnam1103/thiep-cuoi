import type { MetadataRoute } from "next";

import { getVietnameseTemplateSlug } from "@/data/chungdoi";
import {
  templateSeoFacets,
  type TemplateSeoFacet,
} from "@/data/template-seo-facets";
import { templateSeoDetailEnabledSlugs } from "@/data/template-seo-details";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site-url";

type Href = Parameters<typeof getPathname>[0]["href"];

/**
 * Only the fields the sitemap needs, so this module stays free of
 * `@/lib/blog-posts` — that one pulls in `server-only`, which throws on import
 * outside a react-server condition and would take the unit tests with it.
 */
export type BlogSitemapPost = {
  slug: string;
  updatedAt: Date;
};

function entry(href: Href, lastModified: string | Date): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${getPathname({ href, locale: routing.defaultLocale })}`,
    lastModified,
  };
}

function facetHref(facet: TemplateSeoFacet): Href {
  if (facet.kind === "style") {
    return {
      pathname: "/templates/style/[slug]",
      params: { slug: facet.slug },
    };
  }

  return {
    pathname: "/templates/color/[slug]",
    params: { slug: facet.slug },
  };
}

// Dates for the most recent significant edits to source-managed content. Update
// the affected date when changing page copy, template catalogs, or structured data.
const staticRoutes: ReadonlyArray<readonly [href: Href, lastModified: string]> = [
  ["/", "2026-11-26"],
  ["/create-wedding-invitation-online", "2026-11-26"],
  ["/pricing", "2026-09-04"],
  ["/templates", "2026-09-10"],
  ["/tools", "2026-09-21"],
  ["/help", "2026-07-26"],
  ["/privacy-policy", "2026-01-01"],
  ["/terms-of-service", "2026-01-01"],
  ["/refund-policy", "2026-01-01"],
];
const templateFacetLastModified = "2026-09-10";
const templateDetailLastModified = "2026-09-10";

export function buildSitemapEntries(
  posts: readonly BlogSitemapPost[],
  templateRouteSlugs: Readonly<Record<string, string>> = {},
  enabledSlugs: readonly string[] = templateSeoDetailEnabledSlugs,
  templateSeoOverrides: Readonly<Record<string, { updatedAt: string } | undefined>> = {},
): MetadataRoute.Sitemap {
  const templateDetailEntries = enabledSlugs.map((slug) => {
    const updatedAt = templateSeoOverrides[slug]?.updatedAt;
    return entry(
      {
        pathname: "/templates/[slug]",
        params: { slug: templateRouteSlugs[slug] ?? getVietnameseTemplateSlug(slug) },
      },
      updatedAt && updatedAt > templateDetailLastModified ? updatedAt : templateDetailLastModified,
    );
  });

  const blogEntries = posts.length > 0
    ? [
        // Posts arrive ordered by publishedAt, but the index page changes
        // whenever any post does, so take the newest modification rather than
        // the newest publication.
        entry(
          "/blog",
          posts.reduce(
            (newest, post) => (post.updatedAt > newest ? post.updatedAt : newest),
            posts[0].updatedAt,
          ),
        ),
        ...posts.map((post) =>
          entry(
            { pathname: "/blog/[slug]" as const, params: { slug: post.slug } },
            post.updatedAt,
          ),
        ),
      ]
    : [];

  const entries = [
    ...staticRoutes.map(([href, lastModified]) => entry(href, lastModified)),
    ...templateSeoFacets.map((facet) => entry(facetHref(facet), templateFacetLastModified)),
    ...templateDetailEntries,
    ...blogEntries,
  ];

  return Array.from(new Map(entries.map((item) => [item.url, item])).values());
}
