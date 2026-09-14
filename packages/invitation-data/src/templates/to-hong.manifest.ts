import { createTemplateDemoContent, defineTemplateManifest } from "./template-manifest";

const slug = "to-hong";
const red = "#780f23";
const paper = "#f7efdf";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "to-hong",
  rendererExport: "ToHongInvitation", ceremonyRendering: "inline-all",
  heroImageCount: 1,
  catalog: {
    name: "Tơ Hồng",
    title: "Tơ Hồng — Se duyên thành đôi | Thiệp Mừng Online",
    description: "Thiệp cưới đỏ rượu và giấy ngà nhiều lớp, sợi tơ se duyên dẫn qua từng khoảnh khắc đến ngày thành đôi.",
    category: "Traditional",
    color: "Red",
    isNew: true,
    highlights: ["Chạm nút thắt mở thiệp giấy nhiều lớp", "Sợi tơ dẫn chuyện theo nhịp cuộn", "Phong bao tơ hồng mở thẻ QR"],
  },
  theme: {
    theme: {
      background: red, cardBg: paper, textPrimary: red, textSecondary: "#755c55",
      accent: red, dividerFrom: "transparent", dividerTo: "#bd9c6f",
      buttonBg: red, buttonText: paper, guestBoxBg: paper,
      particleColors: [], particleType: "none",
    },
    fonts: { couple: "Fz Qellia", ampersand: null },
    sealType: null,
    decorations: { cardImages: [] },
  },
  demoContent: {
    ...createTemplateDemoContent({
      slug, primaryColor: red, fontFamily: "Fz Qellia",
      gallerySlug: "zen-sand", music: "/chungdoi/music/song-hy-red.mp3",
      brideFullName: "Nguyễn Minh Anh", brideShortName: "Minh Anh",
      groomFullName: "Trần Hoàng Nam", groomShortName: "Hoàng Nam",
      date: "2026-11-22",
    }),
    heroImage2: undefined,
    dressCodeColors: "#780f23,#f7efdf,#bd9c6f",
  },
  i18n: {
    vi: {
      name: "Tơ Hồng",
      description: "Se duyên thành đôi với sợi tơ đỏ, khung giấy ngà nhiều lớp và những chuyển động dịu dàng.",
    },
  },
  assets: ["/chungdoi/images/themes/to-hong/paper-frame.webp", "/chungdoi/images/themes/to-hong/to-hong-cord-mobile.webp", "/chungdoi/images/themes/to-hong/to-hong-cord-desktop.webp", "/chungdoi/music/song-hy-red.mp3"],
});
