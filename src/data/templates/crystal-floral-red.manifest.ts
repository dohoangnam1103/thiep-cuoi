import { defineTemplateManifest } from "./template-manifest";

const slug = "crystal-floral-red";
const themeRoot = `/chungdoi/images/themes/${slug}`;
const gallery = Array.from(
  { length: 7 },
  (_, index) => `/chungdoi/images/gallery/${slug}/photo-${index + 1}.webp`,
);
const themeAssets = [
  `${themeRoot}/flower1.webp`,
  `${themeRoot}/flower2.webp`,
  `${themeRoot}/flower3.webp`,
  `${themeRoot}/flower4.webp`,
  `${themeRoot}/flower5.webp`,
  `${themeRoot}/flower-frame.webp`,
  `${themeRoot}/filigree.webp`,
  `${themeRoot}/calendar-frame.webp`,
  `${themeRoot}/ring.webp`,
  `${themeRoot}/map.webp`,
  `${themeRoot}/flowericon.webp`,
] as const;
const envelope = "/chungdoi/images/envelope/crystal_floral_red.webp";
const music = "/chungdoi/music/crystal-floral-red.mp3";

export const manifest = defineTemplateManifest({
  slug,
  viRouteSlug: "hoa-thuy-tinh-do",
  rendererExport: "CrystalFloralRedInvitation",
  ceremonyRendering: "post-template",
  heroImageCount: 0,
  catalog: {
    name: "Crystal Floral Red",
    title: "Hoa Thủy Tinh Đỏ - Thiệp cưới hoa pha lê châu Âu | Thiệp Mừng Online",
    description: "Thiệp cưới đỏ rượu vang với khung hoa pha lê, họa tiết dát vàng và bố cục châu Âu sang trọng.",
    category: "Floral",
    color: "Red",
    isNew: true,
    highlights: [
      "Khung hoa pha lê đỏ và vàng sang trọng",
      "Album ảnh coverflow ba chiều",
      "Lịch tiệc, dress code và hộp quà đồng bộ",
    ],
  },
  theme: {
    theme: {
      background: "linear-gradient(135deg, #71000b 0%, #9c1526 46%, #c72a4b 100%)",
      cardBg: "#fbf8f3",
      textPrimary: "#9c1f2c",
      textSecondary: "rgba(86, 2, 7, 0.78)",
      accent: "#9c1f2c",
      dividerFrom: "transparent",
      dividerTo: "rgba(156, 31, 44, 0.35)",
      buttonBg: "#9c1f2c",
      buttonText: "#fbf8f3",
      guestBoxBg: "rgba(251, 248, 243, 0.94)",
      guestBoxBorder: "rgba(156, 31, 44, 0.26)",
      particleColors: ["#9c1f2c", "#b72236", "#74000a", "#d6b176", "#fbf8f3"],
      particleType: "flowers",
    },
    fonts: {
      couple: '"Viaoda Libre", "EB Garamond", serif',
      ampersand: '"Alex Brush", "The Nautigal", cursive',
    },
    sealType: "heart",
    decorations: {
      cardImages: [
        // `envelope-fly-fit-height` lo phần đo kích thước (className chốt chiều
        // cao), `crystal-floral-opening-fly` lo phần opacity. Xem globals.css.
        {
          src: `${themeRoot}/flower2.webp`,
          className: "envelope-fly-fit-height crystal-floral-opening-fly h-36 md:h-32 lg:h-36 w-auto max-w-none -top-[5%] -left-[14px] md:-left-[26px] -translate-x-[6%] md:-translate-x-[11%] opacity-100 rotate-[25deg]",
          flyOnOpen: true,
        },
        {
          src: `${themeRoot}/flower3.webp`,
          className: "envelope-fly-fit-height crystal-floral-opening-fly h-36 md:h-32 lg:h-36 w-auto max-w-none -bottom-[5%] -right-[14px] md:-right-[26px] translate-x-[6%] md:translate-x-[11%] opacity-100 -rotate-[25deg]",
          flyOnOpen: true,
        },
      ],
    },
  },
  demoContent: {
    slug,
    invitationId: "hoangnam-thuyduong-crystal-red",
    theme: {
      primaryColor: "#9c1f2c",
      fontFamily: "Viaoda Libre",
      assetFolder: slug,
      assets: [...themeAssets, envelope],
    },
    couple: {
      brideFullName: "Trần Thuỳ Dương",
      groomFullName: "Lê Hoàng Nam",
      brideShortName: "Thuỳ Dương",
      groomShortName: "Hoàng Nam",
      brideBirthOrder: "Út Nữ",
      groomBirthOrder: "Trưởng Nam",
      brideFirst: false,
      date: "2026-12-19",
      time: "18:30",
      ceremonyDate: "2026-12-19",
      ceremonyTime: "09:00",
      ceremonyHeader: "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA",
      ceremonyType: "thanh-hon",
      openingMessage: "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI",
    },
    families: {
      brideFather: "Trần Đức Minh",
      brideMother: "Nguyễn Thị Thu",
      brideAddress: "Số 108, đường Nguyễn Trãi,\nphường Bến Thành, quận 1, TP. Hồ Chí Minh",
      groomFather: "Lê Văn Cường",
      groomMother: "Phạm Thị Hạnh",
      groomAddress: "Số 24, đường Phan Xích Long,\nphường 2, quận Phú Nhuận, TP. Hồ Chí Minh",
      brideParentTitle: "Ông Bà",
      groomParentTitle: "Ông Bà",
    },
    venue: {
      address: "Trung tâm Hội nghị Tiệc cưới Adora, 431 Hoàng Văn Thụ, phường 4,\nquận Tân Bình, TP. Hồ Chí Minh",
      mapAddress: "Trung tâm Hội nghị Tiệc cưới The ADORA, 431 Hoàng Văn Thụ, Tân Bình, Hồ Chí Minh",
      banquetTime: "18:30",
      welcomeTime: "17:30",
    },
    schedule: [
      { time: "17:30", label: "Đón khách" },
      { time: "18:30", label: "Khai tiệc" },
      { time: "18:45", label: "Rót rượu, cắt bánh" },
      { time: "19:00", label: "Phục vụ món chính" },
      { time: "21:00", label: "Kết thúc tiệc" },
    ],
    portraits: {
      groom: gallery[0],
      bride: gallery[1],
    },
    gallery,
    heroImage: gallery[0],
    heroImage2: gallery[1],
    showHeroImage: false,
    dressCodeColors: "#b31d32,#6c0009,#f8eddb",
    albumLayout: "coverflow",
    wishes: [
      { name: "Minh Anh", time: "17:05:17 3/8/2026", text: "Chúc mừng hạnh phúc hai bạn! Chúc anh chị trăm năm hạnh phúc, đầu bạc răng long." },
      { name: "Bảo Trâm", time: "17:05:17 3/8/2026", text: "Thiệp đẹp quá trời, chúc Hoàng Nam và Thuỳ Dương mãi bên nhau, yêu thương trọn đời nhé!" },
      { name: "Quốc Huy", time: "17:05:17 3/8/2026", text: "Chúc mừng đám cưới! Mong hai bạn luôn thấu hiểu, sẻ chia và hạnh phúc dài lâu." },
      { name: "Thu Hà", time: "17:05:17 3/8/2026", text: "Chúc cô dâu chú rể mãi mặn nồng, sớm có tin vui, tổ ấm ngập tràn tiếng cười!" },
      { name: "Đức Thành", time: "17:05:17 3/8/2026", text: "Mừng ngày trọng đại của hai bạn. Chúc gia đình nhỏ luôn ấm êm và thật nhiều may mắn." },
      { name: "Lan Phương", time: "17:05:17 3/8/2026", text: "Chúc hai bạn một hành trình mới thật rực rỡ, yêu nhau nhiều hơn mỗi ngày nhé!" },
      { name: "Gia Bảo", time: "17:05:17 3/8/2026", text: "Chúc mừng Hoàng Nam! Cuối cùng cũng tới ngày này, hạnh phúc bên nhau mãi mãi nha." },
      { name: "Ngọc Diệp", time: "17:05:17 3/8/2026", text: "Chúc mừng hai bạn! Chúc tình yêu luôn nồng ấm và mọi điều tốt đẹp sẽ đến." },
      { name: "Tuấn Kiệt", time: "17:05:17 3/8/2026", text: "Chúc anh chị trăm năm hạnh phúc, con đàn cháu đống, phú quý an khang!" },
      { name: "Mỹ Linh", time: "17:05:17 3/8/2026", text: "Thuỳ Dương xinh quá! Chúc hai bạn hạnh phúc viên mãn, mãi mãi yêu thương nhau." },
    ],
    bank: {
      brideBankName: "MB Bank",
      brideAccountNumber: "0908776655",
      brideAccountName: "TRAN THUY DUONG",
      groomBankName: "BIDV",
      groomAccountNumber: "21510009988776",
      groomAccountName: "LE HOANG NAM",
    },
    music,
  },
  i18n: {
    vi: {
      name: "Hoa Thủy Tinh Đỏ",
      description: "Thiệp cưới hoa pha lê đỏ rượu vang, khung vàng châu Âu và album ảnh ba chiều sang trọng.",
    },
  },
  assets: [...themeAssets, ...gallery, envelope, music],
});
