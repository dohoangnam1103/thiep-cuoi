import { isInvitationActivated } from "@/lib/invitation-entitlement";
import { FREE_TRIAL_MS } from "@/lib/trial";

export const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ReminderCandidate = {
  paid: boolean;
  complimentary: boolean;
  publishedAt: Date | null;
  reminderSentAt: Date | null;
  email: string | null;
};

export function shouldSendReminder(c: ReminderCandidate, now: Date): boolean {
  if (isInvitationActivated(c)) return false;
  if (!c.publishedAt) return false;
  if (c.reminderSentAt) return false;
  if (!c.email) return false;

  const expiresAt = c.publishedAt.getTime() + FREE_TRIAL_MS;
  const nowMs = now.getTime();
  return expiresAt > nowMs && expiresAt <= nowMs + REMINDER_WINDOW_MS;
}

export function buildCardName(
  content: { brideShortName: string; groomShortName: string } | null,
): string {
  const parts = [content?.brideShortName, content?.groomShortName]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" & ") : "Thiệp cưới của bạn";
}
