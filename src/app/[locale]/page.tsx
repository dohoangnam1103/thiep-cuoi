import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiClone } from "@/components/chungdoi-clone";
import type { Locale } from "@/i18n/routing";
import { pageSeo, staticAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return pageSeo({
    title: t("title"),
    description: t("description"),
    alternates: staticAlternates("/", locale),
    locale,
    imageAlt: t("socialImageAlt"),
    openGraphTitle: t("openGraphTitle"),
    openGraphDescription: t("openGraphDescription"),
    twitterTitle: t("twitterTitle"),
    twitterDescription: t("twitterDescription"),
  });
}

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ChungDoiClone />;
}
