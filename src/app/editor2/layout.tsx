import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { HeroTypographyDefaults } from "@/components/hero-typography-defaults";
import { editorMessageNamespaces, selectMessages } from "@/i18n/message-scopes";
import { appFontVariables } from "@/lib/fonts";
import viMessages from "../../../messages/vi.json";
import "../globals.css";
import "./editor2.css";

export const metadata: Metadata = { title: viMessages.editor2.title, robots: { index: false, follow: false } };

export default function Editor2Layout({ children }: { children: React.ReactNode }) {
  return <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
    <body className="editor2-page min-h-full bg-background text-foreground">
      <NextIntlClientProvider locale="vi" messages={selectMessages(viMessages, [...editorMessageNamespaces, "editor2"])}>
        <HeroTypographyDefaults>{children}</HeroTypographyDefaults>
      </NextIntlClientProvider>
    </body>
  </html>;
}
