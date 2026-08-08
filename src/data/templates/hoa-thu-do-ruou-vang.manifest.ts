import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "hoa-thu-do-ruou-vang", viRouteSlug: "hoa-thu-do-ruou-vang", rendererExport: "HoaThuDoRuouVangInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["hoa-thu-do-ruou-vang"],
  name: "Hoa Thư Đỏ Rượu Vang", title: "Hoa Thư Đỏ Rượu Vang Wedding Invitation | Thiệp Mừng Online",
  description: "A classic floral arch crowned with wine-red blooms framing the couple portrait.",
  category: "Floral", color: "Red",
  highlights: ["Floral arch over the portrait", "Wine-red blooms and sage sprigs", "Classic double-rule border"],
  artwork: "/chungdoi/images/themes/_decor/hoa-thu-do-ruou-vang/artwork.webp",
  outer: "#f4e7e0", card: "#fdf8f4", ink: "#3a1d24", muted: "rgba(58,29,36,0.6)", accent: "#7b2b3a", buttonText: "#fdf8f4",
  fontFamily: "Fz Qellia", particleType: "petals", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Hoa Thư Đỏ Rượu Vang", description: "Thiệp cưới cổ điển với vòm hoa đỏ rượu vang ôm lấy ảnh cô dâu chú rể." },
    en: { name: "Hoa Thư Đỏ Rượu Vang", description: "A classic floral arch of wine-red blooms framing the couple portrait." },
    ja: { name: "花書・ワインレッド", description: "ワインレッドの花のアーチが新郎新婦の写真を囲む、古典的な招待状です。" },
    ko: { name: "화서 와인 레드", description: "와인 레드 꽃 아치가 신랑신부 사진을 감싸는 클래식 청첩장입니다." },
    zh: { name: "花书酒红", description: "酒红花拱门环绕新人照片的古典婚礼请柬。" },
  },
});
