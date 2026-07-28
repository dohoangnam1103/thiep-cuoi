import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "cinema-credit", viRouteSlug: "tua-phim-tinh-yeu", rendererExport: "CinemaCreditInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["cinema-credit"],
  name: "Cinema Credit", title: "Cinema Credit Wedding Invitation | Thiệp Mừng Online",
  description: "A cinematic invitation with a central aisle, tungsten light and credit-block typography.",
  category: "Modern", color: "Black",
  highlights: ["35mm theater atmosphere", "Central cinematic vanishing point", "Credit-block typography"],
  artwork: "/chungdoi/images/themes/_decor/cinema-credit/artwork.webp",
  outer: "#130f0d", card: "#17110f", ink: "#eee4d9", muted: "rgba(238,228,217,0.60)", accent: "#d49b5b", buttonText: "#17110f",
  fontFamily: "Lora", particleType: "sparkles", gallerySlug: "editorial-noir", music: "/chungdoi/music/editorial-noir.mp3",
  i18n: {
    vi: { name: "Tựa Phim Tình Yêu", description: "Thiệp cưới điện ảnh với lối rạp hội tụ, đèn tungsten và nhịp chữ credit." },
    en: { name: "Cinema Credit", description: "A central theater aisle, tungsten light and credit-block rhythm shape this invitation." },
    ja: { name: "恋のクレジット", description: "劇場の中央通路、タングステン光、映画クレジットのリズムで構成した招待状です。" },
    ko: { name: "러브 크레딧", description: "극장 중앙 통로와 텅스텐 조명, 영화 크레딧 리듬을 담은 청첩장입니다." },
    zh: { name: "爱情片尾", description: "以影院中央通道、钨丝灯光和电影字幕节奏构成的婚礼请柬。" },
  },
});
