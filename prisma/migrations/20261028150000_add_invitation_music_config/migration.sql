ALTER TABLE "InvitationContent" ADD COLUMN "musicEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "InvitationContent" ADD COLUMN "musicStartAt" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "InvitationContent" ADD COLUMN "musicTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InvitationContent" ADD COLUMN "musicArtist" TEXT NOT NULL DEFAULT '';
