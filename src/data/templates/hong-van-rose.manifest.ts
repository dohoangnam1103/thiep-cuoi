import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "hong-van-rose",
  viRouteSlug: "hong-van-hoa-hong",
  rendererExport: "HongVanRoseInvitation",
  heroImageCount: 1,
  openingEffect: { ...artOpeningEffects["hoa-thu-do-ruou-vang"], id: "hong-van-rose-layered-opening" },
  name: "Hồng Vân",
  title: "Hồng Vân - Thiệp cưới hoa hồng đỏ | Thiệp Mừng Online",
  description: "Thiệp cưới đỏ nhung với hoa hồng đỏ, viền vàng champagne và bố cục dọc tinh tế.",
  category: "Floral",
  color: "Red",
  highlights: ["Hoa hồng đỏ nổi bật", "Bố cục một cột dễ đọc", "Responsive ngang và dọc"],
  artwork: "/chungdoi/images/themes/_decor/brocade-flower-red/hoa-hong.webp",
  outer: "#4b0710",
  card: "#fbf4e8",
  ink: "#5b1019",
  muted: "rgba(91,16,25,0.66)",
  accent: "#a82432",
  buttonText: "#fff7eb",
  fontFamily: "Viaoda Libre",
  particleType: "petals",
  gallerySlug: "editorial-noir",
  music: "/chungdoi/music/crystal-floral-red.mp3",
  i18n: {
    vi: {
      name: "Hồng Vân",
      description: "Thiệp cưới đỏ nhung với hoa hồng đỏ và bố cục một cột thanh lịch.",
    },
  },
});
