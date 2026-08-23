import Link from "next/link";

import { verifyAdmin } from "@/lib/admin-dal";
import { REAL_INVITATION_WHERE } from "@/lib/admin-invitation-filters";
import { prisma } from "@/lib/prisma";

const SYSTEM_EMAIL = "system@demo.local";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export default async function AdminDashboardPage() {
  await verifyAdmin();

  const [userCount, realInvitations, demoCount, suggestionCount, paidCount, revenue] = await Promise.all([
    prisma.user.count({ where: { email: { not: SYSTEM_EMAIL } } }),
    prisma.invitation.count({ where: REAL_INVITATION_WHERE }),
    prisma.invitation.count({ where: { isDemo: true } }),
    prisma.templateSuggestion.count(),
    prisma.payment.count({ where: { status: "paid" } }),
    prisma.payment.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
  ]);

  const stats = [
    { label: "Người dùng", value: userCount, href: "/admin/users" },
    { label: "Thiệp thật", value: realInvitations, href: "/admin/invitations" },
    { label: "Thiệp demo", value: demoCount, href: "/admin/demos" },
    { label: "Gợi ý mẫu", value: suggestionCount, href: "/admin/template-suggestions" },
    { label: "Đơn đã trả", value: paidCount, href: "/admin/payments" },
    { label: "Doanh thu", value: formatVnd(revenue._sum.amount ?? 0), href: "/admin/payments" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl text-foreground">Tổng quan</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => {
          const card = (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="transition hover:opacity-80">
              {card}
            </Link>
          ) : (
            <div key={stat.label}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
