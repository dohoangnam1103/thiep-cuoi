import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "tho-cam-highland",
  openingEffect: artOpeningEffects["tho-cam-highland"],
  viRouteSlug: "tho-cam-vung-cao",
  rendererExport: "ThoCamHighlandInvitation",
  heroImageCount: 1,
  name: "Highland Brocade",
  title: "Vietnamese Highland Brocade Wedding Invitation | Thiệp Mừng Online",
  description: "A tactile indigo invitation shaped by original highland textile geometry.",
  category: "Vietnamese Heritage",
  color: "Blue",
  highlights: ["Handwoven textile texture", "Asymmetric geometric rhythm", "Indigo and turmeric palette"],
  artwork: "/chungdoi/images/themes/_decor/tho-cam-highland/artwork.webp",
  outer: "#071b2b", card: "#0d2940", ink: "#f7ead1", muted: "rgba(247,234,209,0.66)", accent: "#f0c56b", buttonText: "#0d2940",
  fontFamily: "SVN-HC Haydon Brush", particleType: "confetti", gallerySlug: "ticket-terracotta", music: "/chungdoi/music/ticket-terracotta.mp3",
  i18n: {
    vi: { name: "Thổ Cẩm Vùng Cao", description: "Thiệp cưới dệt indigo với nhịp hình học bất đối xứng và sắc chỉ vùng cao." },
  },
});
