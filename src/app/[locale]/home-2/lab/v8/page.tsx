import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { V8Page } from "@/components/home2/lab/v8-page";
import { publicImageSize } from "@/components/home2/listing-sizes";
import type { TemplateShotData } from "@/components/home2/types";
import { getVietnameseTemplateSlug, templates } from "@/data/chungdoi";
import type { Locale } from "@/i18n/routing";
import { getPublicTemplateNameOverrides } from "@/lib/template-labels";

export const metadata: Metadata = {
  title: "V8 · Một ngày cưới",
  robots: { index: false, follow: false },
};

/** Giống trang chủ thật: tên mẫu thiệp đọc từ database lúc chạy, mà database
 *  không có mặt khi build Docker image. */
export const dynamic = "force-dynamic";

export default async function LabV8({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Cùng cách nạp dữ liệu với `/home-2`: 5 mẫu cho dải hero, 6 cho lưới chương
  // 01 — tổng 11 mẫu đầu bảng.
  const [nameOverrides, listingT] = await Promise.all([
    getPublicTemplateNameOverrides(),
    getTranslations({ locale, namespace: "listing" }),
  ]);

  const featured = templates.slice(0, 11);

  const shots: TemplateShotData[] = await Promise.all(
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
    <V8Page
      shots={shots}
      templateCount={templates.length}
      instantTemplateId={templates[0]?.slug ?? "song-hy-red"}
      rsvpImage={rsvpImage}
      languagesImage={languagesImage}
    />
  );
}
