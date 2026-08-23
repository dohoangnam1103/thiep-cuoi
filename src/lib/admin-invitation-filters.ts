import type { Prisma } from "@/generated/prisma/client";

import { SYSTEM_EMAIL } from "@/lib/admin-support-input";

/**
 * What "Thiệp thật" means, defined once so the Tổng quan count and the list
 * page cannot drift apart. `NOT: { email }` rather than `email: { not }` is
 * deliberate: the latter drops users whose email is null on SQL null
 * semantics, and those are exactly the anonymous owners worth seeing.
 */
export const REAL_INVITATION_WHERE = {
  isDemo: false,
  // Measured, not assumed: as a relation filter both `NOT: { email }` and
  // `email: { not }` drop owners whose email is null, because `NULL <> 'x'` is
  // NULL rather than true. Those owners are anonymous accounts — precisely the
  // ones worth seeing — so the null branch has to be spelled out.
  user: { OR: [{ email: null }, { email: { not: SYSTEM_EMAIL } }] },
} satisfies Prisma.InvitationWhereInput;

export type InvitationSearchable = {
  slug: string | null;
  user: { email: string | null };
  content: { groomFullName: string | null; brideFullName: string | null } | null;
};

/**
 * Search runs in memory rather than as a LIKE clause. SQLite folds case for
 * ASCII only, so a lowercased "Được" stops matching at the Đ and any query
 * typed in a different case than the stored name silently returns nothing.
 * `toLocaleLowerCase("vi")` folds the whole alphabet.
 *
 * The cost is fetching the section before filtering it, which is fine for an
 * admin table in the low hundreds; it would need revisiting in the thousands.
 */
export function normalizeSearch(value: string | undefined): string {
  return (value ?? "").trim().slice(0, 120).toLocaleLowerCase("vi");
}

export function invitationMatchesSearch(
  row: InvitationSearchable,
  normalizedTerm: string,
): boolean {
  if (!normalizedTerm) return true;
  return [
    row.slug,
    row.user.email,
    row.content?.groomFullName,
    row.content?.brideFullName,
  ].some((field) => field?.toLocaleLowerCase("vi").includes(normalizedTerm));
}

export const INVITATION_STATUS_FILTERS = ["all", "draft", "published"] as const;
export const INVITATION_ACTIVATION_FILTERS = [
  "all",
  "paid",
  "complimentary",
  "trial",
  "expired",
] as const;

export type InvitationStatusFilter = (typeof INVITATION_STATUS_FILTERS)[number];
export type InvitationActivationFilter =
  (typeof INVITATION_ACTIVATION_FILTERS)[number];

/**
 * Query values arrive from the URL, so anything outside the known set has to
 * collapse to "all" rather than reach Prisma or a translation lookup.
 */
export function parseStatusFilter(value: string | undefined): InvitationStatusFilter {
  return INVITATION_STATUS_FILTERS.includes(value as InvitationStatusFilter)
    ? (value as InvitationStatusFilter)
    : "all";
}

export function parseActivationFilter(
  value: string | undefined,
): InvitationActivationFilter {
  return INVITATION_ACTIVATION_FILTERS.includes(value as InvitationActivationFilter)
    ? (value as InvitationActivationFilter)
    : "all";
}

/**
 * "expired" is a trial whose window has run out, which depends on
 * `publishedAt` plus the trial length and so cannot be expressed as a column
 * filter. It narrows to trial in SQL and is finished off in memory.
 */
export function activationWhere(
  filter: InvitationActivationFilter,
): { paid?: boolean; complimentary?: boolean } {
  switch (filter) {
    case "paid":
      return { paid: true };
    case "complimentary":
      return { paid: false, complimentary: true };
    case "trial":
    case "expired":
      return { paid: false, complimentary: false };
    default:
      return {};
  }
}
