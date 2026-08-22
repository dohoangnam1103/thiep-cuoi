import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { V5Approach } from "@/components/home2/lab/v5-approach";
import type { Locale } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Wireframe V5 · Đi về phía nhau",
  robots: { index: false, follow: false },
};

export default async function LabV5({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <V5Approach />;
}
