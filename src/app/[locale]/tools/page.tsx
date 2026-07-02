import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiTools } from "@/components/chungdoi-tools";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: getPathname({ href: "/tools", locale }) },
  };
}

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ChungDoiTools />;
}
