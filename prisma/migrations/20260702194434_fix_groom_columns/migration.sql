/*
  Warnings:

  - You are about to drop the column `gromFullName` on the `InvitationContent` table. All the data in the column will be lost.
  - You are about to drop the column `gromShortName` on the `InvitationContent` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InvitationContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invitationId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#c8102e',
    "fontFamily" TEXT,
    "assetFolder" TEXT,
    "music" TEXT,
    "brideFullName" TEXT NOT NULL DEFAULT '',
    "groomFullName" TEXT NOT NULL DEFAULT '',
    "brideShortName" TEXT NOT NULL DEFAULT '',
    "groomShortName" TEXT NOT NULL DEFAULT '',
    "brideFirst" BOOLEAN NOT NULL DEFAULT true,
    "date" TEXT NOT NULL DEFAULT '',
    "time" TEXT NOT NULL DEFAULT '',
    "ceremonyDate" TEXT NOT NULL DEFAULT '',
    "ceremonyTime" TEXT NOT NULL DEFAULT '',
    "ceremonyHeader" TEXT NOT NULL DEFAULT '',
    "brideFather" TEXT NOT NULL DEFAULT '',
    "brideMother" TEXT NOT NULL DEFAULT '',
    "brideAddress" TEXT NOT NULL DEFAULT '',
    "groomFather" TEXT NOT NULL DEFAULT '',
    "groomMother" TEXT NOT NULL DEFAULT '',
    "groomAddress" TEXT NOT NULL DEFAULT '',
    "brideParentTitle" TEXT NOT NULL DEFAULT '',
    "groomParentTitle" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "mapAddress" TEXT NOT NULL DEFAULT '',
    "banquetTime" TEXT NOT NULL DEFAULT '',
    "brideBankName" TEXT NOT NULL DEFAULT '',
    "brideAccountNumber" TEXT NOT NULL DEFAULT '',
    "brideAccountName" TEXT NOT NULL DEFAULT '',
    "groomBankName" TEXT NOT NULL DEFAULT '',
    "groomAccountNumber" TEXT NOT NULL DEFAULT '',
    "groomAccountName" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "InvitationContent_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InvitationContent" ("address", "assetFolder", "banquetTime", "brideAccountName", "brideAccountNumber", "brideAddress", "brideBankName", "brideFather", "brideFirst", "brideFullName", "brideMother", "brideParentTitle", "brideShortName", "ceremonyDate", "ceremonyHeader", "ceremonyTime", "date", "fontFamily", "groomAccountName", "groomAccountNumber", "groomAddress", "groomBankName", "groomFather", "groomMother", "groomParentTitle", "id", "invitationId", "mapAddress", "music", "primaryColor", "time") SELECT "address", "assetFolder", "banquetTime", "brideAccountName", "brideAccountNumber", "brideAddress", "brideBankName", "brideFather", "brideFirst", "brideFullName", "brideMother", "brideParentTitle", "brideShortName", "ceremonyDate", "ceremonyHeader", "ceremonyTime", "date", "fontFamily", "groomAccountName", "groomAccountNumber", "groomAddress", "groomBankName", "groomFather", "groomMother", "groomParentTitle", "id", "invitationId", "mapAddress", "music", "primaryColor", "time" FROM "InvitationContent";
DROP TABLE "InvitationContent";
ALTER TABLE "new_InvitationContent" RENAME TO "InvitationContent";
CREATE UNIQUE INDEX "InvitationContent_invitationId_key" ON "InvitationContent"("invitationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
