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
    en: { name: "Lotus Monoline", description: "Expressive ink lines and a restrained celadon wash frame a quiet invitation." },
    ja: { name: "一筆蓮", description: "一続きの墨線と淡い青磁色で蓮を描いた静かな招待状です。" },
    ko: { name: "한 줄 연꽃", description: "이어지는 먹선과 은은한 청자빛으로 연꽃을 그린 고요한 청첩장입니다." },
    zh: { name: "一线莲", description: "以连贯墨线和淡雅青瓷色描绘莲花的静谧婚礼请柬。" },
  },
});
