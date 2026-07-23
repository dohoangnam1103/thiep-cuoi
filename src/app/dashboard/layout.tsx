import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";

import viMessages from "../../../messages/vi.json";
import "../globals.css";
import { SiteHeader } from "@/components/chungdoi-chrome";
import { GoogleAnalytics } from "@/components/google-analytics";
import { PetalField } from "@/components/petal-field";
import { appFontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Thiệp của tôi | Thiệp Mừng Online",
  robots: { index: false, follow: false },
  icons: { icon: "/chungdoi/icon-v2.png" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <PetalField />
        <NextIntlClientProvider
          locale="vi"
          messages={{
            chrome: viMessages.chrome,
            trialCountdown: viMessages.trialCountdown,
          }}
        >
          <SiteHeader initialLoggedIn hideCreateButton />
          {children}
        </NextIntlClientProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
