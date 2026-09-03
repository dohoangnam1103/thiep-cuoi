import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiClone } from "@/components/chungdoi-clone";
import { RouteMessages } from "@/components/route-messages";
import { homeMessageNamespaces } from "@/i18n/message-scopes";
import { TemplateMobileThumbnailOverridesProvider } from "@/components/template-mobile-thumbnail-overrides";
import { TemplateNameOverridesProvider } from "@/components/template-name-overrides";
import type { Locale } from "@/i18n/routing";
import { pageSeo, staticAlternates } from "@/lib/seo";
import { getTemplateLabelOverrides } from "@/lib/template-labels";
import { getTemplateMobileThumbnailOverrides } from "@/lib/template-mobile-thumbnails";

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

// Generate on first runtime request, never from a build machine's database.
export function generateStaticParams() { return []; }
export const revalidate = 300;

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [templateNameOverrides, mobileThumbnailOverrides] = await Promise.all([
    getTemplateLabelOverrides(),
    getTemplateMobileThumbnailOverrides(),
  ]);

  return (
    <RouteMessages namespaces={homeMessageNamespaces}>
      <TemplateMobileThumbnailOverridesProvider value={mobileThumbnailOverrides}>
        <TemplateNameOverridesProvider value={templateNameOverrides}>
          <ChungDoiClone />
        </TemplateNameOverridesProvider>
      </TemplateMobileThumbnailOverridesProvider>
    </RouteMessages>
  );
}
