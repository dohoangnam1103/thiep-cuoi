-- CreateTable
CREATE TABLE "TemplateLabel" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
