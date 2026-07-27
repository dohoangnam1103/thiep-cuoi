import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiClone } from "@/components/chungdoi-clone";
import { TemplateNameOverridesProvider } from "@/components/template-name-overrides";
import type { Locale } from "@/i18n/routing";
import { pageSeo, staticAlternates } from "@/lib/seo";
import { getPublicTemplateNameOverrides } from "@/lib/template-labels";

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

/** ISR so admin renames land without a redeploy. */
export const revalidate = 600;

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const templateNameOverrides = await getPublicTemplateNameOverrides();

  return (
    <TemplateNameOverridesProvider value={templateNameOverrides}>
      <ChungDoiClone />
    </TemplateNameOverridesProvider>
  );
}
