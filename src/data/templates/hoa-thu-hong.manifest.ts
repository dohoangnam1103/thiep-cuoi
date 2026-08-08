import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "hoa-thu-hong", viRouteSlug: "hoa-thu-hong", rendererExport: "HoaThuHongInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["hoa-thu-hong"],
  name: "Hoa Thư Hồng", title: "Hoa Thư Hồng Wedding Invitation | Thiệp Mừng Online",
  description: "A classic floral arch crowned with rose blooms framing the couple portrait.",
  category: "Floral", color: "Pink",
  highlights: ["Floral arch over the portrait", "Rose blooms and olive sprigs", "Classic double-rule border"],
  artwork: "/chungdoi/images/themes/_decor/hoa-thu-hong/artwork.webp",
  outer: "#f6e5ea", card: "#fdf8fa", ink: "#452431", muted: "rgba(69,36,49,0.6)", accent: "#b8607a", buttonText: "#fdf8fa",
  fontFamily: "Fz Qellia", particleType: "petals", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Hoa Thư Hồng", description: "Thiệp cưới cổ điển với vòm hoa hồng ôm lấy ảnh cô dâu chú rể." },
    en: { name: "Hoa Thư Hồng", description: "A classic floral arch of rose blooms framing the couple portrait." },
    ja: { name: "花書・ローズ", description: "ローズの花のアーチが新郎新婦の写真を囲む、古典的な招待状です。" },
    ko: { name: "화서 로즈", description: "로즈 꽃 아치가 신랑신부 사진을 감싸는 클래식 청첩장입니다." },
    zh: { name: "花书玫粉", description: "玫粉花拱门环绕新人照片的古典婚礼请柬。" },
  },
});
