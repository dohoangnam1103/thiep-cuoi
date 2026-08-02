import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FlowLab } from "@/components/flow-lab";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

function isLabEnabled(): boolean {
  return process.env.NODE_ENV !== "production"
    || process.env.FLOW_DEMO_LAB_ENABLED === "1";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "flowDemoLab" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function FlowDemoLabPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  if (!isLabEnabled()) notFound();

  const { locale } = await params;
  setRequestLocale(locale);

  return <FlowLab />;
}
