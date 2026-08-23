import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { publicImageSize } from "@/components/home2/listing-sizes";
import { V7Page } from "@/components/home2/lab/v7-page";
import type { TemplateShotData } from "@/components/home2/types";
import { getVietnameseTemplateSlug, templates } from "@/data/chungdoi";
import type { Locale } from "@/i18n/routing";
import { getPublicTemplateNameOverrides } from "@/lib/template-labels";

import { displaySerif } from "../../fonts";
import "../../home-2.css";

export const metadata: Metadata = {
  title: "Trang chủ · V7 hành trình về chung một nhà",
  // Biến thể chạy song song với trang chủ thật. Không cho index để tránh trùng
  // nội dung với "/" và tránh lọt bản chưa chốt vào kết quả tìm kiếm.
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

/** Giống trang chủ thật: tên mẫu thiệp đọc từ database lúc chạy, mà database
 *  không có mặt khi build Docker image. */
export const dynamic = "force-dynamic";

/** V7 chỉ cần lưới 6 mẫu ở chương 01 — phần hero là hành trình, không có dải ảnh
 *  thiệp như V0. */
const GRID_COUNT = 6;

export default async function HomeV7({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [nameOverrides, listingT] = await Promise.all([
    getPublicTemplateNameOverrides(),
    getTranslations({ locale, namespace: "listing" }),
  ]);

  const featured = templates.slice(0, GRID_COUNT);

  const shots: TemplateShotData[] = await Promise.all(
    featured.map(async (template) => {
      const size = await publicImageSize(template.listing);
      const localizedNameKey = `templates.${template.slug}.name`;
      // Thứ tự ưu tiên tên: admin đổi tên trong DB → tên tiếng Việt trong catalog
      // → tên gốc trong data.
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
    <div className={displaySerif.variable}>
      <V7Page
        shots={shots}
        templateCount={templates.length}
        instantTemplateId={templates[0]?.slug ?? "song-hy-red"}
        rsvpImage={rsvpImage}
        languagesImage={languagesImage}
      />
    </div>
  );
}
