import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiPolicy } from "@/components/chungdoi-policy";
import type { Locale } from "@/i18n/routing";
import { pageSeo, staticAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "policy" });

  return pageSeo({
    title: t("refundMetaTitle"),
    description: t("refundMetaDescription"),
    alternates: staticAlternates("/refund-policy", locale),
    locale,
  });
}

export default async function RefundPolicyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ChungDoiPolicy kind="refund" />;
}
