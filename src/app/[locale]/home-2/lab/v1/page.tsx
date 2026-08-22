import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { V1Envelope } from "@/components/home2/lab/v1-envelope";
import type { Locale } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Wireframe V1 · Thiệp mở ra",
  robots: { index: false, follow: false },
};

export default async function LabV1({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <V1Envelope />;
}
