import { HeroTypographyDefaults } from "@/components/hero-typography-defaults";
import type { Metadata } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import viMessages from "../../../messages/vi.json";
import "../globals.css";
import { PetalField } from "@/components/petal-field";
import { getCurrentAdmin } from "@/lib/admin-dal";
import { appFontVariables } from "@/lib/fonts";
import { adminLogout } from "./actions";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = {
  title: "Quản trị | Thiệp Mừng Online",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/users", label: "Người dùng" },
  { href: "/admin/invitations", label: "Thiệp thật" },
  { href: "/admin/demos", label: "Thiệp demo" },
  { href: "/admin/demos?tab=mobile-thumbnail", label: "Thumbnail mobile" },
  { href: "/admin/blogs", label: "Bài viết" },
  { href: "/admin/template-suggestions", label: "Gợi ý mẫu thiệp" },
  { href: "/admin/payments", label: "Giao dịch" },
  { href: "/admin/vouchers", label: "Giá" },
  { href: "/admin/settings", label: "Cài đặt" },
];

const SUPER_ADMIN_NAV = [
  { href: "/admin/admins", label: "Admin" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [admin, t] = await Promise.all([getCurrentAdmin(), getTranslations("adminSupport")]);
  const navItems = [...NAV, { href: "/admin/email-logs", label: t("emailLogsNav") }];
  const nav = admin?.isSuperAdmin ? [...navItems, ...SUPER_ADMIN_NAV] : navItems;

  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      <body className="min-h-full bg-muted/20 text-foreground">
        <PetalField />
        <NextIntlClientProvider
          locale="vi"
          messages={{
            adminSupport: viMessages.adminSupport,
            adminDemos: viMessages.adminDemos,
            editor: { support: viMessages.editor.support },
          }}
        >
          {admin ? (
            <div className="flex min-h-screen">
              <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-background lg:flex">
                <Link
                  href="/admin"
                  className="block border-b border-border px-4 py-4 font-heading text-lg text-primary"
                >
                  Quản trị
                </Link>
                <div className="flex-1 overflow-y-auto p-2">
                  <AdminNav items={nav} orientation="vertical" />
                </div>
                <form action={adminLogout} className="border-t border-border p-2">
                  <button
                    type="submit"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted hover:text-destructive"
                  >
                    Đăng xuất
                  </button>
                </form>
              </aside>

              {/* Below `lg` the sidebar would eat the screen, so the same list
                  becomes a scrollable strip above the content. */}
              <div className="min-w-0 flex-1">
                <header className="border-b border-border bg-background lg:hidden">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <Link href="/admin" className="font-heading text-base text-primary">
                      Quản trị
                    </Link>
                    <form action={adminLogout} className="ml-auto">
                      <button
                        type="submit"
                        className="text-sm text-muted-foreground hover:text-destructive"
                      >
                        Đăng xuất
                      </button>
                    </form>
                  </div>
                  {/* No padding here: the strip's fade has to reach the screen
                      edge to read as "there is more nav over there", so the
                      strip owns its own inset. */}
                  <div className="pb-2">
                    <AdminNav items={nav} orientation="horizontal" />
                  </div>
                </header>
                <main className="mx-auto max-w-6xl px-4 py-6"><HeroTypographyDefaults>{children}</HeroTypographyDefaults></main>
              </div>
            </div>
          ) : (
            <main className="mx-auto max-w-6xl px-4 py-6"><HeroTypographyDefaults>{children}</HeroTypographyDefaults></main>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
