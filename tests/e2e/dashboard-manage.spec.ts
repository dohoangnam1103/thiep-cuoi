import { randomUUID } from "node:crypto";

import { test, expect } from "@playwright/test";

import { loginAsUser } from "./helpers/auth";
import { getDb, prismaNow } from "./helpers/db";
import {
  cleanupUser,
  createGuest,
  createInvitation,
  createPayment,
  createUser,
  publishInvitation,
} from "./helpers/fixtures";

type GuestRow = { id: string; token: string; name: string };
type PaymentRow = {
  id: string;
  code: string;
  amount: number;
  status: string;
  voucherCode: string | null;
};

function seedRsvp(
  invitationId: string,
  overrides: Partial<{
    name: string;
    attending: boolean;
    guests: number;
    side: string | null;
    message: string | null;
  }> = {},
): string {
  const db = getDb();
  const rsvpId = `r${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  db.prepare(
    `INSERT INTO Rsvp (id, invitationId, name, attending, guests, side, message, shuttle, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    rsvpId,
    invitationId,
    overrides.name ?? "Khách RSVP",
    overrides.attending === false ? 0 : 1,
    overrides.guests ?? 1,
    overrides.side ?? null,
    overrides.message ?? null,
    0,
    prismaNow(),
  );
  return rsvpId;
}

function guestsOf(invitationId: string): GuestRow[] {
  return getDb()
    .prepare(`SELECT id, token, name FROM Guest WHERE invitationId = ?`)
    .all(invitationId) as GuestRow[];
}

function paymentsOf(invitationId: string): PaymentRow[] {
  return getDb()
    .prepare(`SELECT id, code, amount, status, voucherCode FROM Payment WHERE invitationId = ?`)
    .all(invitationId) as PaymentRow[];
}

