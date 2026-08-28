-- These templates historically rendered the first album photo as their opening
-- image whenever heroImage was empty. Persist that implicit choice before the
-- dedicated editor field becomes visible, so existing invitations keep the same
-- opening image after deployment. This is intentionally idempotent and never
-- replaces an image the owner already selected explicitly.
UPDATE "InvitationContent"
SET "heroImage" = (
  SELECT "GalleryPhoto"."url"
  FROM "GalleryPhoto"
  WHERE "GalleryPhoto"."invitationId" = "InvitationContent"."invitationId"
  ORDER BY "GalleryPhoto"."sortOrder" ASC, "GalleryPhoto"."id" ASC
  LIMIT 1
)
WHERE TRIM("InvitationContent"."heroImage") = ''
  AND EXISTS (
    SELECT 1
    FROM "Invitation"
    WHERE "Invitation"."id" = "InvitationContent"."invitationId"
      AND "Invitation"."templateId" IN (
        'minimalism-dark-red',
        'minimalism-jade',
        'minimalism-sky-blue',
        'minimalism-powder-pink'
      )
  )
  AND EXISTS (
    SELECT 1
    FROM "GalleryPhoto"
    WHERE "GalleryPhoto"."invitationId" = "InvitationContent"."invitationId"
  );
