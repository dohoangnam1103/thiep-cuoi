import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { WeddingInvitationGuide } from "@/components/wedding-invitation-guide";
import type { Locale } from "@/i18n/routing";
import { pageSeo, staticAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "weddingGuide.metadata" });

  return pageSeo({
    title: t("title"),
    description: t("description"),
    alternates: staticAlternates("/create-wedding-invitation-online", locale),
    locale,
    image: "/thiepmungonline/wedding-guide/chon-mau-thiep-tmo.webp",
  });
}

export default async function CreateWeddingInvitationOnlinePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <WeddingInvitationGuide locale={locale} />;
}
