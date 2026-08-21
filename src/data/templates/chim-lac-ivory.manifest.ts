import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "chim-lac-ivory", viRouteSlug: "chim-lac-ngoc-nga", rendererExport: "ChimLacIvoryInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["chim-lac-ivory"],
  name: "Chim Lạc Ivory", title: "Chim Lạc Ivory Wedding Invitation | Thiệp Mừng Online",
  description: "An ivory paper invitation with a fine-line Đông Sơn drum silhouette and a cinnabar flock of Lạc birds.",
  category: "Minimal", color: "Ivory",
  highlights: ["Fine-line Đông Sơn drum silhouette", "Cinnabar Lạc bird flight arc", "Airy ivory paper frieze"],
  artwork: "/chungdoi/images/themes/_decor/chim-lac-ivory/artwork.webp",
  outer: "#e4d9c1", card: "#f4ecda", ink: "#3a2a1e", muted: "rgba(58,42,30,0.6)", accent: "#a8341f", buttonText: "#f8f1e1",
  fontFamily: "Fz Qellia", particleType: "petals", gallerySlug: "zen-sand", music: "/chungdoi/music/zen-sand.mp3",
  i18n: {
    vi: { name: "Chim Lạc Ngọc Ngà", description: "Thiệp cưới nền giấy ngà với dáng trống đồng nét mảnh và đàn chim Lạc màu son bay thành vòng cung." },
  },
});
