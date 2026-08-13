import { randomUUID } from "node:crypto";

import { SEEDED_ADMIN } from "./auth";
import { getDb, prismaNow } from "./db";

function id(prefix = "c"): string {
  return `${prefix}${randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

export type SeededUser = { id: string; email: string };
export type SeededInvitation = { id: string; userId: string; templateId: string };

/** Create a fresh user. Each test should make its own to stay isolated. */
export function createUser(overrides?: { email?: string; password?: string }): SeededUser {
  const db = getDb();
  const userId = id("u");
  const email = overrides?.email ?? `u-${randomUUID()}@e2e.test`;
  db.prepare(
    `INSERT INTO User (id, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)`,
  ).run(userId, email, overrides?.password ?? "x", prismaNow());
  return { id: userId, email };
}

/** Create an invitation (with empty content row) owned by `userId`. */
export function createInvitation(
  userId: string,
  overrides?: Partial<{
    templateId: string;
    status: string;
    paid: boolean;
    complimentary: boolean;
    adminPriceOverride: number | null;
    slug: string;
    isDemo: boolean;
    publishedAt: Date;
  }>,
): SeededInvitation {
  const db = getDb();
  const invId = id("i");
  const now = prismaNow();
  db.prepare(
    `INSERT INTO Invitation (id, userId, slug, templateId, status, paid, complimentary, adminPriceOverride, isDemo, publishedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    invId,
    userId,
    overrides?.slug ?? null,
    overrides?.templateId ?? "song-hy-red",
    overrides?.status ?? "draft",
    overrides?.paid ? 1 : 0,
    overrides?.complimentary ? 1 : 0,
    overrides?.adminPriceOverride ?? null,
    overrides?.isDemo ? 1 : 0,
    overrides?.publishedAt ? prismaNow(overrides.publishedAt) : null,
    now,
    now,
  );
  db.prepare(`INSERT INTO InvitationContent (id, invitationId) VALUES (?, ?)`).run(id("ic"), invId);
  return { id: invId, userId, templateId: overrides?.templateId ?? "song-hy-red" };
}

/** Publish an invitation with a unique slug so /thiep/[slug] resolves. */
export function publishInvitation(
  invitationId: string,
  contentOverrides?: Record<string, string>,
): string {
  const db = getDb();
  const slug = `thiep-${randomUUID().slice(0, 8)}`;
  if (contentOverrides) {
    const cols = Object.keys(contentOverrides);
    if (cols.length) {
      const setSql = cols.map((c) => `"${c}" = ?`).join(", ");
      db.prepare(`UPDATE InvitationContent SET ${setSql} WHERE invitationId = ?`).run(
        ...cols.map((c) => contentOverrides[c]),
        invitationId,
      );
    }
  }
  db.prepare(
    `UPDATE Invitation SET status = 'published', paid = 1, slug = ?, publishedAt = ?, updatedAt = ? WHERE id = ?`,
  ).run(slug, prismaNow(), prismaNow(), invitationId);
  return slug;
}

export function createGuest(invitationId: string, name = "Nguyễn Văn A"): { id: string; token: string } {
  const db = getDb();
  const guestId = id("g");
  const token = randomUUID();
  db.prepare(
    `INSERT INTO Guest (id, invitationId, token, name, createdAt) VALUES (?, ?, ?, ?, ?)`,
  ).run(guestId, invitationId, token, name, prismaNow());
  return { id: guestId, token };
}

