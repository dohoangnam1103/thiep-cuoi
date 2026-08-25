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
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      {/* Route group riêng, không bọc thiệp nào — áp font shell thẳng ở body. */}
      <body className="font-app-sans min-h-full bg-background text-foreground">
        <PetalField />
        <NextIntlClientProvider
          locale="vi"
          messages={{
            chrome: viMessages.chrome,
            trialCountdown: viMessages.trialCountdown,
            dashboardActivation: viMessages.dashboardActivation,
            paymentActivation: viMessages.paymentActivation,
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
