import { Be_Vietnam_Pro, Geist_Mono, Lora } from "next/font/google";

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

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const appFontVariables = `${beVietnamPro.variable} ${lora.variable} ${geistMono.variable}`;
