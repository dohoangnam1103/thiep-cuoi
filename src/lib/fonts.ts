import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";

export const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "800"],
  style: "normal",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const appFontVariables = `${beVietnamPro.variable} ${geistMono.variable}`;
