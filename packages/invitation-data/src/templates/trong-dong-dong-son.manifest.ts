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
  },
});
