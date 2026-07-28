import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "aurora-glass-dark", viRouteSlug: "cuc-quang-kinh-toi", rendererExport: "AuroraGlassDarkInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["aurora-glass-dark"],
  name: "Dark Aurora Glass", title: "Dark Aurora Glass Wedding Invitation | Thiệp Mừng Online",
  description: "A dark glass invitation with translucent petrol ribbons and physical edge refraction.",
  category: "Modern", color: "Green",
  highlights: ["Translucent aurora ribbons", "Physical glass refraction", "Graphite and petrol palette"],
  artwork: "/chungdoi/images/themes/_decor/aurora-glass-dark/artwork.webp",
  outer: "#111a1b", card: "#162324", ink: "#edf3ef", muted: "rgba(237,243,239,0.60)", accent: "#a7d4ce", buttonText: "#142021",
  fontFamily: "Alex Brush", particleType: "sparkles", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Cực Quang Kính Tối", description: "Thiệp cưới kính tối với dải cực quang petrol, khúc xạ cạnh và ánh ngọc trai." },
    en: { name: "Dark Aurora Glass", description: "Translucent petrol ribbons meet through physical glass refraction on graphite." },
    ja: { name: "夜光ガラス", description: "グラファイトの闇に透明な青緑の光帯とガラスの屈折を重ねた招待状です。" },
    ko: { name: "다크 오로라 글라스", description: "그래파이트 위에 투명한 페트롤 빛 띠와 유리 굴절을 담은 청첩장입니다." },
    zh: { name: "暗夜极光玻璃", description: "在石墨色背景上叠加透明青绿色光带和玻璃折射的婚礼请柬。" },
  },
});
