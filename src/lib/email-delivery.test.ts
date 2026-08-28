import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";
import {
  formatEmailDeliveryError,
  recordEmailClick,
  sendTrackedEmail,
} from "./email-delivery";

const createEmailLogSql = readFileSync(
  new URL("../../prisma/migrations/20260827103000_add_email_operations_log/migration.sql", import.meta.url),
  "utf8",
);
const hardenEmailLogSql = readFileSync(
  new URL("../../prisma/migrations/20260827153000_harden_email_operations_log/migration.sql", import.meta.url),
  "utf8",
);
const clickTrackingSql = readFileSync(
  new URL("../../prisma/migrations/20260828170344_add_email_click_tracking/migration.sql", import.meta.url),
  "utf8",
);

async function withEmailDb<T>(run: (db: PrismaClient) => Promise<T>): Promise<T> {
  const directory = mkdtempSync(join(tmpdir(), "email-delivery-test-"));
  const databasePath = join(directory, "test.db");
  const sqlite = new Database(databasePath);
  // Hai bảng cha tối thiểu để SQLite có thể kiểm tra foreign key của migration;
  // test không tạo relation nên chỉ cần primary key đúng tên.
  sqlite.exec('CREATE TABLE "User" ("id" TEXT NOT NULL PRIMARY KEY);');
  sqlite.exec('CREATE TABLE "Invitation" ("id" TEXT NOT NULL PRIMARY KEY);');
  sqlite.exec(createEmailLogSql);
  sqlite.exec(hardenEmailLogSql);
  sqlite.exec(clickTrackingSql);
  sqlite.close();

  const adapter = new PrismaBetterSqlite3({ url: `file:${databasePath}` });
  const db = new PrismaClient({ adapter });
  try {
    return await run(db);
  } finally {
    await db.$disconnect();
    rmSync(directory, { recursive: true, force: true });
  }
}

const baseInput = {
  dedupeKey: "trial-reminder:expired:invitation-1",
  type: "expired",
  recipientEmail: "first@example.com",
  recipientName: "An & Bình",
  subject: "Thiệp đã tạm ẩn",
  html: "<p>payload đầu tiên</p>",
};

test("email delivery error is safe for one-line admin display", () => {
  assert.equal(
    formatEmailDeliveryError(new Error("  Resend\n  temporary\t failure  ")),
    "Resend temporary failure",
  );
});

test("email delivery error limits an unexpectedly large provider response", () => {
  assert.equal(formatEmailDeliveryError(new Error("x".repeat(1_100))).length, 1_000);
});

test("concurrent workers call provider only once for one dedupe key", async () => {
  await withEmailDb(async (db) => {
    let releaseSender: (() => void) | undefined;
    let senderStarted: (() => void) | undefined;
    const senderStartedPromise = new Promise<void>((resolve) => {
      senderStarted = resolve;
    });
    const releaseSenderPromise = new Promise<void>((resolve) => {
      releaseSender = resolve;
    });
    let sendCount = 0;

    const first = sendTrackedEmail(baseInput, db, async () => {
      sendCount += 1;
      senderStarted?.();
      await releaseSenderPromise;
      return { providerMessageId: "resend-1" };
    });
    await senderStartedPromise;

    const second = await sendTrackedEmail(baseInput, db, async () => {
      sendCount += 1;
      return { providerMessageId: "resend-duplicate" };
    });
    assert.equal(second.status, "in-progress");

    releaseSender?.();
    assert.equal((await first).status, "sent");
    assert.equal(sendCount, 1);
    assert.equal(await db.emailDelivery.count(), 1);
    assert.equal(await db.emailDeliveryAttempt.count(), 1);
  });
});

test("retry reuses the immutable first payload even when live data changes", async () => {
  await withEmailDb(async (db) => {
    const failed = await sendTrackedEmail(baseInput, db, async () => {
      throw new Error("temporary provider failure");
    });
    assert.equal(failed.status, "failed");

    let retriedPayload: { to: string; subject: string; html: string } | null = null;
    const retried = await sendTrackedEmail(
      {
        ...baseInput,
        recipientEmail: "changed@example.com",
        subject: "Subject đã đổi",
        html: "<p>payload đã đổi</p>",
      },
      db,
      async (payload) => {
        retriedPayload = payload;
        return { providerMessageId: "resend-retry" };
      },
    );

    assert.equal(retried.status, "sent");
    assert.deepEqual(retriedPayload, {
      to: baseInput.recipientEmail,
      subject: baseInput.subject,
      html: baseInput.html,
      idempotencyKey: retried.deliveryId,
    });
    const delivery = await db.emailDelivery.findUniqueOrThrow({
      where: { dedupeKey: baseInput.dedupeKey },
    });
    assert.equal(delivery.recipientEmail, baseInput.recipientEmail);
    assert.equal(delivery.subject, baseInput.subject);
    assert.equal(delivery.html, baseInput.html);
    assert.equal(delivery.attemptCount, 2);
  });
});

