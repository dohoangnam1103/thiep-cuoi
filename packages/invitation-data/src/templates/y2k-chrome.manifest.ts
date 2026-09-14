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
  },
});
