import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiPolicy } from "@/components/chungdoi-policy";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "policy" });

  return {
    title: t("privacyMetaTitle"),
    description: t("privacyMetaDescription"),
    alternates: { canonical: getPathname({ href: "/privacy-policy", locale }) },
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ChungDoiPolicy kind="privacy" />;
}
