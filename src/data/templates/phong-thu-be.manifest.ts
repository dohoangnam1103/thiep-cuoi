import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "phong-thu-be", viRouteSlug: "phong-thu-be", rendererExport: "PhongThuBeInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["phong-thu-be"],
  name: "Phong Thư Be", title: "Phong Thư Be Wedding Invitation | Thiệp Mừng Online",
  description: "A soft modern invitation built from a sand-beige paper envelope and a bronze wax seal.",
  category: "Minimal", color: "Ivory",
  highlights: ["Folded paper envelope cover", "Bronze wax seal medallion", "Warm sand-beige stationery"],
  artwork: "/chungdoi/images/themes/_decor/phong-thu-be/artwork.webp",
  outer: "#f2ebdd", card: "#fdfaf4", ink: "#4a3a29", muted: "rgba(74,58,41,0.6)", accent: "#b08d5f", buttonText: "#fdfaf4",
  fontFamily: "The Nautigal", particleType: "petals", gallerySlug: "zen-sand", music: "/chungdoi/music/zen-sand.mp3",
  i18n: {
    vi: { name: "Phong Thư Be", description: "Thiệp cưới nhẹ nhàng hiện đại với phong bì giấy màu be và dấu sáp niêm đồng." },
  },
});
