import type { MetadataRoute } from "next";

import { completedTemplates, getVietnameseTemplateSlug } from "@/data/chungdoi";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site-url";

type Href = Parameters<typeof getPathname>[0]["href"];

function entry(href: Href): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${getPathname({ href, locale: routing.defaultLocale })}`,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
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
  const entries = [...staticRoutes, ...templateDemoRoutes].map(entry);

  return Array.from(new Map(entries.map((item) => [item.url, item])).values());
}
