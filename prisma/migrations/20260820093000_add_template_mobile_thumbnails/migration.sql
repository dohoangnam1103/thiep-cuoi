-- CreateTable
CREATE TABLE "TemplateMobileThumbnail" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
