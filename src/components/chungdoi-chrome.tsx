"use client";

import { ImageIcon, MessageCircle, Play, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import NextLink from "next/link";

// import { LanguageSwitcher } from "@/components/language-switcher"; // tạm ẩn: web chỉ dùng tiếng Việt
import { LogoMark } from "@/components/logo-mark";
import { Link } from "@/i18n/navigation";

type SessionState = { loggedIn: boolean; firstInvitationId: string | null };

export function Logo({ responsive = false }: { responsive?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-muted">
      <LogoMark className="size-8" />
      {responsive ? (
        <>
          <span className="font-pattaya text-2xl text-foreground sm:hidden">Thiệp Mừng</span>
          <span className="hidden font-pattaya text-2xl text-foreground sm:inline">Thiệp Mừng Online</span>
        </>
      ) : (
        <span className="font-pattaya text-2xl text-foreground">Thiệp Mừng Online</span>
      )}
    </Link>
  );
}

export function SiteHeader() {
  const t = useTranslations("chrome");
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SessionState | null) => {
        if (active && data) setSession(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const loggedIn = session?.loggedIn ?? false;
  const guestsHref = session?.firstInvitationId
    ? `/dashboard/${session.firstInvitationId}/guests`
    : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo responsive />
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
          <Link href="/templates" className="transition hover:text-foreground">
            {t("nav.templates")}
          </Link>
          {loggedIn ? (
            <>
              <NextLink href="/dashboard" className="transition hover:text-foreground">
                {t("nav.myInvitations")}
              </NextLink>
              <NextLink href={guestsHref} className="transition hover:text-foreground">
                {t("nav.guests")}
              </NextLink>
            </>
          ) : null}
          <Link href="/pricing" className="transition hover:text-foreground">
            {t("nav.pricing")}
          </Link>
          <Link href="/blog" className="transition hover:text-foreground">
            {t("nav.blog")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {/* Tạm ẩn: web hiện chỉ dùng tiếng Việt */}
          {/* <LanguageSwitcher /> */}
          {loggedIn ? null : (
            <NextLink
              href="/login"
              className="hidden rounded-full border border-border px-4 py-2 text-sm font-bold text-foreground transition hover:border-primary/60 hover:text-primary sm:inline-block"
            >
              {t("login")}
            </NextLink>
          )}
          <Link
            href="/templates"
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90"
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
    <footer className="border-t border-border bg-secondary pb-24 pt-12 lg:pb-8">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">{t("tagline")}</p>
        </div>
        {columns.map(([heading, items]) => (
          <div key={heading}>
            <h3 className="font-heading text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">{heading}</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {items.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="transition hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>{t("copyright")}</p>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg lg:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-3 text-xs font-bold text-muted-foreground">
          <Link href="/templates" className="flex flex-col items-center justify-center gap-1 hover:text-foreground">
            <ImageIcon className="size-5" /> {t("mobileTemplates")}
          </Link>
          <Link href="/pricing" className="flex flex-col items-center justify-center gap-1 hover:text-foreground">
            <Play className="size-5" /> {t("pricing")}
          </Link>
          <Link href="/tools" className="flex flex-col items-center justify-center gap-1 hover:text-foreground">
            <Users className="size-5" /> {t("toolsHeading")}
          </Link>
        </div>
      </nav>
      <Link
        href="/help"
        className="fixed bottom-20 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 transition hover:-translate-y-1 sm:bottom-6"
        aria-label={t("chatWithUs")}
      >
        <MessageCircle className="size-6" />
      </Link>
    </footer>
  );
}
