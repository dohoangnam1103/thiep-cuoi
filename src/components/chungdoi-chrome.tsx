"use client";

import { ImageIcon, Menu, MessageCircle, Play, Plus, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import NextLink from "next/link";

// import { LanguageSwitcher } from "@/components/language-switcher"; // tạm ẩn: web chỉ dùng tiếng Việt
import { LogoMark } from "@/components/logo-mark";
import { AdaptiveToaster } from "@/components/adaptive-toaster";
import { Link, usePathname } from "@/i18n/navigation";
import { loginHref, TEMPLATE_LIST_PATH } from "@/lib/auth-redirects";

type SessionState = { loggedIn: boolean; firstInvitationId: string | null; invitationCount?: number; email?: string | null };

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function desktopNavClassName(active: boolean) {
  return `rounded-full px-3 py-2 transition ${
    active ? "bg-primary/10 font-bold text-primary" : "hover:text-foreground"
  }`;
}

export function Logo({ responsive = false }: { responsive?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Thiệp Mừng Online"
      className="flex shrink-0 items-center rounded-xl px-1 py-1 transition hover:bg-muted"
    >
      <LogoMark
        eager={responsive}
        className={responsive ? "h-9 w-auto sm:h-11" : "h-12 w-auto max-w-full"}
      />
    </Link>
  );
}

export function SiteHeader({
  initialLoggedIn = false,
  hideCreateButton = false,
}: {
  initialLoggedIn?: boolean;
  hideCreateButton?: boolean;
}) {
  const t = useTranslations("chrome");
  const pathname = usePathname() as string;
  const [session, setSession] = useState<SessionState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const loggedIn = session?.loggedIn ?? initialLoggedIn;
  // Khách mời: đúng 1 thiệp → vào guests của thiệp đó luôn. 0 hoặc nhiều thiệp →
  // vào /dashboard (danh sách thiệp) để user tự chọn.
  const guestsHref =
    session?.invitationCount === 1 && session.firstInvitationId
      ? `/dashboard/${session.firstInvitationId}/guests`
      : "/dashboard";
  const templatesActive = isActivePath(pathname, "/templates");
  const guestsActive = /^\/dashboard\/[^/]+\/guests(?:\/|$)/.test(pathname);
  const dashboardActive = isActivePath(pathname, "/dashboard") && !guestsActive;
  const pricingActive = isActivePath(pathname, "/pricing");
  const toolsActive = isActivePath(pathname, "/tools");
  const blogActive = isActivePath(pathname, "/blog");
  const helpActive = isActivePath(pathname, "/help");

  const menuItems: Array<{ label: string; href: string; active: boolean }> = [
    { label: t("nav.templates"), href: "/templates", active: templatesActive },
    ...(loggedIn
      ? [
          { label: t("nav.myInvitations"), href: "/dashboard", active: dashboardActive },
          { label: t("nav.guests"), href: guestsHref, active: guestsActive },
        ]
      : []),
    { label: t("nav.pricing"), href: "/pricing", active: pricingActive },
    { label: t("nav.tools"), href: "/tools", active: toolsActive },
    { label: t("nav.blog"), href: "/blog", active: blogActive },
    { label: t("nav.help"), href: "/help", active: helpActive },
  ];

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
          aria-label={t("menu")}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
        >
          <Menu className="size-6" />
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 lg:static lg:left-auto lg:translate-x-0">
          <Logo responsive />
        </div>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
          <Link href="/templates" className={desktopNavClassName(templatesActive)} aria-current={templatesActive ? "page" : undefined}>
            {t("nav.templates")}
          </Link>
          {loggedIn ? (
            <>
              <NextLink
                href="/dashboard"
                className={desktopNavClassName(dashboardActive)}
                aria-current={dashboardActive ? "page" : undefined}
              >
                {t("nav.myInvitations")}
              </NextLink>
              <NextLink
                href={guestsHref}
                className={desktopNavClassName(guestsActive)}
                aria-current={guestsActive ? "page" : undefined}
              >
                {t("nav.guests")}
              </NextLink>
            </>
          ) : null}
          <Link href="/pricing" className={desktopNavClassName(pricingActive)} aria-current={pricingActive ? "page" : undefined}>
            {t("nav.pricing")}
          </Link>
          <Link href="/blog" className={desktopNavClassName(blogActive)} aria-current={blogActive ? "page" : undefined}>
            {t("nav.blog")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {/* Tạm ẩn: web hiện chỉ dùng tiếng Việt */}
          {/* <LanguageSwitcher /> */}
          {hideCreateButton ? null : loggedIn ? (
            <Link
              href="/templates"
              aria-label={t("createNow")}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90 lg:size-auto lg:whitespace-nowrap lg:px-4 lg:py-2"
            >
              <Plus className="size-5 lg:hidden" />
              <span className="hidden lg:inline">{t("createNow")}</span>
            </Link>
          ) : (
            <NextLink
              href={loginHref(TEMPLATE_LIST_PATH)}
              aria-label={t("createNow")}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90 lg:size-auto lg:whitespace-nowrap lg:px-4 lg:py-2"
            >
              <Plus className="size-5 lg:hidden" />
              <span className="hidden lg:inline">{t("createNow")}</span>
            </NextLink>
          )}
        </div>
      </div>
      <AdaptiveToaster />
    </header>

      {/* Drawer menu trượt từ trái (mobile) */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          aria-label={t("closeMenu")}
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={t("menu")}
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-background shadow-2xl transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Logo />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label={t("closeMenu")}
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <NextLink
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center rounded-xl px-4 py-3 text-base font-semibold transition ${
                      item.active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    }`}
                    aria-current={item.active ? "page" : undefined}
                  >
                    {item.label}
                  </NextLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}

export function SiteFooter() {
  const t = useTranslations("chrome.footer");
  const pathname = usePathname() as string;
  const templatesActive = isActivePath(pathname, "/templates");
  const pricingActive = isActivePath(pathname, "/pricing");
  const toolsActive = isActivePath(pathname, "/tools");

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
          <Link
            href="/templates"
            className={`flex flex-col items-center justify-center gap-1 transition ${templatesActive ? "bg-primary/10 text-primary" : "hover:text-foreground"}`}
            aria-current={templatesActive ? "page" : undefined}
          >
            <ImageIcon className="size-5" /> {t("mobileTemplates")}
          </Link>
          <Link
            href="/pricing"
            className={`flex flex-col items-center justify-center gap-1 transition ${pricingActive ? "bg-primary/10 text-primary" : "hover:text-foreground"}`}
            aria-current={pricingActive ? "page" : undefined}
          >
            <Play className="size-5" /> {t("pricing")}
          </Link>
          <Link
            href="/tools"
            className={`flex flex-col items-center justify-center gap-1 transition ${toolsActive ? "bg-primary/10 text-primary" : "hover:text-foreground"}`}
            aria-current={toolsActive ? "page" : undefined}
          >
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
