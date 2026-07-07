import { randomUUID } from "node:crypto";

import { test, expect } from "@playwright/test";

import { getDb } from "./helpers/db";
import { createUser, cleanupUser } from "./helpers/fixtures";
import { loginAsUser, SEEDED_USER } from "./helpers/auth";

function findUserId(email: string): string | undefined {
  const row = getDb().prepare("SELECT id FROM User WHERE email = ?").get(email) as
    | { id: string }
    | undefined;
  return row?.id;
}

test.describe("auth: login", () => {
  test("seeded user logs in and lands on /dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(SEEDED_USER.email);
    await page.locator("#password").fill(SEEDED_USER.password);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
  });

  test("wrong password stays on /login with credential error", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(SEEDED_USER.email);
    await page.locator("#password").fill("wrong-password");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText("Email hoặc mật khẩu không đúng")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("invalid email format is blocked by browser validation", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("not-an-email");
    await page.locator("#password").fill("user123456");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator("#email")).toHaveJSProperty("validity.valid", false);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("password shorter than 6 shows validation error", async ({ page }) => {
    await page.goto("/login");
    // Bypass native minLength so the server action runs the zod check.
    await page.locator("#password").evaluate((el) => el.removeAttribute("minLength"));
    await page.locator("#email").fill(SEEDED_USER.email);
    await page.locator("#password").fill("123");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText("Mật khẩu tối thiểu 6 ký tự")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("auth: signup", () => {
  test("new unique email creates user and lands on /dashboard", async ({ page }) => {
    const email = `signup-${randomUUID()}@e2e.test`;
    let createdId: string | undefined;
    try {
      await page.goto("/signup");
      await page.locator("#email").fill(email);
      await page.locator("#password").fill("newpass123");
      await page.locator('button[type="submit"]').click();

      await page.waitForURL("**/dashboard");
      await expect(page).toHaveURL(/\/dashboard$/);

      createdId = findUserId(email);
      expect(createdId).toBeTruthy();
    } finally {
      if (createdId) cleanupUser(createdId);
    }
  });

  test("already-registered email shows duplicate error", async ({ page }) => {
    await page.goto("/signup");
    await page.locator("#email").fill(SEEDED_USER.email);
    await page.locator("#password").fill("user123456");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText("Email này đã được đăng ký")).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });
});

test.describe("auth: session and redirects", () => {
  test("authenticated user visiting /login is redirected to /dashboard", async ({ context, page }) => {
    const user = createUser();
    try {
      await loginAsUser(context, user.id);
      await page.goto("/login");
      await page.waitForURL("**/dashboard");
      await expect(page).toHaveURL(/\/dashboard$/);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("authenticated user visiting /signup is redirected to /dashboard", async ({ context, page }) => {
    const user = createUser();
    try {
      await loginAsUser(context, user.id);
      await page.goto("/signup");
      await page.waitForURL("**/dashboard");
      await expect(page).toHaveURL(/\/dashboard$/);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("unauthenticated user visiting /dashboard is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("logout clears the session and redirects home", async ({ context, page }) => {
    const user = createUser();
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/dashboard$/);

      await page.getByRole("button", { name: "Đăng xuất" }).click();
      await page.waitForURL((url) => !url.pathname.startsWith("/dashboard"));

      // Session gone: dashboard now bounces back to /login.
      await page.goto("/dashboard");
      await page.waitForURL("**/login");
      await expect(page).toHaveURL(/\/login$/);
    } finally {
      cleanupUser(user.id);
    }
  });
});
