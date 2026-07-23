import type { Metadata } from "next";

import "../globals.css";
import { GoogleAnalytics } from "@/components/google-analytics";
import { PetalField } from "@/components/petal-field";
import { appFontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Chỉnh sửa thiệp | Thiệp Mừng Online",
  robots: { index: false, follow: false },
  icons: { icon: "/chungdoi/icon-v2.png" },
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <PetalField />
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
