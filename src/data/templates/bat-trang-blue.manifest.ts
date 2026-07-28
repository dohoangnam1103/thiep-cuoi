import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "bat-trang-blue",
  openingEffect: artOpeningEffects["bat-trang-blue"],
  viRouteSlug: "gom-bat-trang-lam",
  rendererExport: "BatTrangBlueInvitation",
  heroImageCount: 2,
  name: "Bat Trang Blue",
  title: "Bat Trang Blue and White Wedding Invitation | Thiệp Mừng Online",
  description: "A cobalt underglaze invitation inspired by Bat Trang ceramic brushwork.",
  category: "Vietnamese Heritage",
  color: "Blue",
  highlights: ["Cobalt ceramic medallion", "Kiln-fired glaze texture", "Airy porcelain composition"],
  artwork: "/chungdoi/images/themes/_decor/bat-trang-blue/artwork.webp",
  outer: "#e8e4da", card: "#f7f5ef", ink: "#123d73", muted: "rgba(18,61,115,0.62)", accent: "#164a8a", buttonText: "#f7f5ef",
  fontFamily: "Fz Qellia", particleType: "petals", gallerySlug: "zen-sand", music: "/chungdoi/music/zen-sand.mp3",
  i18n: {
    vi: { name: "Gốm Bát Tràng Lam", description: "Thiệp cưới lam trắng với nét cọ men cobalt, cánh én và sen trên nền sứ rạn." },
    en: { name: "Bat Trang Blue", description: "Cobalt brushwork and a softly crazed porcelain ground shape this invitation." },
    ja: { name: "バッチャン青花", description: "コバルトの筆致と貫入釉を生かした青花磁器風の招待状です。" },
    ko: { name: "밧짱 청화", description: "코발트 붓결과 빙렬 유약을 살린 청화 도자기풍 청첩장입니다." },
    zh: { name: "钵场青花", description: "以钴蓝笔触和开片釉面呈现的青花陶瓷婚礼请柬。" },
  },
});
