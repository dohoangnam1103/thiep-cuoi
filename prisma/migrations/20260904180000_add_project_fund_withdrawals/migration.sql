-- CreateTable
CREATE TABLE "ProjectFundWithdrawal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestKey" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "amount" INTEGER NOT NULL CHECK ("amount" > 0),
    "withdrawnAt" DATETIME NOT NULL,
    "purpose" TEXT NOT NULL,
    "bankReference" TEXT NOT NULL,
    "note" TEXT,
    "createdByAdminId" TEXT,
    "createdByAdminEmail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectFundWithdrawal_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectFundAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "withdrawalId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "amount" INTEGER NOT NULL CHECK ("amount" > 0),
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProjectFundAllocation_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "ProjectFundWithdrawal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectFundWithdrawalVoid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "withdrawalId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByAdminId" TEXT,
    "createdByAdminEmail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectFundWithdrawalVoid_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "ProjectFundWithdrawal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectFundWithdrawalVoid_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFundWithdrawal_requestKey_key" ON "ProjectFundWithdrawal"("requestKey");
CREATE UNIQUE INDEX "ProjectFundWithdrawal_bankReference_key" ON "ProjectFundWithdrawal"("bankReference");
CREATE INDEX "ProjectFundWithdrawal_withdrawnAt_createdAt_idx" ON "ProjectFundWithdrawal"("withdrawnAt", "createdAt");
CREATE INDEX "ProjectFundWithdrawal_createdByAdminId_createdAt_idx" ON "ProjectFundWithdrawal"("createdByAdminId", "createdAt");
CREATE INDEX "ProjectFundAllocation_withdrawalId_sortOrder_idx" ON "ProjectFundAllocation"("withdrawalId", "sortOrder");
CREATE UNIQUE INDEX "ProjectFundWithdrawalVoid_withdrawalId_key" ON "ProjectFundWithdrawalVoid"("withdrawalId");
CREATE INDEX "ProjectFundWithdrawalVoid_createdByAdminId_createdAt_idx" ON "ProjectFundWithdrawalVoid"("createdByAdminId", "createdAt");

-- Append-only guards. Actor IDs may still become NULL through the Admin
-- foreign key so deleting an admin account does not erase the email snapshot.
CREATE TRIGGER "ProjectFundWithdrawal_prevent_financial_update"
BEFORE UPDATE OF "id", "requestKey", "payloadHash", "amount", "withdrawnAt", "purpose", "bankReference", "note", "createdByAdminEmail", "createdAt"
ON "ProjectFundWithdrawal"
BEGIN
    SELECT RAISE(ABORT, 'ProjectFundWithdrawal is append-only');
END;

CREATE TRIGGER "ProjectFundWithdrawal_prevent_actor_reassignment"
BEFORE UPDATE OF "createdByAdminId" ON "ProjectFundWithdrawal"
WHEN NEW."createdByAdminId" IS NOT NULL
BEGIN
    SELECT RAISE(ABORT, 'ProjectFundWithdrawal actor cannot be reassigned');
END;

CREATE TRIGGER "ProjectFundWithdrawal_prevent_delete"
BEFORE DELETE ON "ProjectFundWithdrawal"
BEGIN
    SELECT RAISE(ABORT, 'ProjectFundWithdrawal cannot be deleted');
END;

CREATE TRIGGER "ProjectFundAllocation_prevent_update"
BEFORE UPDATE ON "ProjectFundAllocation"
BEGIN
    SELECT RAISE(ABORT, 'ProjectFundAllocation is append-only');
END;

CREATE TRIGGER "ProjectFundAllocation_prevent_delete"
BEFORE DELETE ON "ProjectFundAllocation"
BEGIN
    SELECT RAISE(ABORT, 'ProjectFundAllocation cannot be deleted');
END;

-- Prevent a direct writer from allocating more than the withdrawal. The Server
-- Action additionally requires the final sum to equal the withdrawal exactly.
CREATE TRIGGER "ProjectFundAllocation_prevent_overallocation"
BEFORE INSERT ON "ProjectFundAllocation"
WHEN (
    COALESCE((SELECT SUM("amount") FROM "ProjectFundAllocation" WHERE "withdrawalId" = NEW."withdrawalId"), 0)
    + NEW."amount"
) > (SELECT "amount" FROM "ProjectFundWithdrawal" WHERE "id" = NEW."withdrawalId")
BEGIN
    SELECT RAISE(ABORT, 'ProjectFundAllocation exceeds withdrawal amount');
END;

CREATE TRIGGER "ProjectFundWithdrawalVoid_prevent_update"
BEFORE UPDATE OF "id", "withdrawalId", "reason", "createdByAdminEmail", "createdAt"
ON "ProjectFundWithdrawalVoid"
BEGIN
    SELECT RAISE(ABORT, 'ProjectFundWithdrawalVoid is append-only');
END;

CREATE TRIGGER "ProjectFundWithdrawalVoid_prevent_actor_reassignment"
BEFORE UPDATE OF "createdByAdminId" ON "ProjectFundWithdrawalVoid"
WHEN NEW."createdByAdminId" IS NOT NULL
BEGIN
    SELECT RAISE(ABORT, 'ProjectFundWithdrawalVoid actor cannot be reassigned');
END;

CREATE TRIGGER "ProjectFundWithdrawalVoid_prevent_delete"
BEFORE DELETE ON "ProjectFundWithdrawalVoid"
BEGIN
    SELECT RAISE(ABORT, 'ProjectFundWithdrawalVoid cannot be deleted');
END;
