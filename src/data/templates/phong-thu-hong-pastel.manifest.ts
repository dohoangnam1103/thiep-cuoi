import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "phong-thu-hong-pastel", viRouteSlug: "phong-thu-hong-pastel", rendererExport: "PhongThuHongPastelInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["phong-thu-hong-pastel"],
  name: "Phong Thư Hồng Pastel", title: "Phong Thư Hồng Pastel Wedding Invitation | Thiệp Mừng Online",
  description: "A soft modern invitation built from a blush paper envelope and a rosewood wax seal.",
  category: "Minimal", color: "Pink",
  highlights: ["Folded paper envelope cover", "Rosewood wax seal medallion", "Blush pink stationery"],
  artwork: "/chungdoi/images/themes/_decor/phong-thu-hong-pastel/artwork.webp",
  outer: "#f7e8ee", card: "#fdf8fa", ink: "#4a2b36", muted: "rgba(74,43,54,0.6)", accent: "#b8748c", buttonText: "#fdf8fa",
  fontFamily: "Fz Aghita", particleType: "petals", gallerySlug: "zen-sand", music: "/chungdoi/music/zen-sand.mp3",
  i18n: {
    vi: { name: "Phong Thư Hồng Pastel", description: "Thiệp cưới nhẹ nhàng hiện đại với phong bì giấy hồng pastel và dấu sáp niêm hồng trầm." },
  },
});
