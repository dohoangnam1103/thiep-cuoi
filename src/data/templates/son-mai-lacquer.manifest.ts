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
    en: { name: "Vietnamese Lacquer", description: "Deep black lacquer, gold leaf and eggshell inlay form a ceremonial invitation." },
    ja: { name: "ベトナム漆", description: "黒漆、金箔、卵殻のひび模様で仕立てた格調高い招待状です。" },
    ko: { name: "베트남 옻칠", description: "깊은 흑칠과 금박, 난각 균열로 완성한 격조 있는 청첩장입니다." },
    zh: { name: "越南漆艺", description: "以深黑漆面、金箔和蛋壳裂纹打造的典礼感婚礼请柬。" },
  },
});
