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

type AppLocale = (typeof routing.locales)[number];

function buildAlternates(
  hrefByLocale: (locale: AppLocale) => Href,
  currentLocale: AppLocale,
): Alternates {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, getPathname({ href: hrefByLocale(locale), locale })]),
  );
  const canonical = languages[currentLocale];
  return {
    canonical,
    languages: { ...languages, "x-default": languages[routing.defaultLocale] },
  };
}

export function staticAlternates(href: Href, locale: AppLocale): Alternates {
  return buildAlternates(() => href, locale);
}

export function blogAlternates(slug: string, locale: AppLocale): Alternates {
  return buildAlternates(() => ({ pathname: "/blog/[slug]", params: { slug } }), locale);
}

export function templateAlternates(routeSlug: string, locale: AppLocale): Alternates | null {
  const template = findTemplateByRouteSlug(routeSlug);
  if (!template) return null;
  return buildAlternates((locale) => ({
    pathname: "/templates/[slug]/demo",
    params: { slug: locale === "vi" ? getVietnameseTemplateSlug(template.slug) : template.slug },
  }), locale);
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
