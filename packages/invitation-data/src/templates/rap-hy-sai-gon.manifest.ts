import { createArtTemplateManifest } from "./art-template-manifest";
import { artOpeningEffects } from "./art-opening-effects";

export const manifest = createArtTemplateManifest({
  slug: "rap-hy-sai-gon", viRouteSlug: "rap-hy-sai-gon", rendererExport: "RapHySaiGonInvitation", heroImageCount: 1,
  openingEffect: artOpeningEffects["rap-hy-sai-gon"],
  name: "Saigon Wedding Stage", title: "Rạp Hỷ Sài Gòn Wedding Invitation | Thiệp Mừng Online",
  description: "A fearless Vietnamese wedding stage remixed with velvet curtains, marquee lights, chrome hearts, and pop color.",
  category: "Vietnamese Heritage", color: "Red",
  highlights: ["Vietnamese wedding-stage maximalism", "Animated velvet and marquee opening", "Bold pop-editorial storytelling"],
  artwork: "/chungdoi/images/themes/_decor/rap-hy-sai-gon/artwork.webp",
  outer: "radial-gradient(ellipse at 50% 42%, #ead99d 0%, #d4b65f 42%, #b4874d 74%, #855938 100%)", card: "#f0e2c6", ink: "#29211d", muted: "rgba(41,33,29,0.66)", accent: "#ad3f4a", buttonText: "#f0e2c6",
  fontFamily: "SVN-HC Marvin Visions", particleType: "hearts", gallerySlug: "ticket-terracotta", music: "/chungdoi/music/song-hy-red.mp3",
  i18n: {
    vi: { name: "Rạp Hỷ Sài Gòn", description: "Sân khấu tân hôn Việt được remix táo bạo với rèm nhung, đèn marquee, trái tim chrome và sắc màu pop." },
  },
});
