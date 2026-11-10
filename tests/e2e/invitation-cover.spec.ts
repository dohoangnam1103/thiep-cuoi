import { expect, test } from "@playwright/test";

import { getDb } from "./helpers/db";

const demo = "/mau-thiep/long-phung-v3-do/demo";

test("a legacy 3D preference still serves a 2D cover in the initial HTML", async ({ request }) => {
  const db = getDb();
  const previous = db.prepare("SELECT cover3dEnabled FROM AppConfig WHERE id = 'default'").get() as {
    cover3dEnabled: number;
  };

  db.prepare("UPDATE AppConfig SET cover3dEnabled = 1 WHERE id = 'default'").run();
  try {
    const response = await request.get(demo);
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain('data-envelope-renderer="2d"');
  } finally {
    db.prepare("UPDATE AppConfig SET cover3dEnabled = ? WHERE id = 'default'").run(previous.cover3dEnabled);
  }
});

test("the 2D cover opens the selected invitation", async ({ page }) => {
  await page.goto(demo);
  const cover = page.locator('[data-envelope-renderer="2d"]');
  await expect(cover).toBeVisible();
  await cover.locator("[data-open-btn]").click();
  await expect(page.getByTestId("dragon-phoenix-v3-hero")).toBeVisible();
  await expect(cover).toHaveCount(0);
});
