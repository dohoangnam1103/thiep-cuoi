import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiPricing } from "@/components/chungdoi-pricing";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: getPathname({ href: "/pricing", locale }) },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ChungDoiPricing />;
}
