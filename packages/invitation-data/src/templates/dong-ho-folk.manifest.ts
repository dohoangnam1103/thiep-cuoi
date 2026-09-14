import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "dong-ho-folk",
  openingEffect: artOpeningEffects["dong-ho-folk"],
  viRouteSlug: "dong-ho-dan-gian",
  rendererExport: "DongHoFolkInvitation",
  heroImageCount: 2,
  name: "Dong Ho Folk",
  title: "Dong Ho Folk Wedding Invitation | Thiệp Mừng Online",
  description: "An original Vietnamese folk-print invitation on textured do paper.",
  category: "Vietnamese Heritage",
  color: "Ochre",
  highlights: ["Original folk woodblock artwork", "Do-paper texture", "Bold natural-pigment palette"],
  artwork: "/chungdoi/images/themes/_decor/dong-ho-folk/artwork.webp",
  outer: "#d9c18e", card: "#f1ddb0", ink: "#263221", muted: "rgba(38,50,33,0.66)", accent: "#9d261e", buttonText: "#fff4dc",
  fontFamily: "UNI Chu truyen thong", particleType: "petals", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Đông Hồ Se Duyên", description: "Thiệp cưới dân gian trên nền giấy dó, màu điệp và nét khắc mộc đầy sức sống." },
  },
});
