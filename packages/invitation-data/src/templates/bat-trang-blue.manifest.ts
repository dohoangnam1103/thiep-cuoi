import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "bat-trang-blue",
  openingEffect: artOpeningEffects["bat-trang-blue"],
  viRouteSlug: "gom-bat-trang-lam",
  rendererExport: "BatTrangBlueInvitation",
  heroImageCount: 2,
  name: "Bat Trang Blue",
  title: "Bat Trang Blue and White Wedding Invitation | Thiệp Mừng Online",
  description: "A cobalt underglaze invitation inspired by Bat Trang ceramic brushwork.",
  category: "Vietnamese Heritage",
  color: "Blue",
  highlights: ["Cobalt ceramic medallion", "Kiln-fired glaze texture", "Airy porcelain composition"],
  artwork: "/chungdoi/images/themes/_decor/bat-trang-blue/artwork.webp",
  outer: "#e8e4da", card: "#f7f5ef", ink: "#123d73", muted: "rgba(18,61,115,0.62)", accent: "#164a8a", buttonText: "#f7f5ef",
  fontFamily: "Fz Qellia", particleType: "petals", gallerySlug: "zen-sand", music: "/chungdoi/music/zen-sand.mp3",
  i18n: {
    vi: { name: "Gốm Bát Tràng Lam", description: "Thiệp cưới lam trắng với nét cọ men cobalt, cánh én và sen trên nền sứ rạn." },
  },
});
