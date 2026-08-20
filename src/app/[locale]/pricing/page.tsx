import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiPricing } from "@/components/chungdoi-pricing";
import type { Locale } from "@/i18n/routing";
import { getPaymentPrices } from "@/lib/payment-config";
import { pageSeo, staticAlternates } from "@/lib/seo";

// Giá bán do admin sửa trong /admin/vouchers và nằm trong AppConfig. Trang này
// phải đọc DB ở mỗi request: build trong Docker không có sẵn dev.db (xem
// .dockerignore), nên prerender sẽ đóng băng một mức giá sai vào HTML.
export const dynamic = "force-dynamic";

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

  const prices = await getPaymentPrices();

  return <ChungDoiPricing prices={prices} />;
}
