import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "son-mai-lacquer",
  openingEffect: artOpeningEffects["son-mai-lacquer"],
  viRouteSlug: "son-mai-vang-son",
  rendererExport: "SonMaiLacquerInvitation",
  heroImageCount: 1,
  name: "Vietnamese Lacquer",
  title: "Vietnamese Lacquer Wedding Invitation | Thiệp Mừng Online",
  description: "A deep black lacquer invitation with gold leaf, cinnabar and eggshell inlay.",
  category: "Vietnamese Heritage",
  color: "Black",
  highlights: ["Original lacquer crane artwork", "Gold-leaf depth", "Eggshell crackle inlay"],
  artwork: "/chungdoi/images/themes/_decor/son-mai-lacquer/artwork.webp",
  outer: "#080706", card: "#100d09", ink: "#f3e4bd", muted: "rgba(243,228,189,0.65)", accent: "#d5a643", buttonText: "#100d09",
  fontFamily: "DFVN New Eddy", particleType: "sparkles", gallerySlug: "editorial-noir", music: "/chungdoi/music/editorial-noir.mp3",
  i18n: {
    vi: { name: "Sơn Mài Vàng Son", description: "Thiệp cưới sơn mài đen sâu với vàng quỳ, son đỏ và vỏ trứng rạn." },
  },
});
