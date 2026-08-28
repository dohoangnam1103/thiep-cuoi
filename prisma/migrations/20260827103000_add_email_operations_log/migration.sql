-- Lưu vận hành email thành ba lớp: lượt chạy, thư logic và từng lần thử gửi.
-- Không backfill `reminderSentAt` cũ vì dữ liệu lịch sử không có recipient
-- snapshot, provider ID hay lỗi gửi nên không thể coi là lịch sử chính xác.

CREATE TABLE "EmailRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "scannedCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dedupeKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "userId" TEXT,
    "invitationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'resend',
    "providerMessageId" TEXT,
    "lastError" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sentAt" DATETIME,
    CONSTRAINT "EmailDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmailDelivery_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "EmailDeliveryAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliveryId" TEXT NOT NULL,
    "runId" TEXT,
    "status" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailDeliveryAttempt_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "EmailDelivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailDeliveryAttempt_runId_fkey" FOREIGN KEY ("runId") REFERENCES "EmailRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EmailDelivery_dedupeKey_key" ON "EmailDelivery"("dedupeKey");
CREATE INDEX "EmailRun_source_startedAt_idx" ON "EmailRun"("source", "startedAt");
CREATE INDEX "EmailRun_startedAt_idx" ON "EmailRun"("startedAt");
CREATE INDEX "EmailDelivery_type_createdAt_idx" ON "EmailDelivery"("type", "createdAt");
CREATE INDEX "EmailDelivery_status_createdAt_idx" ON "EmailDelivery"("status", "createdAt");
CREATE INDEX "EmailDelivery_recipientEmail_createdAt_idx" ON "EmailDelivery"("recipientEmail", "createdAt");
CREATE INDEX "EmailDelivery_userId_createdAt_idx" ON "EmailDelivery"("userId", "createdAt");
CREATE INDEX "EmailDelivery_invitationId_createdAt_idx" ON "EmailDelivery"("invitationId", "createdAt");
CREATE INDEX "EmailDeliveryAttempt_runId_attemptedAt_idx" ON "EmailDeliveryAttempt"("runId", "attemptedAt");
CREATE INDEX "EmailDeliveryAttempt_deliveryId_attemptedAt_idx" ON "EmailDeliveryAttempt"("deliveryId", "attemptedAt");
CREATE INDEX "EmailDeliveryAttempt_status_attemptedAt_idx" ON "EmailDeliveryAttempt"("status", "attemptedAt");
