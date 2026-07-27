import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiListing } from "@/components/chungdoi-listing";
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
  const t = await getTranslations({ locale, namespace: "listing" });

  return pageSeo({
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: staticAlternates("/templates", locale),
    locale,
  });
}

/** ISR so admin renames land without a redeploy. */
export const revalidate = 600;

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const templateNameOverrides = await getPublicTemplateNameOverrides();

  return (
    <TemplateNameOverridesProvider value={templateNameOverrides}>
      <ChungDoiListing />
    </TemplateNameOverridesProvider>
  );
}
