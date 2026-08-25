import type { Payment } from "@/generated/prisma/client";
import { reconcilePayosPayment } from "@/lib/payment-service";
import { SETTLEABLE_PAYMENT_STATUSES } from "@/lib/payment-settlement";
import { isRetryablePayosError } from "@/lib/payos";
import { prisma } from "@/lib/prisma";

/**
 * Đối soát định kỳ các đơn payOS chưa chốt.
 *
 * Lý do tồn tại: webhook là đường xác nhận thanh toán duy nhất khi khách không
 * còn mở trang. Trang thanh toán có poll 4 giây gọi `reconcilePayosPayment`,
 * nhưng nó chỉ chạy khi tab còn sống — mà hành vi thật trên mobile là quét QR,
 * nhảy sang app bank, rồi tắt máy. Nếu webhook thất bại đúng lúc đó (container
 * đang restart giữa deploy, mạng chớp, Cloudflare 5xx, hay `PAYOS_CHECKSUM_KEY`
 * vừa rotate làm verify chữ ký trả false) thì tiền đã vào tài khoản mà
 * `Payment.status` vẫn `pending` và thiệp vẫn ẩn — không ai biết, kể cả admin,
 * vì trang quản trị chỉ đọc DB.
 *
 * Module này là đường bù cho đúng tình huống đó: hỏi lại payOS trạng thái thật.
 */

/**
 * Chỉ đối soát đơn tạo trong khoảng này.
 *
 * Link payOS hết hạn sau 24h (`PAYMENT_PENDING_EXPIRES_HOURS`) nên tiền chỉ có
 * thể về trong vòng 24h kể từ lúc tạo đơn. 7 ngày là dư sức để bắt một đợt mất
 * webhook kéo dài qua cuối tuần, đồng thời chặn không cho vùng quét phình vô hạn
 * theo tuổi database.
 */
export const PAYOS_RECONCILE_LOOKBACK_DAYS = 7;

/**
 * Chặn trên số lần gọi API payOS trong một lượt chạy. Mỗi đơn là một request
 * riêng với timeout 10s, nên cần một mức trần để một lượt không thể chạy lấn
 * sang lượt sau.
 */
export const PAYOS_RECONCILE_BATCH_LIMIT = 200;

/**
 * Giãn cách giữa hai lần gọi payOS.
 *
 * payOS chặn rate limit bằng `HTTP 429` kèm body `text/html`. Đo trên production:
 * bắn 8 request liên tiếp thì có request bị chặn, còn giãn 700ms thì 8/8 đi qua.
 * Đây là job nền không ai đợi, nên chậm vài giây không đổi gì.
 */
const REQUEST_SPACING_MS = 700;

/** Số lần thử lại cho một đơn khi gặp lỗi tạm thời (429, 5xx, timeout). */
const MAX_RETRIES = 2;

/** Chờ lâu hơn sau mỗi lần bị chặn, để không góp thêm vào chính đợt rate limit. */
const RETRY_BACKOFF_MS = [1_500, 4_000];

export type PayosReconcileSummary = {
  /** Số đơn đã hỏi payOS. */
  scanned: number;
  /** Số đơn hoá ra đã trả tiền và vừa được kích hoạt. */
  settled: number;
  /** Số đơn payOS xác nhận vẫn chưa trả — trạng thái local đã đúng. */
  unchanged: number;
  /** Số đơn hỏi không được kể cả sau khi thử lại. */
  failed: number;
  /** Số đơn phải thử lại mới xong. Cao đều đặn nghĩa là nên giãn nhịp thêm. */
  retried: number;
};

function cutoffFrom(now: Date, lookbackDays: number): Date {
  return new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Tìm các đơn payOS còn có thể nhận tiền và hỏi payOS trạng thái thật của từng
 * đơn. Đơn nào payOS báo đã trả thì `reconcilePayosPayment` sẽ kích hoạt thiệp
 * qua `settlePayment`, nên mọi luật settle và mọi việc ghi ca cần đối soát vẫn
 * đi qua đúng một chỗ.
 *
 * Chạy tuần tự chứ không song song: đây là job nền không ai đợi, và nối đuôi thì
 * không tạo đỉnh tải lên payOS lẫn lên SQLite.
 */
export async function reconcileOutstandingPayosPayments(options?: {
  now?: Date;
  lookbackDays?: number;
  limit?: number;
}): Promise<PayosReconcileSummary> {
  const now = options?.now ?? new Date();
  const lookbackDays = options?.lookbackDays ?? PAYOS_RECONCILE_LOOKBACK_DAYS;
  const limit = options?.limit ?? PAYOS_RECONCILE_BATCH_LIMIT;

  const outstanding = await prisma.payment.findMany({
    where: {
      provider: "payos",
      status: { in: [...SETTLEABLE_PAYMENT_STATUSES] },
      // Không có mã đơn bên payOS thì không có gì để hỏi.
      providerOrderCode: { not: null },
      createdAt: { gte: cutoffFrom(now, lookbackDays) },
    },
    // Cũ nhất trước: đơn càng cũ thì khách càng chờ lâu, và nếu chạm mức trần
    // thì phần bị cắt là phần mới nhất, tức là phần lượt sau sẽ bắt được sớm.
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const summary: PayosReconcileSummary = {
    scanned: outstanding.length,
    settled: 0,
    unchanged: 0,
    failed: 0,
    retried: 0,
  };

  for (const [index, payment] of outstanding.entries()) {
    if (index > 0) await sleep(REQUEST_SPACING_MS);

    let lastError: unknown = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      if (attempt > 0) {
        summary.retried += 1;
        await sleep(RETRY_BACKOFF_MS[attempt - 1] ?? RETRY_BACKOFF_MS.at(-1)!);
      }
      try {
        const status = await reconcilePayosPayment(payment, "payos-cron");
        lastError = null;
        if (status === "paid" && payment.status !== "paid") {
          summary.settled += 1;
          console.info("[payos-reconcile] webhook đã mất, đơn vừa được cứu", {
            paymentId: payment.id,
            code: payment.code,
            amount: payment.amount,
          });
        } else {
          summary.unchanged += 1;
        }
        break;
      } catch (error) {
        lastError = error;
        // Lỗi không đáng thử lại (chữ ký sai, đơn không tồn tại bên payOS) thì
        // thử thêm chỉ tốn quota và làm nặng thêm đợt rate limit.
        if (!isRetryablePayosError(error)) break;
      }
    }

    if (lastError !== null) {
      summary.failed += 1;
      console.error("[payos-reconcile] không hỏi được payOS", {
        paymentId: payment.id,
        code: payment.code,
        retryable: isRetryablePayosError(lastError),
        error: lastError instanceof Error ? lastError.message : "unknown",
      });
    }
  }

  return summary;
}

/** Tách riêng cho test: đơn nào đủ điều kiện vào lượt đối soát. */
export function isReconcileCandidate(
  payment: Pick<Payment, "provider" | "status" | "providerOrderCode" | "createdAt">,
  now: Date,
  lookbackDays: number = PAYOS_RECONCILE_LOOKBACK_DAYS,
): boolean {
  if (payment.provider !== "payos") return false;
  if (!payment.providerOrderCode) return false;
  if (!(SETTLEABLE_PAYMENT_STATUSES as readonly string[]).includes(payment.status)) {
    return false;
  }
  return payment.createdAt.getTime() >= cutoffFrom(now, lookbackDays).getTime();
}
