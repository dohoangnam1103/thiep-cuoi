-- Extend guests without changing existing invitation links or RSVP relations.
ALTER TABLE "Invitation" ADD COLUMN "guestManagerToken" TEXT;
CREATE UNIQUE INDEX "Invitation_guestManagerToken_key" ON "Invitation"("guestManagerToken");

ALTER TABLE "Guest" ADD COLUMN "groupName" TEXT;
ALTER TABLE "Guest" ADD COLUMN "tableName" TEXT;
ALTER TABLE "Guest" ADD COLUMN "phone" TEXT;
ALTER TABLE "Guest" ADD COLUMN "email" TEXT;
ALTER TABLE "Guest" ADD COLUMN "greeting" TEXT;
ALTER TABLE "Guest" ADD COLUMN "maxGuests" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Guest" ADD COLUMN "giftAmount" INTEGER;
ALTER TABLE "Guest" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "RsvpQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invitationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RsvpQuestion_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "RsvpAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rsvpId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "RsvpAnswer_rsvpId_fkey" FOREIGN KEY ("rsvpId") REFERENCES "Rsvp" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RsvpAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "RsvpQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "RsvpQuestion_invitationId_idx" ON "RsvpQuestion"("invitationId");
CREATE UNIQUE INDEX "RsvpAnswer_rsvpId_questionId_key" ON "RsvpAnswer"("rsvpId", "questionId");
CREATE INDEX "RsvpAnswer_questionId_idx" ON "RsvpAnswer"("questionId");
