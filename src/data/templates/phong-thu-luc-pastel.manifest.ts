import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "phong-thu-luc-pastel", viRouteSlug: "phong-thu-luc-pastel", rendererExport: "PhongThuLucPastelInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["phong-thu-luc-pastel"],
  name: "Phong Thư Lục Pastel", title: "Phong Thư Lục Pastel Wedding Invitation | Thiệp Mừng Online",
  description: "A soft modern invitation built from a pastel sage paper envelope and a green wax seal.",
  category: "Minimal", color: "Green",
  highlights: ["Folded paper envelope cover", "Sage wax seal medallion", "Pastel eucalyptus stationery"],
  artwork: "/chungdoi/images/themes/_decor/phong-thu-luc-pastel/artwork.webp",
  outer: "#eaf1e8", card: "#fbfcf9", ink: "#2f4238", muted: "rgba(47,66,56,0.6)", accent: "#6f8f76", buttonText: "#fbfcf9",
  fontFamily: "Lora", particleType: "leaves", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Phong Thư Lục Pastel", description: "Thiệp cưới nhẹ nhàng hiện đại với phong bì giấy xanh lá pastel và dấu sáp niêm xanh." },
  },
});
