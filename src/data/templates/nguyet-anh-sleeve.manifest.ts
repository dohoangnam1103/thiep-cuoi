import { nguyetAnhSleevePilotContent } from "../nguyet-anh-sleeve-pilot";
import { defineTemplateManifest } from "./template-manifest";

const slug = "nguyet-anh-sleeve";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "nguyet-anh-sleeve",
  rendererExport: "NguyetAnhSleeveInvitation",
  heroImageCount: 2,
  catalog: {
    name: "Nguyệt Ảnh Sleeve",
    title: "Nguyệt Ảnh Sleeve Wedding Invitation | Thiệp Mừng Online",
    description:
      "Thiệp cưới Three.js dạng film sleeve kính khói, mở bằng chuyển động rút film card và contact sheet phòng tối.",
    category: "Modern",
    color: "Silver",
    isNew: true,
    highlights: [
      "Smoked-glass sleeve và film card hai mặt",
      "Aperture release, pull-out và camera handoff mượt",
      "Contact-sheet gallery với photogram sen ánh bạc",
    ],
  },
  theme: {
    theme: {
      background: "#0B1116",
      cardBg: "#14232D",
      textPrimary: "#D7E4EA",
      textSecondary: "rgba(215, 228, 234, 0.68)",
      accent: "#78C7D7",
      dividerFrom: "transparent",
      dividerTo: "rgba(120, 199, 215, 0.42)",
      buttonBg: "#78C7D7",
      buttonText: "#071015",
      guestBoxBg: "rgba(20, 35, 45, 0.72)",
      guestBoxBorder: "rgba(215, 228, 234, 0.18)",
      particleColors: ["#78C7D7", "#D7E4EA", "#14232D"],
      particleType: "none",
    },
    fonts: {
      couple: '"HelveticaNeue", "Be Vietnam Pro", sans-serif',
      ampersand: null,
    },
    sealType: null,
    decorations: { cardImages: [] },
  },
  demoContent: nguyetAnhSleevePilotContent,
  i18n: {
    vi: {
      name: "Nguyệt Ảnh Sleeve",
      description:
        "Thiệp film sleeve kính khói với photogram sen ánh bạc và khoảnh khắc rút card liên tục.",
    },
  },
  assets: [
    "/chungdoi/templates/nguyet-anh-sleeve/source/lotus-photogram-master-v1.png",
    "/chungdoi/templates/nguyet-anh-sleeve/cover/lotus-photogram-v1.webp",
    "/chungdoi/templates/nguyet-anh-sleeve/cover/lotus-photogram-v1.mobile.webp",
    "/chungdoi/templates/nguyet-anh-sleeve/asset-manifest.json",
    "/chungdoi/music/editorial-noir.mp3",
  ],
});
