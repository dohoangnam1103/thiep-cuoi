CREATE TABLE "CeremonyItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invitationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CeremonyItem_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CeremonyItem_invitationId_idx" ON "CeremonyItem"("invitationId");

INSERT INTO "CeremonyItem" ("id", "invitationId", "title", "date", "time", "sortOrder")
SELECT
    'legacy-ceremony-' || "invitationId",
    "invitationId",
    "ceremonyHeader",
    "ceremonyDate",
    "ceremonyTime",
    0
FROM "InvitationContent"
WHERE
    TRIM("ceremonyHeader") <> ''
    OR TRIM("ceremonyDate") <> ''
    OR TRIM("ceremonyTime") <> '';
