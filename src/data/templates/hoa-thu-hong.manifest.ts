import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "hoa-thu-hong", viRouteSlug: "hoa-thu-hong", rendererExport: "HoaThuHongInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["hoa-thu-hong"],
  name: "Hoa Thư Hồng", title: "Hoa Thư Hồng Wedding Invitation | Thiệp Mừng Online",
  description: "A classic floral arch crowned with rose blooms framing the couple portrait.",
  category: "Floral", color: "Pink",
  highlights: ["Floral arch over the portrait", "Rose blooms and olive sprigs", "Classic double-rule border"],
  artwork: "/chungdoi/images/themes/_decor/hoa-thu-hong/artwork.webp",
  outer: "#f6e5ea", card: "#fdf8fa", ink: "#452431", muted: "rgba(69,36,49,0.6)", accent: "#b8607a", buttonText: "#fdf8fa",
  fontFamily: "Fz Qellia", particleType: "petals", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Hoa Thư Hồng", description: "Thiệp cưới cổ điển với vòm hoa hồng ôm lấy ảnh cô dâu chú rể." },
  },
});
