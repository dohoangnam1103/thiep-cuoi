import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import {
  ForestWeddingJourneyLab,
  type ForestWeddingJourneyFixture,
} from "@/components/forest-wedding-journey/forest-wedding-journey-lab";
import enMessages from "../../../../../messages/en.json";
import jaMessages from "../../../../../messages/ja.json";
import koMessages from "../../../../../messages/ko.json";
import viMessages from "../../../../../messages/vi.json";
import zhMessages from "../../../../../messages/zh.json";

export const dynamic = "force-dynamic";

function isLabEnabled(): boolean {
  return process.env.NODE_ENV !== "production"
    || process.env.FOREST_WEDDING_JOURNEY_LAB_ENABLED === "1";
}

const forestLabMessages = {
  en: enMessages.forestWeddingJourneyLab,
  ja: jaMessages.forestWeddingJourneyLab,
  ko: koMessages.forestWeddingJourneyLab,
  vi: viMessages.forestWeddingJourneyLab,
  zh: zhMessages.forestWeddingJourneyLab,
} as const;

type ForestLabLocale = keyof typeof forestLabMessages;

function isForestLabLocale(value: string): value is ForestLabLocale {
  return value in forestLabMessages;
}

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function resolveFixture(value: string | undefined): ForestWeddingJourneyFixture {
  return value === "long-copy" ? "long-copy" : "default";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isForestLabLocale(locale)) notFound();
  const messages = forestLabMessages[locale];

  return {
    title: messages.metaTitle,
    description: messages.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ForestWeddingJourneyLabPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isLabEnabled()) notFound();

  const { locale } = await params;
  if (!isForestLabLocale(locale)) notFound();
  const query = await searchParams;
  const fixture = resolveFixture(firstSearchParam(query.fixture));
  setRequestLocale("vi");

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{ forestWeddingJourneyLab: forestLabMessages[locale] }}
    >
      <ForestWeddingJourneyLab fixture={fixture} />
    </NextIntlClientProvider>
  );
}
