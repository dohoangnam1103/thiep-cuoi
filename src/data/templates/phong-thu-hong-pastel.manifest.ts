import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "phong-thu-hong-pastel", viRouteSlug: "phong-thu-hong-pastel", rendererExport: "PhongThuHongPastelInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["phong-thu-hong-pastel"],
  name: "Phong Thư Hồng Pastel", title: "Phong Thư Hồng Pastel Wedding Invitation | Thiệp Mừng Online",
  description: "A soft modern invitation built from a blush paper envelope and a rosewood wax seal.",
  category: "Minimal", color: "Pink",
  highlights: ["Folded paper envelope cover", "Rosewood wax seal medallion", "Blush pink stationery"],
  artwork: "/chungdoi/images/themes/_decor/phong-thu-hong-pastel/artwork.webp",
  outer: "#f7e8ee", card: "#fdf8fa", ink: "#4a2b36", muted: "rgba(74,43,54,0.6)", accent: "#b8748c", buttonText: "#fdf8fa",
  fontFamily: "Fz Aghita", particleType: "petals", gallerySlug: "zen-sand", music: "/chungdoi/music/zen-sand.mp3",
  i18n: {
    vi: { name: "Phong Thư Hồng Pastel", description: "Thiệp cưới nhẹ nhàng hiện đại với phong bì giấy hồng pastel và dấu sáp niêm hồng trầm." },
    en: { name: "Phong Thư Hồng Pastel", description: "A blush paper envelope closed with a rosewood wax seal." },
    ja: { name: "封書・ペールピンク", description: "淡いピンクの紙封筒とローズウッドの封蝋を組み合わせた、柔らかく現代的な招待状です。" },
    ko: { name: "봉서 파스텔 핑크", description: "블러시 종이 봉투와 로즈우드 봉랍으로 마무리한 부드러운 현대풍 청첩장입니다." },
    zh: { name: "封书淡粉", description: "腮粉色纸质信封搭配玫紫火漆印的柔和现代婚礼请柬。" },
  },
});
