import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { V4Thread } from "@/components/home2/lab/v4-thread";
import type { Locale } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Wireframe V4 · Tơ hồng",
  robots: { index: false, follow: false },
};

export default async function LabV4({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <V4Thread />;
}
