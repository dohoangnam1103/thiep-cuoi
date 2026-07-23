"use client";

import { Clock3, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { getTrialRemaining } from "@/lib/trial";

type TrialCountdownBannerProps = {
  invitationId: string;
  expiresAt: number;
  source: "dashboard_list" | "editor";
  className?: string;
};

const CLOCK_RESOLUTION_MS = 30_000;

function subscribeClock(onStoreChange: () => void) {
  const timer = window.setInterval(onStoreChange, CLOCK_RESOLUTION_MS);
  window.addEventListener("focus", onStoreChange);
  document.addEventListener("visibilitychange", onStoreChange);

  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onStoreChange);
    document.removeEventListener("visibilitychange", onStoreChange);
  };
}

function getClockSnapshot(): number | null {
  return Math.floor(Date.now() / CLOCK_RESOLUTION_MS) * CLOCK_RESOLUTION_MS;
}

function getServerClockSnapshot(): number | null {
  return null;
}

export function TrialCountdownBanner({
  invitationId,
  expiresAt,
  source,
  className = "",
}: TrialCountdownBannerProps) {
  const t = useTranslations("trialCountdown");
  const now = useSyncExternalStore(
    subscribeClock,
    getClockSnapshot,
    getServerClockSnapshot,
  );
  const remaining = now === null ? null : getTrialRemaining(expiresAt, now);
  const title = !remaining
    ? t("calculating")
    : remaining.expired
      ? t("expired")
      : remaining.days > 0
        ? t("daysHours", { days: remaining.days, hours: remaining.hours })
        : remaining.hours > 0
          ? t("hoursMinutes", { hours: remaining.hours, minutes: remaining.minutes })
          : remaining.minutes > 0
            ? t("minutes", { minutes: remaining.minutes })
            : t("lessMinute");

  return (
    <section
      className={`flex flex-col gap-4 rounded-2xl bg-amber-400 px-4 py-4 text-amber-950 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 ${className}`}
      aria-label={t("regionLabel")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Clock3 className="size-7 shrink-0 stroke-[2.25] sm:size-8" aria-hidden />
        <div className="min-w-0">
          <p className="font-bold leading-tight sm:text-lg" aria-live="polite">
            {title}
          </p>
          <p className="mt-1 text-sm text-amber-950/75">
            {remaining?.expired ? t("expiredDescription") : t("activeDescription")}
          </p>
        </div>
      </div>
      <Link
        href={`/dashboard/${invitationId}/thanh-toan`}
        data-ga-event="checkout_click"
        data-ga-param-source={source}
        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 font-bold text-pink-500 shadow-md transition hover:-translate-y-0.5 hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-400"
      >
        <span className="grid size-8 place-items-center rounded-full bg-pink-500 text-white shadow">
          <Sparkles className="size-4" aria-hidden />
        </span>
        {t("payNow")}
      </Link>
    </section>
  );
}
