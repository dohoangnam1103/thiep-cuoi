import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "art-deco-gatsby", viRouteSlug: "gatsby-nghe-thuat", rendererExport: "ArtDecoGatsbyInvitation", heroImageCount: 2,
  openingEffect: artOpeningEffects["art-deco-gatsby"],
  name: "Art Deco Gatsby", title: "Art Deco Gatsby Wedding Invitation | Thiệp Mừng Online",
  description: "A midnight-black invitation framed by architectural champagne-gold geometry.",
  category: "Modern", color: "Black",
  highlights: ["Architectural fan crown", "Champagne foil lines", "Disciplined 1920s symmetry"],
  artwork: "/chungdoi/images/themes/_decor/art-deco-gatsby/artwork.webp",
  outer: "#11110f", card: "#181815", ink: "#f1e7d0", muted: "rgba(241,231,208,0.62)", accent: "#d9b86c", buttonText: "#11110f",
  fontFamily: "SVN-HC Built Titling", particleType: "sparkles", gallerySlug: "editorial-noir", music: "/chungdoi/music/editorial-noir.mp3",
  i18n: {
    vi: { name: "Gatsby Nghệ Thuật", description: "Thiệp cưới đen tuyền với vương miện quạt và đường foil champagne chuẩn Art Deco." },
    en: { name: "Art Deco Gatsby", description: "Midnight paper and architectural champagne foil create a disciplined 1920s invitation." },
    ja: { name: "ギャツビー・デコ", description: "漆黒の紙とシャンパンゴールドの幾何学で仕立てた招待状です。" },
    ko: { name: "개츠비 데코", description: "미드나이트 블랙과 샴페인 골드 기하로 완성한 청첩장입니다." },
    zh: { name: "盖茨比装饰", description: "以午夜黑纸和香槟金几何线条构成的婚礼请柬。" },
  },
});
