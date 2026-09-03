import { HeroTypographyDefaults } from "@/components/hero-typography-defaults";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { indexableLocales, routing } from "@/i18n/routing";
import { appFontVariables } from "@/lib/fonts";
import { openGraphLocale } from "@/lib/seo";
import {
  SITE_LOGO_PATH,
  SITE_SOCIAL_IMAGE_HEIGHT,
  SITE_SOCIAL_IMAGE_PATH,
  SITE_SOCIAL_IMAGE_WIDTH,
  SITE_URL,
  absoluteUrl,
} from "@/lib/site-url";
import "../globals.css";
import { GoogleAnalytics } from "@/components/google-analytics";
import { PetalField } from "@/components/petal-field";
import { RouteMessages } from "@/components/route-messages";

export function generateStaticParams() {
  // Leave locale paths to on-demand generation. Enumerating `vi` here also
  // prerenders Home/pricing despite their empty page-level param lists, which
  // would ship the build machine's price/name data to a different runtime DB.
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const appLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: appLocale, namespace: "metadata" });

  const languages = Object.fromEntries(
    indexableLocales.map((l) => [l, l === routing.defaultLocale ? "/" : `/${l}`]),
  );

  const isIndexable = indexableLocales.includes(locale as (typeof indexableLocales)[number]);
  const ogImage = absoluteUrl(SITE_SOCIAL_IMAGE_PATH);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: "%s | Thiệp Mừng Online",
    },
    description: t("description"),
    authors: [{ name: "Thiệp Mừng Online", url: SITE_URL }],
    creator: "Thiệp Mừng Online",
    publisher: "Thiệp Mừng Online",
    robots: {
      index: isIndexable,
      follow: true,
      googleBot: {
        index: isIndexable,
        follow: true,
      },
    },
    verification: {
      google: "5sP6NNaX9ZwqFeSZiHdojYOOrd455yZVvfJHuZgApO4",
    },
    alternates: {
      canonical: locale === routing.defaultLocale ? "/" : `/${locale}`,
      languages: { ...languages, "x-default": "/" },
    },
    openGraph: {
      type: "website",
      siteName: "Thiệp Mừng Online",
      title: t("title"),
      description: t("description"),
      url: locale === routing.defaultLocale ? "/" : `/${locale}`,
      locale: openGraphLocale(appLocale),
      images: [{
        url: ogImage,
        width: SITE_SOCIAL_IMAGE_WIDTH,
        height: SITE_SOCIAL_IMAGE_HEIGHT,
        alt: t("socialImageAlt"),
        type: "image/jpeg",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitterTitle"),
      description: t("twitterDescription"),
      images: [{ url: ogImage, alt: t("socialImageAlt") }],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const appLocale = locale;
  setRequestLocale(appLocale);
  const t = await getTranslations({ locale: appLocale, namespace: "metadata" });
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Thiệp Mừng Online",
        url: SITE_URL,
        logo: absoluteUrl(SITE_LOGO_PATH),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: t("title"),
        description: t("description"),
        inLanguage: locale,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <html
      lang={locale}
      className={`${appFontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <PetalField />
        {/* This boundary also owns error.tsx, outside the page-level providers. */}
        <RouteMessages namespaces={["errorBoundary"]}><HeroTypographyDefaults>{children}</HeroTypographyDefaults></RouteMessages>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
