import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "swiss-brutalist", viRouteSlug: "thuy-si-to-bao", rendererExport: "SwissBrutalistInvitation", heroImageCount: 2,
  openingEffect: artOpeningEffects["swiss-brutalist"],
  name: "Swiss Brutalist", title: "Swiss Brutalist Wedding Invitation | Thiệp Mừng Online",
  description: "A strict typographic invitation shaped by black geometry and one red axis.",
  category: "Modern", color: "White",
  highlights: ["Hard modular grid", "Oversized black geometry", "Single signal-red axis"],
  artwork: "/chungdoi/images/themes/_decor/swiss-brutalist/artwork.webp",
  outer: "#efeee9", card: "#f5f3ed", ink: "#1e1e1c", muted: "rgba(30,30,28,0.58)", accent: "#dc241f", buttonText: "#efeee9",
  fontFamily: "HelveticaNeue", particleType: "confetti", gallerySlug: "editorial-noir", music: "/chungdoi/music/editorial-noir.mp3",
  i18n: {
    vi: { name: "Thụy Sĩ Tô Bạo", description: "Thiệp cưới lưới Thụy Sĩ với hình đen cắt mạnh và một trục đỏ duy nhất." },
    en: { name: "Swiss Brutalist", description: "A strict modular grid, oversized black geometry and one signal-red axis." },
    ja: { name: "スイス・ブルータル", description: "厳格なグリッド、黒い大形状、一本の赤い軸で構成した招待状です。" },
    ko: { name: "스위스 브루탈", description: "엄격한 그리드와 거대한 검정 형태, 하나의 붉은 축으로 만든 청첩장입니다." },
    zh: { name: "瑞士粗野", description: "以严格网格、巨型黑色形体和单一红轴构成的婚礼请柬。" },
  },
});
