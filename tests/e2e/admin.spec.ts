import { randomUUID } from "node:crypto";

import { test, expect } from "@playwright/test";

import { getDb, prismaNow } from "./helpers/db";
import { createUser, createInvitation, createPayment, cleanupUser } from "./helpers/fixtures";
import { loginAsAdmin, loginAsUser, SEEDED_ADMIN } from "./helpers/auth";

/** id of the seeded super admin (admin@e2e.test), used for forged-cookie login. */
function seededAdminId(): string {
  const row = getDb().prepare("SELECT id FROM Admin WHERE email = ?").get(SEEDED_ADMIN.email) as
    | { id: string }
    | undefined;
  if (!row) throw new Error("seeded admin not found in test.db");
  return row.id;
}

function makeId(prefix: string): string {
  return `${prefix}${randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

/** Insert a Voucher row directly and return its code. */
function seedVoucher(overrides?: { active?: boolean; maxUses?: number }): { id: string; code: string } {
  const db = getDb();
  const id = makeId("v");
  const code = `E2E${randomUUID().slice(0, 8).toUpperCase()}`;
  db.prepare(
    `INSERT INTO Voucher (id, code, amountOff, active, maxUses, usedCount, expiresAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, code, 50000, overrides?.active === false ? 0 : 1, overrides?.maxUses ?? null, 0, null, prismaNow());
  return { id, code };
}

function deleteVoucherByCode(code: string): void {
  getDb().prepare("DELETE FROM Voucher WHERE code = ?").run(code);
}

