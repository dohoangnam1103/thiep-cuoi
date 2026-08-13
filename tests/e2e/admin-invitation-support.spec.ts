import { randomUUID } from "node:crypto";

import { test, expect, type Page } from "@playwright/test";

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

type ContentSnapshot = Record<string, string | number | null>;
type InvitationSnapshot = Record<string, unknown>;
type AuditRow = {
  adminId: string | null;
  action: string;
  targetUserId: string | null;
  invitationId: string | null;
};

function invitationSnapshot(invitationId: string): InvitationSnapshot | undefined {
  return getDb()
    .prepare("SELECT * FROM Invitation WHERE id = ?")
    .get(invitationId) as InvitationSnapshot | undefined;
}

function contentSnapshot(invitationId: string): ContentSnapshot {
  const row = getDb()
    .prepare("SELECT * FROM InvitationContent WHERE invitationId = ?")
    .get(invitationId) as ContentSnapshot | undefined;
  return row ?? {};
}

function readContent(invitationId: string, column: string): string | null {
  const row = getDb()
    .prepare(`SELECT "${column}" AS value FROM InvitationContent WHERE invitationId = ?`)
    .get(invitationId) as { value: string | null } | undefined;
  return row?.value ?? null;
}

function auditRowsFor(invitationId: string): AuditRow[] {
  return getDb()
    .prepare(
      `SELECT adminId, action, targetUserId, invitationId FROM AdminAuditLog
       WHERE invitationId = ? ORDER BY createdAt, id`,
    )
    .all(invitationId) as AuditRow[];
}

function auditCount(invitationId: string): number {
  return (
    getDb()
      .prepare("SELECT COUNT(*) AS count FROM AdminAuditLog WHERE invitationId = ?")
      .get(invitationId) as { count: number }
  ).count;
}

function clearAuditFor(user: { id: string; email: string }): void {
  getDb()
    .prepare("DELETE FROM AdminAuditLog WHERE targetUserId = ? OR targetUserEmail = ?")
    .run(user.id, user.email);
}

async function fillPublishableDraft(page: Page): Promise<string> {
  const slug = `support-${randomUUID().slice(0, 8)}`;
  await page.locator("#brideFullName").fill("Nguyễn Mai");
  await page.locator("#groomFullName").fill("Trần Nam");
  await page.locator("#date").fill("2026-12-20");
  await page.locator("#time").fill("18:00");
  await page.locator("#slug").fill(slug);
  return slug;
}

/**
 * The editor binds every support action to the route invitation id. React
 * ships that bound id inside the multipart flight payload (field "0", e.g.
 * ["<id>","$undefined","$K1"]), so rewriting the POST body simulates a
 * tampered bound invocation against another invitation while the submitted
 * form still belongs to the opened one.
 */
