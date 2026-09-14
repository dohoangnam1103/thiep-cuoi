import { createTemplateDemoContent, defineTemplateManifest } from "./template-manifest";

const slug = "uyen-uong";
const artwork = "/chungdoi/images/themes/uyen-uong/pond-engraving.webp";
const ink = "#922b32";
const paper = "#fdf6e9";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "uyen-uong",
  rendererExport: "UyenUongInvitation", ceremonyRendering: "inline-all",
  heroImageCount: 1,
  catalog: {
    name: "Uyên Ương",
    title: "Uyên Ương | Thiệp cưới đôi uyên ương trên hồ sen",
    description: "Thiệp cưới giấy ngà với đôi uyên ương khắc nét đỏ bên hồ sen, gửi lời chúc hòa hợp và gắn bó.",
    category: "Traditional",
    color: "Red",
    isNew: true,
    highlights: ["Đôi uyên ương bên hồ sen", "Nét khắc đỏ trên giấy ngà", "Phong bao mừng cưới đồng bộ"],
  },
  theme: {
    theme: {
      background: "#f0e7dd",
      cardBg: paper,
      textPrimary: ink,
      textSecondary: "#705653",
      accent: ink,
      dividerFrom: "transparent",
      dividerTo: "#922b3240",
      buttonBg: ink,
      buttonText: paper,
      guestBoxBg: "#fdf6e9f2",
      guestBoxBorder: "#922b3240",
      particleColors: [ink],
      particleType: "petals",
    },
    fonts: { couple: "Fz Qellia", ampersand: null },
    sealType: null,
    decorations: {
      cardImages: [{
        src: artwork,
        className: "bottom-0 left-0 w-full opacity-65",
        flyOnOpen: false,
      }],
    },
  },
  demoContent: {
    ...createTemplateDemoContent({
      slug,
      primaryColor: ink,
      fontFamily: "Fz Qellia",
      gallerySlug: "zen-sand",
      music: "/chungdoi/music/song-hy-red.mp3",
      brideFullName: "Trần Ngọc Uyên",
      brideShortName: "Ngọc Uyên",
      groomFullName: "Nguyễn Minh Quân",
      groomShortName: "Minh Quân",
      date: "2026-11-22",
    }),
    heroImage2: undefined,
    dressCodeColors: `${ink},${paper},#5d7057`,
  },
  i18n: {
    vi: {
      name: "Uyên Ương",
      description: "Đôi uyên ương bên hồ sen, nét khắc đỏ trên giấy ngà. Thiệp cưới trang trọng, nhẹ nhàng và đậm tình duyên đôi lứa.",
    },
  },
  assets: [artwork, "/chungdoi/music/song-hy-red.mp3"],
});
