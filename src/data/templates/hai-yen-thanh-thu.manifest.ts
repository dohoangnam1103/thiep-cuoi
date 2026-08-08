import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "hai-yen-thanh-thu", viRouteSlug: "hai-yen-thanh-thu", rendererExport: "HaiYenThanhThuInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["hai-yen-thanh-thu"],
  name: "Hải Yến Thanh Thư", title: "Hải Yến Thanh Thư Wedding Invitation | Thiệp Mừng Online",
  description: "A cream-paper invitation with a cerulean watercolour bay and a pair of sea swallows crossing the wash.",
  category: "Destination", color: "Blue",
  highlights: ["Paired sea swallows in flight", "Cerulean watercolour bay wash", "Warm cream letterpress paper"],
  artwork: "/chungdoi/images/themes/_decor/hai-yen-thanh-thu/artwork.webp",
  outer: "#f4f3ef", card: "#fdfbf7", ink: "#123a52", muted: "rgba(18,58,82,0.6)", accent: "#2d8fbe", buttonText: "#fdfbf7",
  fontFamily: "Alex Brush", particleType: "sparkles", gallerySlug: "arch-sage", music: "/chungdoi/music/arch-sage.mp3",
  i18n: {
    vi: { name: "Hải Yến Thanh Thư", description: "Thiệp cưới nền giấy kem với dải màu nước xanh lam và đôi chim én biển bay ngang vịnh." },
    en: { name: "Hải Yến Thanh Thư", description: "Cream paper, a cerulean watercolour bay and a pair of sea swallows crossing the wash." },
    ja: { name: "海燕・碧書", description: "クリーム色の紙に青い水彩の入り江と、湾を横切る二羽の海燕を描いた招待状です。" },
    ko: { name: "바다 제비 청서", description: "크림색 종이에 푸른 수채 물결과 만을 가로지르는 두 마리 바다 제비를 담은 청첩장입니다." },
    zh: { name: "海燕青书", description: "米白纸面，蔚蓝水彩海湾与一对掠过海面的海燕的婚礼请柬。" },
  },
});
