import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "chim-lac-ivory", viRouteSlug: "chim-lac-ngoc-nga", rendererExport: "ChimLacIvoryInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["chim-lac-ivory"],
  name: "Chim Lạc Ivory", title: "Chim Lạc Ivory Wedding Invitation | Thiệp Mừng Online",
  description: "An ivory paper invitation with a fine-line Đông Sơn drum silhouette and a cinnabar flock of Lạc birds.",
  category: "Minimal", color: "Ivory",
  highlights: ["Fine-line Đông Sơn drum silhouette", "Cinnabar Lạc bird flight arc", "Airy ivory paper frieze"],
  artwork: "/chungdoi/images/themes/_decor/chim-lac-ivory/artwork.webp",
  outer: "#e4d9c1", card: "#f4ecda", ink: "#3a2a1e", muted: "rgba(58,42,30,0.6)", accent: "#a8341f", buttonText: "#f8f1e1",
  fontFamily: "Fz Qellia", particleType: "petals", gallerySlug: "zen-sand", music: "/chungdoi/music/zen-sand.mp3",
  i18n: {
    vi: { name: "Chim Lạc Ngọc Ngà", description: "Thiệp cưới nền giấy ngà với dáng trống đồng nét mảnh và đàn chim Lạc màu son bay thành vòng cung." },
    en: { name: "Chim Lạc Ivory", description: "Ivory paper, a fine-line Đông Sơn drum silhouette and a cinnabar flock of Lạc birds in flight." },
    ja: { name: "ラック鳥・アイボリー", description: "アイボリーの紙に細線の銅鼓と朱色のラック鳥の群れを描いた招待状です。" },
    ko: { name: "락 새 아이보리", description: "아이보리 종이에 가는 선의 청동북과 주홍색 락 새 떼를 담은 청첩장입니다." },
    zh: { name: "貉鸟象牙白", description: "象牙白纸面，细线铜鼓剪影与朱红貉鸟结成飞行弧线的婚礼请柬。" },
  },
});
