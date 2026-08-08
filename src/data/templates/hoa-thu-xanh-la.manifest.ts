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
    en: { name: "Hoa Thư Xanh Lá", description: "A classic floral arch of forest-green foliage framing the couple portrait." },
    ja: { name: "花書・フォレストグリーン", description: "深緑の花と葉のアーチが新郎新婦の写真を囲む、古典的な招待状です。" },
    ko: { name: "화서 포레스트 그린", description: "짙은 초록 꽃과 잎 아치가 신랑신부 사진을 감싸는 클래식 청첩장입니다." },
    zh: { name: "花书森绿", description: "森绿花叶拱门环绕新人照片的古典婚礼请柬。" },
  },
});
