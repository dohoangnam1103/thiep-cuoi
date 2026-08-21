import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "long-phung-deco",
  openingEffect: artOpeningEffects["long-phung-deco"],
  viRouteSlug: "long-phung-hinh-hoc",
  rendererExport: "LongPhungDecoInvitation",
  heroImageCount: 2,
  name: "Dragon Phoenix Deco",
  title: "Dragon Phoenix Art Deco Wedding Invitation | Thiệp Mừng Online",
  description: "A geometric dragon and phoenix crest with disciplined Art Deco structure.",
  category: "Vietnamese Heritage",
  color: "Red",
  highlights: ["Faceted dragon-phoenix crest", "Strict Art Deco geometry", "Oxblood and foil palette"],
  artwork: "/chungdoi/images/themes/_decor/long-phung-deco/artwork.webp",
  outer: "#420308", card: "#390106", ink: "#f6e5b6", muted: "rgba(246,229,182,0.64)", accent: "#d4a83f", buttonText: "#390106",
  fontFamily: "Fz Aghita", particleType: "sparkles", gallerySlug: "editorial-noir", music: "/chungdoi/music/editorial-noir.mp3",
  i18n: {
    vi: { name: "Long Phụng Hình Học", description: "Thiệp cưới long phụng Art Deco với hình khối sắc, đỏ oxblood và đường foil vàng." },
  },
});
