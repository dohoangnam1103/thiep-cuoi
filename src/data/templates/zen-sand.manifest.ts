import {
  createTemplateDemoContent,
  defineTemplateManifest,
} from "./template-manifest";

const slug = "zen-sand";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "tinh-sa",
  rendererExport: "ZenSandInvitation",
  catalog: {
    name: "Zen Sand",
    title: "Zen Sand Wedding Invitation - Quiet Japanese Minimalism | Thiệp Mừng Online",
    description: "A restrained sand-toned invitation with an enso mark, quiet spacing and ceremonial calm.",
    category: "Minimal",
    color: "White",
    isNew: true,
    highlights: [
      "Enso-inspired focal mark",
      "Quiet, spacious single-column rhythm",
      "Soft washi and seal-red palette",
    ],
  },
  theme: {
    theme: {
      background: "linear-gradient(145deg, #cbc4b8, #e2ddd5)",
      cardBg: "#f7f4ee",
      textPrimary: "#2c2a26",
      textSecondary: "rgba(44, 42, 38, 0.7)",
      accent: "#8c3b2f",
      dividerFrom: "transparent",
      dividerTo: "rgba(44, 42, 38, 0.35)",
      buttonBg: "#8c3b2f",
      buttonText: "#f7f4ee",
      guestBoxBg: "rgba(44, 42, 38, 0.06)",
      guestBoxBorder: "rgba(44, 42, 38, 0.2)",
      particleColors: ["#8c3b2f", "#d9d2c7", "#f7f4ee"],
      particleType: "petals",
    },
    fonts: {
      couple: "\"Noto Serif JP\", Georgia, serif",
      ampersand: null,
    },
    sealType: "heart",
    decorations: { cardImages: [] },
  },
  demoContent: createTemplateDemoContent({
    slug,
    primaryColor: "#8c3b2f",
    fontFamily: "Noto Serif JP",
    music: "/chungdoi/music/zen-sand.mp3",
  }),
  i18n: {
    vi: {
      name: "Tĩnh Sa",
      description: "Thiệp cưới tối giản với nền cát, khoảng thở rộng và dấu mực ensō tĩnh tại.",
    },
    en: {
      name: "Zen Sand",
      description: "A quiet sand-toned invitation with spacious rhythm and an enso ink mark.",
    },
    ja: {
      name: "禅の砂",
      description: "砂色の余白と円相の墨跡で静けさを表現した招待状です。",
    },
    ko: {
      name: "젠 샌드",
      description: "모래빛 여백과 엔소 먹선으로 고요함을 담은 청첩장입니다.",
    },
    zh: {
      name: "静砂",
      description: "以沙色留白和圆相墨迹表达宁静的婚礼请柬。",
    },
  },
  assets: [
    ...Array.from({ length: 8 }, (_, index) => `/chungdoi/images/gallery/${slug}/photo-${index + 1}.webp`),
    "/chungdoi/music/zen-sand.mp3",
  ],
});
