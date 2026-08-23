import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { V6Merged } from "@/components/home2/lab/v6-merged";
import type { Locale } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Wireframe V6 · Hành trình về chung một nhà",
  robots: { index: false, follow: false },
};

export default async function LabV6({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <V6Merged />;
}
