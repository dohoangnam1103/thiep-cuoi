import { createTemplateDemoContent, defineTemplateManifest } from "./template-manifest";

const slug = "mahal-gold";
const root = `/chungdoi/images/themes/${slug}`;
const artwork = ["paper", "bells", "flower1", "arch-frame", "ganesha", "sandstone", "castle", "flower2", "fence", "castle2", "pattern", "sandstone-flower", "flower3-decoration", "calendar-frame", "medallion-coming", "medallion-gift", "medallion-cake", "gold-line"].map(name => `${root}/${name}.webp`);
const music = "/chungdoi/music/mahal-gold.mp3";
const base = createTemplateDemoContent({
  slug, primaryColor: "#640e1b", fontFamily: "The Nautigal",
  music, galleryCount: 9,
  groomFullName: "Trần Quốc Đạt", groomShortName: "Quốc Đạt",
  brideFullName: "Nguyễn Hà Vy", brideShortName: "Hà Vy", date: "2026-11-14", time: "18:00",
});
const description = "Thiệp cưới cung điện vàng bên hồ, khung vòm Ấn Độ và hoa đỏ trên nền giấy kem cổ điển.";

export const manifest = defineTemplateManifest({
  slug, viRouteSlug: "mahal-vang", rendererExport: "MahalGoldInvitation", heroImageCount: 0,
  catalog: {
    name: "Mahal Vàng", title: "Mahal Vàng | Thiệp Mừng Online", description,
    category: "Royal", color: "Gold", isNew: true,
    highlights: ["Cung điện vàng và khung vòm Ấn Độ", "Hoa đỏ nhiều lớp trên nền giấy kem", "Album ảnh, lịch cưới và hộp quà đồng bộ"],
  },
  theme: {
    theme: {
      background: "linear-gradient(135deg, #753638 0%, #97554b 55%, #b39670 100%)",
      cardBg: "#f3e2cd", textPrimary: "#640e1b", textSecondary: "#7d4c47", accent: "#640e1b",
      dividerFrom: "transparent", dividerTo: "rgba(171,122,69,0.4)",
      buttonBg: "#640e1b", buttonText: "#ffffff", guestBoxBg: "rgba(255,255,255,0.2)",
      guestBoxBorder: "rgba(171,122,69,0.2)",
      particleColors: ["#c35170", "#ab7a45", "#f3e2cd"], particleType: "flowers",
    },
    fonts: { couple: '"The Nautigal", cursive', ampersand: '"Alex Brush", cursive' },
    sealType: "heart",
    decorations: { cardImages: [
      { src: `${root}/flower1.webp`, className: "w-[32%] -left-[7%] -top-[5%] rotate-[-90deg]", flyOnOpen: true },
      { src: `${root}/flower1.webp`, className: "w-[32%] -right-[7%] -bottom-[5%] rotate-[90deg]", flyOnOpen: true },
    ] },
  },
  demoContent: {
    ...base,
    theme: { ...base.theme, assetFolder: slug, assets: artwork },
    showHeroImage: false,
    albumLayout: "coverflow",
    couple: { ...base.couple, ceremonyDate: "2026-10-03", ceremonyTime: "09:00", brideBirthOrder: "Con gái út", groomBirthOrder: "Trưởng nam", openingMessage: "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI" },
    families: {
      groomFather: "Trần Đình Phúc", groomMother: "Lê Thị Kim Chi", groomAddress: "12 Nguyễn Sinh Cung, phường Vỹ Dạ, thành phố Huế",
      brideFather: "Nguyễn Văn Hoài", brideMother: "Phạm Thị Thu Lan", brideAddress: "Thôn Thanh Thủy Chánh, xã Thủy Thanh, thị xã Hương Thủy, thành phố Huế",
      groomParentTitle: "Ông Bà", brideParentTitle: "Ông Bà",
    },
    venue: { address: "Trung tâm Hội nghị Tiệc cưới Hương Giang Palace\n51 Lê Lợi, phường Phú Hội, thành phố Huế", mapAddress: "Hương Giang Hotel, 51 Lê Lợi, Huế", banquetTime: "18:00", welcomeTime: "17:00" },
    schedule: [
      { time: "17:00", label: "Đón khách" }, { time: "18:00", label: "Khai tiệc" },
      { time: "18:20", label: "Rót rượu, cắt bánh" }, { time: "18:45", label: "Phục vụ món chính" }, { time: "20:30", label: "Kết thúc tiệc" },
    ],
    dressCodeColors: "#640e1b,#c7a76b,#f3e2cd",
  },
  i18n: { vi: { name: "Mahal Vàng", description } },
  assets: [...artwork, ...base.gallery, music, "/chungdoi/images/envelope/mahal_gold.webp"],
});
