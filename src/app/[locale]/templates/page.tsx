import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiListing } from "@/components/chungdoi-listing";
import { TemplateMobileThumbnailOverridesProvider } from "@/components/template-mobile-thumbnail-overrides";
import { TemplateNameOverridesProvider } from "@/components/template-name-overrides";
import { completedTemplates } from "@/data/chungdoi";
import type { Locale } from "@/i18n/routing";
import { pageSeo, staticAlternates } from "@/lib/seo";
import {
  getPublicTemplateDisplayOrder,
  sortByTemplateDisplayOrder,
} from "@/lib/template-display-order";
import { getPublicTemplateNameOverrides } from "@/lib/template-labels";
import { getPublicTemplateMobileThumbnailOverrides } from "@/lib/template-mobile-thumbnails";
import {
  getPublicTemplateVisibilityOverrides,
  isTemplateVisible,
} from "@/lib/template-visibility";

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

/**
 * Template names come from the runtime database, which is unavailable while the
 * Docker image is being built. Keep this route dynamic so a build-time fallback
 * cannot stay visible after an admin rename.
 */
export const dynamic = "force-dynamic";

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [
    templateNameOverrides,
    mobileThumbnailOverrides,
    displayOrder,
    visibilityOverrides,
  ] = await Promise.all([
    getPublicTemplateNameOverrides(),
    getPublicTemplateMobileThumbnailOverrides(),
    getPublicTemplateDisplayOrder(),
    getPublicTemplateVisibilityOverrides(),
  ]);
  const orderedTemplates = sortByTemplateDisplayOrder(
    completedTemplates.filter((template) =>
      isTemplateVisible(visibilityOverrides, template.slug),
    ),
    displayOrder,
    (template) => template.slug,
  );

  return (
    <TemplateMobileThumbnailOverridesProvider value={mobileThumbnailOverrides}>
      <TemplateNameOverridesProvider value={templateNameOverrides}>
        <ChungDoiListing initialTemplates={orderedTemplates} />
      </TemplateNameOverridesProvider>
    </TemplateMobileThumbnailOverridesProvider>
  );
}
