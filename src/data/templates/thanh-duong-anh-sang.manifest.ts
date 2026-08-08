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
    en: {
      name: "Cathedral Light",
      description:
        "Warm limestone, gothic pointed arches, a cobalt-and-gold rose window and a pair of doves rising through morning light.",
    },
    ja: {
      name: "大聖堂の光",
      description:
        "温かな石灰岩の地に尖ったゴシック・アーチ、藍と金のバラ窓、朝の光に舞い上がる二羽の鳩を描いた招待状です。",
    },
    ko: {
      name: "성당의 빛",
      description:
        "따뜻한 석회석 바탕에 고딕 아치와 코발트·금빛 장미창, 아침 빛으로 날아오르는 비둘기 한 쌍을 담은 청첩장입니다.",
    },
    zh: {
      name: "圣堂之光",
      description: "温暖石灰岩底色，哥特尖拱与钴蓝金色玫瑰窗，一对白鸽在晨光中振翅的婚礼请柬。",
    },
  },
});
