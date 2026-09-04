import type { MetadataRoute } from "next";

import { listPublishedBlogPosts } from "@/lib/blog-posts";
import { buildSitemapEntries } from "@/lib/sitemap-entries";
import { getPublicTemplateRouteOverrides } from "@/lib/template-route-aliases";

// Blog entries come from SQLite, which the Docker build image does not have, so
// this route reads the database per request instead of at build time — the same
// reason the blog pages themselves opt out of static rendering. Sitemaps are
// fetched by crawlers, not users, so the extra query costs effectively nothing.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A sitemap that 500s is reported as a hard fetch failure in Search Console,
  // so a database hiccup degrades to built-in routes rather than taking the
  // whole document down.
  const [posts, templateRouteSlugs] = await Promise.all([
    listPublishedBlogPosts().catch((error: unknown) => {
      console.error("Không đọc được bài blog cho sitemap", {
        error: error instanceof Error ? error.message : "unknown",
      });
      return [];
    }),
    getPublicTemplateRouteOverrides(),
  ]);

  return buildSitemapEntries(posts, templateRouteSlugs);
}
