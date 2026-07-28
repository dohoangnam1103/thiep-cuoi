import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "hang-trong-folk",
  openingEffect: artOpeningEffects["hang-trong-folk"],
  viRouteSlug: "hang-trong-phu-quy",
  rendererExport: "HangTrongFolkInvitation",
  heroImageCount: 2,
  name: "Hang Trong Folk",
  title: "Hang Trong Folk Wedding Invitation | Thiệp Mừng Online",
  description: "A luminous folk-painting invitation with peacocks and peonies.",
  category: "Vietnamese Heritage",
  color: "Pink",
  highlights: ["Fine ink outlines", "Hand-brushed mineral colors", "Asymmetric peacock framing"],
  artwork: "/chungdoi/images/themes/_decor/hang-trong-folk/artwork.webp",
  outer: "#ead8bd", card: "#f7ecd9", ink: "#173a42", muted: "rgba(23,58,66,0.62)", accent: "#9d275d", buttonText: "#fff5e4",
  fontFamily: "Pattaya", particleType: "petals", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Hàng Trống Phú Quý", description: "Thiệp cưới dân gian thanh nhã với công, mẫu đơn và màu khoáng rực vừa đủ." },
    en: { name: "Hang Trong Folk", description: "Fine ink outlines and luminous color washes frame a ceremonial invitation." },
    ja: { name: "ハンチョン富貴", description: "孔雀と牡丹を繊細な墨線と鮮やかな彩色で描いた招待状です。" },
    ko: { name: "항쫑 부귀", description: "공작과 모란을 섬세한 먹선과 빛나는 채색으로 담은 청첩장입니다." },
    zh: { name: "行鼓富贵", description: "以孔雀、牡丹、细腻墨线和明亮设色构成的婚礼请柬。" },
  },
});
