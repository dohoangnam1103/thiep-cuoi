import {
  createTemplateDemoContent,
  defineTemplateManifest,
} from "./template-manifest";

const slug = "arch-sage";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "vom-xanh-thao-moc",
  rendererExport: "ArchSageInvitation",
  ceremonyRendering: "post-template",
  catalog: {
    name: "Arch Sage",
    title: "Arch Sage Wedding Invitation - Layered Botanical Arches | Thiệp Mừng Online",
    description: "A botanical sage invitation built from layered arches, framed portraits and soft depth.",
    category: "Botanical",
    color: "Green",
    isNew: true,
    highlights: [
      "Layered architectural arch system",
      "Arch-cropped wedding photography",
      "Sage, cream and forest-green palette",
    ],
  },
  theme: {
    theme: {
      background: "linear-gradient(145deg, #263124, #435440)",
      cardBg: "#fbfcf9",
      textPrimary: "#33402f",
      textSecondary: "rgba(51, 64, 47, 0.72)",
      accent: "#6b7f6a",
      dividerFrom: "transparent",
      dividerTo: "rgba(107, 127, 106, 0.45)",
      buttonBg: "#33402f",
      buttonText: "#fbfcf9",
      guestBoxBg: "rgba(107, 127, 106, 0.08)",
      guestBoxBorder: "rgba(107, 127, 106, 0.3)",
      particleColors: ["#6b7f6a", "#aab9a6", "#fbfcf9"],
      particleType: "leaves",
    },
    fonts: {
      couple: "\"Cormorant Garamond\", Georgia, serif",
      ampersand: null,
    },
    sealType: "heart",
    decorations: { cardImages: [] },
  },
  demoContent: createTemplateDemoContent({
    slug,
    primaryColor: "#6b7f6a",
    fontFamily: "Cormorant Garamond",
    music: "/chungdoi/music/arch-sage.mp3",
  }),
  i18n: {
    vi: {
      name: "Vòm Xanh Thảo Mộc",
      description: "Thiệp cưới xanh thảo mộc với hệ vòm xếp lớp, ảnh chân dung bo vòm và chiều sâu nhẹ.",
    },
  },
  assets: [
    ...Array.from({ length: 8 }, (_, index) => `/chungdoi/images/gallery/${slug}/photo-${index + 1}.webp`),
    "/chungdoi/music/arch-sage.mp3",
  ],
});
