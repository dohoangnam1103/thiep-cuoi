"use client";

import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SlideshowProjectsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("slideshowDashboard");

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[radial-gradient(circle_at_top,#35342f,#11110f_68%)] px-5 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-red-300/15 bg-white/5 p-8 text-center shadow-2xl sm:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-300/10 text-red-200">
          <CircleAlert size={25} aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{t("error.title")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/50">{t("error.description")}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-[#d8ff3e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e2ff73]"
          >
            <RotateCcw size={15} aria-hidden />
            {t("error.retry")}
          </button>
          <Link
            href="/trinh-chieu"
            className="rounded-full border border-white/12 px-5 py-2.5 text-sm font-medium text-white/65 transition hover:bg-white/8 hover:text-white"
          >
            {t("error.back")}
          </Link>
        </div>
      </div>
    </main>
  );
}
