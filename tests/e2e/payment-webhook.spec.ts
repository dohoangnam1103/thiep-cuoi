import { createHmac } from "node:crypto";

import { test, expect } from "@playwright/test";

import { getDb, prismaNow } from "./helpers/db";
import { createUser, createInvitation, createPayment, cleanupUser } from "./helpers/fixtures";

// Must match webServer env CASSO_WEBHOOK_TOKEN in playwright.config.ts.
const CHECKSUM_KEY = "e2e-casso-token";
const WEBHOOK_PATH = "/api/casso/webhook";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// Mirror of sortObjDataByKey in src/lib/payment.ts — the route signs over the
// key-sorted JSON, so the test must sign the identical message.
function sortObjDataByKey(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortObjDataByKey);
  }
  if (value !== null && typeof value === "object") {
    const sorted: { [key: string]: JsonValue } = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortObjDataByKey(value[key]);
    }
    return sorted;
  }
  return value;
}

/** Build a valid `X-Casso-Signature` header for a body. */
function signCasso(body: JsonValue, key = CHECKSUM_KEY): string {
  const timestamp = String(Date.now());
  const message = `${timestamp}.${JSON.stringify(sortObjDataByKey(body))}`;
  const signature = createHmac("sha512", key).update(message).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

type CassoBody = { error?: number; data: { id?: number; description?: string; amount?: number } };

function cassoBody(description: string, amount: number): CassoBody {
  return { error: 0, data: { id: 1, description, amount } };
}

function getPayment(code: string): { status: string; paidAt: string | null } | undefined {
  return getDb().prepare(`SELECT status, paidAt FROM Payment WHERE code = ?`).get(code) as
    | { status: string; paidAt: string | null }
    | undefined;
}

function getInvitationPaid(id: string): number | undefined {
  const row = getDb().prepare(`SELECT paid FROM Invitation WHERE id = ?`).get(id) as
    | { paid: number }
    | undefined;
  return row?.paid;
}

test.describe("Casso webhook", () => {
  test("rejects request with no signature header → 401", async ({ request }) => {
    const res = await request.post(WEBHOOK_PATH, { data: cassoBody("CDABC234", 150000) });
    expect(res.status()).toBe(401);
  });

  test("rejects request with wrong signature → 401", async ({ request }) => {
    const body = cassoBody("CDABC234", 150000);
    const res = await request.post(WEBHOOK_PATH, {
      headers: { "x-casso-signature": signCasso(body, "wrong-key") },
      data: body,
    });
    expect(res.status()).toBe(401);
  });

  test("valid webhook matching pending payment → marks paid + invitation.paid", async ({ request }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const { code } = createPayment(inv.id, { code: "CDPAY234", amount: 150000, status: "pending" });

      const body = cassoBody(`CK chuyen tien ${code} thanh toan`, 150000);
      const res = await request.post(WEBHOOK_PATH, {
        headers: { "x-casso-signature": signCasso(body) },
        data: body,
      });

      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual({ success: true });

      const payment = getPayment(code);
      expect(payment?.status).toBe("paid");
      expect(payment?.paidAt).not.toBeNull();
      expect(getInvitationPaid(inv.id)).toBe(1);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("matches code case-insensitively inside description", async ({ request }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const { code } = createPayment(inv.id, { code: "CDXYZ567", amount: 150000, status: "pending" });

      const body = cassoBody(`noi dung ${code.toLowerCase()} het`, 200000);
      const res = await request.post(WEBHOOK_PATH, {
        headers: { "x-casso-signature": signCasso(body) },
        data: body,
      });

      expect(res.status()).toBe(200);
      expect(getPayment(code)?.status).toBe("paid");
      expect(getInvitationPaid(inv.id)).toBe(1);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("valid signature but non-existent code → success, no crash", async ({ request }) => {
    const body = cassoBody("thanh toan CDZZZZ22 khong ton tai", 150000);
    const res = await request.post(WEBHOOK_PATH, {
      headers: { "x-casso-signature": signCasso(body) },
      data: body,
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  test("description without an order code → success, no payment changed", async ({ request }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const { code } = createPayment(inv.id, { code: "CDNONE23", amount: 150000, status: "pending" });

      const body = cassoBody("chuyen khoan khong co ma don", 150000);
      const res = await request.post(WEBHOOK_PATH, {
        headers: { "x-casso-signature": signCasso(body) },
        data: body,
      });

      expect(res.status()).toBe(200);
      expect(getPayment(code)?.status).toBe("pending");
      expect(getInvitationPaid(inv.id)).toBe(0);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("received amount below payment amount → stays pending", async ({ request }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const { code } = createPayment(inv.id, { code: "CDLOW234", amount: 150000, status: "pending" });

      const body = cassoBody(`thanh toan ${code}`, 100000);
      const res = await request.post(WEBHOOK_PATH, {
        headers: { "x-casso-signature": signCasso(body) },
        data: body,
      });

      expect(res.status()).toBe(200);
      expect(getPayment(code)?.status).toBe("pending");
      expect(getInvitationPaid(inv.id)).toBe(0);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("already-paid payment is not double-processed", async ({ request }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id, { paid: true });
      const { code } = createPayment(inv.id, { code: "CDPAID23", amount: 150000, status: "paid" });

      const body = cassoBody(`thanh toan lai ${code}`, 150000);
      const res = await request.post(WEBHOOK_PATH, {
        headers: { "x-casso-signature": signCasso(body) },
        data: body,
      });

      expect(res.status()).toBe(200);
      // paidAt was never set for this fixture; if reprocessed it would be filled.
      const payment = getPayment(code);
      expect(payment?.status).toBe("paid");
      expect(payment?.paidAt).toBeNull();
    } finally {
      cleanupUser(user.id);
    }
  });

  test("expired pending payment is not flipped by webhook", async ({ request }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const { code, id: payId } = createPayment(inv.id, {
        code: "CDEXPI23",
        amount: 150000,
        status: "pending",
      });
      // Backdate createdAt beyond the 24h pending window.
      const stale = new Date(Date.now() - 48 * 60 * 60 * 1000);
      getDb().prepare(`UPDATE Payment SET createdAt = ? WHERE id = ?`).run(prismaNow(stale), payId);

      const body = cassoBody(`thanh toan ${code}`, 150000);
      const res = await request.post(WEBHOOK_PATH, {
        headers: { "x-casso-signature": signCasso(body) },
        data: body,
      });

      expect(res.status()).toBe(200);
      expect(getPayment(code)?.status).toBe("pending");
      expect(getInvitationPaid(inv.id)).toBe(0);
    } finally {
      cleanupUser(user.id);
    }
  });
});

test.describe("Payment status polling", () => {
  test("pending payment → { status: 'pending' }", async ({ request }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const { code } = createPayment(inv.id, { code: "CDSTAT23", status: "pending" });

      const res = await request.get(`/api/payment/${code}/status`);
      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual({ status: "pending" });
    } finally {
      cleanupUser(user.id);
    }
  });

  test("after webhook marks paid → { status: 'paid' }", async ({ request }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const { code } = createPayment(inv.id, { code: "CDDONE23", amount: 150000, status: "pending" });

      const body = cassoBody(`thanh toan ${code}`, 150000);
      const webhook = await request.post(WEBHOOK_PATH, {
        headers: { "x-casso-signature": signCasso(body) },
        data: body,
      });
      expect(webhook.status()).toBe(200);

      const res = await request.get(`/api/payment/${code}/status`);
      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual({ status: "paid" });
    } finally {
      cleanupUser(user.id);
    }
  });

  test("expired pending payment → { status: 'expired' }", async ({ request }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const { code, id: payId } = createPayment(inv.id, { code: "CDXPST23", status: "pending" });
      const stale = new Date(Date.now() - 48 * 60 * 60 * 1000);
      getDb().prepare(`UPDATE Payment SET createdAt = ? WHERE id = ?`).run(prismaNow(stale), payId);

      const res = await request.get(`/api/payment/${code}/status`);
      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual({ status: "expired" });
    } finally {
      cleanupUser(user.id);
    }
  });

  test("unknown code → 404", async ({ request }) => {
    const res = await request.get(`/api/payment/CDNOPE22/status`);
    expect(res.status()).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });
});
