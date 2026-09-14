import { artOpeningEffects } from "./art-opening-effects";
import { createArtTemplateManifest } from "./art-template-manifest";

export const manifest = createArtTemplateManifest({
  slug: "thanh-duong-anh-sang",
  viRouteSlug: "thanh-duong-anh-sang",
  rendererExport: "ThanhDuongAnhSangInvitation",
  heroImageCount: 1,
  openingEffect: artOpeningEffects["thanh-duong-anh-sang"],
  name: "Cathedral Light",
  title: "Cathedral Light Wedding Invitation | Thiệp Mừng Online",
  description: "A warm limestone invitation framed by gothic arches and rose-window light.",
  category: "Modern",
  color: "Gold",
  highlights: [
    "Gothic double arch in warm limestone",
    "Rose window with cobalt and gold panes",
    "Dove pair rising through morning light",
  ],
  artwork: "/chungdoi/images/themes/_decor/thanh-duong-anh-sang/artwork.webp",
  outer: "#f2ede0",
  card: "#f9f6ef",
  ink: "#1e3a5f",
  muted: "rgba(30,58,95,0.55)",
  accent: "#c9922f",
  buttonText: "#f9f6ef",
  fontFamily: "Fz Qellia",
  particleType: "sparkles",
  gallerySlug: "arch-sage",
  music: "/chungdoi/music/jasmine-white.mp3",
  i18n: {
    vi: {
      name: "Thánh Đường Ánh Sáng",
      description:
        "Thiệp cưới nền đá vôi ấm với vòm gothic, cửa sổ hoa hồng kính màu lam vàng và đôi bồ câu bay trong nắng sớm.",
    },
  },
});