test("retry older than the provider idempotency window requires manual review", async () => {
  await withEmailDb(async (db) => {
    await sendTrackedEmail(baseInput, db, async () => {
      throw new Error("ambiguous network failure");
    });
    const oldAttempt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.emailDeliveryAttempt.updateMany({ data: { attemptedAt: oldAttempt } });

    let sendCount = 0;
    const result = await sendTrackedEmail(baseInput, db, async () => {
      sendCount += 1;
      return { providerMessageId: "must-not-send" };
    });

    assert.equal(result.status, "manual-review");
    assert.equal(sendCount, 0);
    const delivery = await db.emailDelivery.findUniqueOrThrow({
      where: { dedupeKey: baseInput.dedupeKey },
    });
    assert.equal(delivery.status, "failed");
    assert.match(delivery.lastError ?? "", /kiểm tra Resend/);
    assert.equal(await db.emailDeliveryAttempt.count(), 2);
    assert.equal(delivery.attemptCount, 1);

    const repeated = await sendTrackedEmail(baseInput, db, async () => {
      sendCount += 1;
      return { providerMessageId: "still-must-not-send" };
    });
    assert.equal(repeated.status, "manual-review");
    assert.equal(await db.emailDeliveryAttempt.count(), 2);
    assert.equal(sendCount, 0);
  });
});

test("ghi click không được đụng vào updatedAt của delivery", async () => {
  await withEmailDb(async (db) => {
    const sent = await sendTrackedEmail(baseInput, db, async () => ({
      providerMessageId: "resend-1",
    }));
    assert.equal(sent.status, "sent");

    const before = await db.emailDelivery.findUniqueOrThrow({
      where: { id: sent.deliveryId },
      select: { updatedAt: true },
    });

    // Chờ một nhịp để `@updatedAt` chắc chắn sẽ ra giá trị khác nếu bị chạm.
    await new Promise((resolve) => setTimeout(resolve, 20));
    await recordEmailClick(sent.deliveryId, db);

    const after = await db.emailDelivery.findUniqueOrThrow({
      where: { id: sent.deliveryId },
      select: { updatedAt: true, clickCount: true, firstClickedAt: true, lastClickedAt: true },
    });

    // Đây là bất biến mà `recordEmailClick` dùng SQL thô để giữ: `claimDelivery`
    // đọc `updatedAt` cho optimistic concurrency và cho mốc 15 phút coi delivery
    // `pending` là kẹt, nên một cú click không được làm nó trông như vừa xử lý.
    assert.equal(
      after.updatedAt.getTime(),
      before.updatedAt.getTime(),
      "click đã đẩy updatedAt lên",
    );
    assert.equal(after.clickCount, 1);
    assert.ok(after.firstClickedAt, "thiếu firstClickedAt");
    assert.ok(after.lastClickedAt, "thiếu lastClickedAt");
  });
});

test("click lần hai giữ nguyên firstClickedAt và đẩy lastClickedAt", async () => {
  await withEmailDb(async (db) => {
    const sent = await sendTrackedEmail(baseInput, db, async () => ({
      providerMessageId: "resend-1",
    }));

    await recordEmailClick(sent.deliveryId, db);
    const first = await db.emailDelivery.findUniqueOrThrow({
      where: { id: sent.deliveryId },
      select: { firstClickedAt: true },
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    await recordEmailClick(sent.deliveryId, db);
    const second = await db.emailDelivery.findUniqueOrThrow({
      where: { id: sent.deliveryId },
      select: { clickCount: true, firstClickedAt: true, lastClickedAt: true },
    });

    assert.equal(second.clickCount, 2);
    // Phễu chuyển đổi so `Payment.paidAt` với `firstClickedAt`, nên mốc này phải cố
    // định; nếu nó nhảy theo mỗi lần khách mở lại thư cũ thì một chuyển đổi đã đếm
    // sẽ tự biến mất khỏi báo cáo.
    assert.equal(
      second.firstClickedAt?.getTime(),
      first.firstClickedAt?.getTime(),
      "firstClickedAt bị ghi đè",
    );
    assert.ok(
      (second.lastClickedAt?.getTime() ?? 0) > (first.firstClickedAt?.getTime() ?? 0),
      "lastClickedAt không tiến lên",
    );
  });
});

test("ghi click cho delivery không tồn tại không ném lỗi", async () => {
  // Đường khách đang đi để trả tiền: một câu ghi số liệu thất bại không được chặn
  // redirect sang trang thanh toán.
  await withEmailDb(async (db) => {
    await recordEmailClick("khong-ton-tai", db);
  });
});
