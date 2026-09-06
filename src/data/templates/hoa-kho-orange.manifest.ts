import { createTemplateDemoContent, defineTemplateManifest } from "./template-manifest";

const slug = "hoa-kho-orange";
const root = `/chungdoi/images/themes/${slug}`;
const artwork = ["paper.webp", "flower2.webp", "flower3.webp", "flower4.webp", "calendar-heart.svg", "water.webp", "cake.webp", "ring.webp"].map(file => `${root}/${file}`);
const base = createTemplateDemoContent({ slug, primaryColor: "#4c611b", fontFamily: "Carattere", music: "/chungdoi/music/a-thousand-years.mp3", galleryCount: 8, groomFullName: "Trần Gia Bảo", groomShortName: "Gia Bảo", brideFullName: "Lý Thanh Vân", brideShortName: "Thanh Vân", date: "2026-12-19", time: "19:30" });
const description = "Thiệp cưới hoa khô cam, lá xanh ô-liu và khung vòm trên nền giấy kem, phong cách mộc mạc ấm áp.";
export const manifest = defineTemplateManifest({
  slug, viRouteSlug: "hoa-kho-cam", rendererExport: "HoaKhoOrangeInvitation", ceremonyRendering: "post-template", heroImageCount: 0,
  catalog: { name: "Hoa Khô Cam", title: "Hoa Khô Cam | Thiệp Mừng Online", description, category: "Botanical", color: "Orange", isNew: true, highlights: ["Hoa cam nhiều lớp quanh khung vòm", "Nền giấy kem và viền xanh ô-liu", "Lịch trái tim và phong bao đồng bộ"] },
  theme: {
    theme: { background: "#ce8d49", cardBg: "#faf4e8", textPrimary: "#4c611b", textSecondary: "#74794c", accent: "#4c611b", dividerFrom: "transparent", dividerTo: "#ce8d49", buttonBg: "#4c611b", buttonText: "#faf4e8", guestBoxBg: "transparent", guestBoxBorder: "#ce8d4944", particleColors: ["#f26100", "#4c611b", "#faf4e8"], particleType: "flowers" },
    fonts: { couple: '"Carattere", cursive', ampersand: '"Whisper", cursive' }, sealType: "heart",
    decorations: { cardImages: [ { src: `${root}/flower2.webp`, className: "-left-[4%] -top-[13%] w-[32%] rotate-[35deg]", flyOnOpen: true }, { src: `${root}/flower2.webp`, className: "-right-[4%] -top-[13%] w-[32%] rotate-[-40deg]", flyOnOpen: true } ] },
  },
  demoContent: { ...base, theme: { ...base.theme, assetFolder: slug, assets: artwork }, showHeroImage: false, albumLayout: "coverflow", couple: { ...base.couple, openingMessage: "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI" },
    families: { groomFather: "Trần Văn Thịnh", groomMother: "Phan Thị Kim Yến", groomAddress: "Số 48, đường Nguyễn Tất Thành,\nphường Tân An, TP. Buôn Ma Thuột, tỉnh Đắk Lắk", brideFather: "Lý Đức Toàn", brideMother: "Ngô Thị Hạnh", brideAddress: "Số 7, đường Hùng Vương,\nthị trấn Ea Kar, huyện Ea Kar, tỉnh Đắk Lắk", groomParentTitle: "Ông Bà", brideParentTitle: "Ông Bà" },
    venue: { address: "Nhà hàng Tiệc cưới Hương Cau, 96 Trần Quang Khải, thị trấn Ea Kar, huyện Ea Kar, tỉnh Đắk Lắk", mapAddress: "Nhà hàng Hương Cau, 96 Trần Quang Khải, Ea Kar, Đắk Lắk", welcomeTime: "18:30", banquetTime: "19:30" },
    wishes: [
      { name: "Gia đình Thu Trang", time: "2026-09-01T09:00:00.000Z", text: "Chúc hai bạn một ngày cưới thật vui và một mái nhà đầy tiếng cười." },
      { name: "Minh Anh", time: "2026-09-01T08:00:00.000Z", text: "Mong Bảo và Vân luôn dành thời gian lắng nghe, chăm sóc và đồng hành cùng nhau." },
      { name: "Hoàng Phúc", time: "2026-09-01T07:00:00.000Z", text: "Chúc mừng ngày vui! Hẹn gặp hai bạn trong buổi tiệc ấm áp sắp tới." },
      { name: "Thu Hà", time: "2026-09-01T06:00:00.000Z", text: "Chúc đôi bạn giữ mãi sự dịu dàng và niềm vui trong những ngày bình thường." },
      { name: "Gia đình Quang Minh", time: "2026-09-01T05:00:00.000Z", text: "Cả nhà gửi lời chúc mừng đến cô dâu, chú rể và hai bên gia đình." },
      { name: "Lan Hương", time: "2026-09-01T04:00:00.000Z", text: "Chúc tổ ấm mới ngập tràn bình yên. Cùng viết tiếp thật nhiều kỷ niệm đẹp nhé!" },
    ],
    schedule: [{ time: "17:30", label: "Đón khách" }, { time: "18:30", label: "Khai tiệc" }, { time: "18:45", label: "Rót rượu, cắt bánh" }, { time: "19:00", label: "Phục vụ món chính" }, { time: "21:00", label: "Kết thúc tiệc" }], dressCodeColors: "#000000,#4c611b,#ffffff",
  },
  i18n: { vi: { name: "Hoa Khô Cam", description } },
  assets: [...artwork, ...base.gallery, "/chungdoi/images/envelope/hoa_kho_orange.webp", "/chungdoi/fonts/Carattere-Regular.ttf", "/chungdoi/fonts/Whisper-Regular.ttf"],
});
