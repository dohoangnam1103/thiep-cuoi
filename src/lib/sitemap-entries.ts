import type { MetadataRoute } from "next";

import { completedTemplates, getVietnameseTemplateSlug } from "@/data/chungdoi";
import {
  templateSeoFacets,
  type TemplateSeoFacet,
} from "@/data/template-seo-facets";
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

function entry(href: Href, lastModified?: Date): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${getPathname({ href, locale: routing.defaultLocale })}`,
    ...(lastModified ? { lastModified } : {}),
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

/**
 * A sitemap that lies about `lastmod` is worse than one that omits it: Google
 * compares the claim against what it finds when crawling and discounts the
 * signal for the whole site once the dates stop matching. Blog posts carry a
 * real `updatedAt`, so they get a date; the marketing and template pages have no
 * per-page modification date to draw on, so they stay bare rather than
 * inheriting a build timestamp that would change on every deploy.
 */
export function buildSitemapEntries(
  posts: readonly BlogSitemapPost[],
): MetadataRoute.Sitemap {
  const staticRoutes: Href[] = [
    "/",
    "/create-wedding-invitation-online",
    "/pricing",
    "/templates",
    "/tools",
    "/help",
    "/privacy-policy",
    "/terms-of-service",
    "/refund-policy",
  ];
  const templateDemoRoutes: Href[] = completedTemplates.map((template) => ({
    pathname: "/templates/[slug]/demo" as const,
    params: { slug: getVietnameseTemplateSlug(template.slug) },
  }));
  const facetRoutes = templateSeoFacets.map(facetHref);

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
    ...[...staticRoutes, ...facetRoutes, ...templateDemoRoutes].map((href) =>
      entry(href),
    ),
    ...blogEntries,
  ];

  return Array.from(new Map(entries.map((item) => [item.url, item])).values());
}
