import type { ChungDoiDemoContent } from "../chungdoi-demo-content";

import { artOpeningEffects } from "./art-opening-effects";
import { createTemplateDemoContent, defineTemplateManifest } from "./template-manifest";

const slug = "hoa-mai-thuy-mac";
const themeRoot = "/chungdoi/images/themes/hoa-mai-thuy-mac";
const openingRoot = "/chungdoi/images/themes/_decor/hoa-mai-thuy-mac";
const music = "/chungdoi/music/sunflower.mp3";

const baseDemo = createTemplateDemoContent({
  slug,
  primaryColor: "#A95231",
  fontFamily: "Cormorant Garamond",
  gallerySlug: "zen-sand",
  music,
  brideFullName: "Trần An Nhiên",
  brideShortName: "An Nhiên",
  groomFullName: "Nguyễn Minh Khôi",
  groomShortName: "Minh Khôi",
  date: "2026-11-22",
  time: "18:00",
});

const demoContent = {
  ...baseDemo,
  invitationId: "an-nhien-minh-khoi-hoa-mai-thuy-mac",
  theme: {
    primaryColor: "#A95231",
    fontFamily: "Cormorant Garamond",
    assetFolder: slug,
    assets: [
      `${themeRoot}/paper-tile.webp`,
      `${themeRoot}/mai-branch-canopy.webp`,
      `${themeRoot}/mai-branch-left.webp`,
      `${themeRoot}/mai-branch-right.webp`,
      `${themeRoot}/mai-cluster-round.webp`,
      `${themeRoot}/mai-divider.webp`,
      `${themeRoot}/petals.webp`,
      `${themeRoot}/wash-mountains-wide.webp`,
      `${themeRoot}/wash-river-wide.webp`,
    ],
  },
  couple: {
    ...baseDemo.couple,
    brideFirst: true,
    brideBirthOrder: "Trưởng Nữ",
    groomBirthOrder: "Trưởng Nam",
    ceremonyDate: "2026-11-22",
    ceremonyTime: "09:00",
    ceremonyHeader: "LỄ VU QUY ĐƯỢC CỬ HÀNH TẠI TƯ GIA NHÀ GÁI",
    ceremonyType: "vu-quy" as const,
    openingMessage:
      "Giữa mùa mai nở, hai gia đình trân trọng kính mời quý khách đến chung vui và chứng kiến khoảnh khắc chúng mình về chung một nhà.",
  },
  ceremonies: [
    {
      title: "Lễ Vu Quy tại tư gia Nhà Gái",
      date: "2026-11-22",
      time: "09:00",
    },
    {
      title: "Lễ Thành Hôn tại tư gia Nhà Trai",
      date: "2026-11-22",
      time: "11:00",
    },
  ],
  heroImage2: undefined,
  dressCodeColors: "#DFAE37,#A95231,#66775B,#F3E9D7",
} satisfies ChungDoiDemoContent;

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "hoa-mai-thuy-mac",
  rendererExport: "HoaMaiThuyMacInvitation",
  ceremonyRendering: "inline-all",
  heroImageCount: 1,
  catalog: {
    name: "Hoa Mai Thủy Mặc",
    title: "Hoa Mai Thủy Mặc - Thiệp Cưới Màu Nước Trên Giấy Thủ Công | Thiệp Mừng Online",
    description:
      "Thiệp cưới một cột trên nền giấy thủ công, điểm cành mai vàng màu nước và phong cảnh thủy mặc dịu nhẹ.",
    category: "Floral",
    color: "Yellow",
    isNew: true,
    highlights: [
      "Nền giấy thủ công ấm và có thớ tự nhiên",
      "Cành hoa mai vàng cùng phong cảnh màu nước riêng",
      "Toàn bộ nội dung và tính năng nằm trên một cột thanh thoát",
    ],
  },
  theme: {
    theme: {
      background: "#D9CBB4",
      cardBg: "#F3E9D7",
      textPrimary: "#3E332B",
      textSecondary: "rgba(62, 51, 43, 0.72)",
      accent: "#DFAE37",
      dividerFrom: "transparent",
      dividerTo: "rgba(169, 82, 49, 0.42)",
      buttonBg: "#A95231",
      buttonText: "#FFF9EC",
      guestBoxBg: "rgba(255, 249, 236, 0.62)",
      guestBoxBorder: "rgba(169, 82, 49, 0.24)",
      particleColors: ["#DFAE37", "#F1C95A", "#FFF0A8", "#A95231"],
      particleType: "petals",
    },
    fonts: {
      couple: "Cormorant Garamond",
      ampersand: null,
    },
    sealType: "heart",
    decorations: {
      cardImages: [
        {
          src: `${openingRoot}/cover-plate.webp`,
          className: "inset-0 h-full w-full object-cover opacity-35",
          flyOnOpen: false,
        },
      ],
    },
    openingEffect: artOpeningEffects[slug],
  },
  demoContent,
  i18n: {
    vi: {
      name: "Hoa Mai Thủy Mặc",
      description:
        "Thiệp cưới một cột trên nền giấy thủ công, cành mai vàng màu nước và phong cảnh thủy mặc dịu nhẹ.",
    },
  },
  assets: [
    `${themeRoot}/paper-tile.webp`,
    `${themeRoot}/mai-branch-canopy.webp`,
    `${themeRoot}/mai-branch-left.webp`,
    `${themeRoot}/mai-branch-right.webp`,
    `${themeRoot}/mai-cluster-round.webp`,
    `${themeRoot}/mai-divider.webp`,
    `${themeRoot}/petals.webp`,
    `${themeRoot}/wash-mountains-wide.webp`,
    `${themeRoot}/wash-river-wide.webp`,
    `${openingRoot}/artwork.webp`,
    `${openingRoot}/cover-plate.webp`,
    `${openingRoot}/cover-branch-left.webp`,
    `${openingRoot}/cover-branch-right.webp`,
    `${openingRoot}/cover-seal.webp`,
    "/chungdoi/images/envelope/hoa_mai_thuy_mac.webp",
    music,
  ],
});
