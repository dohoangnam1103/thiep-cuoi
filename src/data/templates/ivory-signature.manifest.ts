import { artOpeningEffects } from "./art-opening-effects";
import { createArtTemplateManifest } from "./art-template-manifest";

export const manifest = createArtTemplateManifest({
  slug: "ivory-signature", viRouteSlug: "dau-an-ngoc-nga", rendererExport: "IvorySignatureInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["ivory-signature"],
  name: "Ivory Signature", title: "Dấu Ấn Ngọc Ngà Wedding Invitation | Thiệp Mừng Online",
  description: "A European quiet-luxury invitation in warm ivory, olive, navy, and champagne.",
  category: "Minimal", color: "Ivory",
  highlights: ["Quiet-luxury ivory stationery", "Olive and navy tailoring", "Champagne seal opening"],
  artwork: "/chungdoi/images/themes/_decor/ivory-signature/artwork.webp",
  outer: "#f4f0e8", card: "#fbf8f0", ink: "#172437", muted: "rgba(23,36,55,0.58)", accent: "#66705a", buttonText: "#fbf8f0",
  fontFamily: "1FTV VIP Signora", particleType: "leaves", gallerySlug: "zen-sand", music: "/chungdoi/music/zen-sand.mp3",
  i18n: {
    vi: { name: "Dấu Ấn Ngọc Ngà", description: "Thiệp cưới tối giản châu Âu với giấy ngà ấm, sắc olive, navy và dấu niêm champagne." },
  },
});
