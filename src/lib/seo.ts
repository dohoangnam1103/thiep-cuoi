import type { Metadata } from "next";

import { getPathname } from "@/i18n/navigation";
import { indexableLocales, routing } from "@/i18n/routing";
import { findTemplateByRouteSlug, getVietnameseTemplateSlug } from "@/data/chungdoi";
import {
  SITE_SOCIAL_IMAGE_HEIGHT,
  SITE_SOCIAL_IMAGE_PATH,
  SITE_SOCIAL_IMAGE_WIDTH,
  absoluteUrl,
} from "@/lib/site-url";

type Href = Parameters<typeof getPathname>[0]["href"];

type Alternates = {
  canonical: string;
  languages: Record<string, string>;
};

type AppLocale = (typeof routing.locales)[number];

const OPEN_GRAPH_LOCALES: Record<AppLocale, string> = { vi: "vi_VN" };

export function openGraphLocale(locale: AppLocale): string {
  return OPEN_GRAPH_LOCALES[locale];
}

function buildAlternates(
  hrefByLocale: (locale: AppLocale) => Href,
  currentLocale: AppLocale,
): Alternates {
  const languages = Object.fromEntries(
    indexableLocales.map((locale) => [
      locale,
      getPathname({ href: hrefByLocale(locale), locale }),
    ]),
  );
  const canonical = getPathname({
    href: hrefByLocale(currentLocale),
    locale: currentLocale,
  });
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
  locale,
  image = SITE_SOCIAL_IMAGE_PATH,
  imageAlt = title,
  imageWidth,
  imageHeight,
  imageType,
  openGraphTitle = title,
  openGraphDescription = description,
  twitterTitle = openGraphTitle,
  twitterDescription = openGraphDescription,
  type = "website",
}: {
  title: string;
  description: string;
  alternates: Alternates;
  locale?: AppLocale;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  type?: "website" | "article";
}): Metadata {
  const imageUrl = absoluteUrl(image);
  const socialImage = image === SITE_SOCIAL_IMAGE_PATH
    ? {
        url: imageUrl,
        width: SITE_SOCIAL_IMAGE_WIDTH,
        height: SITE_SOCIAL_IMAGE_HEIGHT,
        alt: imageAlt,
        type: "image/jpeg",
      }
    : {
        url: imageUrl,
        width: imageWidth,
        height: imageHeight,
        alt: imageAlt,
        type: imageType,
      };

  return {
    title: { absolute: title },
    description,
    alternates,
    openGraph: {
      type,
      title: openGraphTitle,
      description: openGraphDescription,
      siteName: "Thiệp Mừng Online",
      url: alternates.canonical,
      locale: locale ? openGraphLocale(locale) : undefined,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      images: [{ url: imageUrl, alt: imageAlt }],
    },
  };
}
