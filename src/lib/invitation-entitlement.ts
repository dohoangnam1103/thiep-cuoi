import { trialExpiresAt } from "@/lib/trial";

export type InvitationActivation = "paid" | "complimentary" | "trial";

export type InvitationActivationFields = {
  paid: boolean;
  complimentary: boolean;
};

export function getInvitationActivation(
  invitation: InvitationActivationFields,
): InvitationActivation {
  if (invitation.paid) return "paid";
  if (invitation.complimentary) return "complimentary";
  return "trial";
}

export function isInvitationActivated(invitation: InvitationActivationFields): boolean {
  return getInvitationActivation(invitation) !== "trial";
}

export function isInvitationExpired(
  invitation: InvitationActivationFields & { publishedAt: Date | null },
  now = new Date(),
): boolean {
  if (isInvitationActivated(invitation) || !invitation.publishedAt) return false;
  return now.getTime() >= trialExpiresAt(invitation.publishedAt).getTime();
}
