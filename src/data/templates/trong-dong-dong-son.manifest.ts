import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "trong-dong-dong-son", viRouteSlug: "trong-dong-dong-son", rendererExport: "TrongDongDongSonInvitation", heroImageCount: 2,
  openingEffect: artOpeningEffects["trong-dong-dong-son"],
  name: "Đông Sơn Bronze Drum", title: "Đông Sơn Bronze Drum Wedding Invitation | Thiệp Mừng Online",
  description: "A patinated bronze drum face with a fourteen-ray sun, spiral bands and a ring of Lạc birds.",
  category: "Traditional", color: "Bronze",
  highlights: ["Fourteen-ray Đông Sơn sun star", "Ring of tangent Lạc birds", "Patinated bronze spiral bands"],
  artwork: "/chungdoi/images/themes/_decor/trong-dong-dong-son/artwork.webp",
  outer: "#0b211f", card: "#123430", ink: "#f2e6c8", muted: "rgba(242,230,200,0.62)", accent: "#cba14a", buttonText: "#10302c",
  fontFamily: "UNI Chu truyen thong", particleType: "sparkles", gallerySlug: "editorial-noir", music: "/chungdoi/music/editorial-noir.mp3",
  i18n: {
    vi: { name: "Trống Đồng Đông Sơn", description: "Thiệp cưới lấy cảm hứng mặt trống đồng Đông Sơn với ngôi sao mười bốn cánh, vòng hoa văn xoắn và đàn chim Lạc." },
    en: { name: "Đông Sơn Bronze Drum", description: "A patinated bronze drum face with a fourteen-ray sun, spiral bands and a ring of Lạc birds in flight." },
    ja: { name: "ドンソン銅鼓", description: "十四条の太陽紋、渦文の帯、そして飛翔するラック鳥をあしらった銅鼓の招待状です。" },
    ko: { name: "동선 청동북", description: "열네 갈래 태양문과 나선 문양, 비상하는 락 새를 담은 청동북 청첩장입니다." },
    zh: { name: "东山铜鼓", description: "以东山铜鼓鼓面为灵感，十四芒太阳纹、螺旋纹带与飞翔的貉鸟环绕的婚礼请柬。" },
  },
});
