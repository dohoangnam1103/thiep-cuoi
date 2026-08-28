import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmailViaResend } from "@/lib/email";

const PENDING_DELIVERY_STALE_MS = 15 * 60 * 1000;
// Resend giữ idempotency key 24 giờ. Chừa một giờ an toàn cho clock/network
// skew; quá mốc này không tự gọi provider lại vì request trước có thể đã gửi.
const PROVIDER_RETRY_WINDOW_MS = 23 * 60 * 60 * 1000;
const MAX_ERROR_LENGTH = 1_000;
const RETRY_WINDOW_EXPIRED_ERROR =
  "Đã quá cửa sổ retry an toàn 23 giờ; cần kiểm tra Resend trước khi gửi lại thủ công";

type EmailOperationsDb = typeof prisma;

export type EmailRunSummary = {
  scannedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
};

export type SendTrackedEmailInput = {
  runId?: string;
  dedupeKey: string;
  type: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  html: string;
  userId?: string;
  invitationId?: string;
};

export type SendTrackedEmailResult = {
  deliveryId: string;
  status: "sent" | "failed" | "already-sent" | "in-progress" | "manual-review";
  providerMessageId: string | null;
};

type EmailSender = typeof sendEmailViaResend;

function isUniqueConstraint(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function formatEmailDeliveryError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Lỗi không xác định khi gửi email";
  return message.replace(/\s+/g, " ").trim().slice(0, MAX_ERROR_LENGTH);
}

export async function startEmailRun(
  input: { source: string; trigger: string },
  db: EmailOperationsDb = prisma,
) {
  return db.emailRun.create({ data: input });
}

export async function finishEmailRun(
  runId: string,
  summary: EmailRunSummary,
  completion: {
    status: "completed" | "completed-with-errors" | "failed";
    errorMessage?: string | null;
  } = {
    status: "completed",
  },
  db: EmailOperationsDb = prisma,
) {
  return db.emailRun.update({
    where: { id: runId },
    data: {
      ...summary,
      status: completion.status,
      errorMessage: completion.errorMessage ?? null,
      finishedAt: new Date(),
    },
  });
}

type DeliveryPayload = { recipientEmail: string; subject: string; html: string };
type ClaimedDelivery = {
  id: string;
  status: "claimed" | "already-sent" | "in-progress" | "manual-review";
  payload?: DeliveryPayload;
  reason?: string;
  shouldRecord?: boolean;
};

/**
 * Chỉ một worker được quyền gọi provider cho mỗi `dedupeKey`.
 *
 * Delivery pending bị kẹt (container chết giữa chừng) được nhận lại sau 15 phút;
 * key idempotency gửi sang Resend vẫn bảo vệ khỏi việc provider xử lý thư hai lần.
 */
async function claimDelivery(
  input: SendTrackedEmailInput,
  db: EmailOperationsDb,
): Promise<ClaimedDelivery> {
  try {
    const delivery = await db.emailDelivery.create({
      data: {
        dedupeKey: input.dedupeKey,
        type: input.type,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName ?? null,
        subject: input.subject,
        html: input.html,
        userId: input.userId ?? null,
        invitationId: input.invitationId ?? null,
      },
    });
    return {
      id: delivery.id,
      status: "claimed",
      payload: {
        recipientEmail: delivery.recipientEmail,
        subject: delivery.subject,
        html: delivery.html,
      },
    };
  } catch (error) {
    if (!isUniqueConstraint(error)) throw error;
  }

  const delivery = await db.emailDelivery.findUnique({
    where: { dedupeKey: input.dedupeKey },
    select: {
      id: true,
      status: true,
      updatedAt: true,
      lastError: true,
      recipientEmail: true,
      subject: true,
      html: true,
      attempts: {
        orderBy: { attemptedAt: "asc" },
        take: 1,
        select: { attemptedAt: true },
      },
    },
  });
  if (!delivery) {
    // Một process khác có thể đã dọn record giữa P2002 và findUnique; lượt cron
    // kế tiếp sẽ tạo lại delivery. Không gửi một thư không còn claim của mình.
    return { id: input.dedupeKey, status: "in-progress" };
  }
  if (delivery.status === "sent") return { id: delivery.id, status: "already-sent" };

  const staleBefore = new Date(Date.now() - PENDING_DELIVERY_STALE_MS);
  const canRetry = delivery.status === "failed" || delivery.updatedAt <= staleBefore;
  if (!canRetry) return { id: delivery.id, status: "in-progress" };

  const firstAttemptAt = delivery.attempts[0]?.attemptedAt ?? null;
  const retryExpired =
    firstAttemptAt !== null &&
    firstAttemptAt.getTime() <= Date.now() - PROVIDER_RETRY_WINDOW_MS;
  if (retryExpired || !delivery.html) {
    const reason = retryExpired
      ? RETRY_WINDOW_EXPIRED_ERROR
      : "Thiếu payload gốc; không thể retry email an toàn";
    if (delivery.lastError === reason) {
      return { id: delivery.id, status: "manual-review", reason, shouldRecord: false };
    }
    const blocked = await db.emailDelivery.updateMany({
      where: { id: delivery.id, status: delivery.status, updatedAt: delivery.updatedAt },
      data: {
        status: "failed",
        lastError: reason,
      },
    });
    return {
      id: delivery.id,
      status: "manual-review",
      reason,
      shouldRecord: blocked.count === 1,
    };
  }

  const claim = await db.emailDelivery.updateMany({
    where: {
      id: delivery.id,
      status: delivery.status,
      updatedAt: delivery.updatedAt,
    },
    data: { status: "pending", lastError: null },
  });
  if (claim.count !== 1) return { id: delivery.id, status: "in-progress" };
  return {
    id: delivery.id,
    status: "claimed",
    payload: {
      recipientEmail: delivery.recipientEmail,
      subject: delivery.subject,
      html: delivery.html,
    },
  };
}

