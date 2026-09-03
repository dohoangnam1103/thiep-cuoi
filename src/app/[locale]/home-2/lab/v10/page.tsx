import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  V10Page,
  type V10Template,
} from "@/components/home2/lab/v10-page";
import { getVietnameseTemplateSlug, templates } from "@/data/chungdoi";
import type { Locale } from "@/i18n/routing";
import { getPublicTemplateNameOverrides } from "@/lib/template-labels";

import { displaySerif } from "../../fonts";
import "../../home-2.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "homeLabV10.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
    alternates: { canonical: "/" },
  };
}

export const dynamic = "force-dynamic";

const TEMPLATE_COUNT = 4;

export default async function LabV10({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [nameOverrides, listingT] = await Promise.all([
    getPublicTemplateNameOverrides(),
    getTranslations({ locale, namespace: "listing" }),
  ]);

  const featuredTemplates: V10Template[] = templates
    .slice(0, TEMPLATE_COUNT)
    .map((template) => {
      const localizedNameKey = `templates.${template.slug}.name`;
      const name =
        nameOverrides[template.slug]
        ?? (listingT.has(localizedNameKey)
          ? listingT(localizedNameKey)
          : template.name);

      return {
        slug: template.slug,
        name,
        portrait: template.portrait,
        demoPath: `/mau-thiep/${getVietnameseTemplateSlug(template.slug)}/demo`,
      };
    });

  return (
    <div className={displaySerif.variable}>
      <V10Page
        templates={featuredTemplates}
        templateCount={templates.length}
        instantTemplateId={templates[0]?.slug ?? "song-hy-red"}
      />
    </div>
  );
}
