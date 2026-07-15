import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiListing } from "@/components/chungdoi-listing";
import type { Locale } from "@/i18n/routing";
import { staticAlternates } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listing" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const image = absoluteUrl("/chungdoi/icon-v2.png");

  return {
    title: { absolute: title },
    description,
    alternates: staticAlternates("/templates", locale),
    openGraph: {
      type: "website",
      title,
      description,
      images: [{ url: image }],
      siteName: "Thiệp Mừng Online",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ChungDoiListing />;
}
