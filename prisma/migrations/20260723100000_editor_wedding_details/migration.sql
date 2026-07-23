ALTER TABLE "InvitationContent" ADD COLUMN "ceremonyType" TEXT NOT NULL DEFAULT 'thanh-hon';
ALTER TABLE "InvitationContent" ADD COLUMN "openingMessage" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InvitationContent" ADD COLUMN "heroImage" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InvitationContent" ADD COLUMN "showHeroImage" BOOLEAN NOT NULL DEFAULT true;
