import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

import { createTemplateDemoContent, defineTemplateManifest } from "./template-manifest";

const slug = "ban-ve-to-am";
const gallerySlug = "arch-sage";
const gallery = Array.from(
  { length: 8 },
  (_, index) => `/chungdoi/images/gallery/${gallerySlug}/photo-${index + 1}.webp`,
);
const gardenFrame =
  "/chungdoi/templates/ban-ve-to-am/cover/garden-frame.svg";
const artwork = [
  gardenFrame,
  "/chungdoi/templates/ban-ve-to-am/ornaments/botanical-divider.svg",
  "/chungdoi/templates/ban-ve-to-am/gift/garden-envelope.svg",
] as const;
const music = "/chungdoi/music/arch-sage.mp3";
const description =
  "Thiệp cưới nhà kính ngập ánh sáng với vòm trắng, lá xanh sage, hoa ivory và những lớp giấy champagne dịu dàng cho ngày chung đôi.";

const baseDemo = createTemplateDemoContent({
  slug,
  primaryColor: "#315445",
  fontFamily: "Cormorant Garamond",
  music,
  gallerySlug,
  galleryCount: 8,
  brideFullName: "Trần Linh Chi",
  brideShortName: "Linh Chi",
  groomFullName: "Nguyễn Quang Minh",
  groomShortName: "Quang Minh",
  date: "2026-12-27",
  time: "18:00",
});

const demoContent = {
  ...baseDemo,
  invitationId: "linh-chi-quang-minh-vuon-kinh-ngay-thuong",
  theme: {
    primaryColor: "#315445",
    fontFamily: "Cormorant Garamond",
    assetFolder: slug,
    assets: [...artwork],
  },
  couple: {
    ...baseDemo.couple,
    brideBirthOrder: "Trưởng Nữ",
    groomBirthOrder: "Trưởng Nam",
    brideFirst: true,
    ceremonyDate: "2026-12-27",
    ceremonyTime: "09:00",
    ceremonyHeader: "LỄ VU QUY ĐƯỢC CỬ HÀNH TẠI TƯ GIA NHÀ GÁI",
    ceremonyType: "vu-quy" as const,
    openingMessage:
      "Giữa khu vườn đầy nắng, chúng mình đã tìm thấy một người để cùng đi qua mọi mùa thương nhớ. Hai gia đình trân trọng kính mời quý khách đến chung vui và chứng kiến khoảnh khắc chúng mình về chung một nhà.",
  },
  families: {
    brideFather: "Trần Văn Thành",
    brideMother: "Lê Thị Thu Hà",
    brideAddress: "Thành phố Huế, Việt Nam",
    groomFather: "Nguyễn Quốc Hưng",
    groomMother: "Phạm Thị Minh Anh",
    groomAddress: "Thành phố Hồ Chí Minh, Việt Nam",
    brideParentTitle: "Ông Bà",
    groomParentTitle: "Ông Bà",
  },
  venue: {
    address:
      "GEM Center\n8 Nguyễn Bỉnh Khiêm, Phường Sài Gòn, Thành phố Hồ Chí Minh",
    mapAddress:
      "GEM Center, 8 Nguyễn Bỉnh Khiêm, Phường Sài Gòn, Thành phố Hồ Chí Minh",
    banquetTime: "18:00",
    welcomeTime: "17:30",
  },
  ceremonies: [
    {
      title: "Lễ Vu Quy tại tư gia Nhà Gái",
      date: "2026-12-27",
      time: "09:00",
    },
    {
      title: "Lễ Thành Hôn tại tư gia Nhà Trai",
      date: "2026-12-27",
      time: "11:00",
    },
  ],
  schedule: [
    { time: "17:30", label: "Đón khách" },
    { time: "18:00", label: "Làm lễ" },
    { time: "18:30", label: "Khai tiệc" },
    { time: "20:30", label: "Chụp ảnh lưu niệm" },
  ],
  portraits: {
    bride: gallery[1] ?? gallery[0] ?? "",
    groom: gallery[2] ?? gallery[0] ?? "",
  },
  gallery,
  heroImage: gallery[0],
  heroImage2: undefined,
  showHeroImage: true,
  albumLayout: "grid" as const,
  dressCodeColors: "#315445,#778B7C,#C7A96B,#D8B5AA,#FAF7F0",
  wishes: [
    {
      name: "Gia đình Minh Thư",
      time: "2026-11-18T09:15:00.000Z",
      text: "Chúc hai con luôn dịu dàng bên nhau, cùng vun trồng một mái ấm đầy nắng, tiếng cười và yêu thương.",
    },
    {
      name: "Nhóm bạn thân",
      time: "2026-11-21T18:40:00.000Z",
      text: "Mừng Linh Chi và Quang Minh đã tìm thấy nhau giữa khu vườn rộng lớn của cuộc đời. Chúc hai bạn trăm năm hạnh phúc!",
    },
  ],
  bank: {
    brideBankName: "Vietcombank",
    brideAccountNumber: "1026888899",
    brideAccountName: "TRAN LINH CHI",
    groomBankName: "Techcombank",
    groomAccountNumber: "1903888899",
    groomAccountName: "NGUYEN QUANG MINH",
  },
  music,
} satisfies ChungDoiDemoContent;

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "ban-ve-to-am",
  rendererExport: "BanVeToAmInvitation",
  heroImageCount: 1,
  catalog: {
    name: "Vườn Kính Ngày Thương",
    title: "Vườn Kính Ngày Thương - Thiệp Cưới Nhà Kính Lãng Mạn | Thiệp Mừng Online",
    description,
    category: "Botanical",
    color: "Green",
    isNew: true,
    highlights: [
      "Bìa thiệp 2D ivory với khung vòm botanical và dấu niêm phong trái tim",
      "Không gian nhà kính trắng, lá xanh sage, hoa ivory và ánh sáng trong trẻo",
      "Bố cục riêng cho lời ngỏ, ngày chung đôi, album, lịch trình, bản đồ, lưu bút và quà mừng",
    ],
  },
  theme: {
    theme: {
      background:
        "radial-gradient(circle at 18% 16%, rgba(216,181,170,0.24), transparent 30%), radial-gradient(circle at 84% 80%, rgba(199,169,107,0.18), transparent 32%), linear-gradient(145deg, #DDE7DE, #8FA495 54%, #315445)",
      cardBg: "#FAF7F0",
      textPrimary: "#315445",
      textSecondary: "rgba(49, 84, 69, 0.72)",
      accent: "#A88752",
      dividerFrom: "transparent",
      dividerTo: "rgba(168, 135, 82, 0.5)",
      buttonBg: "#315445",
      buttonText: "#FAF7F0",
      guestBoxBg: "rgba(119, 139, 124, 0.1)",
      guestBoxBorder: "rgba(119, 139, 124, 0.34)",
      particleColors: ["#FAF7F0", "#D8B5AA", "#C7A96B", "#778B7C"],
      particleType: "leaves",
    },
    fonts: {
      couple: '"Cormorant Garamond", "EB Garamond", serif',
      ampersand: null,
    },
    sealType: "heart",
    decorations: {
      cardImages: [
        {
          src: gardenFrame,
          className: "inset-[2%] h-[96%] w-[96%] object-fill opacity-90",
          flyOnOpen: false,
        },
      ],
    },
  },
  demoContent,
  i18n: {
    vi: {
      name: "Vườn Kính Ngày Thương",
      description,
    },
  },
  assets: [...artwork, ...gallery, music],
});
