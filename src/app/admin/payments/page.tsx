import { verifyAdmin } from "@/lib/admin-dal";
import { isPendingPaymentExpired } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
}

export default async function AdminPaymentsPage() {
  await verifyAdmin();

  const [payments, revenue] = await Promise.all([
    prisma.payment.findMany({
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
    prisma.payment.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
  ]);

  const totalRevenue = revenue._sum.amount ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-heading text-2xl text-foreground">Giao dịch ({payments.length})</h1>
        <p className="text-sm text-muted-foreground">
          Tổng doanh thu: <span className="font-semibold text-foreground">{formatVnd(totalRevenue)}</span>
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Mã đơn</th>
              <th className="px-4 py-3 font-medium">Thiệp</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Số tiền</th>
              <th className="px-4 py-3 font-medium">Voucher</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium">Ngày trả</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  Chưa có giao dịch nào.
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const c = payment.invitation.content;
                const couple = c && (c.brideFullName || c.groomFullName)
                  ? `${c.groomFullName} & ${c.brideFullName}`.trim()
                  : "—";
                const paid = payment.status === "paid";
                const expired = payment.status === "pending" && isPendingPaymentExpired(payment.createdAt);
                return (
                  <tr key={payment.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{payment.code}</td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">{payment.invitation.templateId}</span>
                      <br />
                      {couple}
                    </td>
                    <td className="px-4 py-3">{payment.invitation.user.email ?? "—"}</td>
                    <td className="px-4 py-3">{formatVnd(payment.amount)}</td>
                    <td className="px-4 py-3">{payment.voucherCode ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          paid
                            ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            : expired
                              ? "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                              : "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700"
                        }
                      >
                        {paid ? "Đã trả" : expired ? "Hết hạn" : "Chờ"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(payment.createdAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
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
