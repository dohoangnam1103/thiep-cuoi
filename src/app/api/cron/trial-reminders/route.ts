import { cronUnauthorized, isAuthorizedCronRequest } from "@/lib/cron-auth";
import {
  finishEmailRun,
  formatEmailDeliveryError,
  sendTrackedEmail,
  startEmailRun,
} from "@/lib/email-delivery";
import { buildReminderEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  buildCardName,
  shouldSendExpiredReminder,
  shouldSendReminder,
  type ReminderCandidate,
} from "@/lib/trial-reminder";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) return cronUnauthorized();

  const now = new Date();
  const run = await startEmailRun({ source: "trial-reminders", trigger: "cron" });
  const result = {
    scanned: 0,
    sent: 0,
    sentExpired: 0,
    failed: 0,
    skipped: 0,
    internalErrors: 0,
  };
  let fatalError: unknown = null;

  // Không lọc `reminderSentAt: null` trong truy vấn nữa: mốc nhắc bù có cột đánh
  // dấu riêng, và thiệp đã nhận mốc "còn 24h" vẫn có thể cần mốc "đã tạm ẩn".
  // Hai hàm thuần bên dưới mới là nơi quyết định.
  try {
    const invitations = await prisma.invitation.findMany({
      where: {
        isDemo: false,
        paid: false,
        complimentary: false,
        publishedAt: { not: null },
      },
      select: { id: true },
    });
    result.scanned = invitations.length;

    for (const invitation of invitations) {
      // Thu hẹp race với thanh toán/chỉnh email trong lúc một run đang gửi tuần
      // tự: đọc lại đúng trước khi gọi provider thay vì dùng snapshot đầu run.
      const inv = await prisma.invitation.findFirst({
        where: {
          id: invitation.id,
          isDemo: false,
          paid: false,
          complimentary: false,
          publishedAt: { not: null },
        },
        include: {
          user: { select: { email: true } },
          content: { select: { brideShortName: true, groomShortName: true } },
        },
      });
      if (!inv) {
        result.skipped += 1;
        continue;
      }
      const email = inv.user.email;
      const candidate: ReminderCandidate = {
        paid: inv.paid,
        complimentary: inv.complimentary,
        publishedAt: inv.publishedAt,
        reminderSentAt: inv.reminderSentAt,
        expiredReminderSentAt: inv.expiredReminderSentAt,
        email,
      };

      const kind = shouldSendReminder(candidate, now)
        ? "trial-ending"
        : shouldSendExpiredReminder(candidate, now)
          ? "expired"
          : null;
      if (kind === null) {
        result.skipped += 1;
        continue;
      }

      const cardName = buildCardName(inv.content);
      const recipientName = cardName === "Thiệp cưới của bạn" ? "" : cardName;
      const { subject, html } = buildReminderEmail({
        recipientName,
        cardName,
        invitationId: inv.id,
        kind,
      });

      try {
        const delivery = await sendTrackedEmail({
          runId: run.id,
          dedupeKey: `trial-reminder:${kind}:${inv.id}`,
          type: kind,
          recipientEmail: email as string,
          recipientName,
          subject,
          html,
          userId: inv.userId,
          invitationId: inv.id,
        });

        if (delivery.status === "failed") {
          result.failed += 1;
          continue;
        }
        if (delivery.status === "manual-review") {
          result.failed += 1;
          continue;
        }
        if (delivery.status === "in-progress") {
          result.skipped += 1;
          continue;
        }

        if (delivery.status === "sent") {
          if (kind === "trial-ending") result.sent += 1;
          else result.sentExpired += 1;
        } else {
          result.skipped += 1;
        }

        // Đánh dấu sau khi provider nhận email. "already-sent" chỉ xảy ra khi
        // delivery trước đó thành công nhưng process chết trước dòng update này;
        // cập nhật lại mốc giúp lần cron sau không phải quét case đó mãi.
        try {
          await prisma.invitation.update({
            where: { id: inv.id },
            data:
              kind === "trial-ending"
                ? { reminderSentAt: new Date() }
                : { expiredReminderSentAt: new Date() },
          });
        } catch (error) {
          result.internalErrors += 1;
          console.error(
            `[trial-reminder] email đã gửi nhưng không ghi được marker ${kind} ${inv.id}:`,
            error instanceof Error ? error.message : error,
          );
        }
      } catch (error) {
        result.failed += 1;
        console.error(
          `[trial-reminder] fail ${kind} ${inv.id} -> ${email}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  } catch (error) {
    fatalError = error;
    throw error;
  } finally {
    const status = fatalError
      ? "failed"
      : result.failed > 0 || result.internalErrors > 0
        ? "completed-with-errors"
        : "completed";
    try {
      await finishEmailRun(
        run.id,
        {
          scannedCount: result.scanned,
          sentCount: result.sent + result.sentExpired,
          failedCount: result.failed,
          skippedCount: result.skipped,
        },
        {
          status,
          errorMessage: fatalError
            ? formatEmailDeliveryError(fatalError)
            : result.internalErrors > 0
              ? `${result.internalErrors} email đã gửi nhưng chưa ghi được marker thiệp`
              : null,
        },
      );
    } catch (finishError) {
      console.error(
        `[trial-reminder] không kết thúc được email run ${run.id}:`,
        finishError instanceof Error ? finishError.message : finishError,
      );
      if (!fatalError) throw finishError;
    }
  }

  console.info("[trial-reminder] xong", result);
  return Response.json(result, {
    status: result.failed > 0 || result.internalErrors > 0 ? 500 : 200,
  });
}
