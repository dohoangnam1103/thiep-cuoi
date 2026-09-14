import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "sen-monoline",
  openingEffect: artOpeningEffects["sen-monoline"],
  viRouteSlug: "sen-muc-mot-net",
  rendererExport: "SenMonolineInvitation",
  heroImageCount: 2,
  name: "Lotus Monoline",
  title: "Lotus Monoline Wedding Invitation | Thiệp Mừng Online",
  description: "A quiet lotus invitation drawn with one expressive ink language.",
  category: "Vietnamese Heritage",
  color: "White",
  highlights: ["Continuous ink-line lotus", "Celadon wash", "Generous paper space"],
  artwork: "/chungdoi/images/themes/_decor/sen-monoline/artwork.webp",
  outer: "#ebece7", card: "#f4f3ed", ink: "#28342e", muted: "rgba(40,52,46,0.58)", accent: "#a13d2d", buttonText: "#f4f3ed",
  fontFamily: "1FTV VIP Signora", particleType: "petals", gallerySlug: "zen-sand", music: "/chungdoi/music/zen-sand.mp3",
  i18n: {
    vi: { name: "Sen Mực Một Nét", description: "Thiệp cưới sen nét mực liên tục, màu rửa men ngọc và khoảng trắng tĩnh tại." },
  },
});
