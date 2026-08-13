ALTER TABLE "Invitation" ADD COLUMN "adminPriceOverride" INTEGER;
ALTER TABLE "Invitation" ADD COLUMN "complimentary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Invitation" ADD COLUMN "complimentaryAt" DATETIME;

CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT,
    "adminEmail" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetUserEmail" TEXT,
    "invitationId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdminAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdminAuditLog_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AdminAuditLog_targetUserId_createdAt_idx" ON "AdminAuditLog"("targetUserId", "createdAt");
CREATE INDEX "AdminAuditLog_invitationId_createdAt_idx" ON "AdminAuditLog"("invitationId", "createdAt");
CREATE INDEX "AdminAuditLog_adminId_createdAt_idx" ON "AdminAuditLog"("adminId", "createdAt");
