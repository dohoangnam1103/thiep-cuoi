import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { publicImageSize } from "@/components/home2/listing-sizes";
import { V9Page } from "@/components/home2/lab/v9-page";
import type { V9TemplateShot } from "@/components/home2/lab/v9-journey";
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
  const t = await getTranslations({ locale, namespace: "homeLabV9.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
    alternates: { canonical: "/" },
  };
}

export const dynamic = "force-dynamic";

const SHOT_COUNT = 11;

export default async function LabV9({
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

  const featured = templates.slice(0, SHOT_COUNT);
  const shots: V9TemplateShot[] = await Promise.all(
    featured.map(async (template) => {
      const size = await publicImageSize(template.listing);
      const localizedNameKey = `templates.${template.slug}.name`;
      const name =
        nameOverrides[template.slug]
        ?? (listingT.has(localizedNameKey) ? listingT(localizedNameKey) : template.name);

      return {
        slug: template.slug,
        name,
        category: template.category,
        color: template.color,
        isNew: template.isNew,
        portrait: template.portrait,
        listing: template.listing,
        listingWidth: size.width,
        listingHeight: size.height,
        demoPath: `/mau-thiep/${getVietnameseTemplateSlug(template.slug)}/demo`,
      };
    }),
  );

  const [rsvpImage, languagesImage] = await Promise.all([
    publicImageSize("/chungdoi/images/rsvp-showcase.png"),
    publicImageSize("/chungdoi/images/language-showcase.png"),
  ]);

  return (
    <div className={displaySerif.variable}>
      <V9Page
        shots={shots}
        templateCount={templates.length}
        instantTemplateId={templates[0]?.slug ?? "song-hy-red"}
        rsvpImage={rsvpImage}
        languagesImage={languagesImage}
      />
    </div>
  );
}