function installBoundIdRewrite(page: Page, fromId: string, toId: string): Promise<{
  hits: () => number;
  uninstall: () => Promise<void>;
}> {
  let hits = 0;
  const pattern = "**/admin/invitations/*/edit";
  return page.route(pattern, async (route) => {
    const request = route.request();
    if (request.method() !== "POST") {
      await route.continue();
      return;
    }
    const body = request.postDataBuffer();
    const text = body?.toString("utf8") ?? "";
    if (!text.includes(`"${fromId}"`)) {
      await route.continue();
      return;
    }
    hits += 1;
    await route.continue({
      postData: Buffer.from(text.split(`"${fromId}"`).join(`"${toId}"`), "utf8"),
    });
  }).then(() => ({
    hits: () => hits,
    uninstall: () => page.unroute(pattern),
  }));
}

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

  for (const isSuperAdmin of [false, true] as const) {
    test(`${isSuperAdmin ? "super" : "non-super"} admin edits and publishes a customer invitation through the support editor`, async ({
      page,
      context,
    }) => {
      const user = createUser();
      const admin = seedAdmin(isSuperAdmin);
      const invitation = createInvitation(user.id);
      try {
        await loginAsAdmin(context, admin.id);
        await page.goto(`/admin/invitations/${invitation.id}/edit`);
        await expect(page.getByText(`Đang hỗ trợ tài khoản ${user.email}`)).toBeVisible();
        const userCookie = (await context.cookies()).find((cookie) => cookie.name === "session");
        expect(userCookie).toBeUndefined();

        const slug = await fillPublishableDraft(page);
        await page.getByRole("button", { name: "Xuất bản thiệp" }).click();

        await expect.poll(() => getInvitation(invitation.id).status).toBe("published");
        expect(getInvitation(invitation.id).slug).toBe(slug);
        expect(
          await page.evaluate(
            (id) => localStorage.getItem(`chungdoi:draft:${id}`),
            invitation.id,
          ),
        ).toBeNull();
        const audit = getLatestAudit(invitation.id);
        expect(audit?.adminId).toBe(admin.id);
        expect(audit?.action).toBe("INVITATION_PUBLISHED_BY_ADMIN");
      } finally {
        clearAuditFor(user);
        deleteAdmin(admin.id);
        cleanupUser(user.id);
      }
    });
  }

  test("support editor rejects demo and unknown invitation ids", async ({ page, context }) => {
    const user = createUser();
    const demo = createInvitation(user.id, { isDemo: true });
    try {
      await loginAsAdmin(context, seededAdminId());
      for (const id of [demo.id, `missing-${randomUUID()}`]) {
        const response = await page.goto(`/admin/invitations/${id}/edit`);
        expect(response?.status()).toBe(404);
        await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
      }
    } finally {
      cleanupUser(user.id);
    }
  });

  test("unauthenticated support save keeps invitation content and audit unchanged", async ({
    page,
    context,
  }) => {
    const user = createUser();
    const admin = seedAdmin(false);
    const invitation = createInvitation(user.id);
    const invitationBefore = invitationSnapshot(invitation.id);
    const contentBefore = contentSnapshot(invitation.id);
    const auditBefore = auditCount(invitation.id);
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/invitations/${invitation.id}/edit`);
      await expect(page.locator("#brideFullName")).toBeVisible();
      await page.locator("#brideFullName").fill("Nguyễn Mai");
      await page.locator("#groomFullName").fill("Trần Nam");
      await context.clearCookies();
      await page.getByRole("button", { name: "Lưu bản nháp" }).click();
      await page.waitForURL("**/admin/login");
      expect(invitationSnapshot(invitation.id)).toEqual(invitationBefore);
      expect(contentSnapshot(invitation.id)).toEqual(contentBefore);
      expect(auditCount(invitation.id)).toBe(auditBefore);
    } finally {
      clearAuditFor(user);
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });

  test("unauthenticated support publish keeps slug, status, content and audit unchanged", async ({
    page,
    context,
  }) => {
    const user = createUser();
    const admin = seedAdmin(false);
    const invitation = createInvitation(user.id);
    const invitationBefore = invitationSnapshot(invitation.id);
    const contentBefore = contentSnapshot(invitation.id);
    const auditBefore = auditCount(invitation.id);
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/invitations/${invitation.id}/edit`);
      await expect(page.locator("#brideFullName")).toBeVisible();
      await fillPublishableDraft(page);
      await context.clearCookies();
      await page.getByRole("button", { name: "Xuất bản thiệp" }).click();
      await page.waitForURL("**/admin/login");
      expect(invitationSnapshot(invitation.id)).toEqual(invitationBefore);
      expect(contentSnapshot(invitation.id)).toEqual(contentBefore);
      expect(auditCount(invitation.id)).toBe(auditBefore);
    } finally {
      clearAuditFor(user);
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });

  test("tampered hidden templateId is rejected without writes or audit", async ({
    page,
    context,
  }) => {
    const user = createUser();
    const admin = seedAdmin(false);
    const invitation = createInvitation(user.id);
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/invitations/${invitation.id}/edit`);
      await expect(page.locator("#brideFullName")).toBeVisible();
      await page.locator("#brideFullName").fill("Nguyễn Mai");
      // The templateId hidden input is React-controlled, so tamper the wire:
      // rewrite the submitted template slug to a non-allowlist value.
      await page.route("**/admin/invitations/*/edit", async (route) => {
        const request = route.request();
        if (request.method() !== "POST") {
          await route.continue();
          return;
        }
        const body = request.postDataBuffer();
        const text = body?.toString("utf8") ?? "";
        if (!text.includes("song-hy-red")) {
          await route.continue();
          return;
        }
        await route.continue({
          postData: Buffer.from(text.split("song-hy-red").join("not-a-template"), "utf8"),
        });
      });
      const invitationBefore = invitationSnapshot(invitation.id);
      const contentBefore = contentSnapshot(invitation.id);
      const auditBefore = auditCount(invitation.id);
      await page.getByRole("button", { name: "Lưu bản nháp" }).click();
      await expect(page.getByText("Dữ liệu không hợp lệ.")).toBeVisible();
      expect(invitationSnapshot(invitation.id)).toEqual(invitationBefore);
      expect(contentSnapshot(invitation.id)).toEqual(contentBefore);
      expect(auditCount(invitation.id)).toBe(auditBefore);
      expect(getInvitation(invitation.id).templateId).toBe("song-hy-red");
    } finally {
      clearAuditFor(user);
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });

  test("slug and map wrappers re-authenticate at invocation time", async ({ page, context }) => {
    const user = createUser();
    const admin = seedAdmin(false);
    const invitation = createInvitation(user.id);
    const invitationBefore = invitationSnapshot(invitation.id);
    const contentBefore = contentSnapshot(invitation.id);
    const auditBefore = auditCount(invitation.id);
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/invitations/${invitation.id}/edit`);
      await expect(page.locator("#slug")).toBeVisible();
      await page.locator("#slug").fill("duong-dan-kiem-tra");
      await context.clearCookies();
      await page.getByRole("button", { name: "Kiểm tra" }).click();
      await page.waitForURL("**/admin/login");

      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/invitations/${invitation.id}/edit`);
      await expect(page.locator("#mapAddress")).toBeAttached();
      await page
        .getByRole("button", { name: "Vị trí trên bản đồ chưa đúng?" })
        .click();
      await page.locator("#mapAddress").fill("https://maps.app.goo.gl/e2eshort");
      await context.clearCookies();
      await page.locator("#mapAddress").blur();
      await page.waitForURL("**/admin/login");

      expect(invitationSnapshot(invitation.id)).toEqual(invitationBefore);
      expect(contentSnapshot(invitation.id)).toEqual(contentBefore);
      expect(auditCount(invitation.id)).toBe(auditBefore);
    } finally {
      clearAuditFor(user);
      deleteAdmin(admin.id);
      cleanupUser(user.id);
    }
  });

  test("support editor cross-binding re-derives user from invitation", async ({
    page,
    context,
  }) => {
    const userA = createUser();
    const userB = createUser();
    const invitationA = createInvitation(userA.id);
    const invitationB = createInvitation(userB.id);
    const admin = seedAdmin(false);
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto(`/admin/invitations/${invitationA.id}/edit`);
      await expect(page.getByText(`Đang hỗ trợ tài khoản ${userA.email}`)).toBeVisible();

      const invitationABefore = invitationSnapshot(invitationA.id);
      const invitationBBefore = invitationSnapshot(invitationB.id);
      const contentABefore = contentSnapshot(invitationA.id);
      const contentBBefore = contentSnapshot(invitationB.id);

      // Tamper the bound route id to invitation B while keeping form state from A.
      const rewrite = await installBoundIdRewrite(page, invitationA.id, invitationB.id);
      await page.locator("#brideFullName").fill("Nguyễn Mai");
      await page.locator("#groomFullName").fill("Trần Nam");
      await page.locator("#date").fill("2026-12-20");
      await page.locator("#time").fill("18:00");
      await page.getByRole("button", { name: "Lưu bản nháp" }).click();
      await expect.poll(() => readContent(invitationB.id, "brideFullName")).toBe("Nguyễn Mai");

      // A is untouched; B received the submitted draft and the B/B audit pair.
      expect(invitationSnapshot(invitationA.id)).toEqual(invitationABefore);
      expect(contentSnapshot(invitationA.id)).toEqual(contentABefore);
      expect(auditCount(invitationA.id)).toBe(0);
      expect(readContent(invitationB.id, "groomFullName")).toBe("Trần Nam");
      expect(readContent(invitationB.id, "date")).toBe("2026-12-20");
      expect(readContent(invitationB.id, "time")).toBe("18:00");
      expect(auditRowsFor(invitationB.id)).toEqual([
        {
          adminId: admin.id,
          action: "INVITATION_UPDATED_BY_ADMIN",
          targetUserId: userB.id,
          invitationId: invitationB.id,
        },
      ]);

      const invitationAAfterSave = invitationSnapshot(invitationA.id);
      const invitationBAfterSave = invitationSnapshot(invitationB.id);
      const contentAAfterSave = contentSnapshot(invitationA.id);
      const contentBAfterSave = contentSnapshot(invitationB.id);

      // Tamper again for the publish invocation.
      const slugB = `support-cross-${randomUUID().slice(0, 8)}`;
      await page.locator("#slug").fill(slugB);
      await page.getByRole("button", { name: "Xuất bản thiệp" }).click();
      await expect.poll(() => getInvitation(invitationB.id).status).toBe("published");

      // A kept its save-time state; B carries the publication metadata.
      expect(invitationSnapshot(invitationA.id)).toEqual(invitationAAfterSave);
      expect(contentSnapshot(invitationA.id)).toEqual(contentAAfterSave);
      expect(invitationSnapshot(invitationB.id)).not.toEqual(invitationBAfterSave);
      expect(contentSnapshot(invitationB.id)).toEqual(contentBAfterSave);
      expect(getInvitation(invitationB.id)).toMatchObject({
        status: "published",
        slug: slugB,
        userId: userB.id,
      });
      expect(auditCount(invitationA.id)).toBe(0);
      expect(auditRowsFor(invitationB.id)).toEqual([
        {
          adminId: admin.id,
          action: "INVITATION_UPDATED_BY_ADMIN",
          targetUserId: userB.id,
          invitationId: invitationB.id,
        },
        {
          adminId: admin.id,
          action: "INVITATION_PUBLISHED_BY_ADMIN",
          targetUserId: userB.id,
          invitationId: invitationB.id,
        },
      ]);

      // No audit row may pair one user with another user's invitation.
      const mismatchedAuditCount = (
        getDb()
          .prepare(`
            SELECT COUNT(*) AS count FROM AdminAuditLog
            WHERE (targetUserId = ? AND invitationId = ?)
               OR (targetUserId = ? AND invitationId = ?)
          `)
          .get(userA.id, invitationB.id, userB.id, invitationA.id) as { count: number }
      ).count;
      expect(mismatchedAuditCount).toBe(0);

      // Both tampered submissions actually crossed the rewrite.
      expect(rewrite.hits()).toBeGreaterThanOrEqual(2);
      await rewrite.uninstall();

      // Baseline sanity: the pre-tamper rows were distinct real invitations and
      // B started with empty content.
      expect(invitationBBefore?.userId).toBe(userB.id);
      expect(invitationABefore?.id).toBe(invitationA.id);
      expect(contentBBefore.brideFullName ?? "").toBe("");
    } finally {
      clearAuditFor(userA);
      clearAuditFor(userB);
      deleteAdmin(admin.id);
      cleanupUser(userA.id);
      cleanupUser(userB.id);
    }
  });
});
