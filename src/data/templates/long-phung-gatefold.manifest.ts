import { defineTemplateManifest } from "./template-manifest";
import { longPhungGatefoldPilotContent } from "../long-phung-gatefold-pilot";

const slug = "long-phung-gatefold";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "long-phung-gatefold",
  rendererExport: "LongPhungGatefoldInvitation",
  heroImageCount: 2,
  catalog: {
    name: "Long Phụng Gatefold",
    title: "Long Phụng Gatefold Wedding Invitation | Thiệp Mừng Online",
    description:
      "Thiệp cưới gatefold sơn mài đỏ đương đại với rồng, phượng và khoảnh khắc mở thiệp vật lý.",
    category: "Vietnamese Heritage",
    color: "Red",
    isNew: true,
    highlights: [
      "Gatefold ba phần với khóa tròn tách đôi",
      "Rồng và phượng khắc foil vàng trên nền sơn mài",
      "Foldout chapters và loose-photo album",
    ],
  },
  theme: {
    theme: {
      background: "#17110F",
      cardBg: "#EAD9B8",
      textPrimary: "#17110F",
      textSecondary: "rgba(234, 217, 184, 0.72)",
      accent: "#B58A3A",
      dividerFrom: "transparent",
      dividerTo: "rgba(181, 138, 58, 0.45)",
      buttonBg: "#B58A3A",
      buttonText: "#17110F",
      guestBoxBg: "rgba(124, 27, 27, 0.12)",
      guestBoxBorder: "rgba(181, 138, 58, 0.45)",
      particleColors: ["#B58A3A", "#7C1B1B", "#EAD9B8"],
      particleType: "none",
    },
    fonts: {
      couple: '"UNI Chu truyen thong", "Fz Qellia", serif',
      ampersand: null,
    },
    sealType: null,
    decorations: { cardImages: [] },
  },
  demoContent: longPhungGatefoldPilotContent,
  i18n: {
    vi: {
      name: "Long Phụng Gatefold",
      description:
        "Thiệp gatefold sơn mài đỏ đương đại, mở quanh bản lề để lộ lời mời ở trung tâm.",
    },
  },
  assets: [
    "/chungdoi/templates/long-phung-gatefold/source/dragon-left-master-v2.png",
    "/chungdoi/templates/long-phung-gatefold/source/phoenix-right-master-v1.png",
    "/chungdoi/templates/long-phung-gatefold/source/cloud-front-master-v1.png",
    "/chungdoi/templates/long-phung-gatefold/cover/dragon-left-composite-v2.webp",
    "/chungdoi/templates/long-phung-gatefold/cover/phoenix-right-composite-v1.webp",
    "/chungdoi/templates/long-phung-gatefold/opening/cloud-front-candidate-v1.webp",
    "/chungdoi/templates/long-phung-gatefold/materials/paper-color.webp",
    "/chungdoi/templates/long-phung-gatefold/materials/paper-normal.webp",
    "/chungdoi/templates/long-phung-gatefold/materials/foil-roughness.webp",
    "/chungdoi/music/editorial-noir.mp3",
  ],
});
