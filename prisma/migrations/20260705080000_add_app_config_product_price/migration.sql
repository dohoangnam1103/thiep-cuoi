-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "productPrice" INTEGER NOT NULL DEFAULT 150000,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "AppConfig" ("id", "productPrice", "updatedAt") VALUES ('default', 150000, CURRENT_TIMESTAMP);
