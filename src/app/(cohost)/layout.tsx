import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "../globals.css";
import { PetalField } from "@/components/petal-field";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cùng quản lý khách mời | Thiệp Mừng Online",
  robots: { index: false, follow: false },
  icons: { icon: "/chungdoi/icon-v2.png" },
};

export default function CohostLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <PetalField />
        {children}
      </body>
    </html>
  );
}
