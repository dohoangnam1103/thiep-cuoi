import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";

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
  icons: { icon: "/chungdoi/icon-v2.png" },
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      <body className="editor-page min-h-full overflow-x-hidden bg-background text-foreground">
        <PetalField />
        <NextIntlClientProvider
          locale="vi"
          messages={{
            editor: viMessages.editor,
            trialCountdown: viMessages.trialCountdown,
            chrome: { footer: viMessages.chrome.footer },
          }}
        >
          {children}
          <ContactFab />
        </NextIntlClientProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
