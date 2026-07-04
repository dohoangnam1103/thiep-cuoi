import { verifyAdmin } from "@/lib/admin-dal";
import { prisma } from "@/lib/prisma";
import { VoucherForm } from "./VoucherForm";
import { toggleVoucher } from "./actions";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
}

export default async function AdminVouchersPage() {
  await verifyAdmin();

  const vouchers = await prisma.voucher.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl text-foreground">Voucher ({vouchers.length})</h1>

      <VoucherForm />

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Mã</th>
              <th className="px-4 py-3 font-medium">Giảm</th>
              <th className="px-4 py-3 font-medium">Đã dùng</th>
              <th className="px-4 py-3 font-medium">Hết hạn</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Chưa có voucher nào.
                </td>
              </tr>
            ) : (
              vouchers.map((voucher) => {
                const uses = voucher.maxUses ? `${voucher.usedCount}/${voucher.maxUses}` : `${voucher.usedCount}`;
                return (
                  <tr key={voucher.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{voucher.code}</td>
                    <td className="px-4 py-3">{formatVnd(voucher.amountOff)}</td>
                    <td className="px-4 py-3">{uses}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {voucher.expiresAt ? formatDate(voucher.expiresAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          voucher.active
                            ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {voucher.active ? "Đang bật" : "Đã tắt"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleVoucher.bind(null, voucher.id)}>
                        <button type="submit" className="text-sm text-primary hover:underline">
                          {voucher.active ? "Tắt" : "Bật"}
                        </button>
                      </form>
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
