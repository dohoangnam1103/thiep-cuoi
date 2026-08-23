import {
  Be_Vietnam_Pro,
  EB_Garamond,
  Geist_Mono,
  Lora,
  Patrick_Hand,
  Playfair_Display,
} from "next/font/google";

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
  lora.variable,
  ebGaramond.variable,
  playfairDisplay.variable,
  patrickHand.variable,
  geistMono.variable,
].join(" ");
