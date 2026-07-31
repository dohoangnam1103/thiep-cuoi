import { doraemonDoorPilotContent } from "../doraemon-door-pilot";
import { defineTemplateManifest } from "./template-manifest";

const slug = "doraemon-door";

const characterRoot = "/chungdoi/templates/doraemon-door/characters";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "doraemon-door",
  rendererExport: "DoraemonDoorInvitation",
  heroImageCount: 0,
  catalog: {
    name: "Doraemon Door",
    title: "Doraemon Door Wedding Invitation | Thiệp Mừng Online",
    description:
      "Thiệp cưới Three.js với Cánh cửa thần kỳ, Nobita chú rể, Shizuka cô dâu và nhóm bạn trên nhiều lớp không gian.",
    category: "Playful",
    color: "Blue",
    isNew: true,
    highlights: [
      "Cánh cửa 3D mở bằng chuyển động vật lý",
      "Năm nhân vật nền trong suốt trên các lớp parallax",
      "Portal handoff liên tục sang thiệp cưới dạng storybook",
    ],
  },
  theme: {
    theme: {
      background: "#DDF6FF",
      cardBg: "#FFF9EE",
      textPrimary: "#17334A",
      textSecondary: "rgba(23, 51, 74, 0.7)",
      accent: "#E96F9A",
      dividerFrom: "transparent",
      dividerTo: "rgba(57, 188, 235, 0.42)",
      buttonBg: "#E96F9A",
      buttonText: "#FFF9EE",
      guestBoxBg: "rgba(255, 249, 238, 0.84)",
      guestBoxBorder: "rgba(23, 51, 74, 0.16)",
      particleColors: ["#39BCEB", "#E96F9A", "#F4C84A"],
      particleType: "none",
    },
    fonts: {
      couple: '"SVN-HC Marvin Visions", HelveticaNeue, sans-serif',
      ampersand: null,
    },
    sealType: null,
    decorations: { cardImages: [] },
  },
  demoContent: doraemonDoorPilotContent,
  i18n: {
    vi: {
      name: "Doraemon Door",
      description:
        "Cánh cửa thần kỳ Three.js mở ra đám cưới của Nobita và Shizuka cùng nhóm bạn thân.",
    },
    en: {
      name: "Doraemon Door",
      description:
        "A Three.js Anywhere Door opens onto Nobita and Shizuka's wedding with their closest friends.",
    },
    ja: {
      name: "ドラえもん・ドア",
      description:
        "どこでもドアが開き、のび太としずかの結婚式と仲間たちが現れるThree.js招待状です。",
    },
    ko: {
      name: "도라에몽 도어",
      description:
        "어디로든 문이 열리며 노비타와 시즈카의 결혼식과 친구들이 등장하는 Three.js 청첩장입니다.",
    },
    zh: {
      name: "哆啦A梦任意门",
      description:
        "任意门开启后，大雄、静香与好友们共同呈现一场 Three.js 婚礼请柬。",
    },
  },
  assets: [
    `${characterRoot}/nobita-groom.webp`,
    `${characterRoot}/nobita-groom.mobile.webp`,
    `${characterRoot}/shizuka-bride.webp`,
    `${characterRoot}/shizuka-bride.mobile.webp`,
    `${characterRoot}/doraemon-ring-bearer.webp`,
    `${characterRoot}/doraemon-ring-bearer.mobile.webp`,
    `${characterRoot}/jaian-best-man.webp`,
    `${characterRoot}/jaian-best-man.mobile.webp`,
    `${characterRoot}/suneo-best-man.webp`,
    `${characterRoot}/suneo-best-man.mobile.webp`,
    "/chungdoi/music/editorial-noir.mp3",
  ],
});
