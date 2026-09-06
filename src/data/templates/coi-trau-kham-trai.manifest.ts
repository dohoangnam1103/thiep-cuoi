import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";

import {
  createTemplateDemoContent,
  defineTemplateManifest,
} from "./template-manifest";

const slug = "coi-trau-kham-trai";
const gallerySlug = "editorial-noir";
const gallery = Array.from(
  { length: 8 },
  (_, index) => `/chungdoi/images/gallery/${gallerySlug}/photo-${index + 1}.webp`,
);
const artwork = [
  "/chungdoi/templates/coi-trau-kham-trai/cover/caddy-lid.svg",
  "/chungdoi/templates/coi-trau-kham-trai/interior/tray-wells.svg",
  "/chungdoi/templates/coi-trau-kham-trai/ornaments/betel-vine.svg",
  "/chungdoi/templates/coi-trau-kham-trai/ornaments/areca-spray.svg",
  "/chungdoi/templates/coi-trau-kham-trai/ornaments/shell-divider.svg",
] as const;

const baseDemo = createTemplateDemoContent({
  slug,
  primaryColor: "#32151F",
  fontFamily: "Cormorant Garamond",
  music: "/chungdoi/music/editorial-noir.mp3",
  gallerySlug,
  galleryCount: 8,
  brideFullName: "Lê Ngọc An",
  brideShortName: "Ngọc An",
  groomFullName: "Nguyễn Minh Triết",
  groomShortName: "Minh Triết",
  date: "2026-12-20",
  time: "18:00",
});

const demoContent = {
  ...baseDemo,
  invitationId: "ngoc-an-minh-triet-coi-trau",
  theme: {
    primaryColor: "#32151F",
    fontFamily: "Cormorant Garamond",
    assetFolder: slug,
    assets: [...artwork],
  },
  couple: {
    ...baseDemo.couple,
    brideBirthOrder: "Trưởng Nữ",
    groomBirthOrder: "Trưởng Nam",
    brideFirst: true,
    ceremonyDate: "2026-12-20",
    ceremonyTime: "09:00",
    ceremonyHeader: "LỄ VU QUY ĐƯỢC CỬ HÀNH TẠI TƯ GIA NHÀ GÁI",
    ceremonyType: "vu-quy" as const,
    openingMessage:
      "Miếng trầu mở lời, gia đình chúng tôi trân trọng kính mời quý khách đến chung vui trong ngày hai con nên duyên.",
  },
  families: {
    brideFather: "Lê Văn Thành",
    brideMother: "Trần Thị Thu Hà",
    brideAddress: "Thành phố Huế, Việt Nam",
    groomFather: "Nguyễn Quốc Hưng",
    groomMother: "Phạm Thị Minh Anh",
    groomAddress: "Thành phố Hồ Chí Minh, Việt Nam",
    brideParentTitle: "Ông Bà",
    groomParentTitle: "Ông Bà",
  },
  venue: {
    address:
      "Riverside Palace\n360D Bến Vân Đồn, Quận 4, Thành phố Hồ Chí Minh",
    mapAddress:
      "Riverside Palace, 360D Bến Vân Đồn, Quận 4, Thành phố Hồ Chí Minh",
    banquetTime: "18:00",
    welcomeTime: "17:30",
  },
  ceremonies: [
    {
      title: "Lễ Vu Quy tại tư gia Nhà Gái",
      date: "2026-12-20",
      time: "09:00",
    },
    {
      title: "Lễ Thành Hôn tại tư gia Nhà Trai",
      date: "2026-12-20",
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
    bride: gallery[0] ?? "",
    groom: gallery[1] ?? "",
  },
  gallery,
  heroImage: gallery[0],
  heroImage2: undefined,
  showHeroImage: true,
  dressCodeColors: "#32151F,#315A42,#F1E8D8,#929B98",
  albumLayout: "mosaic" as const,
  wishes: [
    {
      name: "Gia đình Thu Trang",
      time: "2026-11-18T09:15:00.000Z",
      text: "Chúc hai con trọn đời đồng lòng, mỗi ngày bên nhau đều dịu dàng và an vui.",
    },
    {
      name: "Nhóm bạn Đại học",
      time: "2026-11-21T18:40:00.000Z",
      text: "Mừng Ngọc An và Minh Triết đã tìm thấy người cùng mình đi hết những mùa thương nhớ.",
    },
  ],
  bank: {
    brideBankName: "Vietcombank",
    brideAccountNumber: "1026888899",
    brideAccountName: "LE NGOC AN",
    groomBankName: "Techcombank",
    groomAccountNumber: "1903888899",
    groomAccountName: "NGUYEN MINH TRIET",
  },
  music: null,
} satisfies ChungDoiDemoContent;

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "coi-trau-kham-trai",
  rendererExport: "CoiTrauKhamTraiInvitation",
  ceremonyRendering: "inline-all",
  heroImageCount: 1,
  catalog: {
    name: "Cơi Trầu Khảm Trai",
    title: "Cơi Trầu Khảm Trai - Thiệp Cưới Việt Đương Đại | Thiệp Mừng Online",
    description:
      "Thiệp cưới Việt đương đại mở như một cơi trầu sơn mài, điểm khảm trai, lá trầu và hoa cau thanh nhã.",
    category: "Vietnamese Heritage",
    color: "Purple",
    isNew: true,
    highlights: [
      "Cơi trầu 3D tương tác với nắp sơn mài mở vật lý",
      "Khảm trai, lá trầu và hoa cau trong bảng màu mận - xanh - ngà",
      "Bố cục nghi lễ riêng cho hai gia đình, lịch cưới, album và mừng cưới",
    ],
  },
  theme: {
    theme: {
      background:
        "radial-gradient(circle at 50% 24%, #315A42 0%, #32151F 52%, #180B10 100%)",
      cardBg: "#F1E8D8",
      textPrimary: "#32151F",
      textSecondary: "rgba(50, 21, 31, 0.72)",
      accent: "#315A42",
      dividerFrom: "transparent",
      dividerTo: "rgba(146, 155, 152, 0.62)",
      buttonBg: "#315A42",
      buttonText: "#F1E8D8",
      guestBoxBg: "rgba(49, 90, 66, 0.08)",
      guestBoxBorder: "rgba(49, 90, 66, 0.28)",
      particleColors: ["#D8E3DF", "#929B98", "#B85B52"],
      particleType: "none",
    },
    fonts: {
      couple: '"Cormorant Garamond", "EB Garamond", serif',
      ampersand: null,
    },
    sealType: null,
    decorations: { cardImages: [] },
  },
  demoContent,
  i18n: {
    vi: {
      name: "Cơi Trầu Khảm Trai",
      description:
        "Cơi trầu sơn mài mở lời nên duyên, điểm khảm trai, lá trầu và hoa cau trong một trải nghiệm cưới Việt đương đại.",
    },
  },
  assets: [...artwork, ...gallery],
});
