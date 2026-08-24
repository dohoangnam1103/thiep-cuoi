import type { Metadata } from "next";

import "../globals.css";
import { GoogleAnalytics } from "@/components/google-analytics";
import { PetalField } from "@/components/petal-field";
import { appFontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Đăng nhập | Thiệp Mừng Online",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <PetalField />
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
