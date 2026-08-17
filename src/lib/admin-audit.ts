import type { Prisma } from "@/generated/prisma/client";

export const ADMIN_AUDIT_ACTIONS = {
  invitationCreated: "INVITATION_CREATED_FOR_USER",
  invitationUpdated: "INVITATION_UPDATED_BY_ADMIN",
  invitationPublished: "INVITATION_PUBLISHED_BY_ADMIN",
  priceOverrideSet: "PRICE_OVERRIDE_SET",
  priceOverrideCleared: "PRICE_OVERRIDE_CLEARED",
  complimentaryGranted: "COMPLIMENTARY_GRANTED",
  complimentaryRevoked: "COMPLIMENTARY_REVOKED",
} as const;

export type AdminAuditAction =
  (typeof ADMIN_AUDIT_ACTIONS)[keyof typeof ADMIN_AUDIT_ACTIONS];

type AuditJson =
  | string
  | number
  | boolean
  | null
  | AuditJson[]
  | { [key: string]: AuditJson };

export function serializeAuditDetails(details: Record<string, AuditJson>): string {
  return JSON.stringify(details);
}

export async function writeAdminAudit(
  db: Prisma.TransactionClient,
  input: {
    adminId: string;
    adminEmail: string;
    targetUserId: string;
    targetUserEmail: string | null;
    invitationId: string;
    action: AdminAuditAction;
    details?: Record<string, AuditJson>;
  },
): Promise<void> {
  await db.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      adminEmail: input.adminEmail,
      targetUserId: input.targetUserId,
      targetUserEmail: input.targetUserEmail,
      invitationId: input.invitationId,
      action: input.action,
      details: input.details ? serializeAuditDetails(input.details) : null,
    },
  });
}
