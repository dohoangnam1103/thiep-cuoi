import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiClone } from "@/components/chungdoi-clone";
import { TemplateMobileThumbnailOverridesProvider } from "@/components/template-mobile-thumbnail-overrides";
import { TemplateNameOverridesProvider } from "@/components/template-name-overrides";
import type { Locale } from "@/i18n/routing";
import { pageSeo, staticAlternates } from "@/lib/seo";
import { getPublicTemplateNameOverrides } from "@/lib/template-labels";
import { getPublicTemplateMobileThumbnailOverrides } from "@/lib/template-mobile-thumbnails";

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

/**
 * Template names come from the runtime database, which is unavailable while the
 * Docker image is being built. Keep this route dynamic so renamed carousel
 * entries are visible immediately.
 */
export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [templateNameOverrides, mobileThumbnailOverrides] = await Promise.all([
    getPublicTemplateNameOverrides(),
    getPublicTemplateMobileThumbnailOverrides(),
  ]);

  return (
    <TemplateMobileThumbnailOverridesProvider value={mobileThumbnailOverrides}>
      <TemplateNameOverridesProvider value={templateNameOverrides}>
        <ChungDoiClone />
      </TemplateNameOverridesProvider>
    </TemplateMobileThumbnailOverridesProvider>
  );
}
