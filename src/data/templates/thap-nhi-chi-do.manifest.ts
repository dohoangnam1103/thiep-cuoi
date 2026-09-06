import {
  DEFAULT_ZODIAC_ART_COLOR,
  ZODIAC_IDS,
  zodiacArtworkPath,
} from "../../lib/zodiac";

import {
  createTemplateDemoContent,
  defineTemplateManifest,
} from "./template-manifest";

const slug = "thap-nhi-chi-do";
const artworkIds = [...ZODIAC_IDS, "phuong"] as const;
const zodiacArtworkAssets = artworkIds.flatMap((id) => [
  zodiacArtworkPath(id),
  zodiacArtworkPath(id, "line"),
]);

const baseDemoContent = createTemplateDemoContent({
  slug,
  primaryColor: DEFAULT_ZODIAC_ART_COLOR,
  fontFamily: "Fz Aghita",
  music: "/chungdoi/music/double-phoenix-red.mp3",
  galleryCount: 6,
  gallerySlug: "double-phoenix-red",
});

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "thap-nhi-chi-do",
  rendererExport: "ThapNhiChiInvitation", ceremonyRendering: "post-template",
  heroImageCount: 0,
  catalog: {
    name: "Vietnamese Zodiac Red",
    title: "Vietnamese Zodiac Red Wedding Invitation | Thiệp Mừng Online",
    description:
      "A lacquer-red wedding invitation pairing the bride and groom's Vietnamese zodiac animals in recolorable gold ornament.",
    category: "Vietnamese Zodiac",
    color: "Lacquer Red",
    isNew: true,
    highlights: [
      "Bride and groom zodiac artwork",
      "Twelve Vietnamese zodiac choices",
      "Recolorable lacquer-gold animal masks",
    ],
  },
  theme: {
    theme: {
      background: "linear-gradient(to bottom right, #710001, #5a0001, #450001)",
      cardBg: "rgba(255, 240, 231, 0.95)",
      textPrimary: "#710001",
      textSecondary: "rgba(113, 0, 1, 0.8)",
      accent: "#710001",
      dividerFrom: "transparent",
      dividerTo: "rgba(113, 0, 1, 0.5)",
      buttonBg: "#710001",
      buttonText: "#FFF0E7",
      guestBoxBg: "rgba(113, 0, 1, 0.1)",
      guestBoxBorder: "rgba(113, 0, 1, 0.25)",
      particleColors: ["#710001", "#8B0000", "#A52A2A", "#FFF0E7"],
      particleType: "happiness",
    },
    fonts: {
      couple: '"Fz Aghita", "Baskerville", "Times New Roman", serif',
      ampersand: null,
    },
    sealType: null,
    decorations: {
      cardImages: [
        {
          src: "{{brideZodiac}}",
          className:
            "w-[112px] md:w-[170px] top-[8px] left-[8px] md:top-[20px] md:left-[20px] opacity-90 rotate-3",
          flyOnOpen: true,
        },
        {
          src: "{{groomZodiac}}",
          className:
            "w-[112px] md:w-[170px] bottom-[8px] right-[8px] md:bottom-[20px] md:right-[20px] opacity-90 -scale-x-100 -rotate-3",
          flyOnOpen: true,
        },
        {
          src: "/chungdoi/images/themes/_decor/songphung-red/HOA.webp",
          className:
            "w-[120px] md:w-[160px] -bottom-[20px] -left-[20px] md:-bottom-[30px] md:-left-[30px] opacity-60",
          flyOnOpen: false,
        },
        {
          src: "/chungdoi/images/themes/_decor/songphung-red/HOA.webp",
          className:
            "w-[100px] md:w-[140px] -top-[15px] -right-[15px] md:-top-[20px] md:-right-[20px] opacity-60 rotate-180",
          flyOnOpen: false,
        },
      ],
    },
  },
  demoContent: {
    ...baseDemoContent,
    theme: {
      ...baseDemoContent.theme,
      assetFolder: "songphung-red",
    },
    couple: {
      ...baseDemoContent.couple,
      brideZodiac: "meo",
      groomZodiac: "rong",
      brideFirst: true,
    },
  },
  i18n: {
    vi: {
      name: "Thập Nhị Chi Đỏ",
      description:
        "Thiệp cưới sơn son với cặp linh vật con giáp Việt của cô dâu và chú rể, chạm vàng và đổi màu linh hoạt.",
    },
  },
  assets: [
    ...zodiacArtworkAssets,
    "/chungdoi/images/themes/songphung-red/NENGIAY.jpg",
    "/chungdoi/images/themes/songphung-red/HOA.webp",
    "/chungdoi/images/themes/songphung-red/CHU HY.webp",
    "/chungdoi/images/themes/_decor/songphung-red/HOA.webp",
    "/chungdoi/music/double-phoenix-red.mp3",
  ],
});
