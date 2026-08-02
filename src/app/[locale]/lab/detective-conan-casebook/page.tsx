import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { DetectiveConanCasebookLab } from "@/components/chungdoi-detective-conan-casebook-lab";
import { manifest } from "@/data/templates/detective-conan-casebook.manifest";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

function isLabEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.DETECTIVE_CONAN_CASEBOOK_LAB_ENABLED === "1"
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const listing = manifest.i18n[locale];

  return {
    title: listing.name,
    description: listing.description,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DetectiveConanCasebookLabPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  if (!isLabEnabled()) notFound();

  const { locale } = await params;
  setRequestLocale(locale);

  return <DetectiveConanCasebookLab />;
}
