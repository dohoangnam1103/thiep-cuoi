import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";
import { sendReminderEmail } from "@/lib/email";
import {
  buildCardName,
  shouldSendExpiredReminder,
  shouldSendReminder,
  type ReminderCandidate,
} from "@/lib/trial-reminder";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const now = new Date();
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

  let sent = 0;
  let sentExpired = 0;
  let failed = 0;
  let skipped = 0;

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
      skipped += 1;
      continue;
    }

    const cardName = buildCardName(inv.content);
    const recipientName = cardName === "Thiệp cưới của bạn" ? "" : cardName;

    if (dryRun) {
      console.log(`[dry-run ${kind}] ${cardName} <${email}> (${inv.id})`);
      if (kind === "trial-ending") sent += 1;
      else sentExpired += 1;
      continue;
    }

    try {
      await sendReminderEmail({
        to: email as string,
        recipientName,
        cardName,
        invitationId: inv.id,
        kind,
      });
      await prisma.invitation.update({
        where: { id: inv.id },
        data:
          kind === "trial-ending"
            ? { reminderSentAt: new Date() }
            : { expiredReminderSentAt: new Date() },
      });
      if (kind === "trial-ending") sent += 1;
      else sentExpired += 1;
      console.log(`[sent ${kind}] ${inv.id} -> ${email}`);
    } catch (error) {
      failed += 1;
      console.error(
        `[fail ${kind}] ${inv.id} -> ${email}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(
    `\nTổng kết${dryRun ? " (DRY RUN, chưa gửi gì)" : ""}: nhắc còn-24h ${sent}, nhắc đã-ẩn ${sentExpired}, lỗi ${failed}, bỏ qua ${skipped}, quét ${invitations.length}`,
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
