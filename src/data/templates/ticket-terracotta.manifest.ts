import {
  createTemplateDemoContent,
  defineTemplateManifest,
} from "./template-manifest";

const slug = "ticket-terracotta";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "ve-hen-dat-nung",
  rendererExport: "TicketTerracottaInvitation",
  catalog: {
    name: "Ticket Terracotta",
    title: "Ticket Terracotta Wedding Invitation - Boarding Pass Layout | Thiệp Mừng Online",
    description: "A terracotta wedding invitation shaped by ticket stubs, perforation and travel ephemera.",
    category: "Modern",
    color: "Brown",
    isNew: true,
    highlights: [
      "Boarding-pass information architecture",
      "Perforated ticket stubs and barcode details",
      "Warm terracotta and paper-white palette",
    ],
  },
  theme: {
    theme: {
      background: "linear-gradient(145deg, #4f281f, #7e3c2b)",
      cardBg: "#fffaf5",
      textPrimary: "#3c211a",
      textSecondary: "rgba(60, 33, 26, 0.72)",
      accent: "#a4462d",
      dividerFrom: "transparent",
      dividerTo: "rgba(164, 70, 45, 0.5)",
      buttonBg: "#a4462d",
      buttonText: "#fffaf5",
      guestBoxBg: "rgba(164, 70, 45, 0.08)",
      guestBoxBorder: "rgba(164, 70, 45, 0.3)",
      particleColors: ["#a4462d", "#d58b70", "#fffaf5"],
      particleType: "confetti",
    },
    fonts: {
      couple: "\"Be Vietnam Pro\", Arial, sans-serif",
      ampersand: null,
    },
    sealType: "heart",
    decorations: { cardImages: [] },
  },
  demoContent: createTemplateDemoContent({
    slug,
    primaryColor: "#a4462d",
    fontFamily: "Be Vietnam Pro",
    music: "/chungdoi/music/ticket-terracotta.mp3",
  }),
  i18n: {
    vi: {
      name: "Vé Hẹn Đất Nung",
      description: "Thiệp cưới lấy cảm hứng từ vé hành trình, cuống xé và sắc đất nung ấm áp.",
    },
  },
  assets: [
    ...Array.from({ length: 8 }, (_, index) => `/chungdoi/images/gallery/${slug}/photo-${index + 1}.webp`),
    "/chungdoi/music/ticket-terracotta.mp3",
  ],
});
