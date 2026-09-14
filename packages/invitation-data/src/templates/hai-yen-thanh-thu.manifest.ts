import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "hai-yen-thanh-thu", viRouteSlug: "hai-yen-thanh-thu", rendererExport: "HaiYenThanhThuInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["hai-yen-thanh-thu"],
  name: "Hải Yến Thanh Thư", title: "Hải Yến Thanh Thư Wedding Invitation | Thiệp Mừng Online",
  description: "A cream-paper invitation with a cerulean watercolour bay and a pair of sea swallows crossing the wash.",
  category: "Destination", color: "Blue",
  highlights: ["Paired sea swallows in flight", "Cerulean watercolour bay wash", "Warm cream letterpress paper"],
  artwork: "/chungdoi/images/themes/_decor/hai-yen-thanh-thu/artwork.webp",
  outer: "#f4f3ef", card: "#fdfbf7", ink: "#123a52", muted: "rgba(18,58,82,0.6)", accent: "#2d8fbe", buttonText: "#fdfbf7",
  fontFamily: "Alex Brush", particleType: "sparkles", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Hải Yến Thanh Thư", description: "Thiệp cưới nền giấy kem với dải màu nước xanh lam và đôi chim én biển bay ngang vịnh." },
  },
});
