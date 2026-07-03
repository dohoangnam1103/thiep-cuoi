// Tùy chọn tĩnh cho form editor. Thư mục public/ không đọc được ở client runtime,
// nên liệt kê tay theo font đã khai báo @font-face (globals.css) và nhạc trong public/chungdoi/music/.

export type SelectOption = { value: string; label: string };

/** Font khớp với @font-face trong src/app/globals.css. Value = tên font-family. */
export const FONT_OPTIONS: SelectOption[] = [
  { value: "", label: "Mặc định (theo mẫu)" },
  { value: "Fz Aghita", label: "Fz Aghita" },
  { value: "Fz Qellia", label: "Fz Qellia" },
  { value: "Pattaya", label: "Pattaya" },
  { value: "SVN-HC Pacifico", label: "SVN-HC Pacifico" },
  { value: "SVN-HC Haydon Brush", label: "SVN-HC Haydon Brush" },
  { value: "SVN-HC Marvin Visions", label: "SVN-HC Marvin Visions" },
  { value: "SVN-HC Built Titling", label: "SVN-HC Built Titling" },
  { value: "HelveticaNeue", label: "Helvetica Neue" },
];

/** Nhạc nền trong public/chungdoi/music/. Value = đường dẫn phát trực tiếp. */
export const MUSIC_OPTIONS: SelectOption[] = [
  { value: "", label: "Không nhạc" },
  { value: "/chungdoi/music/perfect-ed-sheeran.mp3", label: "Perfect - Ed Sheeran" },
  { value: "/chungdoi/music/baroque-gold.mp3", label: "Baroque Gold" },
  { value: "/chungdoi/music/royal-red.mp3", label: "Royal Red" },
  { value: "/chungdoi/music/royal-green.mp3", label: "Royal Green" },
  { value: "/chungdoi/music/royal-blue.mp3", label: "Royal Blue" },
  { value: "/chungdoi/music/chateau-blue.mp3", label: "Chateau Blue" },
  { value: "/chungdoi/music/chateau-green.mp3", label: "Chateau Green" },
  { value: "/chungdoi/music/cherry-blossom-pink.mp3", label: "Cherry Blossom Pink" },
  { value: "/chungdoi/music/jasmine-white.mp3", label: "Jasmine White" },
  { value: "/chungdoi/music/spring-garden-red.mp3", label: "Spring Garden Red" },
  { value: "/chungdoi/music/spring-garden-green.mp3", label: "Spring Garden Green" },
  { value: "/chungdoi/music/spring-garden-blue.mp3", label: "Spring Garden Blue" },
  { value: "/chungdoi/music/boho-floral-pink.mp3", label: "Boho Floral Pink" },
  { value: "/chungdoi/music/boho-floral-green.mp3", label: "Boho Floral Green" },
  { value: "/chungdoi/music/boho-floral-brown.mp3", label: "Boho Floral Brown" },
  { value: "/chungdoi/music/silk-flora-brown.mp3", label: "Silk Flora Brown" },
  { value: "/chungdoi/music/elegant-leaf-green.mp3", label: "Elegant Leaf Green" },
  { value: "/chungdoi/music/glass-garden-green.mp3", label: "Glass Garden Green" },
  { value: "/chungdoi/music/crystal-floral-blue.mp3", label: "Crystal Floral Blue" },
  { value: "/chungdoi/music/qasr-gold.mp3", label: "Qasr Gold" },
  { value: "/chungdoi/music/qasr-green.mp3", label: "Qasr Green" },
  { value: "/chungdoi/music/minimalism-red.mp3", label: "Minimalism Red" },
];

/** Thứ bậc khớp bảng chuẩn hoá trong EditorForm (normalizeBirthOrder). "" = tự nhập. */
export const BIRTH_ORDER_OPTIONS: SelectOption[] = [
  { value: "Trưởng Nữ", label: "Trưởng Nữ" },
  { value: "Thứ Nữ", label: "Thứ Nữ" },
  { value: "Út Nữ", label: "Út Nữ" },
  { value: "Trưởng Nam", label: "Trưởng Nam" },
  { value: "Thứ Nam", label: "Thứ Nam" },
  { value: "Út Nam", label: "Út Nam" },
];
