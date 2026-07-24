import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";
import { sendTrialReminderEmail } from "@/lib/email";
import {
  buildCardName,
  shouldSendReminder,
  type ReminderCandidate,
} from "@/lib/trial-reminder";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const now = new Date();
  const invitations = await prisma.invitation.findMany({
    where: { paid: false, publishedAt: { not: null }, reminderSentAt: null },
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
      console.log(`[sent] ${inv.id} -> ${email}`);
    } catch (error) {
      failed += 1;
      console.error(
        `[fail] ${inv.id} -> ${email}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(
    `\nTổng kết: gửi ${sent}, lỗi ${failed}, bỏ qua ${skipped}, quét ${invitations.length}`,
  );
}

main()
  .catch((error) => {
    console.error("Script lỗi:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
