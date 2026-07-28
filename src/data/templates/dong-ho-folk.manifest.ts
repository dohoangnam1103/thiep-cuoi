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
    en: { name: "Dong Ho Folk", description: "A vivid Vietnamese folk-print invitation on textured do paper." },
    ja: { name: "ドンホーの縁", description: "ドー紙の質感と天然顔料を生かしたベトナム民画風の招待状です。" },
    ko: { name: "동호 인연", description: "도 종이 질감과 자연 안료를 살린 베트남 민화풍 청첩장입니다." },
    zh: { name: "东湖良缘", description: "以竹纸肌理和天然色彩呈现的越南民间版画婚礼请柬。" },
  },
});
