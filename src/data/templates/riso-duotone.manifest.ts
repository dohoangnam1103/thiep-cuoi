import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "riso-duotone", viRouteSlug: "riso-hai-mau", rendererExport: "RisoDuotoneInvitation", heroImageCount: 2,
  openingEffect: artOpeningEffects["riso-duotone"],
  name: "Riso Duotone", title: "Riso Duotone Wedding Invitation | Thiệp Mừng Online",
  description: "A tactile two-ink invitation with halftone grain and imperfect registration.",
  category: "Modern", color: "Orange",
  highlights: ["Authentic two-ink overprint", "Halftone paper texture", "Playful misregistration"],
  artwork: "/chungdoi/images/themes/_decor/riso-duotone/artwork.webp",
  outer: "#deded7", card: "#e9e8df", ink: "#12383a", muted: "rgba(18,56,58,0.62)", accent: "#f04f3d", buttonText: "#f6f2e8",
  fontFamily: "SVN-HC Marvin Visions", particleType: "confetti", gallerySlug: "ticket-terracotta", music: "/chungdoi/music/ticket-terracotta.mp3",
  i18n: {
    vi: { name: "Riso Hai Màu", description: "Thiệp cưới in riso san hô và teal với hạt tram, lem mực và lệch bản có chủ ý." },
  },
});
