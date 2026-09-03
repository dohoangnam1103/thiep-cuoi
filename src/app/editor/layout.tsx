import { HeroTypographyDefaults } from "@/components/hero-typography-defaults";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { editorMessageNamespaces, selectMessages } from "@/i18n/message-scopes";

import viMessages from "../../../messages/vi.json";
import "../globals.css";
import "./editor-mobile.css";
import { ContactFab } from "@/components/chungdoi-chrome";
import { GoogleAnalytics } from "@/components/google-analytics";
import { PetalField } from "@/components/petal-field";
import { appFontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Chỉnh sửa thiệp | Thiệp Mừng Online",
  robots: { index: false, follow: false },
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      <body className="editor-page min-h-full overflow-x-hidden bg-background text-foreground">
        <PetalField />
        <NextIntlClientProvider
          locale="vi"
          messages={selectMessages(viMessages, editorMessageNamespaces)}
        >
          <HeroTypographyDefaults>{children}</HeroTypographyDefaults>
          <ContactFab />
        </NextIntlClientProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
