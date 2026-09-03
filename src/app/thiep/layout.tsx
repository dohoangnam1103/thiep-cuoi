import { HeroTypographyDefaults } from "@/components/hero-typography-defaults";
import { RouteMessages } from "@/components/route-messages";
import { invitationMessageNamespaces } from "@/i18n/message-scopes";

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
        <RouteMessages namespaces={invitationMessageNamespaces}><HeroTypographyDefaults>{children}</HeroTypographyDefaults></RouteMessages>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
