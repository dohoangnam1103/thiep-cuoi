-- CreateTable
CREATE TABLE "TemplateVisibility" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
