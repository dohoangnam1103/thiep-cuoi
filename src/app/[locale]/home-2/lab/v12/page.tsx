import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  V12Page,
  type V12GalleryTemplate,
  type V12MosaicTemplate,
} from "@/components/home2/lab/v12-page";
import {
  completedTemplates,
  getVietnameseTemplateSlug,
  templates,
  type ChungDoiTemplate,
} from "@/data/chungdoi";
import listingThumbnails from "@/data/listing-thumbnails.json";
import type { Locale } from "@/i18n/routing";
import { getPublicTemplateNameOverrides } from "@/lib/template-labels";
import { templatePreviewOptimizedUrl } from "@/lib/template-preview-url";

import { displaySerif } from "../../fonts";
import "../../home-2.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "homeLabV12.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
    alternates: { canonical: "/" },
  };
}

export const dynamic = "force-dynamic";

type ListingThumbnail = {
  width: number;
  height: number;
  cropHeight: number;
  variants: Array<{ width: number; src: string }>;
};

const thumbnailMap = listingThumbnails as Record<string, ListingThumbnail>;

const GALLERY_SLUGS = [
  "song-hy-red",
  "glass-garden-pink",
  "minimalism-dark-red",
  "nhat-binh-red",
  "cherry-blossom-pink",
  "qasr-gold",
  "crystal-floral-blue",
  "boho-floral-brown",
  "royal-green",
  "baroque-gold",
  "sunflower",
  "maroon-love",
] as const;

function lightweightPreview(template: ChungDoiTemplate) {
  const prepared = thumbnailMap[template.listing];
  const variant = prepared?.variants.find((item) => item.width === 320)
    ?? prepared?.variants[0];

  if (!prepared || !variant) {
    return {
      src: templatePreviewOptimizedUrl(template.listing, 320, 68),
      width: 320,
      height: 640,
    };
  }

  return {
    src: variant.src,
    width: variant.width,
    height: Math.round((prepared.cropHeight / prepared.width) * variant.width),
  };
}

export default async function LabV12({
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

  const displayName = (template: ChungDoiTemplate) => {
    const localizedNameKey = `templates.${template.slug}.name`;
    return nameOverrides[template.slug]
      ?? (listingT.has(localizedNameKey) ? listingT(localizedNameKey) : template.name);
  };

  const exhibitionTemplates = templates
    .filter((template) => thumbnailMap[template.listing]?.variants.some(
      (variant) => variant.width === 320,
    ))
    .slice(0, 98);
  const mosaicTemplates: V12MosaicTemplate[] = exhibitionTemplates.map((template) => ({
    slug: template.slug,
    name: displayName(template),
    thumbnail: lightweightPreview(template),
  }));

  const completedBySlug = new Map(
    completedTemplates.map((template) => [template.slug, template]),
  );
  const curated = GALLERY_SLUGS.flatMap((slug) => {
    const template = completedBySlug.get(slug);
    return template ? [template] : [];
  });
  const gallerySource = curated.length === GALLERY_SLUGS.length
    ? curated
    : completedTemplates.slice(0, GALLERY_SLUGS.length);
  const galleryTemplates: V12GalleryTemplate[] = gallerySource.map((template) => ({
    slug: template.slug,
    name: displayName(template),
    portrait: template.portrait,
    demoPath: `/mau-thiep/${getVietnameseTemplateSlug(template.slug)}/demo`,
  }));

  return (
    <div className={displaySerif.variable}>
      <V12Page
        templateCount={mosaicTemplates.length}
        mosaicTemplates={mosaicTemplates}
        galleryTemplates={galleryTemplates}
      />
    </div>
  );
}
