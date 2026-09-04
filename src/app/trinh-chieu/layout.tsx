import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";

import viMessages from "../../../messages/vi.json";
import { appFontVariables } from "@/lib/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "Xưởng trình chiếu | Thiệp Mừng Online",
  description: "Tạo câu chuyện cưới để trình chiếu trên TV và chia sẻ trên điện thoại.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function SlideshowLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      <body className="font-app-sans min-h-full bg-[#11110f] text-[#f4f1ea]">
        <NextIntlClientProvider
          locale="vi"
          messages={{
            slideshowStudio: viMessages.slideshowStudio,
            slideshowPayment: viMessages.slideshowPayment,
            slideshowDashboard: viMessages.slideshowDashboard,
            slideshowTemplates: viMessages.slideshowTemplates,
          }}
        >
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
