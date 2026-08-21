import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import type { ChungDoiThemeConfig } from "@/data/chungdoi-theme-config";
import type { ChungDoiTemplate } from "@/data/chungdoi";

// Vietnamese only. The en/ja/ko/zh catalogs and manifest translations were
// removed once routing narrowed to a single locale — see src/i18n/routing.ts.
export const TEMPLATE_MANIFEST_LOCALES = ["vi"] as const;

export type TemplateManifestLocale = (typeof TEMPLATE_MANIFEST_LOCALES)[number];

export type TemplateListingMessage = {
  name: string;
  description: string;
};

export type TemplateManifest = {
  slug: string;
  viRouteSlug: string;
  rendererExport: string;
  heroImageCount?: 0 | 1 | 2;
  catalog: Omit<
    ChungDoiTemplate,
    "slug" | "listing" | "portrait" | "landscape" | "sourceUrl"
  >;
  theme: ChungDoiThemeConfig;
  demoContent: ChungDoiDemoContent;
  i18n: Record<TemplateManifestLocale, TemplateListingMessage>;
  assets: readonly string[];
};

export function defineTemplateManifest<const T extends TemplateManifest>(manifest: T): T {
  return manifest;
}

type DemoContentInput = {
  slug: string;
  primaryColor: string;
  fontFamily: string | null;
  music: string;
  galleryCount?: number;
  gallerySlug?: string;
  brideFullName?: string;
  brideShortName?: string;
  groomFullName?: string;
  groomShortName?: string;
  date?: string;
  time?: string;
};

export function createTemplateDemoContent({
  slug,
  primaryColor,
  fontFamily,
  music,
  galleryCount = 8,
  gallerySlug = slug,
  brideFullName = "Trần An Nhiên",
  brideShortName = "An Nhiên",
  groomFullName = "Nguyễn Minh Khôi",
  groomShortName = "Minh Khôi",
  date = "2026-12-12",
  time = "18:00",
}: DemoContentInput): ChungDoiDemoContent {
  const gallery = Array.from(
    { length: galleryCount },
    (_, index) => `/chungdoi/images/gallery/${gallerySlug}/photo-${index + 1}.webp`,
  );

  return {
    slug,
    invitationId: `${slug}-demo`,
    theme: {
      primaryColor,
      fontFamily,
      assetFolder: null,
      assets: [],
    },
    couple: {
      brideFullName,
      groomFullName,
      brideShortName,
      groomShortName,
      brideBirthOrder: "Út Nữ",
      groomBirthOrder: "Trưởng Nam",
      brideFirst: false,
      date,
      time,
      ceremonyDate: date,
      ceremonyTime: "09:00",
      ceremonyHeader: "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA",
      ceremonyType: "thanh-hon",
      openingMessage: "Trân trọng kính mời quý khách đến chung vui cùng gia đình chúng tôi.",
    },
    families: {
      brideFather: "Trần Văn Thành",
      brideMother: "Lê Thị Thu Hà",
      brideAddress: "Thành phố Huế, Việt Nam",
      groomFather: "Nguyễn Văn Hưng",
      groomMother: "Phạm Thị Minh Anh",
      groomAddress: "Thành phố Hồ Chí Minh, Việt Nam",
      brideParentTitle: "Ông Bà",
      groomParentTitle: "Ông Bà",
    },
    venue: {
      address: "Trung tâm Hội nghị Riverside Palace\n360D Bến Vân Đồn, Quận 4, TP. Hồ Chí Minh",
      mapAddress: "Riverside Palace, 360D Bến Vân Đồn, Quận 4, Hồ Chí Minh",
      banquetTime: time,
    },
    schedule: [
      { time: "17:30", label: "Đón khách" },
      { time: "18:00", label: "Làm lễ" },
      { time: "18:30", label: "Khai tiệc" },
      { time: "20:30", label: "Chụp ảnh lưu niệm" },
    ],
    portraits: {
      groom: gallery[0] ?? "",
      bride: gallery[1] ?? gallery[0] ?? "",
    },
    gallery,
    heroImage: gallery[0],
    heroImage2: gallery[1],
    showHeroImage: true,
    dressCodeColors: `${primaryColor},#f3efe8,#31443a`,
    wishes: [
      {
        name: "Gia đình Thu Trang",
        time: "2026-11-18T09:15:00.000Z",
        text: "Chúc hai bạn luôn bình an, thấu hiểu và cùng nhau đi thật xa.",
      },
    ],
    bank: {
      brideBankName: "Vietcombank",
      brideAccountNumber: "1026888899",
      brideAccountName: brideFullName,
      groomBankName: "Techcombank",
      groomAccountNumber: "1903888899",
      groomAccountName: groomFullName,
    },
    music,
  };
}
