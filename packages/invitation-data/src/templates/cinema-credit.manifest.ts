import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "cinema-credit", viRouteSlug: "tua-phim-tinh-yeu", rendererExport: "CinemaCreditInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["cinema-credit"],
  name: "Cinema Credit", title: "Cinema Credit Wedding Invitation | Thiệp Mừng Online",
  description: "A cinematic invitation with a central aisle, tungsten light and credit-block typography.",
  category: "Modern", color: "Black",
  highlights: ["35mm theater atmosphere", "Central cinematic vanishing point", "Credit-block typography"],
  artwork: "/chungdoi/images/themes/_decor/cinema-credit/artwork.webp",
  outer: "#130f0d", card: "#17110f", ink: "#eee4d9", muted: "rgba(238,228,217,0.60)", accent: "#d49b5b", buttonText: "#17110f",
  fontFamily: "Lora", particleType: "sparkles", gallerySlug: "editorial-noir", music: "/chungdoi/music/editorial-noir.mp3",
  i18n: {
    vi: { name: "Tựa Phim Tình Yêu", description: "Thiệp cưới điện ảnh với lối rạp hội tụ, đèn tungsten và nhịp chữ credit." },
  },
});
