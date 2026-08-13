import { test, expect } from "@playwright/test";

import { getDb, prismaNow } from "./helpers/db";
import {
  createUser,
  createInvitation,
  createPayment,
  cleanupUser,
  invitationCountFor,
  invitationPriceState,
  paymentStatusById,
  auditCountForUser,
  auditCountForInvitation,
  getInvitation,
  getLatestAudit,
  seedAdmin,
  seededAdminId,
  deleteAdmin,
} from "./helpers/fixtures";
import { loginAsAdmin, loginAsUser } from "./helpers/auth";

test.describe("admin: user invitation support", () => {
  test("non-super admin can search users and open a support profile", async ({ page, context }) => {
    const user = createUser();
    const admin = seedAdmin(false);
    try {
      createInvitation(user.id);
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/users?q=${encodeURIComponent(user.email)}`);
      await page.getByRole("link", { name: user.email }).click();
      await expect(page).toHaveURL(new RegExp(`/admin/users/${user.id}$`));
      await expect(page.getByRole("heading", { name: user.email })).toBeVisible();
      await expect(page.getByText("Thiệp của người dùng")).toBeVisible();
    } finally {
      getDb().prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ? OR targetUserEmail = ?")
        .run(user.id, user.email);
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });

  test("user session cannot open an admin support profile", async ({ page, context }) => {
    const user = createUser();
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/admin/users/${user.id}`);
      await page.waitForURL("**/admin/login");
    } finally {
      cleanupUser(user.id);
    }
  });

  test("system user is not exposed by the admin customer list", async ({ page, context }) => {
    await loginAsAdmin(context, seededAdminId());
    await page.goto("/admin/users?q=system%40demo.local");
    await expect(page.getByText("system@demo.local")).toHaveCount(0);
  });

  test("non-super admin creates an invitation for the selected user with an audit log", async ({ page, context }) => {
    const user = createUser();
    const admin = seedAdmin(false);
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/users/${user.id}`);
      await page.getByRole("button", { name: "Tạo thiệp mới" }).click();
      await page.locator('button[data-template-id="song-hy-red"]').click();
      await expect(page).toHaveURL(/\/admin\/invitations\/[^/]+\/edit$/);
      const invitation = getDb()
        .prepare("SELECT id, userId, templateId FROM Invitation WHERE userId = ? ORDER BY createdAt DESC")
        .get(user.id) as { id: string; userId: string; templateId: string };
      expect(invitation.userId).toBe(user.id);
      expect(invitation.templateId).toBe("song-hy-red");
      const audit = getDb()
        .prepare("SELECT adminId, action FROM AdminAuditLog WHERE invitationId = ?")
        .get(invitation.id) as { adminId: string; action: string };
      expect(audit).toEqual({ adminId: admin.id, action: "INVITATION_CREATED_FOR_USER" });
    } finally {
      getDb().prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ? OR targetUserEmail = ?")
        .run(user.id, user.email);
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });

  test("admin final price supersedes pending payment and records the actor", async ({ page, context }) => {
    const user = createUser();
    const admin = seedAdmin(false);
    const invitation = createInvitation(user.id);
    const oldPayment = createPayment(invitation.id, { status: "pending", amount: 150_000 });
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/users/${user.id}`);
      await page.getByRole("button", { name: "Đặt giá" }).click();
      await page.getByLabel("Giá cuối cùng (VND)").fill("79000");
      await page.getByRole("button", { name: "Lưu giá" }).click();

      await expect.poll(() => getInvitation(invitation.id).adminPriceOverride).toBe(79_000);
      const payment = getDb().prepare("SELECT status FROM Payment WHERE id = ?").get(oldPayment.id) as {
        status: string;
      };
      expect(payment.status).toBe("superseded");
      expect(getLatestAudit(invitation.id)).toMatchObject({
        adminId: admin.id,
        action: "PRICE_OVERRIDE_SET",
      });
    } finally {
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });

  test("admin grants complimentary access without creating revenue", async ({ page, context }) => {
    const user = createUser();
    const admin = seedAdmin(false);
    const invitation = createInvitation(user.id);
    const db = getDb();
    const revenue = () => (db
      .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM Payment WHERE status = 'paid'")
      .get() as { total: number }).total;
    const invitationPaymentCount = () => (db
      .prepare("SELECT COUNT(*) AS count FROM Payment WHERE invitationId = ?")
      .get(invitation.id) as { count: number }).count;
    const revenueBefore = revenue();
    const paymentsBefore = invitationPaymentCount();

    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/users/${user.id}`);
      await page.getByRole("button", { name: "Đặt giá" }).click();
      await page.getByLabel("Giá cuối cùng (VND)").fill("0");
      page.once("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: "Lưu giá" }).click();

      await expect.poll(() => db
        .prepare("SELECT paid, complimentary, adminPriceOverride FROM Invitation WHERE id = ?")
        .get(invitation.id)).toEqual({ paid: 0, complimentary: 1, adminPriceOverride: 0 });
      expect(invitationPaymentCount()).toBe(paymentsBefore);
      expect(revenue()).toBe(revenueBefore);
      expect(db.prepare(`
        SELECT action, adminId FROM AdminAuditLog
        WHERE invitationId = ?
        ORDER BY createdAt, id
      `).all(invitation.id)).toEqual([
        { action: "PRICE_OVERRIDE_SET", adminId: admin.id },
        { action: "COMPLIMENTARY_GRANTED", adminId: admin.id },
      ]);
    } finally {
      db.prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ? OR targetUserEmail = ?")
        .run(user.id, user.email);
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });

  for (const invalidPrice of ["", "1.5"] as const) {
    test(`invalid admin price ${JSON.stringify(invalidPrice)} changes nothing`, async ({ page, context }) => {
      const user = createUser();
      const admin = seedAdmin(false);
      const invitation = createInvitation(user.id);
      const pending = createPayment(invitation.id, { status: "pending", amount: 150_000 });
      const db = getDb();
      try {
        await loginAsAdmin(context, admin.id);
        await page.goto(`/admin/users/${user.id}`);
        await page.getByRole("button", { name: "Đặt giá" }).click();
        await page.getByLabel("Giá cuối cùng (VND)").fill(invalidPrice);
        await page.getByRole("button", { name: "Lưu giá" }).click();

        await expect(page.getByText("Giá cuối cùng phải là số nguyên từ 0 đến 100.000.000đ.")).toBeVisible();
        expect((db.prepare("SELECT adminPriceOverride FROM Invitation WHERE id = ?")
          .get(invitation.id) as { adminPriceOverride: number | null }).adminPriceOverride).toBeNull();
        expect((db.prepare("SELECT status FROM Payment WHERE id = ?")
          .get(pending.id) as { status: string }).status).toBe("pending");
        expect((db.prepare(`
          SELECT COUNT(*) AS count FROM AdminAuditLog
          WHERE invitationId = ? AND action IN ('PRICE_OVERRIDE_SET', 'COMPLIMENTARY_GRANTED')
        `).get(invitation.id) as { count: number }).count).toBe(0);
      } finally {
        db.prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ? OR targetUserEmail = ?")
          .run(user.id, user.email);
        deleteAdmin(admin.id);
        cleanupUser(user.id);
      }
    });
  }

  test("unauthenticated direct create submission changes nothing", async ({ page, context }) => {
    const user = createUser();
    const admin = seedAdmin(false);
    const before = invitationCountFor(user.id);
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/users/${user.id}`);
      await page.getByRole("button", { name: "Tạo thiệp mới" }).click();
      await context.clearCookies();
      await page.locator('button[data-template-id="song-hy-red"]').click();
      await page.waitForURL("**/admin/login");
      expect(invitationCountFor(user.id)).toBe(before);
      expect(auditCountForUser(user.id)).toBe(0);
    } finally {
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });

  test("unauthenticated direct price submission changes nothing", async ({ page, context }) => {
    const user = createUser();
    const admin = seedAdmin(false);
    const invitation = createInvitation(user.id);
    const payment = createPayment(invitation.id, { status: "pending" });
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/users/${user.id}`);
      await page.getByRole("button", { name: "Đặt giá" }).click();
      await page.getByLabel("Giá cuối cùng (VND)").fill("79000");
      await context.clearCookies();
      await page.getByRole("button", { name: "Lưu giá" }).click();
      await page.waitForURL("**/admin/login");
      expect(invitationPriceState(invitation.id)).toEqual({
        adminPriceOverride: null,
        complimentary: 0,
      });
      expect(paymentStatusById(payment.id)).toBe("pending");
      expect(auditCountForInvitation(invitation.id)).toBe(0);
    } finally {
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });

  test("route-bound user prevents cross-profile invitation price mutation", async ({ page, context }) => {
    const userA = createUser();
    const userB = createUser();
    const invitationA = createInvitation(userA.id);
    const invitationB = createInvitation(userB.id);
    const admin = seedAdmin(false);
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/users/${userA.id}`);
      await page.getByRole("button", { name: "Đặt giá" }).click();
      await page.locator('input[name="invitationId"]').evaluate((input, id) => {
        (input as HTMLInputElement).value = id;
      }, invitationB.id);
      await page.getByLabel("Giá cuối cùng (VND)").fill("79000");
      await page.getByRole("button", { name: "Lưu giá" }).click();
      await expect(page.getByText("Không tìm thấy thiệp.")).toBeVisible();
      expect(invitationPriceState(invitationA.id).adminPriceOverride).toBeNull();
      expect(invitationPriceState(invitationB.id).adminPriceOverride).toBeNull();
      expect(auditCountForInvitation(invitationA.id)).toBe(0);
      expect(auditCountForInvitation(invitationB.id)).toBe(0);
    } finally {
      deleteAdmin(admin.id);
      cleanupUser(userA.id);
      cleanupUser(userB.id);
    }
  });

  test("a payment race locks direct price mutation", async ({ page, context }) => {
    const user = createUser();
    const invitation = createInvitation(user.id);
    const payment = createPayment(invitation.id, { status: "pending" });
    const admin = seedAdmin(false);
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/users/${user.id}`);
      await page.getByRole("button", { name: "Đặt giá" }).click();
      await page.getByLabel("Giá cuối cùng (VND)").fill("79000");
      getDb().prepare("UPDATE Invitation SET paid = 1, updatedAt = ? WHERE id = ?")
        .run(prismaNow(), invitation.id);
      await page.getByRole("button", { name: "Lưu giá" }).click();
      await expect(page.getByText("Thiệp đã thanh toán nên không thể đổi giá.")).toBeVisible();
      expect(invitationPriceState(invitation.id).adminPriceOverride).toBeNull();
      expect(paymentStatusById(payment.id)).toBe("pending");
      expect(auditCountForInvitation(invitation.id)).toBe(0);
    } finally {
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });

  test("direct price action rejects an already-paid invitation without side effects", async ({ page, context }) => {
    const user = createUser();
    const invitation = createInvitation(user.id, { paid: true });
    const paid = createPayment(invitation.id, { status: "paid", amount: 150_000 });
    const admin = seedAdmin(false);
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/users/${user.id}`);
      const form = page.locator(`form[data-price-invitation-id="${invitation.id}"]`);
      await form.locator('input[name="finalPrice"]').evaluate((input) => {
        const element = input as HTMLInputElement;
        element.disabled = false;
        element.value = "79000";
      });
      await form.locator('button[type="submit"]').evaluate((button) => {
        (button as HTMLButtonElement).disabled = false;
      });
      await form.locator('button[type="submit"]').click();
      await expect(page.getByText("Thiệp đã thanh toán nên không thể đổi giá.")).toBeVisible();
      expect(invitationPriceState(invitation.id)).toEqual({
        adminPriceOverride: null,
        complimentary: 0,
      });
      expect(paymentStatusById(paid.id)).toBe("paid");
      expect(auditCountForInvitation(invitation.id)).toBe(0);
    } finally {
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });

  for (const isSuperAdmin of [false, true] as const) {
    test(`admin role parity (${isSuperAdmin ? "super" : "regular"}) creates and prices invitations identically`, async ({
      page,
      context,
    }) => {
      const user = createUser();
      const admin = seedAdmin(isSuperAdmin);
      const db = getDb();
      try {
        await loginAsAdmin(context, admin.id);
        await page.goto(`/admin/users/${user.id}`);
        await page.getByRole("button", { name: "Tạo thiệp mới" }).click();
        await page.locator('button[data-template-id="song-hy-red"]').click();
        await expect(page).toHaveURL(/\/admin\/invitations\/[^/]+\/edit$/);

        const invitation = db.prepare(`
          SELECT id FROM Invitation
          WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 1
        `).get(user.id) as { id: string };

        await page.goto(`/admin/users/${user.id}`);
        await page.getByRole("button", { name: "Đặt giá" }).click();
        await page.getByLabel("Giá cuối cùng (VND)").fill("79000");
        await page.getByRole("button", { name: "Lưu giá" }).click();
        await expect.poll(() => invitationPriceState(invitation.id)).toEqual({
          adminPriceOverride: 79_000,
          complimentary: 0,
        });

        await page.getByRole("button", { name: "Đặt giá" }).click();
        await page.getByLabel("Giá cuối cùng (VND)").fill("0");
        page.once("dialog", (dialog) => dialog.accept());
        await page.getByRole("button", { name: "Lưu giá" }).click();
        await expect.poll(() => invitationPriceState(invitation.id)).toEqual({
          adminPriceOverride: 0,
          complimentary: 1,
        });

        const audits = db.prepare(`
          SELECT action, adminId, adminEmail
          FROM AdminAuditLog WHERE invitationId = ?
          ORDER BY createdAt, id
        `).all(invitation.id) as {
          action: string;
          adminId: string | null;
          adminEmail: string;
        }[];
        expect(audits.map((row) => row.action)).toEqual([
          "INVITATION_CREATED_FOR_USER",
          "PRICE_OVERRIDE_SET",
          "PRICE_OVERRIDE_SET",
          "COMPLIMENTARY_GRANTED",
        ]);
        expect(audits.every((row) => (
          row.adminId === admin.id && row.adminEmail === admin.email
        ))).toBe(true);
      } finally {
        db.prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ? OR targetUserEmail = ?")
          .run(user.id, user.email);
        deleteAdmin(admin.id);
        cleanupUser(user.id);
      }
    });
  }
});
