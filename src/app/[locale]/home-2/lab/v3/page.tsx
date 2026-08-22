import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { V3Album } from "@/components/home2/lab/v3-album";
import type { Locale } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Wireframe V3 · Album lật ngang",
  robots: { index: false, follow: false },
};

export default async function LabV3({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <V3Album />;
}
