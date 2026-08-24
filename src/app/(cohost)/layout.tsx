import type { Metadata } from "next";

import "../globals.css";
import { PetalField } from "@/components/petal-field";
import { appFontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Cùng quản lý khách mời | Thiệp Mừng Online",
  robots: { index: false, follow: false },
};

export default function CohostLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <PetalField />
        {children}
      </body>
    </html>
  );
}
