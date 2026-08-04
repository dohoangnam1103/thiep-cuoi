// Copied from src/app/[locale]/lab/forest-wedding-journey/page.tsx. Fixes to the
// lab route mechanics must be applied to both.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import {
  BeachWeddingJourneyLab,
  type BeachWeddingJourneyFixture,
} from "@/components/beach-wedding-journey/beach-wedding-journey-lab";
import enMessages from "../../../../../messages/en.json";
import jaMessages from "../../../../../messages/ja.json";
import koMessages from "../../../../../messages/ko.json";
import viMessages from "../../../../../messages/vi.json";
import zhMessages from "../../../../../messages/zh.json";

export const dynamic = "force-dynamic";

function isLabEnabled(): boolean {
  return process.env.NODE_ENV !== "production"
    || process.env.BEACH_WEDDING_JOURNEY_LAB_ENABLED === "1";
}

/**
 * Resolved per request rather than inlined at build time, so the diagnostic E2E
 * suite can opt a production build in while real visitors never receive the
 * `window.__beachWeddingJourneyDiagnostics` reader.
 */
function areRuntimeDiagnosticsEnabled(): boolean {
  return process.env.BEACH_RUNTIME_DIAGNOSTICS === "1";
}

const beachLabMessages = {
  en: enMessages.beachWeddingJourneyLab,
  ja: jaMessages.beachWeddingJourneyLab,
  ko: koMessages.beachWeddingJourneyLab,
  vi: viMessages.beachWeddingJourneyLab,
  zh: zhMessages.beachWeddingJourneyLab,
} as const;

type BeachLabLocale = keyof typeof beachLabMessages;

function isBeachLabLocale(value: string): value is BeachLabLocale {
  return value in beachLabMessages;
}

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function resolveFixture(value: string | undefined): BeachWeddingJourneyFixture {
  return value === "long-copy" ? "long-copy" : "default";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isBeachLabLocale(locale)) notFound();
  const messages = beachLabMessages[locale];

  return {
    title: messages.metaTitle,
    description: messages.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function BeachWeddingJourneyLabPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isLabEnabled()) notFound();

  const { locale } = await params;
  if (!isBeachLabLocale(locale)) notFound();
  const query = await searchParams;
  const fixture = resolveFixture(firstSearchParam(query.fixture));
  setRequestLocale("vi");

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{ beachWeddingJourneyLab: beachLabMessages[locale] }}
    >
      <BeachWeddingJourneyLab
        diagnosticsEnabled={areRuntimeDiagnosticsEnabled()}
        fixture={fixture}
      />
    </NextIntlClientProvider>
  );
}
