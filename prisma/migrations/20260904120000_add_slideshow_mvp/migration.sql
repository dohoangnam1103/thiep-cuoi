-- CreateTable
CREATE TABLE "SlideshowProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "creationKey" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Slideshow cưới',
    "templateId" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL DEFAULT 1,
    "sourceJson" TEXT NOT NULL,
    "sceneOverridesJson" TEXT NOT NULL DEFAULT '{}',
    "musicUrl" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "assetCount" INTEGER NOT NULL DEFAULT 0,
    "assetBytes" INTEGER NOT NULL DEFAULT 0,
    "trialStartedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "complimentary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SlideshowProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SlideshowAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SlideshowAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SlideshowProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SlideshowPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "activeKey" TEXT,
    "code" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'casso',
    "providerOrderCode" TEXT,
    "providerPaymentLinkId" TEXT,
    "providerCheckoutUrl" TEXT,
    "providerQrCode" TEXT,
    "providerBankBin" TEXT,
    "providerBankAccount" TEXT,
    "providerBankAccountName" TEXT,
    "reviewReason" TEXT,
    "receivedAmount" INTEGER,
    "providerRef" TEXT,
    "reviewDetectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    CONSTRAINT "SlideshowPayment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SlideshowProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SlideshowProject_shareToken_key" ON "SlideshowProject"("shareToken");
CREATE UNIQUE INDEX "SlideshowProject_creationKey_key" ON "SlideshowProject"("creationKey");
CREATE INDEX "SlideshowProject_userId_updatedAt_idx" ON "SlideshowProject"("userId", "updatedAt");
CREATE INDEX "SlideshowProject_trialStartedAt_idx" ON "SlideshowProject"("trialStartedAt");
CREATE UNIQUE INDEX "SlideshowAsset_storageKey_key" ON "SlideshowAsset"("storageKey");
CREATE INDEX "SlideshowAsset_projectId_createdAt_idx" ON "SlideshowAsset"("projectId", "createdAt");
CREATE UNIQUE INDEX "SlideshowPayment_activeKey_key" ON "SlideshowPayment"("activeKey");
CREATE UNIQUE INDEX "SlideshowPayment_code_key" ON "SlideshowPayment"("code");
CREATE UNIQUE INDEX "SlideshowPayment_providerOrderCode_key" ON "SlideshowPayment"("providerOrderCode");
CREATE UNIQUE INDEX "SlideshowPayment_providerPaymentLinkId_key" ON "SlideshowPayment"("providerPaymentLinkId");
CREATE INDEX "SlideshowPayment_projectId_createdAt_idx" ON "SlideshowPayment"("projectId", "createdAt");
CREATE INDEX "SlideshowPayment_provider_status_idx" ON "SlideshowPayment"("provider", "status");
