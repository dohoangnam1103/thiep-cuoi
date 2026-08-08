import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "phong-thu-lam-pastel", viRouteSlug: "phong-thu-lam-pastel", rendererExport: "PhongThuLamPastelInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["phong-thu-lam-pastel"],
  name: "Phong Thư Lam Pastel", title: "Phong Thư Lam Pastel Wedding Invitation | Thiệp Mừng Online",
  description: "A soft modern invitation built from a powder blue paper envelope and a slate wax seal.",
  category: "Minimal", color: "Blue",
  highlights: ["Folded paper envelope cover", "Slate wax seal medallion", "Powder blue stationery"],
  artwork: "/chungdoi/images/themes/_decor/phong-thu-lam-pastel/artwork.webp",
  outer: "#e7eef6", card: "#f9fbfd", ink: "#27364a", muted: "rgba(39,54,74,0.6)", accent: "#6382a6", buttonText: "#f9fbfd",
  fontFamily: "Alex Brush", particleType: "sparkles", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Phong Thư Lam Pastel", description: "Thiệp cưới nhẹ nhàng hiện đại với phong bì giấy xanh dương pastel và dấu sáp niêm lam." },
    en: { name: "Phong Thư Lam Pastel", description: "A powder blue paper envelope closed with a slate wax seal." },
    ja: { name: "封書・ペールブルー", description: "淡いブルーの紙封筒とスレート色の封蝋を組み合わせた、柔らかく現代的な招待状です。" },
    ko: { name: "봉서 파스텔 블루", description: "파우더 블루 종이 봉투와 슬레이트 봉랍으로 마무리한 부드러운 현대풍 청첩장입니다." },
    zh: { name: "封书淡蓝", description: "粉蓝色纸质信封搭配石青火漆印的柔和现代婚礼请柬。" },
  },
});
