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
    en: { name: "Hue Silk", description: "Flowing silk panels and court-weaving details shape a Hue-inspired invitation." },
    ja: { name: "フエの絹", description: "アオザイの流線と宮廷織りを紫の絹で表現した招待状です。" },
    ko: { name: "후에 실크", description: "아오자이의 곡선과 궁정 직조를 보랏빛 비단에 담은 청첩장입니다." },
    zh: { name: "顺化紫绸", description: "以奥黛曲线、宫廷织锦和紫色丝绸呈现的婚礼请柬。" },
  },
});
