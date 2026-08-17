"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { reportClientError } from "@/lib/report-client-error";

/**
 * Segment boundary for the public localized pages. Sits below
 * NextIntlClientProvider, so translations are available here — unlike
 * `global-error.tsx`, which replaces the whole layout tree.
 *
 * Keeping this boundary shallow means a crash in the homepage carousel no
 * longer takes down the surrounding chrome.
 */
export default function LocaleError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("errorBoundary");

  useEffect(() => {
    reportClientError(error, "segment");
  }, [error]);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-balance">{t("title")}</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {t("description")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t("home")}
        </Link>
      </div>
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">
          {t("digest", { digest: error.digest })}
        </p>
      ) : null}
    </main>
  );
}
