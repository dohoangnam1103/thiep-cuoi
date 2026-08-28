import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";
import {
  finishEmailRun,
  formatEmailDeliveryError,
  sendTrackedEmail,
  startEmailRun,
} from "@/lib/email-delivery";
import { buildReminderEmail, reminderDedupeKey } from "@/lib/email";
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
  const run = dryRun
    ? null
    : await startEmailRun({ source: "trial-reminders", trigger: "script" }, prisma);
  let sent = 0;
  let sentExpired = 0;
  let failed = 0;
  let skipped = 0;
  let scanned = 0;
  let internalErrors = 0;
  let fatalError: unknown = null;

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
    scanned = invitations.length;

    for (const invitation of invitations) {
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
        skipped += 1;
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

      const { subject, html } = buildReminderEmail({
        recipientName,
        cardName,
        invitationId: inv.id,
        kind,
      });
      try {
        const delivery = await sendTrackedEmail(
          {
            runId: run?.id,
            dedupeKey: reminderDedupeKey(kind, inv.id),
            type: kind,
            recipientEmail: email as string,
            recipientName,
            subject,
            html,
            userId: inv.userId,
            invitationId: inv.id,
          },
          prisma,
        );
        if (delivery.status === "failed") {
          failed += 1;
          console.error(`[fail ${kind}] ${inv.id} -> ${email}: provider error`);
          continue;
        }
        if (delivery.status === "manual-review") {
          failed += 1;
          console.error(`[manual-review ${kind}] ${inv.id} -> ${email}`);
          continue;
        }
        if (delivery.status === "in-progress") {
          skipped += 1;
          continue;
        }

        if (delivery.status === "sent") {
          if (kind === "trial-ending") sent += 1;
          else sentExpired += 1;
          console.log(`[sent ${kind}] ${inv.id} -> ${email}`);
        } else {
          skipped += 1;
        }

        try {
          await prisma.invitation.update({
            where: { id: inv.id },
            data:
              kind === "trial-ending"
                ? { reminderSentAt: new Date() }
                : { expiredReminderSentAt: new Date() },
          });
        } catch (error) {
          internalErrors += 1;
          console.error(
            `[marker-fail ${kind}] ${inv.id}:`,
            error instanceof Error ? error.message : error,
          );
        }
      } catch (error) {
        failed += 1;
        console.error(
          `[fail ${kind}] ${inv.id} -> ${email}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  } catch (error) {
    fatalError = error;
    throw error;
  } finally {
    if (run) {
      const status = fatalError
        ? "failed"
        : failed > 0 || internalErrors > 0
          ? "completed-with-errors"
          : "completed";
      try {
        await finishEmailRun(
          run.id,
          {
            scannedCount: scanned,
            sentCount: sent + sentExpired,
            failedCount: failed,
            skippedCount: skipped,
          },
          {
            status,
            errorMessage: fatalError
              ? formatEmailDeliveryError(fatalError)
              : internalErrors > 0
                ? `${internalErrors} email đã gửi nhưng chưa ghi được marker thiệp`
                : null,
          },
          prisma,
        );
      } catch (finishError) {
        console.error(
          `[run-finish-fail] ${run.id}:`,
          finishError instanceof Error ? finishError.message : finishError,
        );
        if (!fatalError) throw finishError;
      }
    }
  }

  console.log(
    `\nTổng kết${dryRun ? " (DRY RUN, chưa gửi gì)" : ""}: nhắc còn-24h ${sent}, nhắc đã-ẩn ${sentExpired}, lỗi ${failed}, bỏ qua ${skipped}, quét ${scanned}`,
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