export function createPayment(
  invitationId: string,
  overrides?: Partial<{
    code: string;
    amount: number;
    status: string;
    provider: string;
    providerOrderCode: string;
    voucherCode: string;
  }>,
): { id: string; code: string } {
  const db = getDb();
  const payId = id("p");
  const code = overrides?.code ?? `PAY${randomUUID().slice(0, 8).toUpperCase()}`;
  db.prepare(
    `INSERT INTO Payment (
      id, invitationId, code, amount, voucherCode, status, provider, providerOrderCode, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    payId,
    invitationId,
    code,
    overrides?.amount ?? 150000,
    overrides?.voucherCode ?? null,
    overrides?.status ?? "pending",
    overrides?.provider ?? "casso",
    overrides?.providerOrderCode ?? null,
    prismaNow(),
  );
  return { id: payId, code };
}

/** Delete everything a test created, by userId (FK cascade removes invitation children). */
export function cleanupUser(userId: string): void {
  const db = getDb();
  db.pragma("foreign_keys = ON");
  db.prepare(`DELETE FROM Invitation WHERE userId = ?`).run(userId);
  db.prepare(`DELETE FROM User WHERE id = ?`).run(userId);
}

/** Count invitations owned by `userId` (SELECT only). */
export function invitationCountFor(userId: string): number {
  return (
    getDb()
      .prepare("SELECT COUNT(*) AS count FROM Invitation WHERE userId = ?")
      .get(userId) as { count: number }
  ).count;
}

/** Price-related columns of an invitation (SELECT only). */
export function invitationPriceState(invitationId: string): {
  adminPriceOverride: number | null;
  complimentary: number;
} {
  return getDb()
    .prepare("SELECT adminPriceOverride, complimentary FROM Invitation WHERE id = ?")
    .get(invitationId) as { adminPriceOverride: number | null; complimentary: number };
}

export function paymentStatusById(paymentId: string): string | undefined {
  const row = getDb().prepare("SELECT status FROM Payment WHERE id = ?").get(paymentId) as
    | { status: string }
    | undefined;
  return row?.status;
}

export function auditCountForUser(userId: string): number {
  return (
    getDb()
      .prepare("SELECT COUNT(*) AS count FROM AdminAuditLog WHERE targetUserId = ?")
      .get(userId) as { count: number }
  ).count;
}

export function auditCountForInvitation(invitationId: string): number {
  return (
    getDb()
      .prepare("SELECT COUNT(*) AS count FROM AdminAuditLog WHERE invitationId = ?")
      .get(invitationId) as { count: number }
  ).count;
}

export function getInvitation(invitationId: string): {
  id: string;
  userId: string;
  templateId: string;
  status: string;
  slug: string | null;
  paid: number;
  complimentary: number;
  adminPriceOverride: number | null;
} {
  return getDb()
    .prepare(
      `SELECT id, userId, templateId, status, slug, paid, complimentary, adminPriceOverride
       FROM Invitation WHERE id = ?`,
    )
    .get(invitationId) as {
    id: string;
    userId: string;
    templateId: string;
    status: string;
    slug: string | null;
    paid: number;
    complimentary: number;
    adminPriceOverride: number | null;
  };
}

/** Most recent audit row for an invitation (SELECT only). */
export function getLatestAudit(invitationId: string):
  | { adminId: string | null; adminEmail: string; action: string }
  | undefined {
  return getDb()
    .prepare(
      `SELECT adminId, adminEmail, action FROM AdminAuditLog
       WHERE invitationId = ? ORDER BY createdAt DESC, id DESC LIMIT 1`,
    )
    .get(invitationId) as
    | { adminId: string | null; adminEmail: string; action: string }
    | undefined;
}

/** Insert an Admin row directly (used for non-super-admin gating). */
export function seedAdmin(isSuperAdmin: boolean): { id: string; email: string } {
  const db = getDb();
  const adminId = id("a");
  const email = `admin-${randomUUID()}@e2e.test`;
  // passwordHash value is irrelevant here; login is done via forged cookie.
  db.prepare(
    `INSERT INTO Admin (id, email, passwordHash, isSuperAdmin, createdAt) VALUES (?, ?, ?, ?, ?)`,
  ).run(adminId, email, "x", isSuperAdmin ? 1 : 0, prismaNow());
  return { id: adminId, email };
}

/** id of the seeded super admin (admin@e2e.test), used for forged-cookie login. */
export function seededAdminId(): string {
  const row = getDb().prepare("SELECT id FROM Admin WHERE email = ?").get(SEEDED_ADMIN.email) as
    | { id: string }
    | undefined;
  if (!row) throw new Error("seeded admin not found in test.db");
  return row.id;
}

export function deleteAdmin(adminId: string): void {
  getDb().prepare("DELETE FROM Admin WHERE id = ?").run(adminId);
}
