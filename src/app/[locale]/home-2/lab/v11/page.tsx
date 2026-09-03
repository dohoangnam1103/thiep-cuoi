import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  V11Page,
  type V11Template,
} from "@/components/home2/lab/v11-page";
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
  const t = await getTranslations({ locale, namespace: "homeLabV11.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
    alternates: { canonical: "/" },
  };
}

export const dynamic = "force-dynamic";

const FEATURED_TEMPLATE_SLUGS = [
  "song-hy-red",
  "cherry-blossom-pink",
  "minimalism-brown",
  "nhat-binh-red",
  "son-mai-lacquer",
  "ao-dai-hue",
  "crystal-floral-red",
  "bat-trang-blue",
] as const;

export default async function LabV11({
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
  const templateBySlug = new Map(templates.map((template) => [template.slug, template]));
  const curatedTemplates = FEATURED_TEMPLATE_SLUGS.flatMap((slug) => {
    const template = templateBySlug.get(slug);
    return template ? [template] : [];
  });
  const sourceTemplates = curatedTemplates.length >= 6
    ? curatedTemplates
    : templates.slice(0, 8);
  const featuredTemplates: V11Template[] = sourceTemplates.map((template) => {
    const localizedNameKey = `templates.${template.slug}.name`;
    return {
      slug: template.slug,
      name:
        nameOverrides[template.slug]
        ?? (listingT.has(localizedNameKey) ? listingT(localizedNameKey) : template.name),
      portrait: template.portrait,
      demoPath: `/mau-thiep/${getVietnameseTemplateSlug(template.slug)}/demo`,
    };
  });

  return (
    <div className={displaySerif.variable}>
      <V11Page
        instantTemplateId={featuredTemplates[0]?.slug ?? "song-hy-red"}
        templateCount={templates.length}
        templates={featuredTemplates}
      />
    </div>
  );
}
