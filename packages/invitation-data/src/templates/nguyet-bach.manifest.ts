import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "nguyet-bach",
  openingEffect: artOpeningEffects["nguyet-bach"],
  viRouteSlug: "nguyet-bach-ivory",
  rendererExport: "NguyetBachInvitation",
  heroImageCount: 2,
  name: "Nguyet Bach Ivory",
  title: "Nguyet Bach Ivory Wedding Invitation | Thiệp Mừng Online",
  description: "A quiet-luxury wedding invitation on ivory paper with a blind-embossed monogram and thin champagne edge.",
  category: "Minimal",
  color: "Ivory",
  highlights: ["Blind-embossed monogram", "Ivory cotton paper", "Thin champagne edge"],
  artwork: "/chungdoi/images/themes/_decor/nguyet-bach/artwork.webp",
  outer: "#e9e4dc",
  card: "#f6f1e8",
  ink: "#292724",
  muted: "rgba(41,39,36,0.66)",
  accent: "#b89b67",
  buttonText: "#f6f1e8",
  fontFamily: "Lora",
  particleType: "flowers",
  gallerySlug: "zen-sand",
  music: "/chungdoi/music/jasmine-white.mp3",
  i18n: {
    vi: {
      name: "Nguyệt Bạch Ivory",
      description: "Thiệp cưới sang trọng tiết chế trên giấy ivory, monogram dập chìm và viền champagne mảnh.",
    },
  },
});
