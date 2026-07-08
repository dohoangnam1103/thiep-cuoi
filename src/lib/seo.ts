import type { Metadata } from "next";

import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { findTemplateByRouteSlug, getVietnameseTemplateSlug } from "@/data/chungdoi";
import { absoluteUrl } from "@/lib/site-url";

type Href = Parameters<typeof getPathname>[0]["href"];

type Alternates = {
  canonical: string;
  languages: Record<string, string>;
};

function buildAlternates(hrefByLocale: (locale: (typeof routing.locales)[number]) => Href): Alternates {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, getPathname({ href: hrefByLocale(locale), locale })]),
  );
  const canonical = languages[routing.defaultLocale];
  return {
    canonical,
    languages: { ...languages, "x-default": canonical },
  };
}

export function staticAlternates(href: Href): Alternates {
  return buildAlternates(() => href);
}

export function blogAlternates(slug: string): Alternates {
  return buildAlternates(() => ({ pathname: "/blog/[slug]", params: { slug } }));
}

export function templateAlternates(routeSlug: string): Alternates | null {
  const template = findTemplateByRouteSlug(routeSlug);
  if (!template) return null;
  return buildAlternates((locale) => ({
    pathname: "/templates/[slug]/demo",
    params: { slug: locale === "vi" ? getVietnameseTemplateSlug(template.slug) : template.slug },
  }));
}

export function pageSeo({
  title,
  description,
  alternates,
  image = "/chungdoi/icon-v2.png",
  type = "website",
}: {
  title: string;
  description: string;
  alternates: Alternates;
  image?: string;
  type?: "website" | "article";
}): Metadata {
  const imageUrl = absoluteUrl(image);
  return {
    title: { absolute: title },
    description,
    alternates,
    openGraph: {
      type,
      title,
      description,
      siteName: "Thiệp Mừng Online",
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
