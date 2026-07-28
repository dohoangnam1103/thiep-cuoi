import { NextIntlClientProvider } from "next-intl";

import viMessages from "../../../messages/vi.json";
import { GoogleAnalytics } from "@/components/google-analytics";
import { PetalField } from "@/components/petal-field";
import { appFontVariables } from "@/lib/fonts";
import "../globals.css";

export default function ThiepLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      <body className="min-h-full">
        <PetalField />
        <NextIntlClientProvider
          locale="vi"
          messages={{ invitationTemplate: viMessages.invitationTemplate }}
        >
          {children}
        </NextIntlClientProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
