import { detectiveConanCasebookPilotContent } from "../detective-conan-casebook-pilot";
import { defineTemplateManifest } from "./template-manifest";

const slug = "detective-conan-casebook";

const characterRoot = "/chungdoi/templates/detective-conan-casebook/characters";

const characterGroups = [
  "shinichi-ran-wedding",
  "conan-kogoro",
  "detective-boys",
  "heiji-friends",
  "akai-furuya",
] as const;

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "detective-conan-casebook",
  rendererExport: "DetectiveConanCasebookInvitation",
  heroImageCount: 0,
  catalog: {
    name: "Hồ Sơ Hôn Lễ 4869",
    title: "Detective Conan Casebook Wedding Invitation | Thiệp Mừng Online",
    description:
      "Thiệp cưới Three.js dạng hồ sơ trinh thám, mở bìa Shinichi và Ran rồi lật từng trang cùng dàn nhân vật Detective Conan.",
    category: "Playful",
    color: "Blue",
    isNew: true,
    highlights: [
      "Bìa casebook Three.js mở quanh gáy sách có trọng lượng",
      "Handoff liền mạch sang trình đọc DOM không cuộn dọc",
      "Lật trang bằng vuốt, phím mũi tên và điều khiển rõ ràng",
    ],
  },
  theme: {
    theme: {
      background: "#081A2E",
      cardBg: "#F6F1E7",
      textPrimary: "#172437",
      textSecondary: "rgba(23, 36, 55, 0.7)",
      accent: "#C73B45",
      dividerFrom: "transparent",
      dividerTo: "rgba(199, 59, 69, 0.42)",
      buttonBg: "#C73B45",
      buttonText: "#FFFCF5",
      guestBoxBg: "rgba(255, 252, 245, 0.86)",
      guestBoxBorder: "rgba(23, 36, 55, 0.18)",
      particleColors: ["#123A63", "#C73B45", "#F6F1E7"],
      particleType: "none",
    },
    fonts: {
      couple:
        '"SVN-HC Built Titling", HelveticaNeue, "Be Vietnam Pro", sans-serif',
      ampersand: null,
    },
    sealType: null,
    decorations: { cardImages: [] },
  },
  demoContent: detectiveConanCasebookPilotContent,
  i18n: {
    vi: {
      name: "Hồ Sơ Hôn Lễ 4869",
      description:
        "Mở hồ sơ Three.js của Shinichi và Ran, rồi lật từng trang điều tra đám cưới cùng toàn bộ nhóm bạn.",
    },
    en: {
      name: "Wedding Case File 4869",
      description:
        "Open Shinichi and Ran's Three.js casebook, then turn through a no-scroll wedding story with their detective friends.",
    },
    ja: {
      name: "ウェディング事件簿4869",
      description:
        "新一と蘭のThree.js事件簿を開き、仲間たちとページをめくって結婚式をたどる招待状です。",
    },
    ko: {
      name: "웨딩 사건 파일 4869",
      description:
        "신이치와 란의 Three.js 사건 수첩을 열고 탐정 친구들과 페이지를 넘기는 스크롤 없는 청첩장입니다.",
    },
    zh: {
      name: "婚礼档案4869",
      description:
        "打开新一与小兰的 Three.js 案件簿，与侦探伙伴逐页阅读无需纵向滚动的婚礼请柬。",
    },
  },
  assets: [
    ...characterGroups.map((group) => `${characterRoot}/source/${group}.png`),
    ...characterGroups.flatMap((group) => [
      `${characterRoot}/${group}.webp`,
      `${characterRoot}/${group}.mobile.webp`,
    ]),
    "/chungdoi/templates/detective-conan-casebook/asset-manifest.json",
    "/chungdoi/music/editorial-noir.mp3",
  ],
});
