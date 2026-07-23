import type { MetadataRoute } from "next";

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
    "/tools",
    "/help",
    "/privacy-policy",
    "/terms-of-service",
    "/refund-policy",
  ];

  return staticRoutes.map(entry);
}
