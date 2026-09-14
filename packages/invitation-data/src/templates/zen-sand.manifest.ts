import {
  createTemplateDemoContent,
  defineTemplateManifest,
} from "./template-manifest";

const slug = "zen-sand";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "tinh-sa",
  rendererExport: "ZenSandInvitation", ceremonyRendering: "post-template",
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
  },
  assets: [
    ...Array.from({ length: 8 }, (_, index) => `/chungdoi/images/gallery/${slug}/photo-${index + 1}.webp`),
    "/chungdoi/music/zen-sand.mp3",
  ],
});
