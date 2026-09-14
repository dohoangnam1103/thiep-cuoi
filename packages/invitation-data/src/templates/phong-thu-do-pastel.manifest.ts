import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "phong-thu-do-pastel", viRouteSlug: "phong-thu-do-pastel", rendererExport: "PhongThuDoPastelInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["phong-thu-do-pastel"],
  name: "Phong Thư Đỏ Pastel", title: "Phong Thư Đỏ Pastel Wedding Invitation | Thiệp Mừng Online",
  description: "A soft modern invitation built from a dusty terracotta paper envelope and a clay wax seal.",
  category: "Minimal", color: "Red",
  highlights: ["Folded paper envelope cover", "Clay wax seal medallion", "Dusty terracotta stationery"],
  artwork: "/chungdoi/images/themes/_decor/phong-thu-do-pastel/artwork.webp",
  outer: "#f6e6e1", card: "#fdf8f6", ink: "#4d2a26", muted: "rgba(77,42,38,0.6)", accent: "#b5695f", buttonText: "#fdf8f6",
  fontFamily: "1FTV VIP Signora", particleType: "petals", gallerySlug: "ticket-terracotta", music: "/chungdoi/music/ticket-terracotta.mp3",
  i18n: {
    vi: { name: "Phong Thư Đỏ Pastel", description: "Thiệp cưới nhẹ nhàng hiện đại với phong bì giấy đỏ pastel và dấu sáp niêm đất nung." },
  },
});
