import type { MetadataRoute } from "next";

import { blogPosts } from "@/data/chungdoi-content";
import { getVietnameseTemplateSlug, templates } from "@/data/chungdoi";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site-url";

function localeSlug(sourceSlug: string, locale: Locale) {
  return locale === "vi" ? getVietnameseTemplateSlug(sourceSlug) : sourceSlug;
}

type Href = Parameters<typeof getPathname>[0]["href"];

const LAST_MODIFIED = new Date("2026-07-07");

function entry(href: Href, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${SITE_URL}${getPathname({ href, locale })}`]),
  );
  return {
    url: `${SITE_URL}${getPathname({ href, locale: routing.defaultLocale })}`,
    lastModified: LAST_MODIFIED,
    changeFrequency,
    priority,
    alternates: { languages },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: Array<{ href: Href; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { href: "/", priority: 1, changeFrequency: "weekly" },
    { href: "/templates", priority: 0.9, changeFrequency: "weekly" },
    { href: "/create-wedding-invitation-online", priority: 0.9, changeFrequency: "monthly" },
    { href: "/pricing", priority: 0.8, changeFrequency: "monthly" },
    { href: "/tools", priority: 0.6, changeFrequency: "monthly" },
    { href: "/blog", priority: 0.6, changeFrequency: "weekly" },
    { href: "/help", priority: 0.5, changeFrequency: "monthly" },
    { href: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
    { href: "/terms-of-service", priority: 0.3, changeFrequency: "yearly" },
    { href: "/refund-policy", priority: 0.3, changeFrequency: "yearly" },
  ];

  const templateDemos = templates.map((template) => {
    const hrefByLocale = Object.fromEntries(
      routing.locales.map((locale) => {
        const href = {
          pathname: "/templates/[slug]/demo",
          params: { slug: localeSlug(template.slug, locale) },
        } satisfies Href;
        return [locale, `${SITE_URL}${getPathname({ href, locale })}`];
      }),
    );
    return {
      url: hrefByLocale[routing.defaultLocale],
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: { languages: hrefByLocale },
    };
  });

  const blogEntries = blogPosts.map((post) =>
    entry({ pathname: "/blog/[slug]", params: { slug: post.slug } }, 0.5, "monthly"),
  );

  return [
    ...staticRoutes.map((r) => entry(r.href, r.priority, r.changeFrequency)),
    ...templateDemos,
    ...blogEntries,
  ];
}
