-- CreateTable
CREATE TABLE "TemplateDisplayOrder" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "sortOrder" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "TemplateDisplayOrder_sortOrder_idx" ON "TemplateDisplayOrder"("sortOrder");
