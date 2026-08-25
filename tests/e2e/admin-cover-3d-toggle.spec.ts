import { test, expect } from "@playwright/test";

import { loginAsAdmin, SEEDED_ADMIN } from "./helpers/auth";
import { getDb } from "./helpers/db";

/**
 * `prepare-db.ts` seed cover3dEnabled = true để ~40 test bìa 3D trong
 * templates.spec.ts còn chỗ dựa. Suite này chạy tuần tự trên CÙNG một database
 * (workers: 1, fullyParallel: false), nên mọi test ở đây phải trả cờ về true khi
 * xong, kể cả lúc assert fail.
 */
function seededAdminId(): string {
  const row = getDb().prepare("SELECT id FROM Admin WHERE email = ?").get(SEEDED_ADMIN.email) as
    | { id: string }
    | undefined;
  if (!row) throw new Error("seeded admin not found in test.db");
  return row.id;
}

function readFlag(): boolean {
  const row = getDb().prepare("SELECT cover3dEnabled FROM AppConfig WHERE id = 'default'").get() as
    | { cover3dEnabled: number }
    | undefined;
  if (!row) throw new Error("AppConfig row not found in test.db");
  return row.cover3dEnabled === 1;
}

function writeFlag(enabled: boolean): void {
  getDb()
    .prepare("UPDATE AppConfig SET cover3dEnabled = ? WHERE id = 'default'")
    .run(enabled ? 1 : 0);
}

test.describe("admin: công tắc bìa thiệp 3D", () => {
  test.afterEach(() => {
    writeFlag(true);
  });

  test("công tắc ghi vào AppConfig và phản ánh đúng trạng thái đã lưu", async ({ page, context }) => {
    await loginAsAdmin(context, seededAdminId());
    writeFlag(true);

    await page.goto("/admin/settings");
    const toggle = page.getByRole("switch", { name: "Bìa thiệp 3D" });
    await expect(toggle).toHaveAttribute("aria-checked", "true");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(readFlag()).toBe(false);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(readFlag()).toBe(true);
  });

  test("nav quản trị có mục Cài đặt", async ({ page, context }) => {
    await loginAsAdmin(context, seededAdminId());
    await page.goto("/admin/settings");
    await expect(page.locator('a[href="/admin/settings"]').first()).toBeVisible();
  });

  test("tắt công tắc thì bìa là DOM 2D, không có canvas WebGL", async ({ page, context }) => {
    await loginAsAdmin(context, seededAdminId());
    writeFlag(false);

    await page.goto("/mau-thiep/long-phung-v3-do/demo", { timeout: 60_000 });

    const stage = page.locator("[data-envelope-renderer]");
    await expect(stage).toHaveAttribute("data-envelope-renderer", "2d", { timeout: 30_000 });
    // Thẻ 2D SSR được nên có ngay trong HTML, không chờ hydrate.
    await expect(page.locator("[data-envelope-card-content]")).toHaveCount(1);
    // Đây là điểm chính của công tắc: không mount Envelope3D thì chunk
    // three.js/html-to-image không tải, nên không có canvas lẫn node chụp texture.
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator("[data-envelope-capture-root]")).toHaveCount(0);
    // Bìa 2D bấm được ngay, không phải chờ chụp xong texture mới có toạ độ nút.
    await expect(page.locator("[data-open-invitation-control]")).toBeEnabled();
  });

  test("bật công tắc thì bìa quay lại WebGL", async ({ page, context }) => {
    await loginAsAdmin(context, seededAdminId());
    writeFlag(true);

    await page.goto("/mau-thiep/long-phung-v3-do/demo", { timeout: 60_000 });

    const stage = page.locator('[data-envelope-renderer="3d"]');
    await expect(stage).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("[data-envelope-capture-root]")).toHaveCount(1, { timeout: 45_000 });
    await expect(page.locator("canvas")).toHaveCount(1);
  });

  test("bìa 2D mở được thiệp và dựng đúng thân thiệp", async ({ page, context }) => {
    await loginAsAdmin(context, seededAdminId());
    writeFlag(false);

    await page.goto("/mau-thiep/long-phung-v3-do/demo", { timeout: 60_000 });
    await expect(page.locator('[data-envelope-renderer="2d"]')).toBeVisible({ timeout: 30_000 });

    await page.locator("[data-open-invitation-control]").evaluate((button) => {
      (button as HTMLButtonElement).click();
    });

    await expect(page.locator("[data-envelope-renderer]")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('[data-template-visual="dragon-phoenix-v3-red"]')).toBeVisible({
      timeout: 30_000,
    });
  });
});
