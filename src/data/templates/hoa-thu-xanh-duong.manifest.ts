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
    en: { name: "Hoa Thư Xanh Dương", description: "A classic floral arch of indigo blooms framing the couple portrait." },
    ja: { name: "花書・インディゴ", description: "藍色の花のアーチが新郎新婦の写真を囲む、古典的な招待状です。" },
    ko: { name: "화서 인디고", description: "인디고 꽃 아치가 신랑신부 사진을 감싸는 클래식 청첩장입니다." },
    zh: { name: "花书靛蓝", description: "靛蓝花拱门环绕新人照片的古典婚礼请柬。" },
  },
});
