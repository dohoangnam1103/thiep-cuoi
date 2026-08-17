import { createHmac } from "node:crypto";

import { expect, test } from "@playwright/test";

import { cleanupUser, createInvitation, createPayment, createUser } from "./helpers/fixtures";
import { getDb } from "./helpers/db";

const CHECKSUM_KEY = "e2e-payos-checksum";
const WEBHOOK_PATH = "/api/payos/webhook";

type PayosData = {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId: string;
  counterAccountBankName: string;
  counterAccountName: string;
  counterAccountNumber: string;
  virtualAccountName: string;
  virtualAccountNumber: string;
};

function sign(data: PayosData, key = CHECKSUM_KEY): string {
  const message = Object.keys(data)
    .sort()
    .map((field) => `${field}=${String(data[field as keyof PayosData] ?? "")}`)
    .join("&");
  return createHmac("sha256", key).update(message).digest("hex");
}

function webhookData(orderCode: number, amount: number): PayosData {
  return {
    orderCode,
    amount,
    description: "CDPAY234",
    accountNumber: "0357596289",
    reference: `FT-${orderCode}`,
    transactionDateTime: "2026-07-20 18:00:00",
    currency: "VND",
    paymentLinkId: `link-${orderCode}`,
    code: "00",
    desc: "Thành công",
    counterAccountBankId: "",
    counterAccountBankName: "",
    counterAccountName: "",
    counterAccountNumber: "",
    virtualAccountName: "",
    virtualAccountNumber: "",
  };
}

function paymentStatus(code: string): string | undefined {
  const row = getDb().prepare(`SELECT status FROM Payment WHERE code = ?`).get(code) as
    | { status: string }
    | undefined;
  return row?.status;
}

test.describe("payOS webhook", () => {
  test("rejects an invalid signature", async ({ request }) => {
    const data = webhookData(123456, 150000);
    const response = await request.post(WEBHOOK_PATH, {
      data: {
        code: "00",
        desc: "success",
        success: true,
        data,
        signature: sign(data, "wrong-key"),
      },
    });
    expect(response.status()).toBe(401);
  });

  test("marks the matching payOS payment and invitation as paid", async ({ request }) => {
    const user = createUser();
    try {
      const invitation = createInvitation(user.id);
      const orderCode = 987654321;
      const { code } = createPayment(invitation.id, {
        code: "CDPAY234",
        amount: 150000,
        provider: "payos",
        providerOrderCode: String(orderCode),
      });
      const data = webhookData(orderCode, 150000);

      const response = await request.post(WEBHOOK_PATH, {
        data: {
          code: "00",
          desc: "success",
          success: true,
          data,
          signature: sign(data),
        },
      });

      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(paymentStatus(code)).toBe("paid");
      const paid = getDb().prepare(`SELECT paid FROM Invitation WHERE id = ?`).get(invitation.id) as {
        paid: number;
      };
      expect(paid.paid).toBe(1);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("accepts payOS webhook verification samples without changing an order", async ({ request }) => {
    const data = webhookData(111222333, 3000);
    const response = await request.post(WEBHOOK_PATH, {
      data: {
        code: "00",
        desc: "success",
        success: true,
        data,
        signature: sign(data),
      },
    });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ success: true });
  });

  test("superseded payOS payment cannot activate an invitation", async ({ request }) => {
    const user = createUser();
    try {
      const invitation = createInvitation(user.id);
      const orderCode = 987_654_399;
      const { code } = createPayment(invitation.id, {
        code: "CDSUPR99",
        amount: 150_000,
        provider: "payos",
        providerOrderCode: String(orderCode),
        status: "superseded",
      });
      const data = webhookData(orderCode, 150_000);

      const response = await request.post(WEBHOOK_PATH, {
        data: {
          code: "00",
          desc: "success",
          success: true,
          data,
          signature: sign(data),
        },
      });

      expect(response.status()).toBe(200);
      expect(paymentStatus(code)).toBe("superseded");
      const row = getDb()
        .prepare("SELECT paid FROM Invitation WHERE id = ?")
        .get(invitation.id) as { paid: number };
      expect(row.paid).toBe(0);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("legacy voucher-cancelled payOS payment still settles", async ({ request }) => {
    const user = createUser();
    try {
      const invitation = createInvitation(user.id);
      const orderCode = 987_654_397;
      const { code } = createPayment(invitation.id, {
        code: "CDLGCY97",
        amount: 130_000,
        provider: "payos",
        providerOrderCode: String(orderCode),
        status: "cancelled",
        voucherCode: "LEGACY20",
      });
      const data = webhookData(orderCode, 130_000);

      const response = await request.post(WEBHOOK_PATH, {
        data: {
          code: "00",
          desc: "success",
          success: true,
          data,
          signature: sign(data),
        },
      });

      expect(response.status()).toBe(200);
      expect(paymentStatus(code)).toBe("paid");
      const row = getDb()
        .prepare("SELECT paid FROM Invitation WHERE id = ?")
        .get(invitation.id) as { paid: number };
      expect(row.paid).toBe(1);
    } finally {
      cleanupUser(user.id);
    }
  });
});
