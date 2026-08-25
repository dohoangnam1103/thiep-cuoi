import {
  Be_Vietnam_Pro,
  EB_Garamond,
  Geist_Mono,
  Lora,
  Open_Sans,
  Patrick_Hand,
  Playfair_Display,
} from "next/font/google";

/**
 * Font mặc định của app shell: trang marketing (Home, Mẫu thiệp, Bảng giá, Blog,
 * Hướng dẫn, Công cụ, Chính sách) và Dashboard. Thiệp KHÔNG dùng font này —
 * phạm vi do class `.font-app-sans` trong `globals.css` quyết định.
 *
 * Là variable font nên không khai `weight`: next/font nạp trọn trục 300–800,
 * phủ hết `font-medium` → `font-black` mà marketing đang dùng. `font-black` (900)
 * vượt trục nên render ở 800, giống hành vi hiện tại của Be Vietnam Pro (chỉ nạp
 * 400 + 800).
 */
export const openSans = Open_Sans({
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-open-sans",
});

export const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "800"],
  style: "normal",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
});

/** Body serif của thiệp. Bản self-host `Lora-Regular.ttf` chỉ có 1 weight và
 * không chắc phủ dấu tiếng Việt, nên body text dùng bản Google có subset
 * vietnamese; `.font-art-lora` vẫn giữ file self-host làm fallback. */
export const lora = Lora({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-lora",
});

/**
 * Font tên cô dâu chú rể của phần lớn thiệp clone từ chungdoi.com (xem
 * `docs/research/couple-name-fonts.json`). Bản self-host `EBGaramond-Variable.ttf`
 * vẫn giữ làm fallback, nhưng bản Google có subset vietnamese nên chắc chắn đủ dấu.
 */
export const ebGaramond = EB_Garamond({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-eb-garamond",
});

/** Tên cô dâu chú rể của thiệp Gấm Hoa Đỏ (brocade-flower-red) trên bản gốc. */
export const playfairDisplay = Playfair_Display({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-playfair-display",
});

/** Tên cô dâu chú rể của thiệp Hoa Tình Đỏ (hoa-tinh-red) trên bản gốc. */
export const patrickHand = Patrick_Hand({
  weight: ["400"],
  style: "normal",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-patrick-hand",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const appFontVariables = [
  beVietnamPro.variable,
  openSans.variable,
  lora.variable,
  ebGaramond.variable,
  playfairDisplay.variable,
  patrickHand.variable,
  geistMono.variable,
].join(" ");
