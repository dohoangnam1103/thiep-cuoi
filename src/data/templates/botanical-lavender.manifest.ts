import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "botanical-lavender", viRouteSlug: "thao-moc-oai-huong", rendererExport: "BotanicalLavenderInvitation", heroImageCount: 2,
  openingEffect: artOpeningEffects["botanical-lavender"],
  name: "Botanical Lavender", title: "Botanical Lavender Wedding Invitation | Thiệp Mừng Online",
  description: "A cool lavender invitation framed by monoline stems and mustard seed pods.",
  category: "Botanical", color: "Purple",
  highlights: ["Monoline lavender stems", "Mustard seed-pod accents", "Cool editorial paper palette"],
  artwork: "/chungdoi/images/themes/_decor/botanical-lavender/artwork.webp",
  outer: "#e5e0ee", card: "#f0edf4", ink: "#49334f", muted: "rgba(73,51,79,0.58)", accent: "#a67c18", buttonText: "#f4eff7",
  fontFamily: "1FTV VIP Signora", particleType: "leaves", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Thảo Mộc Oải Hương", description: "Thiệp cưới lavender lạnh với cành nét đơn, quả mù tạt và khoảng trắng biên tập." },
    en: { name: "Botanical Lavender", description: "Monoline lavender stems and mustard seed pods frame a cool editorial invitation." },
    ja: { name: "ラベンダー植物誌", description: "ラベンダーの線画とマスタード色の実が囲む涼やかな招待状です。" },
    ko: { name: "보태니컬 라벤더", description: "라벤더 선화와 머스터드 씨앗 꼬투리가 감싸는 청첩장입니다." },
    zh: { name: "薰衣草植物志", description: "以薰衣草线描和芥末黄色种荚环绕的清冷婚礼请柬。" },
  },
});
