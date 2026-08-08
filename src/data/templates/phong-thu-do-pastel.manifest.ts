import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "phong-thu-do-pastel", viRouteSlug: "phong-thu-do-pastel", rendererExport: "PhongThuDoPastelInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["phong-thu-do-pastel"],
  name: "Phong Thư Đỏ Pastel", title: "Phong Thư Đỏ Pastel Wedding Invitation | Thiệp Mừng Online",
  description: "A soft modern invitation built from a dusty terracotta paper envelope and a clay wax seal.",
  category: "Minimal", color: "Red",
  highlights: ["Folded paper envelope cover", "Clay wax seal medallion", "Dusty terracotta stationery"],
  artwork: "/chungdoi/images/themes/_decor/phong-thu-do-pastel/artwork.webp",
  outer: "#f6e6e1", card: "#fdf8f6", ink: "#4d2a26", muted: "rgba(77,42,38,0.6)", accent: "#b5695f", buttonText: "#fdf8f6",
  fontFamily: "1FTV VIP Signora", particleType: "petals", gallerySlug: "ticket-terracotta", music: "/chungdoi/music/ticket-terracotta.mp3",
  i18n: {
    vi: { name: "Phong Thư Đỏ Pastel", description: "Thiệp cưới nhẹ nhàng hiện đại với phong bì giấy đỏ pastel và dấu sáp niêm đất nung." },
    en: { name: "Phong Thư Đỏ Pastel", description: "A dusty terracotta paper envelope closed with a clay wax seal." },
    ja: { name: "封書・ペールレッド", description: "くすんだテラコッタの紙封筒と土色の封蝋を組み合わせた、柔らかく現代的な招待状です。" },
    ko: { name: "봉서 파스텔 레드", description: "테라코타 종이 봉투와 흙빛 봉랍으로 마무리한 부드러운 현대풍 청첩장입니다." },
    zh: { name: "封书淡红", description: "赭红色纸质信封搭配陶土色火漆印的柔和现代婚礼请柬。" },
  },
});
