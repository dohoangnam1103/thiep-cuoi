import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "y2k-chrome", viRouteSlug: "chrome-thien-nien-ky", rendererExport: "Y2kChromeInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["y2k-chrome"],
  name: "Y2K Chrome", title: "Y2K Chrome Wedding Invitation | Thiệp Mừng Online",
  description: "A high-fashion chrome invitation with liquid ribbons and spectral reflections.",
  category: "Modern", color: "Silver",
  highlights: ["Liquid chrome ribbon sculpture", "Spectral cyan-coral reflections", "Oversized future typography"],
  artwork: "/chungdoi/images/themes/_decor/y2k-chrome/artwork.webp",
  outer: "#bfc2ca", card: "#e3e4e9", ink: "#23252b", muted: "rgba(35,37,43,0.58)", accent: "#006e9c", buttonText: "#f3f4f6",
  fontFamily: "SVN-HC Marvin Visions", particleType: "confetti", gallerySlug: "ticket-terracotta", music: "/chungdoi/music/ticket-terracotta.mp3",
  i18n: {
    vi: { name: "Chrome Thiên Niên Kỷ", description: "Thiệp cưới Y2K với dải chrome lỏng, phản xạ cyan-coral và chữ tương lai khổ lớn." },
    en: { name: "Y2K Chrome", description: "Liquid chrome ribbons and spectral cyan-coral reflections form a future-facing invitation." },
    ja: { name: "Y2Kクローム", description: "液体クロームとシアン、コーラルの反射で仕立てた未来的な招待状です。" },
    ko: { name: "Y2K 크롬", description: "리퀴드 크롬과 시안, 코랄 반사로 완성한 미래적인 청첩장입니다." },
    zh: { name: "千禧铬彩", description: "以液态铬带和青蓝、珊瑚色反射构成的未来感婚礼请柬。" },
  },
});
