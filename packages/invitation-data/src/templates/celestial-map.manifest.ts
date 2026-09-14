import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "celestial-map", viRouteSlug: "ban-do-tinh-tuc", rendererExport: "CelestialMapInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["celestial-map"],
  name: "Celestial Map", title: "Celestial Star Map Wedding Invitation | Thiệp Mừng Online",
  description: "Two constellation paths meet beneath a restrained lunar sequence.",
  category: "Modern", color: "Blue",
  highlights: ["Paired constellation paths", "Silver astronomical engraving", "Ink-navy night palette"],
  artwork: "/chungdoi/images/themes/_decor/celestial-map/artwork.webp",
  outer: "#07192c", card: "#0b2138", ink: "#ecf0f5", muted: "rgba(236,240,245,0.62)", accent: "#d2b28c", buttonText: "#07192c",
  fontFamily: "Alex Brush", particleType: "sparkles", gallerySlug: "editorial-noir", music: "/chungdoi/music/editorial-noir.mp3",
  i18n: {
    vi: { name: "Bản Đồ Tinh Túc", description: "Thiệp cưới thiên văn với hai đường chòm sao gặp nhau dưới nhịp pha trăng." },
  },
});
