import type { Metadata } from "next";
import Link from "next/link";

import type { Prisma } from "@/generated/prisma/client";
import { verifyAdmin } from "@/lib/admin-dal";
import {
  endOfDayExclusive,
  parseDateInput,
  parseUserSearch,
} from "@/lib/admin-support-input";
import { formatVietnamDateTimeShort } from "@/lib/datetime";
import { isPendingPaymentExpired } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Giao dịch | Quản trị",
  robots: { index: false, follow: false },
};

const formatDate = formatVietnamDateTimeShort;

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
}

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string }>;
}) {
  await verifyAdmin();

  const { q, from, to } = await searchParams;
  const search = parseUserSearch(q);
  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to);

  const createdAt: Prisma.DateTimeFilter = {
    ...(fromDate ? { gte: fromDate } : {}),
    ...(toDate ? { lt: endOfDayExclusive(toDate) } : {}),
  };
  const where: Prisma.PaymentWhereInput = {
    ...(search ? { invitation: { user: { email: { contains: search } } } } : {}),
    ...(fromDate || toDate ? { createdAt } : {}),
  };
  const isFiltered = Boolean(search || fromDate || toDate);

  const [payments, revenue] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        invitation: {
          include: {
            content: { select: { brideFullName: true, groomFullName: true } },
            user: { select: { email: true } },
          },
        },
      },
    }),
    // Scoped to the same filter so a date range doubles as a revenue report.
    prisma.payment.aggregate({
      where: { ...where, status: "paid" },
      _sum: { amount: true },
    }),
  ]);

  const totalRevenue = revenue._sum.amount ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-heading text-2xl text-foreground">Giao dịch ({payments.length})</h1>
        <p className="text-sm text-muted-foreground">
          {isFiltered ? "Doanh thu (đã lọc)" : "Tổng doanh thu"}:{" "}
          <span className="font-semibold text-foreground">{formatVnd(totalRevenue)}</span>
        </p>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="payment-email" className="text-xs text-muted-foreground">
            Email khách
          </label>
          <input
            id="payment-email"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="vd: an@gmail.com"
            className={`w-64 ${inputClass}`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="payment-from" className="text-xs text-muted-foreground">
            Ngày tạo từ
          </label>
          <input id="payment-from" name="from" type="date" defaultValue={from ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="payment-to" className="text-xs text-muted-foreground">
            Đến ngày
          </label>
          <input id="payment-to" name="to" type="date" defaultValue={to ?? ""} className={inputClass} />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Lọc
        </button>
        {isFiltered ? (
          <Link
            href="/admin/payments"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary"
          >
            Xoá lọc
          </Link>
        ) : null}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Mã đơn</th>
              <th className="px-4 py-3 font-medium">Thiệp</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Số tiền</th>
              <th className="px-4 py-3 font-medium">Voucher</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Trạng thái</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Ngày tạo</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Ngày trả</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  {isFiltered ? "Không có giao dịch nào khớp bộ lọc." : "Chưa có giao dịch nào."}
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const c = payment.invitation.content;
                const groom = c?.groomFullName?.trim();
                const bride = c?.brideFullName?.trim();
                const paid = payment.status === "paid";
                const expired = payment.status === "pending" && isPendingPaymentExpired(payment.createdAt);
                return (
                  <tr key={payment.id} className="border-b border-border last:border-0">
                    <td
                      className={`px-4 py-3 font-mono text-xs ${
                        paid ? "font-semibold text-emerald-700" : ""
                      }`}
                    >
                      {payment.code}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/invitations/${payment.invitationId}/edit`}
                        className="group block"
                      >
                        <span className="block text-xs text-muted-foreground">
                          {payment.invitation.templateId}
                        </span>
                        {groom || bride ? (
                          <>
                            {groom ? (
                              <span className="block text-primary group-hover:underline">{groom}</span>
                            ) : null}
                            {bride ? (
                              <span className="block text-primary group-hover:underline">{bride}</span>
                            ) : null}
                          </>
                        ) : (
                          <span className="block text-primary group-hover:underline">
                            chưa điền tên
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {payment.invitation.user.email ?? (
                        <span className="whitespace-nowrap rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700">
                          chưa gắn email
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatVnd(payment.amount)}</td>
                    <td className="px-4 py-3">{payment.voucherCode ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          paid
                            ? "whitespace-nowrap rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            : expired
                              ? "whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                              : "whitespace-nowrap rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700"
                        }
                      >
                        {paid ? "Đã trả" : expired ? "Hết hạn" : "Chờ"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {payment.paidAt ? formatDate(payment.paidAt) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
