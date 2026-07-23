import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { indexableLocales, routing } from "@/i18n/routing";
import { appFontVariables } from "@/lib/fonts";
import { SITE_URL, absoluteUrl } from "@/lib/site-url";
import "../globals.css";
import { GoogleAnalytics } from "@/components/google-analytics";
import { PetalField } from "@/components/petal-field";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const languages = Object.fromEntries(
    indexableLocales.map((l) => [l, l === routing.defaultLocale ? "/" : `/${l}`]),
  );

  const ogImage = absoluteUrl("/chungdoi/images/en/banner_hero.webp");

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: "%s | Thiệp Mừng Online",
    },
    description: t("description"),
    robots: {
      index: indexableLocales.includes(locale as (typeof indexableLocales)[number]),
      follow: true,
    },
    icons: {
      icon: "/chungdoi/icon-v2.png",
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
      locale,
      images: [{ url: ogImage, width: 2987, height: 1566 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [ogImage],
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

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "metadata" });
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Thiệp Mừng Online",
        url: SITE_URL,
        logo: `${SITE_URL}/chungdoi/icon-v2.png`,
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
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
