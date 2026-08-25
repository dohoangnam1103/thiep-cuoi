import { cronUnauthorized, isAuthorizedCronRequest } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
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
  // Không lọc `reminderSentAt: null` trong truy vấn nữa: mốc nhắc bù có cột đánh
  // dấu riêng, và thiệp đã nhận mốc "còn 24h" vẫn có thể cần mốc "đã tạm ẩn".
  // Hai hàm thuần bên dưới mới là nơi quyết định.
  const invitations = await prisma.invitation.findMany({
    where: {
      paid: false,
      complimentary: false,
      publishedAt: { not: null },
    },
    include: {
      user: { select: { email: true } },
      content: { select: { brideShortName: true, groomShortName: true } },
    },
  });

  const result = {
    scanned: invitations.length,
    sent: 0,
    sentExpired: 0,
    failed: 0,
    skipped: 0,
  };

  for (const inv of invitations) {
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
    try {
      await sendReminderEmail({
        to: email as string,
        recipientName,
        cardName,
        invitationId: inv.id,
        kind,
      });
      // Đánh dấu SAU khi gửi thành công. Gửi lỗi thì giữ nguyên mốc để lượt sau
      // thử lại, và mỗi mốc có cột riêng nên không đè lẫn nhau.
      await prisma.invitation.update({
        where: { id: inv.id },
        data:
          kind === "trial-ending"
            ? { reminderSentAt: new Date() }
            : { expiredReminderSentAt: new Date() },
      });
      if (kind === "trial-ending") result.sent += 1;
      else result.sentExpired += 1;
    } catch (error) {
      result.failed += 1;
      console.error(
        `[trial-reminder] fail ${kind} ${inv.id} -> ${email}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.info("[trial-reminder] xong", result);
  return Response.json(result);
}
