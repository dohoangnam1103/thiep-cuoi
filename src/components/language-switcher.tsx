"use client";

import { Check, Globe2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function selectLocale(nextLocale: string) {
    setOpen(false);
    if (nextLocale === locale) return;
    router.replace(
      // @ts-expect-error -- next-intl validates params against the current route
      { pathname, params },
      { locale: nextLocale },
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-zinc-200 transition hover:border-[#fb3570]/60 hover:text-white"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe2 className="size-4" />
        <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul
            className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#241a17] p-1 shadow-2xl shadow-black/40"
            role="listbox"
          >
            {routing.locales.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => selectLocale(code)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                    code === locale ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"
                  }`}
                  role="option"
                  aria-selected={code === locale}
                >
                  {LOCALE_LABELS[code]}
                  {code === locale ? <Check className="size-4 text-[#fb3570]" /> : null}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