/** Insert an Admin row directly (used for non-super-admin gating). */
function seedAdmin(isSuperAdmin: boolean): { id: string; email: string } {
  const db = getDb();
  const id = makeId("a");
  const email = `admin-${randomUUID()}@e2e.test`;
  // passwordHash value is irrelevant here; login is done via forged cookie.
  db.prepare(
    `INSERT INTO Admin (id, email, passwordHash, isSuperAdmin, createdAt) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, email, "x", isSuperAdmin ? 1 : 0, prismaNow());
  return { id, email };
}

function deleteAdminByEmail(email: string): void {
  getDb().prepare("DELETE FROM Admin WHERE email = ?").run(email);
}

test.describe("admin: login UI", () => {
  test("seeded admin credentials reach /admin", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator("#email").fill(SEEDED_ADMIN.email);
    await page.locator("#password").fill(SEEDED_ADMIN.password);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/admin$/);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
  });

  test("wrong password stays on /admin/login with credential error", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator("#email").fill(SEEDED_ADMIN.email);
    await page.locator("#password").fill("wrong-password-xyz");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText("Email hoặc mật khẩu không đúng")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("invalid email format is blocked by browser validation", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator("#email").fill("not-an-email");
    await page.locator("#password").fill("whatever123");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator("#email")).toHaveJSProperty("validity.valid", false);
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});

test.describe("admin: auth gating", () => {
  test("unauthenticated /admin redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/admin/login");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("unauthenticated sub-pages redirect to /admin/login", async ({ page }) => {
    for (const path of ["/admin/users", "/admin/payments", "/admin/vouchers", "/admin/admins", "/admin/demos"]) {
      await page.goto(path);
      await page.waitForURL("**/admin/login");
      await expect(page).toHaveURL(/\/admin\/login$/);
    }
  });

  test("a user session does not grant admin access", async ({ context, page }) => {
    const user = createUser();
    try {
      await loginAsUser(context, user.id);
      await page.goto("/admin");
      await page.waitForURL("**/admin/login");
      await expect(page).toHaveURL(/\/admin\/login$/);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("non-super admin is redirected away from /admin/admins", async ({ context, page }) => {
    const admin = seedAdmin(false);
    try {
      await loginAsAdmin(context, admin.id);
      await page.goto("/admin/admins");
      await page.waitForURL(/\/admin$/);
      await expect(page).toHaveURL(/\/admin$/);
    } finally {
      deleteAdminByEmail(admin.email);
    }
  });
});

test.describe("admin: users", () => {
  test("seeded users appear in the users list", async ({ context, page }) => {
    const u1 = createUser();
    const u2 = createUser();
    try {
      await loginAsAdmin(context, seededAdminId());
      await page.goto("/admin/users");
      await expect(page.getByRole("heading", { name: /Người dùng/ })).toBeVisible();
      await expect(page.getByText(u1.email)).toBeVisible();
      await expect(page.getByText(u2.email)).toBeVisible();
    } finally {
      cleanupUser(u1.id);
      cleanupUser(u2.id);
    }
  });
});

test.describe("admin: payments", () => {
  test("seeded payment appears in the payments list", async ({ context, page }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id);
      const payment = createPayment(inv.id, { status: "paid", amount: 150000 });
      await loginAsAdmin(context, seededAdminId());
      await page.goto("/admin/payments");
      await expect(page.getByRole("heading", { name: /Giao dịch/ })).toBeVisible();
      await expect(page.getByText(payment.code)).toBeVisible();
    } finally {
      cleanupUser(user.id);
    }
  });
});

test.describe("admin: vouchers", () => {
  test("create a voucher through the UI writes a Voucher row and lists it", async ({ context, page }) => {
    const code = `E2E${randomUUID().slice(0, 8).toUpperCase()}`;
    try {
      await loginAsAdmin(context, seededAdminId());
      await page.goto("/admin/vouchers");
      await page.locator("#code").fill(code);
      await page.locator("#amountOff").fill("30000");
      await page.getByRole("button", { name: "Tạo voucher" }).click();

      await expect(page.getByText("Đã tạo voucher.")).toBeVisible();

      const row = getDb().prepare("SELECT * FROM Voucher WHERE code = ?").get(code) as
        | { code: string; amountOff: number; active: number }
        | undefined;
      expect(row).toBeTruthy();
      expect(row?.amountOff).toBe(30000);
      expect(row?.active).toBe(1);

      await expect(page.getByText(code)).toBeVisible();
    } finally {
      deleteVoucherByCode(code);
    }
  });

  test("rejects a duplicate voucher code", async ({ context, page }) => {
    const existing = seedVoucher();
    try {
      await loginAsAdmin(context, seededAdminId());
      await page.goto("/admin/vouchers");
      await page.locator("#code").fill(existing.code);
      await page.locator("#amountOff").fill("10000");
      await page.getByRole("button", { name: "Tạo voucher" }).click();

      await expect(page.getByText("Mã voucher đã tồn tại")).toBeVisible();
    } finally {
      deleteVoucherByCode(existing.code);
    }
  });

  test("toggle switches a voucher's active state", async ({ context, page }) => {
    const v = seedVoucher({ active: true });
    try {
      await loginAsAdmin(context, seededAdminId());
      await page.goto("/admin/vouchers");
      const row = page.locator("tr", { hasText: v.code });
      await row.getByRole("button", { name: "Tắt" }).click();

      await expect(row.getByRole("button", { name: "Bật" })).toBeVisible();
      const after = getDb().prepare("SELECT active FROM Voucher WHERE code = ?").get(v.code) as
        | { active: number }
        | undefined;
      expect(after?.active).toBe(0);
    } finally {
      deleteVoucherByCode(v.code);
    }
  });

  test("delete removes a voucher", async ({ context, page }) => {
    const v = seedVoucher();
    try {
      await loginAsAdmin(context, seededAdminId());
      await page.goto("/admin/vouchers");
      const row = page.locator("tr", { hasText: v.code });
      await row.getByRole("button", { name: "Xoá" }).click();

      await expect(page.getByText(v.code)).toHaveCount(0);
      const gone = getDb().prepare("SELECT id FROM Voucher WHERE code = ?").get(v.code);
      expect(gone).toBeFalsy();
    } finally {
      deleteVoucherByCode(v.code);
    }
  });
});

test.describe("admin: admins management", () => {
  test("list shows the seeded super admin", async ({ context, page }) => {
    await loginAsAdmin(context, seededAdminId());
    await page.goto("/admin/admins");
    await expect(page.getByRole("heading", { name: /^Admin/ })).toBeVisible();
    await expect(page.getByText(SEEDED_ADMIN.email)).toBeVisible();
  });

  test("super admin can create a new admin", async ({ context, page }) => {
    const email = `new-admin-${randomUUID()}@e2e.test`;
    try {
      await loginAsAdmin(context, seededAdminId());
      await page.goto("/admin/admins");
      await page.locator("#email").fill(email);
      await page.locator("#password").fill("newadmin123");
      await page.getByRole("button", { name: "Tạo admin" }).click();

      await expect(page.getByText("Đã tạo admin.")).toBeVisible();

      const row = getDb().prepare("SELECT email, isSuperAdmin FROM Admin WHERE email = ?").get(email) as
        | { email: string; isSuperAdmin: number }
        | undefined;
      expect(row).toBeTruthy();
      expect(row?.isSuperAdmin).toBe(0);
    } finally {
      deleteAdminByEmail(email);
    }
  });
});

test.describe("admin: demos", () => {
  test("demos list renders", async ({ context, page }) => {
    await loginAsAdmin(context, seededAdminId());
    await page.goto("/admin/demos");
    await expect(page.getByRole("heading", { name: /Thiệp demo/ })).toBeVisible();
  });

  test("demo edit page loads for a seeded demo invitation", async ({ context, page }) => {
    const user = createUser();
    try {
      const inv = createInvitation(user.id, { isDemo: true });
      await loginAsAdmin(context, seededAdminId());
      await page.goto(`/admin/demos/${inv.id}`);
      // The editor shell renders the back-link twice (toolbar + header).
      await expect(page.getByRole("link", { name: /Danh sách thiệp demo/ }).first()).toBeVisible();
    } finally {
      cleanupUser(user.id);
    }
  });
});
