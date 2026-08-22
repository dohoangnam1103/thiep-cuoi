import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { V2Travel } from "@/components/home2/lab/v2-travel";
import type { Locale } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Wireframe V2 · Thiệp du hành",
  robots: { index: false, follow: false },
};

export default async function LabV2({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <V2Travel />;
}
