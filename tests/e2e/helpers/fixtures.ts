import { randomUUID } from "node:crypto";

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
    slug: string;
    isDemo: boolean;
    publishedAt: Date;
  }>,
): SeededInvitation {
  const db = getDb();
  const invId = id("i");
  const now = prismaNow();
  db.prepare(
    `INSERT INTO Invitation (id, userId, slug, templateId, status, paid, complimentary, isDemo, publishedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    invId,
    userId,
    overrides?.slug ?? null,
    overrides?.templateId ?? "song-hy-red",
    overrides?.status ?? "draft",
    overrides?.paid ? 1 : 0,
    overrides?.complimentary ? 1 : 0,
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
