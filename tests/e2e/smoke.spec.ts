import { test, expect } from "@playwright/test";

import { loginAsUser, SEEDED_USER } from "./helpers/auth";
import { getDb } from "./helpers/db";

test.describe("scaffold smoke", () => {
  test("home page loads", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok()).toBeTruthy();
  });

  test("login form submits and reaches dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", SEEDED_USER.email);
    await page.fill("#password", SEEDED_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");
    expect(page.url()).toContain("/dashboard");
  });

  test("forged session cookie authenticates dashboard", async ({ page, context }) => {
    const user = getDb()
      .prepare(`SELECT id FROM User WHERE email = ?`)
      .get(SEEDED_USER.email) as { id: string };
    await loginAsUser(context, user.id);
    const res = await page.goto("/dashboard");
    expect(res?.ok()).toBeTruthy();
    expect(page.url()).toContain("/dashboard");
  });
});
