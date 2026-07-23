-- CreateTable
CREATE TABLE "TemplateSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "referenceImageUrl" TEXT,
    "notifyWhenAvailable" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TemplateSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TemplateSuggestion_userId_createdAt_idx" ON "TemplateSuggestion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TemplateSuggestion_status_createdAt_idx" ON "TemplateSuggestion"("status", "createdAt");
