import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "tho-cam-highland",
  openingEffect: artOpeningEffects["tho-cam-highland"],
  viRouteSlug: "tho-cam-vung-cao",
  rendererExport: "ThoCamHighlandInvitation",
  heroImageCount: 1,
  name: "Highland Brocade",
  title: "Vietnamese Highland Brocade Wedding Invitation | Thiệp Mừng Online",
  description: "A tactile indigo invitation shaped by original highland textile geometry.",
  category: "Vietnamese Heritage",
  color: "Blue",
  highlights: ["Handwoven textile texture", "Asymmetric geometric rhythm", "Indigo and turmeric palette"],
  artwork: "/chungdoi/images/themes/_decor/tho-cam-highland/artwork.webp",
  outer: "#071b2b", card: "#0d2940", ink: "#f7ead1", muted: "rgba(247,234,209,0.66)", accent: "#f0c56b", buttonText: "#0d2940",
  fontFamily: "SVN-HC Haydon Brush", particleType: "confetti", gallerySlug: "ticket-terracotta", music: "/chungdoi/music/ticket-terracotta.mp3",
  i18n: {
    vi: { name: "Thổ Cẩm Vùng Cao", description: "Thiệp cưới dệt indigo với nhịp hình học bất đối xứng và sắc chỉ vùng cao." },
    en: { name: "Highland Brocade", description: "An indigo wedding invitation built from original highland textile geometry." },
    ja: { name: "高地の織り", description: "藍色の織物と独自の幾何学模様で仕立てた招待状です。" },
    ko: { name: "고원 직조", description: "인디고 직물과 독창적인 기하 패턴으로 완성한 청첩장입니다." },
    zh: { name: "高地织锦", description: "以靛蓝织物和原创几何纹样构成的婚礼请柬。" },
  },
});
