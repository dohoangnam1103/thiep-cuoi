import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiPricing } from "@/components/chungdoi-pricing";
import { RouteMessages } from "@/components/route-messages";
import { pricingMessageNamespaces } from "@/i18n/message-scopes";
import type { Locale } from "@/i18n/routing";
import { getPublicPaymentPrices } from "@/lib/payment-config";
import { pageSeo, staticAlternates } from "@/lib/seo";

// Read runtime prices on the first visit; admin price changes invalidate this route.
export function generateStaticParams() { return []; }
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });

  return pageSeo({
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: staticAlternates("/pricing", locale),
    locale,
  });
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const prices = await getPublicPaymentPrices();

  return (
    <RouteMessages namespaces={pricingMessageNamespaces}>
      <ChungDoiPricing prices={prices} />
    </RouteMessages>
  );
}
