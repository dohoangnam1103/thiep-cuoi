import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "cong-la-dua-mien-tay",
  openingEffect: artOpeningEffects["cong-la-dua-mien-tay"],
  viRouteSlug: "cong-la-dua-mien-tay",
  rendererExport: "CongLaDuaMienTayInvitation",
  heroImageCount: 2,
  name: "Coconut Leaf Gate",
  title: "Coconut Leaf Gate Wedding Invitation | Thiệp Mừng Online",
  description: "A Mekong Delta wedding invitation framed by a woven coconut-leaf gate and ripe areca.",
  category: "Vietnamese Heritage",
  color: "Green",
  highlights: ["Woven coconut-leaf arch", "Ripe areca accents", "Mekong Delta yard palette"],
  artwork: "/chungdoi/images/themes/_decor/cong-la-dua-mien-tay/artwork.webp",
  outer: "#eef4e8",
  card: "#ffffff",
  ink: "#26402b",
  muted: "rgba(38,64,43,0.62)",
  accent: "#d98f3d",
  buttonText: "#ffffff",
  fontFamily: "1FTV VIP Signora",
  particleType: "leaves",
  gallerySlug: "arch-sage",
  music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: {
      name: "Cổng Cưới Lá Dừa",
      description: "Thiệp cưới miền Tây với cổng lá dừa đan tay, chữ song hỷ kết cau và sắc nắng sân vườn.",
    },
  },
});
