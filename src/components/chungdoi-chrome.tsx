"use client";

import { ImageIcon, MessageCircle, Play, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";

const NAV_LINKS = [
  ["templates", "/templates"],
  ["pricing", "/pricing"],
  ["tools", "/tools"],
  ["blog", "/blog"],
  ["help", "/help"],
] as const;

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-white/5">
      <img src="/chungdoi/icon.png" alt="ChungDoi" className="size-8 rounded-lg" />
      <span className="font-pattaya text-2xl text-white">ChungDoi</span>
    </Link>
  );
}

export function SiteHeader() {
  const t = useTranslations("chrome");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#18120f]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-semibold text-zinc-200 lg:flex">
          {NAV_LINKS.map(([key, href]) => (
            <Link key={href} href={href} className="transition hover:text-[#fb3570]">
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/templates"
            className="rounded-full bg-[#fb3570] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#fb3570]/25 transition hover:-translate-y-0.5 hover:bg-[#ff4a82]"
          >
            {t("createNow")}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const t = useTranslations("chrome.footer");

  const columns: Array<[string, Array<[string, "/templates" | "/pricing" | "/tools" | "/blog" | "/help" | "/privacy-policy" | "/terms-of-service"]>]> = [
    [
      t("product"),
      [
        [t("weddingTemplates"), "/templates"],
        [t("pricing"), "/pricing"],
        [t("createInvitation"), "/templates"],
      ],
    ],
    [
      t("toolsHeading"),
      [
        [t("allTools"), "/tools"],
        [t("imageCompressor"), "/tools"],
        [t("qrGenerator"), "/tools"],
        [t("guestList"), "/tools"],
      ],
    ],
    [
      t("resources"),
      [
        [t("helpCenter"), "/help"],
        [t("privacyPolicy"), "/privacy-policy"],
        [t("termsOfService"), "/terms-of-service"],
      ],
    ],
  ];

  return (
    <footer className="border-t border-white/10 bg-[#18120f] pb-24 pt-12 lg:pb-8">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">{t("tagline")}</p>
        </div>
        {columns.map(([heading, items]) => (
          <div key={heading}>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">{heading}</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
              {items.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="transition hover:text-[#fb3570]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 px-4 text-sm text-zinc-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>{t("copyright")}</p>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#18120f]/95 backdrop-blur-lg lg:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-3 text-xs font-bold text-zinc-400">
          <Link href="/templates" className="flex flex-col items-center justify-center gap-1 hover:text-white">
            <ImageIcon className="size-5" /> {t("mobileTemplates")}
          </Link>
          <Link href="/pricing" className="flex flex-col items-center justify-center gap-1 hover:text-white">
            <Play className="size-5" /> {t("pricing")}
          </Link>
          <Link href="/tools" className="flex flex-col items-center justify-center gap-1 hover:text-white">
            <Users className="size-5" /> {t("toolsHeading")}
          </Link>
        </div>
      </nav>
      <Link
        href="/help"
        className="fixed bottom-20 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-[#fb3570] text-white shadow-2xl shadow-[#fb3570]/30 transition hover:-translate-y-1 sm:bottom-6"
        aria-label={t("chatWithUs")}
      >
        <MessageCircle className="size-6" />
      </Link>
    </footer>
  );
}
