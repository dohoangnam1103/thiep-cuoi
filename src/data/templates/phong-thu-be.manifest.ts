import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "phong-thu-be", viRouteSlug: "phong-thu-be", rendererExport: "PhongThuBeInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["phong-thu-be"],
  name: "Phong Thư Be", title: "Phong Thư Be Wedding Invitation | Thiệp Mừng Online",
  description: "A soft modern invitation built from a sand-beige paper envelope and a bronze wax seal.",
  category: "Minimal", color: "Ivory",
  highlights: ["Folded paper envelope cover", "Bronze wax seal medallion", "Warm sand-beige stationery"],
  artwork: "/chungdoi/images/themes/_decor/phong-thu-be/artwork.webp",
  outer: "#f2ebdd", card: "#fdfaf4", ink: "#4a3a29", muted: "rgba(74,58,41,0.6)", accent: "#b08d5f", buttonText: "#fdfaf4",
  fontFamily: "The Nautigal", particleType: "petals", gallerySlug: "zen-sand", music: "/chungdoi/music/zen-sand.mp3",
  i18n: {
    vi: { name: "Phong Thư Be", description: "Thiệp cưới nhẹ nhàng hiện đại với phong bì giấy màu be và dấu sáp niêm đồng." },
    en: { name: "Phong Thư Be", description: "A sand-beige paper envelope closed with a bronze wax seal." },
    ja: { name: "封書・ベージュ", description: "ベージュの紙封筒とブロンズの封蝋を組み合わせた、柔らかく現代的な招待状です。" },
    ko: { name: "봉서 베이지", description: "베이지 종이 봉투와 브론즈 봉랍으로 마무리한 부드러운 현대풍 청첩장입니다." },
    zh: { name: "封书米色", description: "米色纸质信封搭配青铜火漆印的柔和现代婚礼请柬。" },
  },
});
