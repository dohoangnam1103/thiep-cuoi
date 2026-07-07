import { test, expect } from "@playwright/test";

import { loginAsUser } from "./helpers/auth";
import { getDb } from "./helpers/db";
import { createInvitation, createUser, cleanupUser, publishInvitation } from "./helpers/fixtures";

// Vietnamese template labels (mirrors src/app/editor/[id]/templates.ts TEMPLATE_LABELS).
// Hardcoded here rather than imported so the Playwright CJS transform never has to
// resolve the `@/` alias / editor module at runtime.
const LABEL = {
  "song-hy-red": "Song Hỷ Đỏ",
  "royal-blue": "Hoàng Gia Xanh Dương",
  "co-ba-red": "Cô Ba Đỏ",
} as const;

function invitationCount(userId: string): number {
  const row = getDb()
    .prepare(`SELECT count(*) AS n FROM Invitation WHERE userId = ?`)
    .get(userId) as { n: number };
  return row.n;
}

test.describe("dashboard — list & auth", () => {
  test("unauthenticated /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });

  test("new user with no invitations sees the empty state", async ({ page, context }) => {
    const user = createUser();
    try {
      await loginAsUser(context, user.id);
      const res = await page.goto("/dashboard");
      expect(res?.ok()).toBeTruthy();
      await expect(page.getByRole("heading", { name: "Thiệp của tôi" })).toBeVisible();
      await expect(page.getByText(/Bạn chưa có thiệp nào/)).toBeVisible();
      // No invitation cards yet.
      await expect(page.locator("ul li")).toHaveCount(0);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("seeded invitations render with their template labels", async ({ page, context }) => {
    const user = createUser();
    createInvitation(user.id, { templateId: "song-hy-red" });
    createInvitation(user.id, { templateId: "royal-blue" });
    createInvitation(user.id, { templateId: "co-ba-red" });
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      // Empty content → card label falls back to the template label.
      await expect(page.getByText(LABEL["song-hy-red"], { exact: true })).toBeVisible();
      await expect(page.getByText(LABEL["royal-blue"], { exact: true })).toBeVisible();
      await expect(page.getByText(LABEL["co-ba-red"], { exact: true })).toBeVisible();
      await expect(page.locator("ul li")).toHaveCount(3);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("draft and published invitations show the correct status badge", async ({ page, context }) => {
    const user = createUser();
    createInvitation(user.id, { templateId: "song-hy-red" }); // draft
    const pub = createInvitation(user.id, { templateId: "royal-blue" });
    publishInvitation(pub.id);
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      await expect(page.getByText("Bản nháp")).toBeVisible();
      await expect(page.getByText("Đã xuất bản")).toBeVisible();
    } finally {
      cleanupUser(user.id);
    }
  });

  test("couple names from content render as the card title", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id, { templateId: "song-hy-red" });
    // Card title is `${groom} & ${bride}` when both content names are present.
    publishInvitation(inv.id, {
      groomFullName: "Anh Chú Rể",
      brideFullName: "Chị Cô Dâu",
    });
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      await expect(page.getByText("Anh Chú Rể & Chị Cô Dâu")).toBeVisible();
    } finally {
      cleanupUser(user.id);
    }
  });

  test("published invitation exposes a public 'Xem thiệp' link with its slug", async ({
    page,
    context,
  }) => {
    const user = createUser();
    const inv = createInvitation(user.id, { templateId: "royal-blue" });
    const slug = publishInvitation(inv.id);
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      const viewLink = page.getByRole("link", { name: "Xem thiệp" });
      await expect(viewLink).toBeVisible();
      await expect(viewLink).toHaveAttribute("href", `/thiep/${slug}`);
    } finally {
      cleanupUser(user.id);
    }
  });
});

test.describe("dashboard — create", () => {
  test("'+ Tạo thiệp mới' opens the template picker modal", async ({ page, context }) => {
    const user = createUser();
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      await page.getByRole("button", { name: "+ Tạo thiệp mới" }).click();
      await expect(page.getByRole("heading", { name: "Chọn mẫu thiệp" })).toBeVisible();
      // Each template is its own <form> with a submit button → several submit buttons.
      const submits = page.locator('div.fixed form button[type="submit"]');
      expect(await submits.count()).toBeGreaterThan(0);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("choosing a template creates an invitation and lands in the editor", async ({
    page,
    context,
  }) => {
    const user = createUser();
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      expect(invitationCount(user.id)).toBe(0);

      await page.getByRole("button", { name: "+ Tạo thiệp mới" }).click();
      await expect(page.getByRole("heading", { name: "Chọn mẫu thiệp" })).toBeVisible();
      // Pick the first template; the server action redirects to /editor/{id}.
      await page.locator('div.fixed form button[type="submit"]').first().click();

      await page.waitForURL("**/editor/**");
      expect(page.url()).toContain("/editor/");
      // The createInvitation action persisted a new row for this user.
      await expect.poll(() => invitationCount(user.id)).toBe(1);
    } finally {
      cleanupUser(user.id);
    }
  });
});

test.describe("dashboard — navigation", () => {
  test("'Chỉnh sửa' link navigates to the editor", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id, { templateId: "song-hy-red" });
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      await page.getByRole("link", { name: "Chỉnh sửa" }).click();
      await page.waitForURL(`**/editor/${inv.id}`);
      expect(page.url()).toContain(`/editor/${inv.id}`);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("'Khách mời' link navigates to the guests sub-page", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id, { templateId: "song-hy-red" });
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      await page.getByRole("link", { name: "Khách mời" }).click();
      await page.waitForURL(`**/dashboard/${inv.id}/guests`);
      expect(page.url()).toContain(`/dashboard/${inv.id}/guests`);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("'Xem xác nhận' link navigates to the rsvp sub-page", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id, { templateId: "song-hy-red" });
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");
      await page.getByRole("link", { name: "Xem xác nhận" }).click();
      await page.waitForURL(`**/dashboard/${inv.id}/rsvp`);
      expect(page.url()).toContain(`/dashboard/${inv.id}/rsvp`);
    } finally {
      cleanupUser(user.id);
    }
  });
});
