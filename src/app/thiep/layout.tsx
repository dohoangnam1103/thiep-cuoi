import { NextIntlClientProvider } from "next-intl";

import { GoogleAnalytics } from "@/components/google-analytics";
import { PetalField } from "@/components/petal-field";
import { appFontVariables } from "@/lib/fonts";
import "../globals.css";

export default function ThiepLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      <body className="min-h-full">
        <PetalField />
        {/* ChungDoiDemo and friends are client components that call
            useTranslations, so the published invitation tree needs its own
            NextIntlClientProvider — this route group is outside [locale]. */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
