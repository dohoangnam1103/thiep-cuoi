import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "../globals.css";
import { PetalField } from "@/components/petal-field";
import { getCurrentAdmin } from "@/lib/admin-dal";
import { appFontVariables } from "@/lib/fonts";
import { adminLogout } from "./actions";

export const metadata: Metadata = {
  title: "Quản trị | Thiệp Mừng Online",
  robots: { index: false, follow: false },
  icons: { icon: "/chungdoi/icon-v2.png" },
};

const NAV = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/users", label: "Người dùng" },
  { href: "/admin/demos", label: "Thiệp demo" },
  { href: "/admin/blogs", label: "Bài viết" },
  { href: "/admin/template-studio", label: "AI Studio" },
  { href: "/admin/template-suggestions", label: "Gợi ý mẫu thiệp" },
  { href: "/admin/payments", label: "Giao dịch" },
  { href: "/admin/vouchers", label: "Voucher" },
];

const SUPER_ADMIN_NAV = [
  { href: "/admin/admins", label: "Admin" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin();
  const nav = admin?.isSuperAdmin ? [...NAV, ...SUPER_ADMIN_NAV] : NAV;

  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      <body className="min-h-full bg-muted/20 text-foreground">
        <PetalField />
        {admin ? (
          <header className="border-b border-border bg-background">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
              <span className="font-heading text-lg text-primary">Quản trị</span>
              <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground">
                    {item.label}
                  </Link>
                ))}
              </nav>
              <form action={adminLogout} className="ml-auto">
                <button type="submit" className="text-sm text-muted-foreground hover:text-destructive">
                  Đăng xuất
                </button>
              </form>
            </div>
          </header>
        ) : null}
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
