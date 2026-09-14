import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "coastal-mediterranean", viRouteSlug: "bo-bien-dia-trung-hai", rendererExport: "CoastalMediterraneanInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["coastal-mediterranean"],
  name: "Mediterranean Coast", title: "Mediterranean Coastal Wedding Invitation | Thiệp Mừng Online",
  description: "A sunlit destination invitation in cobalt, limestone and olive green.",
  category: "Destination", color: "Blue",
  highlights: ["Sunlit limestone arches", "Cobalt ceramic marks", "Olive and sea palette"],
  artwork: "/chungdoi/images/themes/_decor/coastal-mediterranean/artwork.webp",
  outer: "#f0eee6", card: "#faf8f1", ink: "#173a5c", muted: "rgba(23,58,92,0.60)", accent: "#174da1", buttonText: "#faf8f1",
  fontFamily: "SVN-HC Pacifico", particleType: "leaves", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Bờ Biển Địa Trung Hải", description: "Thiệp cưới điểm đến với vòm đá vôi, nét gốm cobalt và nắng biển trong." },
  },
});
