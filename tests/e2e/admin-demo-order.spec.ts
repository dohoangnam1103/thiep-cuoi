import { expect, test } from "@playwright/test";
import vi from "../../messages/vi.json";
import { loginAsAdmin } from "./helpers/auth";
import { getDb } from "./helpers/db";
import { cleanupUser, createInvitation, createUser, seededAdminId } from "./helpers/fixtures";

test("drag order persists when retired demos remain in the database", async ({ page, context }) => {
  const user = createUser();
  const slugs = ["song-hy-red", "royal-blue", "thap-nhi-chi-do", "thanh-duong-anh-sang"];
  const demos = slugs.map((templateId) => createInvitation(user.id, { templateId, isDemo: true }));
  try {
    await loginAsAdmin(context, seededAdminId());
    await page.goto("/admin/demos");
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(2);
    const originalIds = await rows.locator('a[href^="/admin/demos/"]').evaluateAll(
      (links) => links.map((link) => link.getAttribute("href")),
    );
    const handles = rows.locator('button[aria-roledescription="sortable"]');
    // dnd-kit mounts its accessibility instructions once hydration is complete.
    await page.locator('[id^="DndDescribedBy-"]').waitFor({ state: "attached" });
    const first = await handles.nth(0).boundingBox();
    const second = await handles.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    await page.mouse.move(first!.x + first!.width / 2, first!.y + first!.height / 2);
    await page.mouse.down();
    await page.mouse.move(second!.x + second!.width / 2, second!.y + second!.height / 2, { steps: 15 });
    await page.mouse.up();
    await expect(page.getByText(vi.adminDemos.orderSaved, { exact: true })).toBeVisible();
    const expectedIds = [...originalIds].reverse();
    const persisted = getDb().prepare("SELECT slug FROM TemplateDisplayOrder ORDER BY sortOrder").all() as { slug: string }[];
    expect(persisted.map(({ slug }) => `/admin/demos/${demos.find((demo) => demo.templateId === slug)?.id}`)).toEqual(expectedIds);
    await page.reload();
    await expect(rows).toHaveCount(2);
    expect(await rows.locator('a[href^="/admin/demos/"]').evaluateAll(
      (links) => links.map((link) => link.getAttribute("href")),
    )).toEqual(expectedIds);
  } finally {
    cleanupUser(user.id);
    for (const slug of slugs) getDb().prepare("DELETE FROM TemplateDisplayOrder WHERE slug = ?").run(slug);
  }
});
