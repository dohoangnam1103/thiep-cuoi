import type { UnattributedPayment, UnattributedPayments } from "@/lib/unattributed-payments";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
}

function describe(payment: UnattributedPayment): string {
  const parts = [payment.couple ?? payment.slug ?? "chưa điền tên"];
  parts.push(formatVnd(payment.amount));
  parts.push(formatDate(payment.paidAt ?? payment.createdAt));
  return parts.join(" · ");
}

function OrderList({ items }: { items: UnattributedPayment[] }) {
  return (
    <ul className="mt-2 space-y-1">
      {items.map((payment) => (
        <li key={payment.id} className="text-sm">
          <span className="font-mono text-xs">{payment.code}</span>
          <span className="text-muted-foreground"> — {describe(payment)}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Neither failure mode announces itself: an orphaned paid order looks like a
 * normal row with an empty Email cell, and the Casso path only writes
 * `payment_manual_reconciliation_required` to the container log. Surface both
 * where the money is already being looked at.
 */
export function UnattributedPaymentsPanel({ paid, atRisk }: UnattributedPayments) {
  if (paid.length === 0 && atRisk.length === 0) return null;

  return (
    <section
      aria-labelledby="unattributed-heading"
      className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5"
    >
      <h2 id="unattributed-heading" className="font-heading text-lg text-foreground">
        Đơn không gắn email ({paid.length + atRisk.length})
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Thiệp thuộc tài khoản ẩn danh, chỉ định danh bằng cookie 7 ngày. Không có
        email để liên hệ hay khôi phục. Từ 23/8 khách phải đăng nhập mới tạo được
        đơn, nên danh sách này chỉ còn là tồn đọng cũ.
      </p>

      {paid.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-foreground">
            Đã thu tiền, cần gộp vào tài khoản có email ({paid.length})
          </p>
          <OrderList items={paid} />
        </div>
      ) : null}

      {atRisk.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-foreground">
            Chưa trả nhưng link vẫn có thể thu tiền ({atRisk.length})
          </p>
          <p className="text-xs text-muted-foreground">
            Webhook payOS không giới hạn tuổi đơn, và đơn đã huỷ vẫn settle được,
            nên các đơn này còn khả năng nhảy sang nhóm trên.
          </p>
          <OrderList items={atRisk} />
        </div>
      ) : null}
    </section>
  );
}
