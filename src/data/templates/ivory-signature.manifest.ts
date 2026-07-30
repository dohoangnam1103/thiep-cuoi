import { artOpeningEffects } from "./art-opening-effects";
import { createArtTemplateManifest } from "./art-template-manifest";

export const manifest = createArtTemplateManifest({
  slug: "ivory-signature", viRouteSlug: "dau-an-ngoc-nga", rendererExport: "IvorySignatureInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["ivory-signature"],
  name: "Ivory Signature", title: "Dấu Ấn Ngọc Ngà Wedding Invitation | Thiệp Mừng Online",
  description: "A European quiet-luxury invitation in warm ivory, olive, navy, and champagne.",
  category: "Minimal", color: "Ivory",
  highlights: ["Quiet-luxury ivory stationery", "Olive and navy tailoring", "Champagne seal opening"],
  artwork: "/chungdoi/images/themes/_decor/ivory-signature/artwork.webp",
  outer: "#f4f0e8", card: "#fbf8f0", ink: "#172437", muted: "rgba(23,36,55,0.58)", accent: "#66705a", buttonText: "#fbf8f0",
  fontFamily: "1FTV VIP Signora", particleType: "leaves", gallerySlug: "zen-sand", music: "/chungdoi/music/zen-sand.mp3",
  i18n: {
    vi: { name: "Dấu Ấn Ngọc Ngà", description: "Thiệp cưới tối giản châu Âu với giấy ngà ấm, sắc olive, navy và dấu niêm champagne." },
    en: { name: "Ivory Signature", description: "European quiet luxury in warm ivory, tailored olive and navy, finished with a champagne seal." },
    ja: { name: "アイボリー・シグネチャー", description: "温かなアイボリー、オリーブとネイビー、シャンパン色の封印で仕立てた静かな上質感の招待状です。" },
    ko: { name: "아이보리 시그니처", description: "따뜻한 아이보리와 올리브·네이비, 샴페인 씰로 완성한 유럽식 콰이어트 럭셔리 청첩장입니다." },
    zh: { name: "象牙印记", description: "以暖象牙白、橄榄绿、海军蓝与香槟金封印呈现欧洲静奢风格的婚礼请柬。" },
  },
});
