import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "truc-chi-minimal",
  openingEffect: artOpeningEffects["truc-chi-minimal"],
  viRouteSlug: "truc-chi-toa-sang",
  rendererExport: "TrucChiMinimalInvitation",
  heroImageCount: 2,
  name: "Truc Chi Light",
  title: "Truc Chi Handmade Paper Wedding Invitation | Thiệp Mừng Online",
  description: "A luminous handmade-paper invitation with bamboo-fiber relief.",
  category: "Vietnamese Heritage",
  color: "Gold",
  highlights: ["Backlit bamboo-fiber paper", "Blind-embossed botanical relief", "Quiet luminous center"],
  artwork: "/chungdoi/images/themes/_decor/truc-chi-minimal/artwork.webp",
  outer: "#d6b980", card: "#f2dfb8", ink: "#4a3825", muted: "rgba(74,56,37,0.58)", accent: "#7a4b21", buttonText: "#fff1ce",
  fontFamily: "Lora", particleType: "leaves", gallerySlug: "zen-sand", music: "/chungdoi/music/zen-sand.mp3",
  i18n: {
    vi: { name: "Trúc Chỉ Tỏa Sáng", description: "Thiệp cưới giấy trúc chỉ xuyên sáng với xơ sợi, phù điêu tre và khoảng thở lớn." },
    en: { name: "Truc Chi Light", description: "Backlit bamboo-fiber paper and blind botanical relief create a luminous invitation." },
    ja: { name: "竹紙の光", description: "竹繊維の透ける紙と浮き彫りで仕立てた光の招待状です。" },
    ko: { name: "죽지의 빛", description: "대나무 섬유 종이와 은은한 부조가 빛나는 청첩장입니다." },
    zh: { name: "竹纸之光", description: "以透光竹纤维纸和浅浮雕植物纹样构成的婚礼请柬。" },
  },
});
