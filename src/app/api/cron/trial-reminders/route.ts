import { timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { sendTrialReminderEmail } from "@/lib/email";
import {
  buildCardName,
  shouldSendReminder,
  type ReminderCandidate,
} from "@/lib/trial-reminder";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const invitations = await prisma.invitation.findMany({
    where: {
      paid: false,
      complimentary: false,
      publishedAt: { not: null },
      reminderSentAt: null,
    },
    include: {
      user: { select: { email: true } },
      content: { select: { brideShortName: true, groomShortName: true } },
    },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const inv of invitations) {
    const email = inv.user.email;
    const candidate: ReminderCandidate = {
      paid: inv.paid,
      complimentary: inv.complimentary,
      publishedAt: inv.publishedAt,
      reminderSentAt: inv.reminderSentAt,
      email,
    };
    if (!shouldSendReminder(candidate, now)) {
      skipped += 1;
      continue;
    }

    const cardName = buildCardName(inv.content);
    const recipientName = cardName === "Thiệp cưới của bạn" ? "" : cardName;
    try {
      await sendTrialReminderEmail({
        to: email as string,
        recipientName,
        cardName,
        invitationId: inv.id,
      });
      await prisma.invitation.update({
        where: { id: inv.id },
        data: { reminderSentAt: new Date() },
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `[trial-reminder] fail ${inv.id} -> ${email}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return Response.json({ scanned: invitations.length, sent, failed, skipped });
}
