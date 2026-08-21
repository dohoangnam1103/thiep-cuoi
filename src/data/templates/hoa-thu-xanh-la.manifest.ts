import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "hoa-thu-xanh-la", viRouteSlug: "hoa-thu-xanh-la", rendererExport: "HoaThuXanhLaInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["hoa-thu-xanh-la"],
  name: "Hoa Thư Xanh Lá", title: "Hoa Thư Xanh Lá Wedding Invitation | Thiệp Mừng Online",
  description: "A classic floral arch crowned with forest-green foliage framing the couple portrait.",
  category: "Floral", color: "Green",
  highlights: ["Floral arch over the portrait", "Forest-green blooms and sprigs", "Classic double-rule border"],
  artwork: "/chungdoi/images/themes/_decor/hoa-thu-xanh-la/artwork.webp",
  outer: "#e9efe4", card: "#fbfcf8", ink: "#22321f", muted: "rgba(34,50,31,0.6)", accent: "#3f6b4f", buttonText: "#fbfcf8",
  fontFamily: "Fz Qellia", particleType: "leaves", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Hoa Thư Xanh Lá", description: "Thiệp cưới cổ điển với vòm hoa lá xanh rừng ôm lấy ảnh cô dâu chú rể." },
  },
});
