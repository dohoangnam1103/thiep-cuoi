import {
  createTemplateDemoContent,
  defineTemplateManifest,
} from "./template-manifest";

const slug = "editorial-noir";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "hac-ban-tin",
  rendererExport: "EditorialNoirInvitation",
  catalog: {
    name: "Editorial Noir",
    title: "Editorial Noir Wedding Invitation - Bold Magazine Layout | Thiệp Mừng Online",
    description: "A black, ivory and deep-red wedding invitation built like a collectible editorial issue.",
    category: "Modern",
    color: "Black",
    isNew: true,
    highlights: [
      "Asymmetric magazine-style typography",
      "Strong black, ivory and deep-red palette",
      "Structured ceremony and reception data layout",
    ],
  },
  theme: {
    theme: {
      background: "linear-gradient(145deg, #181818, #2a2927)",
      cardBg: "#f4f1ea",
      textPrimary: "#111111",
      textSecondary: "rgba(17, 17, 17, 0.72)",
      accent: "#8c1c13",
      dividerFrom: "transparent",
      dividerTo: "rgba(17, 17, 17, 0.45)",
      buttonBg: "#8c1c13",
      buttonText: "#f4f1ea",
      guestBoxBg: "rgba(140, 28, 19, 0.08)",
      guestBoxBorder: "rgba(17, 17, 17, 0.24)",
      particleColors: ["#8c1c13", "#f4f1ea", "#8d8a84"],
      particleType: "confetti",
    },
    fonts: {
      couple: "\"Playfair Display\", Georgia, serif",
      ampersand: null,
    },
    sealType: "heart",
    decorations: { cardImages: [] },
  },
  demoContent: createTemplateDemoContent({
    slug,
    primaryColor: "#8c1c13",
    fontFamily: "Playfair Display",
    music: "/chungdoi/music/editorial-noir.mp3",
  }),
  i18n: {
    vi: {
      name: "Hắc Bản Tin",
      description: "Thiệp cưới phong cách tạp chí với bố cục bất đối xứng, nền ngà và điểm nhấn đỏ trầm.",
    },
  },
  assets: [
    ...Array.from({ length: 8 }, (_, index) => `/chungdoi/images/gallery/${slug}/photo-${index + 1}.webp`),
    "/chungdoi/music/editorial-noir.mp3",
  ],
});
