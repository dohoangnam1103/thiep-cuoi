-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slug" TEXT,
    "templateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvitationContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invitationId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#c8102e',
    "fontFamily" TEXT,
    "assetFolder" TEXT,
    "music" TEXT,
    "brideFullName" TEXT NOT NULL DEFAULT '',
    "gromFullName" TEXT NOT NULL DEFAULT '',
    "brideShortName" TEXT NOT NULL DEFAULT '',
    "gromShortName" TEXT NOT NULL DEFAULT '',
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

-- CreateTable
CREATE TABLE "ScheduleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invitationId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ScheduleItem_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GalleryPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invitationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "GalleryPhoto_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invitationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Wish_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rsvp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invitationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attending" BOOLEAN NOT NULL DEFAULT true,
    "guests" INTEGER NOT NULL DEFAULT 1,
    "side" TEXT,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rsvp_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_slug_key" ON "Invitation"("slug");

-- CreateIndex
CREATE INDEX "Invitation_userId_idx" ON "Invitation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationContent_invitationId_key" ON "InvitationContent"("invitationId");

-- CreateIndex
CREATE INDEX "ScheduleItem_invitationId_idx" ON "ScheduleItem"("invitationId");

-- CreateIndex
CREATE INDEX "GalleryPhoto_invitationId_idx" ON "GalleryPhoto"("invitationId");

-- CreateIndex
CREATE INDEX "Wish_invitationId_idx" ON "Wish"("invitationId");

-- CreateIndex
CREATE INDEX "Rsvp_invitationId_idx" ON "Rsvp"("invitationId");
