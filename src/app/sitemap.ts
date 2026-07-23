import type { MetadataRoute } from "next";

import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site-url";

type Href = Parameters<typeof getPathname>[0]["href"];

function entry(href: Href, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${getPathname({ href, locale: routing.defaultLocale })}`,
    changeFrequency,
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: Array<{ href: Href; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { href: "/", priority: 1, changeFrequency: "weekly" },
    { href: "/create-wedding-invitation-online", priority: 0.9, changeFrequency: "monthly" },
    { href: "/pricing", priority: 0.8, changeFrequency: "monthly" },
    { href: "/tools", priority: 0.6, changeFrequency: "monthly" },
    { href: "/help", priority: 0.5, changeFrequency: "monthly" },
    { href: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
    { href: "/terms-of-service", priority: 0.3, changeFrequency: "yearly" },
    { href: "/refund-policy", priority: 0.3, changeFrequency: "yearly" },
  ];

  return staticRoutes.map((r) => entry(r.href, r.priority, r.changeFrequency));
}