export async function sendTrackedEmail(
  input: SendTrackedEmailInput,
  db: EmailOperationsDb = prisma,
  sendEmail: EmailSender = sendEmailViaResend,
): Promise<SendTrackedEmailResult> {
  const claim = await claimDelivery(input, db);
  if (claim.status === "manual-review") {
    if (claim.shouldRecord) {
      await db.emailDeliveryAttempt.create({
        data: {
          deliveryId: claim.id,
          runId: input.runId ?? null,
          status: "blocked",
          errorMessage: claim.reason ?? RETRY_WINDOW_EXPIRED_ERROR,
        },
      });
    }
    return { deliveryId: claim.id, status: claim.status, providerMessageId: null };
  }
  if (claim.status !== "claimed") {
    return { deliveryId: claim.id, status: claim.status, providerMessageId: null };
  }
  if (!claim.payload) throw new Error("Delivery đã claim nhưng thiếu payload email");

  const attempt = await db.$transaction(async (tx) => {
    const created = await tx.emailDeliveryAttempt.create({
      data: {
        deliveryId: claim.id,
        runId: input.runId ?? null,
        status: "pending",
      },
    });
    await tx.emailDelivery.update({
      where: { id: claim.id },
      data: { attemptCount: { increment: 1 } },
    });
    return created;
  });

  try {
    const { providerMessageId } = await sendEmail({
      to: claim.payload.recipientEmail,
      subject: claim.payload.subject,
      html: claim.payload.html,
      // Delivery ID là key ngắn, ổn định giữa các retry và không chứa PII.
      idempotencyKey: claim.id,
    });
    const sentAt = new Date();
    await db.$transaction([
      db.emailDeliveryAttempt.update({
        where: { id: attempt.id },
        data: { status: "sent", providerMessageId },
      }),
      db.emailDelivery.update({
        where: { id: claim.id },
        data: {
          status: "sent",
          providerMessageId,
          lastError: null,
          sentAt,
        },
      }),
    ]);
    return { deliveryId: claim.id, status: "sent", providerMessageId };
  } catch (error) {
    const errorMessage = formatEmailDeliveryError(error);
    await db.$transaction([
      db.emailDeliveryAttempt.update({
        where: { id: attempt.id },
        data: { status: "failed", errorMessage },
      }),
      db.emailDelivery.update({
        where: { id: claim.id },
        data: { status: "failed", lastError: errorMessage },
      }),
    ]);
    return { deliveryId: claim.id, status: "failed", providerMessageId: null };
  }
}

/**
 * Ghi một lần khách bấm nút thanh toán trong email.
 *
 * Dùng SQL thô chứ không phải `prisma.emailDelivery.update()` vì
 * `EmailDelivery.updatedAt` là `@updatedAt`, và `claimDelivery` ở trên đọc đúng cột
 * đó cho hai việc: điều kiện optimistic concurrency khi nhận lại delivery
 * (`where: { id, status, updatedAt }`), và mốc 15 phút để coi một delivery `pending`
 * là bị kẹt. Một cú click đi qua ORM sẽ đẩy `updatedAt` lên và làm delivery trông
 * như vừa được xử lý, tức là hoãn một lần retry chính đáng. Cùng lý do như
 * `src/lib/invitation-views.ts`.
 *
 * `COALESCE` giữ `firstClickedAt` bất biến sau lần bấm đầu: phễu chuyển đổi so
 * `Payment.paidAt` với mốc này, nên nó phải là một điểm cố định chứ không được
 * nhảy về sau mỗi lần khách mở lại thư cũ.
 *
 * Không bao giờ ném lỗi. Đây là đường khách đang đi để trả tiền; một câu ghi số
 * liệu thất bại không được phép chặn redirect sang trang thanh toán.
 */
export async function recordEmailClick(
  deliveryId: string,
  db: EmailOperationsDb = prisma,
): Promise<void> {
  const now = new Date();
  try {
    await db.$executeRaw`
      UPDATE "EmailDelivery"
      SET "clickCount" = "clickCount" + 1,
          "firstClickedAt" = COALESCE("firstClickedAt", ${now}),
          "lastClickedAt" = ${now}
      WHERE "id" = ${deliveryId}
    `;
  } catch (error) {
    console.error(
      "EMAIL_CLICK_RECORD_FAILED",
      JSON.stringify({
        deliveryId,
        reason: error instanceof Error ? error.message : "unknown",
      }),
    );
  }
}
