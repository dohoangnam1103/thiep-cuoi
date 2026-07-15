-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ready',
    "youtubeUrl" TEXT,
    "submittedBy" TEXT,
    "errorMessage" TEXT,
    "market" TEXT NOT NULL DEFAULT 'all',
    "reviewedAt" DATETIME,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Track_market_idx" ON "Track"("market");

-- CreateIndex
CREATE INDEX "Track_status_idx" ON "Track"("status");