function createVoucher(input: {
  amountOff: number;
  active: boolean;
}): { id: string; code: string } {
  const id = `v-${randomUUID()}`;
  const code = `E2E${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  getDb()
    .prepare(
      `INSERT INTO Voucher (id, code, amountOff, active, usedCount, createdAt)
       VALUES (?, ?, ?, ?, 0, ?)`,
    )
    .run(id, code, input.amountOff, input.active ? 1 : 0, prismaNow());
  return { id, code };
}

function cleanupVoucher(code: string): void {
  getDb().prepare(`DELETE FROM Voucher WHERE code = ?`).run(code);
}

function latestPaymentOf(invitationId: string): {
  id: string;
  amount: number;
  voucherCode: string | null;
  status: string;
} {
  return getDb()
    .prepare(
      `SELECT id, amount, voucherCode, status FROM Payment
       WHERE invitationId = ? ORDER BY createdAt DESC, id DESC LIMIT 1`,
    )
    .get(invitationId) as {
    id: string;
    amount: number;
    voucherCode: string | null;
    status: string;
  };
}

test.describe("dashboard guests", () => {
  test("guest list renders with heading and stats", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id);
    publishInvitation(inv.id);
    try {
      await loginAsUser(context, user.id);
      const res = await page.goto(`/dashboard/${inv.id}/guests`);
      expect(res?.ok()).toBeTruthy();
      await expect(page.getByRole("heading", { name: "Khách mời" })).toBeVisible();
      await expect(page.getByText("Tổng khách mời")).toBeVisible();
    } finally {
      cleanup(user.id);
    }
  });

  test("seeded guests appear in the list", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id);
    publishInvitation(inv.id);
    createGuest(inv.id, "Trần Thị Seed");
    createGuest(inv.id, "Lê Văn Seed");
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/guests`);
      await expect(page.getByText("Trần Thị Seed")).toBeVisible();
      await expect(page.getByText("Lê Văn Seed")).toBeVisible();
    } finally {
      cleanup(user.id);
    }
  });

  test("draft (unpublished) invitation shows publish-first warning, no add form", async ({
    page,
    context,
  }) => {
    const user = createUser();
    const inv = createInvitation(user.id); // draft, no slug
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/guests`);
      await expect(page.getByText(/chưa được xuất bản/i)).toBeVisible();
      await expect(page.getByPlaceholder("Tên khách*")).toHaveCount(0);
    } finally {
      cleanup(user.id);
    }
  });

  test("adding a guest through the UI persists to DB and shows in list", async ({
    page,
    context,
  }) => {
    const user = createUser();
    const inv = createInvitation(user.id);
    publishInvitation(inv.id);
    const name = `UI Khách ${randomUUID().slice(0, 6)}`;
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/guests`);
      await page.getByPlaceholder("Tên khách*").fill(name);
      await page.getByPlaceholder("Vai (anh, chị, bạn...)").fill("bạn");
      await page.getByRole("button", { name: /Thêm khách/ }).click();

      await expect(page.getByText(name)).toBeVisible();

      await expect
        .poll(() => guestsOf(inv.id).some((g) => g.name === name))
        .toBeTruthy();
      const row = guestsOf(inv.id).find((g) => g.name === name);
      expect(row?.token).toBeTruthy();
    } finally {
      cleanup(user.id);
    }
  });

  test("each guest has a unique share token surfaced as a link", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id);
    publishInvitation(inv.id);
    const g = createGuest(inv.id, "Token Khách");
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/guests`);
      // Zalo/Messenger anchors embed the per-guest link (…?g=<token>).
      await expect(page.locator(`a[href*="${g.token}"]`).first()).toBeVisible();

      const tokens = guestsOf(inv.id).map((r) => r.token);
      expect(new Set(tokens).size).toBe(tokens.length);
    } finally {
      cleanup(user.id);
    }
  });

  test("non-owner cannot access guests page (404)", async ({ page, context }) => {
    const owner = createUser();
    const other = createUser();
    const inv = createInvitation(owner.id);
    publishInvitation(inv.id);
    try {
      await loginAsUser(context, other.id);
      // ownInvitation() → notFound() streams the 404 UI, but an RSC client
      // navigation still resolves HTTP 200. Assert the rendered 404, not status.
      await page.goto(`/dashboard/${inv.id}/guests`);
      await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    } finally {
      cleanup(owner.id);
      cleanup(other.id);
    }
  });
});

test.describe("dashboard rsvp", () => {
  test("rsvp page renders with heading and empty state", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id);
    try {
      await loginAsUser(context, user.id);
      const res = await page.goto(`/dashboard/${inv.id}/rsvp`);
      expect(res?.ok()).toBeTruthy();
      await expect(page.getByRole("heading", { name: "Xác nhận tham dự" })).toBeVisible();
      await expect(page.getByText("Chưa có phản hồi nào.")).toBeVisible();
    } finally {
      cleanup(user.id);
    }
  });

  test("seeded rsvp rows appear in the response table", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id);
    seedRsvp(inv.id, { name: "Rsvp Có Đi", attending: true, guests: 2, side: "Nhà trai" });
    seedRsvp(inv.id, { name: "Rsvp Không Đi", attending: false });
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/rsvp`);
      await expect(page.getByText("Rsvp Có Đi")).toBeVisible();
      await expect(page.getByText("Rsvp Không Đi")).toBeVisible();
    } finally {
      cleanup(user.id);
    }
  });

  test("attending / declined counts reflect seeded data", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id);
    seedRsvp(inv.id, { name: "A", attending: true, guests: 2, side: "Nhà trai" });
    seedRsvp(inv.id, { name: "B", attending: true, guests: 3, side: "Nhà gái" });
    seedRsvp(inv.id, { name: "C", attending: false });
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/rsvp`);

      const statValue = (label: string) =>
        page
          .locator("div.rounded-2xl", { has: page.getByText(label, { exact: true }) })
          .locator("p.text-2xl");
      await expect(statValue("Sẽ tham dự")).toHaveText("2");
      await expect(statValue("Không tham dự")).toHaveText("1");
      await expect(statValue("Tổng khách")).toHaveText("5");
    } finally {
      cleanup(user.id);
    }
  });

  test("non-owner cannot access rsvp page (404)", async ({ page, context }) => {
    const owner = createUser();
    const other = createUser();
    const inv = createInvitation(owner.id);
    seedRsvp(inv.id, { name: "Secret" });
    try {
      await loginAsUser(context, other.id);
      await page.goto(`/dashboard/${inv.id}/rsvp`);
      await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    } finally {
      cleanup(owner.id);
      cleanup(other.id);
    }
  });
});

test.describe("dashboard thanh-toan (payment)", () => {
  test("unpaid invitation: page creates a pending payment and shows QR + default price", async ({
    page,
    context,
  }) => {
    const user = createUser();
    const inv = createInvitation(user.id); // unpaid draft
    try {
      await loginAsUser(context, user.id);
      const res = await page.goto(`/dashboard/${inv.id}/thanh-toan`);
      expect(res?.ok()).toBeTruthy();
      await expect(page.getByRole("heading", { name: "Thanh toán" })).toBeVisible();
      // QR image rendered by PaymentPanel.
      await expect(page.getByAltText("Mã QR chuyển khoản VietQR")).toBeVisible();
      // Default price 150000 → vi-VN "150.000đ".
      await expect(page.getByText("150.000đ")).toBeVisible();

      // A Payment row was created server-side by createOrGetPayment.
      await expect.poll(() => paymentsOf(inv.id).length).toBe(1);
      const [pay] = paymentsOf(inv.id);
      expect(pay.status).toBe("pending");
      expect(pay.amount).toBe(150000);
      // The transfer content (code) is shown on the page.
      await expect(page.getByText(pay.code, { exact: true })).toBeVisible();
    } finally {
      cleanup(user.id);
    }
  });

  test("existing non-expired pending payment is reused, not duplicated", async ({
    page,
    context,
  }) => {
    const user = createUser();
    const inv = createInvitation(user.id);
    const seeded = createPayment(inv.id, { status: "pending", amount: 150000 });
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/thanh-toan`);
      await expect(page.getByText(seeded.code, { exact: true })).toBeVisible();
      // Still exactly one payment — the seeded one was reused.
      expect(paymentsOf(inv.id).length).toBe(1);
    } finally {
      cleanup(user.id);
    }
  });

  test("admin final price is used for the next payment", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id, { adminPriceOverride: 79_000 });
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/thanh-toan`);

      await expect(page.getByText("79.000đ", { exact: true })).toBeVisible();
      await expect(page.getByPlaceholder("Mã giảm giá")).toHaveCount(0);
      await expect.poll(() => paymentsOf(inv.id).length).toBe(1);
      expect(paymentsOf(inv.id).at(-1)?.amount).toBe(79_000);
    } finally {
      cleanup(user.id);
    }
  });

  test("complimentary invitation creates no payment", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id, {
      paid: false,
      adminPriceOverride: 0,
      complimentary: true,
    });
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/thanh-toan`);

      await expect(
        page.getByRole("heading", { name: "Được tặng miễn phí", exact: true }),
      ).toBeVisible();
      expect(paymentsOf(inv.id).length).toBe(0);
    } finally {
      cleanup(user.id);
    }
  });

  test("a regular voucher still applies and returns updated payment info", async ({
    page,
    context,
  }) => {
    const user = createUser();
    const inv = createInvitation(user.id);
    const voucher = createVoucher({ amountOff: 20_000, active: true });
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/thanh-toan`);
      await page.getByPlaceholder("Mã giảm giá").fill(voucher.code);
      await page.getByRole("button", { name: "Áp mã", exact: true }).click();

      await expect(page.getByText("130.000đ", { exact: true })).toBeVisible();
      expect(latestPaymentOf(inv.id)).toMatchObject({
        amount: 130_000,
        voucherCode: voucher.code,
      });
    } finally {
      cleanup(user.id);
      cleanupVoucher(voucher.code);
    }
  });

  test("a stale voucher form rejects an admin final price without mutating payment", async ({
    page,
    context,
  }) => {
    const user = createUser();
    const inv = createInvitation(user.id);
    const voucher = createVoucher({ amountOff: 20_000, active: true });
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/thanh-toan`);
      await expect(page.getByPlaceholder("Mã giảm giá")).toBeVisible();
      const before = latestPaymentOf(inv.id);

      getDb()
        .prepare(
          `UPDATE Invitation SET adminPriceOverride = ?, updatedAt = ? WHERE id = ?`,
        )
        .run(79_000, prismaNow(), inv.id);
      await page.getByPlaceholder("Mã giảm giá").fill(voucher.code);
      await page.getByRole("button", { name: "Áp mã", exact: true }).click();

      await expect(
        page.getByText("Thiệp đã có giá ưu đãi riêng.", { exact: true }),
      ).toBeVisible();
      expect(latestPaymentOf(inv.id)).toMatchObject({
        id: before.id,
        amount: before.amount,
        status: "pending",
        voucherCode: null,
      });
    } finally {
      cleanup(user.id);
      cleanupVoucher(voucher.code);
    }
  });

  test("paid invitation shows the already-paid state, no QR", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id, { paid: true });
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/thanh-toan`);
      await expect(page.getByRole("heading", { name: "Đã thanh toán" })).toBeVisible();
      await expect(page.getByAltText("Mã QR chuyển khoản VietQR")).toHaveCount(0);
      // No payment row is created for an already-paid invitation.
      expect(paymentsOf(inv.id).length).toBe(0);
    } finally {
      cleanup(user.id);
    }
  });

  test("non-owner cannot access payment page (404)", async ({ page, context }) => {
    const owner = createUser();
    const other = createUser();
    const inv = createInvitation(owner.id);
    try {
      await loginAsUser(context, other.id);
      await page.goto(`/dashboard/${inv.id}/thanh-toan`);
      await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
      // No payment created for a blocked request.
      expect(paymentsOf(inv.id).length).toBe(0);
    } finally {
      cleanup(owner.id);
      cleanup(other.id);
    }
  });
});

// Local alias so intent reads clearly; cleanupUser cascades to
// guests / rsvps / payments via FK.
function cleanup(userId: string): void {
  cleanupUser(userId);
}
