import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "ao-dai-hue",
  openingEffect: artOpeningEffects["ao-dai-hue"],
  viRouteSlug: "ao-dai-hue-tim",
  rendererExport: "AoDaiHueInvitation",
  heroImageCount: 1,
  name: "Hue Silk",
  title: "Hue Silk Ao Dai Wedding Invitation | Thiệp Mừng Online",
  description: "A flowing silk invitation inspired by Hue ao dai and court weaving.",
  category: "Vietnamese Heritage",
  color: "Purple",
  highlights: ["Flowing ao-dai silk panels", "Court-weaving details", "Imperial violet palette"],
  artwork: "/chungdoi/images/themes/_decor/ao-dai-hue/artwork.webp",
  outer: "#2e1730", card: "#3b1c3d", ink: "#fae6cf", muted: "rgba(250,230,207,0.64)", accent: "#d9ad73", buttonText: "#2e1730",
  fontFamily: "The Nautigal", particleType: "flowers", gallerySlug: "ticket-terracotta", music: "/chungdoi/music/ticket-terracotta.mp3",
  i18n: {
    vi: { name: "Áo Dài Huế Tím", description: "Thiệp cưới lụa tím Huế với đường tà áo, gấm cung đình và chỉ kim tuyến tiết chế." },
  },
});
