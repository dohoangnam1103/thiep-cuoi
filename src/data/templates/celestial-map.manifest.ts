import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "celestial-map", viRouteSlug: "ban-do-tinh-tuc", rendererExport: "CelestialMapInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["celestial-map"],
  name: "Celestial Map", title: "Celestial Star Map Wedding Invitation | Thiệp Mừng Online",
  description: "Two constellation paths meet beneath a restrained lunar sequence.",
  category: "Modern", color: "Blue",
  highlights: ["Paired constellation paths", "Silver astronomical engraving", "Ink-navy night palette"],
  artwork: "/chungdoi/images/themes/_decor/celestial-map/artwork.webp",
  outer: "#07192c", card: "#0b2138", ink: "#ecf0f5", muted: "rgba(236,240,245,0.62)", accent: "#d2b28c", buttonText: "#07192c",
  fontFamily: "Alex Brush", particleType: "sparkles", gallerySlug: "editorial-noir", music: "/chungdoi/music/editorial-noir.mp3",
  i18n: {
    vi: { name: "Bản Đồ Tinh Túc", description: "Thiệp cưới thiên văn với hai đường chòm sao gặp nhau dưới nhịp pha trăng." },
    en: { name: "Celestial Map", description: "Two constellation paths meet beneath a restrained sequence of lunar phases." },
    ja: { name: "星の地図", description: "二つの星座の軌跡と静かな月相を描いた天文招待状です。" },
    ko: { name: "별자리 지도", description: "두 별자리의 궤적과 절제된 달의 위상을 담은 천문 청첩장입니다." },
    zh: { name: "星宿地图", description: "两条星座轨迹在克制的月相序列下相遇的婚礼请柬。" },
  },
});
