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
  onSessionChange,
}: {
  initialLoggedIn?: boolean;
  hideCreateButton?: boolean;
  onSessionChange?: (loggedIn: boolean) => void;
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
        if (active && data) {
          setSession(data);
          onSessionChange?.(data.loggedIn);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [onSessionChange]);

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
          {/* Nút "Tạo ngay": khi hideCreateButton (vd trang Mẫu thiệp) vẫn render
              nhưng GIỮ CHỖ vô hình (invisible + non-interactive) → header đồng vị
              trí mọi trang, nav không bị dồn lệch sang phải. */}
          {loggedIn ? (
            <Link
              href="/templates"
              aria-label={t("createNow")}
              aria-hidden={hideCreateButton || undefined}
              tabIndex={hideCreateButton ? -1 : undefined}
              className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90 lg:size-auto lg:whitespace-nowrap lg:px-4 lg:py-2 ${
                hideCreateButton ? "pointer-events-none invisible" : ""
              }`}
            >
              <Plus className="size-5 lg:hidden" />
              <span className="hidden lg:inline">{t("createNow")}</span>
            </Link>
          ) : (
            <NextLink
              href={loginHref(TEMPLATE_LIST_PATH)}
              aria-label={t("createNow")}
              aria-hidden={hideCreateButton || undefined}
              tabIndex={hideCreateButton ? -1 : undefined}
              className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90 lg:size-auto lg:whitespace-nowrap lg:px-4 lg:py-2 ${
                hideCreateButton ? "pointer-events-none invisible" : ""
              }`}
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
      <details className="group fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-[60] lg:bottom-6">
        <summary
          aria-label={t("chatWithUs")}
          className="flex size-14 cursor-pointer list-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
        >
          <MessageCircle className="size-6 group-open:hidden" />
          <X className="hidden size-6 group-open:block" />
        </summary>
        <div className="absolute bottom-full right-0 mb-3 flex flex-col items-center gap-3 [&>a]:size-14 [&_svg]:size-8">
          <a
            href="https://www.facebook.com/thiepmungcuoi"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("facebookContact")}
            title={t("facebookContact")}
            className="flex size-12 cursor-pointer items-center justify-center rounded-2xl border border-white/70 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.18)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2] focus-visible:ring-offset-2"
          >
            <span className="sr-only">{t("facebookContact")}</span>
            <svg className="size-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M15.9993 29.3327C23.3631 29.3327 29.3327 23.3631 29.3327 15.9993C29.3327 8.63555 23.3631 2.66602 15.9993 2.66602C8.63555 2.66602 2.66602 8.63555 2.66602 15.9993C2.66602 23.3631 8.63555 29.3327 15.9993 29.3327Z" fill="#1877F2" />
              <path d="M21.1884 19.8541L21.7797 16.0002H18.0818V13.4993C18.0818 12.4449 18.5983 11.417 20.2545 11.417H21.9357V8.13587C20.9486 7.97613 19.9511 7.88894 18.9513 7.875C15.9055 7.875 13.9148 9.7208 13.9148 13.0628V16.0002H10.5293V19.8541H13.9148V29.1712C15.2954 29.3877 16.7012 29.3877 18.0818 29.1712V19.8541H21.1884Z" fill="white" />
            </svg>
          </a>
          <a
            href="https://zalo.me/0787313749"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("zaloContact")}
            title={t("zaloContact")}
            className="flex size-12 cursor-pointer items-center justify-center rounded-2xl border border-white/70 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.18)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0068ff] focus-visible:ring-offset-2"
          >
            <span className="sr-only">{t("zaloContact")}</span>
            <svg className="size-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M7.61855 2.79984C8.53326 2.65584 9.46352 2.65498 10.3877 2.67567L10.3083 2.74896C9.09902 3.53967 8.0962 4.62528 7.37152 5.87127C5.91869 8.36584 5.38921 11.3157 5.50927 14.175C5.62847 16.5031 6.18818 18.8442 7.37497 20.868C7.57363 21.2301 7.90445 21.55 7.90963 21.9898C7.94677 22.9331 7.47949 23.8221 6.84722 24.4964C6.88868 24.5396 6.92928 24.5827 6.97074 24.6258C7.56241 25.2708 8.19381 25.877 8.79498 26.5133C9.64923 27.4773 10.6227 28.331 11.4597 29.3123C10.0673 29.333 8.65851 29.3976 7.28255 29.1381C5.55073 28.8027 4.01325 27.6041 3.27906 26.002C2.83423 25.0759 2.70121 24.0403 2.66666 23.0254C2.6658 18.3398 2.6658 13.655 2.66666 8.97029C2.68567 7.4044 3.10113 5.76607 4.205 4.60458C5.07912 3.62073 6.31688 2.98092 7.61855 2.79984Z" fill="#0068FF" />
              <path d="M20.3021 11.4023C20.6727 11.4023 21.0432 11.4023 21.4146 11.4023C21.4086 13.5692 21.4086 15.737 21.4146 17.9039C21.0518 17.853 20.4481 18.085 20.3116 17.603C20.2892 15.537 20.3099 13.4692 20.3021 11.4023Z" fill="#0068FF" />
              <path d="M8.96598 11.479C10.69 11.4773 12.4124 11.4661 14.1355 11.4782C14.1234 11.8153 14.1044 12.1827 13.8781 12.4551C12.7 13.9193 11.5469 15.4024 10.3696 16.8666C11.6212 16.8743 12.8727 16.8691 14.1243 16.8691C14.101 17.1614 14.2038 17.502 14.0137 17.7556C13.8945 17.9194 13.6786 17.9047 13.4998 17.9065C11.9338 17.8978 10.3679 17.9142 8.80273 17.8978C8.80705 17.5676 8.81051 17.202 9.04199 16.939C10.2063 15.4809 11.3845 14.0331 12.5436 12.5716C11.3525 12.5733 10.1606 12.5638 8.96944 12.5767C8.96166 12.2111 8.96426 11.8447 8.96598 11.479Z" fill="#0068FF" />
              <path d="M24.1759 12.9194C25.4162 12.6427 26.762 13.4558 27.1014 14.675C27.5273 15.9434 26.7499 17.4516 25.4655 17.8379C24.3746 18.2216 23.0686 17.7206 22.5028 16.7169C22.0588 15.9754 22.0321 15.0044 22.4354 14.2413C22.7775 13.5679 23.4383 13.0755 24.1759 12.9194ZM24.1552 14.018C23.3985 14.2844 22.9908 15.2036 23.2862 15.946C23.5307 16.6479 24.3538 17.0773 25.069 16.8618C25.8853 16.6669 26.3785 15.7124 26.0891 14.9303C25.8473 14.156 24.9101 13.7093 24.1552 14.018Z" fill="#0068FF" />
              <path d="M14.9829 13.8129C15.5797 13.0748 16.6249 12.7109 17.5456 12.9739C17.8497 13.0507 18.1252 13.2024 18.3912 13.3637C18.3886 13.2826 18.3826 13.1214 18.38 13.0403C18.7281 13.0386 19.0753 13.0395 19.4234 13.0377C19.4217 14.6588 19.42 16.2799 19.4243 17.9018C19.1686 17.8949 18.9086 17.9251 18.6573 17.8734C18.4811 17.8018 18.4266 17.6095 18.3567 17.4526C17.3962 18.1976 15.8872 18.0286 15.0891 17.1215C14.2383 16.2428 14.1943 14.7459 14.9829 13.8129ZM16.3891 14.0302C15.5892 14.3113 15.2014 15.34 15.6065 16.0816C15.952 16.8042 16.9246 17.1077 17.6199 16.7093C18.2651 16.3713 18.5631 15.5323 18.2859 14.8614C18.0172 14.132 17.1112 13.7232 16.3891 14.0302Z" fill="#0068FF" />
              <path d="M10.3057 2.74839C10.4991 2.6932 10.7013 2.67596 10.9017 2.66992C14.3558 2.68286 17.8099 2.6682 21.2641 2.67423C22.1874 2.68544 23.116 2.62336 24.0324 2.76391C25.3013 2.86049 26.5226 3.39682 27.4667 4.24444C28.6517 5.37488 29.284 7.00286 29.3039 8.62653C29.3047 13.1975 29.3021 17.7718 29.3065 22.341C29.2944 22.3678 29.2711 22.423 29.259 22.4506C28.0281 23.825 26.3732 24.7554 24.6431 25.3573C22.3118 26.1506 19.8147 26.4058 17.3642 26.2196C14.9138 26.0092 12.4443 25.3702 10.3661 24.0182C9.30372 24.4898 8.13161 24.7209 6.96814 24.6252C6.92668 24.5821 6.88608 24.539 6.84462 24.4959C7.47688 23.8216 7.94417 22.9326 7.90703 21.9892C7.90185 21.5495 7.57103 21.2296 7.37237 20.8674C6.18558 18.8436 5.62587 16.5026 5.50667 14.1744C5.38661 11.3151 5.91609 8.36526 7.36892 5.87069C8.0936 4.6247 9.09642 3.5391 10.3057 2.74839ZM20.2975 11.4031C20.3053 13.4699 20.2846 15.5377 20.307 17.6037C20.4435 18.0857 21.0473 17.8538 21.4101 17.9046C21.404 15.7377 21.404 13.57 21.4101 11.4031C21.0386 11.4031 20.6681 11.4031 20.2975 11.4031ZM8.96167 11.4798C8.95995 11.8454 8.95735 12.2119 8.96513 12.5775C10.1562 12.5645 11.3482 12.574 12.5393 12.5723C11.3802 14.0339 10.202 15.4816 9.03768 16.9397C8.8062 17.2027 8.80274 17.5683 8.79842 17.8986C10.3635 17.915 11.9295 17.8986 13.4955 17.9072C13.6743 17.9055 13.8902 17.9201 14.0094 17.7563C14.1995 17.5028 14.0967 17.1622 14.12 16.8699C12.8684 16.8699 11.6168 16.8751 10.3653 16.8673C11.5426 15.4032 12.6957 13.92 13.8738 12.4559C14.1001 12.1834 14.1191 11.8161 14.1312 11.4789C12.408 11.4669 10.6857 11.4781 8.96167 11.4798ZM24.168 12.9146C23.4304 13.0707 22.7696 13.5631 22.4276 14.2365C22.0242 14.9996 22.051 15.9705 22.4949 16.7121C23.0607 17.7158 24.3667 18.2168 25.4576 17.8331C26.742 17.4468 27.5194 15.9386 27.0935 14.6702C26.7541 13.451 25.4084 12.6378 24.168 12.9146ZM14.9794 13.8174C14.1908 14.7504 14.2349 16.2473 15.0857 17.126C15.8838 18.0331 17.3927 18.2021 18.3532 17.4571C18.4232 17.614 18.4776 17.8063 18.6538 17.8779C18.9052 17.9296 19.1652 17.8995 19.4208 17.9064C19.4165 16.2844 19.4182 14.6633 19.42 13.0422C19.0719 13.044 18.7247 13.0431 18.3766 13.0448C18.3792 13.1259 18.3852 13.2871 18.3878 13.3682C18.1218 13.2069 17.8462 13.0552 17.5422 12.9784C16.6214 12.7154 15.5763 13.0793 14.9794 13.8174Z" fill="white" />
              <path d="M16.3843 14.0347C17.1063 13.7277 18.0124 14.1364 18.281 14.8659C18.5583 15.5368 18.2603 16.3758 17.6151 16.7138C16.9198 17.1121 15.9472 16.8086 15.6017 16.086C15.1966 15.3445 15.5844 14.3158 16.3843 14.0347Z" fill="white" />
              <path d="M24.1492 14.0127C24.9041 13.704 25.8413 14.1507 26.0831 14.925C26.3725 15.7071 25.8793 16.6616 25.063 16.8565C24.3478 17.072 23.5247 16.6426 23.2803 15.9407C22.9849 15.1983 23.3925 14.2791 24.1492 14.0127Z" fill="white" />
              <path d="M29.2615 22.4492L29.3298 22.375C29.3652 23.7227 29.2192 25.1291 28.5567 26.3285C27.7862 27.7358 26.3887 28.7809 24.8167 29.1154C23.9348 29.2974 23.0304 29.3379 22.1321 29.3267C19.369 29.3275 16.6058 29.3267 13.8427 29.3275C13.0481 29.3146 12.2517 29.3517 11.4596 29.3103C10.6226 28.329 9.6492 27.4754 8.79495 26.5113C8.19377 25.875 7.56237 25.2688 6.9707 24.6238C8.13418 24.7195 9.30629 24.4884 10.3687 24.0168C12.4469 25.3688 14.9164 26.0078 17.3668 26.2182C19.8173 26.4044 22.3144 26.1492 24.6456 25.3559C26.3757 24.754 28.0307 23.8236 29.2615 22.4492Z" fill="#005BE0" />
            </svg>
          </a>
        </div>
      </details>
    </footer>
  );
}
