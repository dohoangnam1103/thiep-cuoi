import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "hoa-thu-xanh-duong", viRouteSlug: "hoa-thu-xanh-duong", rendererExport: "HoaThuXanhDuongInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["hoa-thu-xanh-duong"],
  name: "Hoa Thư Xanh Dương", title: "Hoa Thư Xanh Dương Wedding Invitation | Thiệp Mừng Online",
  description: "A classic floral arch crowned with indigo blooms framing the couple portrait.",
  category: "Floral", color: "Blue",
  highlights: ["Floral arch over the portrait", "Indigo blooms and teal sprigs", "Classic double-rule border"],
  artwork: "/chungdoi/images/themes/_decor/hoa-thu-xanh-duong/artwork.webp",
  outer: "#e5ecf5", card: "#f8fafd", ink: "#1e2c3f", muted: "rgba(30,44,63,0.6)", accent: "#33567f", buttonText: "#f8fafd",
  fontFamily: "Fz Qellia", particleType: "petals", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Hoa Thư Xanh Dương", description: "Thiệp cưới cổ điển với vòm hoa xanh dương ôm lấy ảnh cô dâu chú rể." },
  },
});
