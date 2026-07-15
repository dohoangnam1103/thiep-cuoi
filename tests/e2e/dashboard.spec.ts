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
      // Each completed template is its own <form> with a submit button.
      const submits = page.locator('div.fixed form button[type="submit"]');
      await expect(submits).toHaveCount(39);
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
  test("clicking the header logo navigates to the home page", async ({ page, context }) => {
    const user = createUser();
    try {
      await loginAsUser(context, user.id);
      await page.goto("/dashboard");

      await page.getByRole("link", { name: "Về trang chủ" }).click();
      await page.waitForURL(/\/$/);
      expect(new URL(page.url()).pathname).toBe("/");
    } finally {
      cleanupUser(user.id);
    }
  });

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

test.describe("dashboard — guest manager v2", () => {
  test("owner can add and edit structured guest information", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id);
    publishInvitation(inv.id);
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/guests`);
      await page.getByRole("button", { name: "Thêm khách" }).first().click();
      await page.getByLabel("Họ và tên *").fill("Nguyễn Minh Anh");
      await page.getByLabel("Vai trò / danh xưng").fill("Anh");
      await page.getByRole("textbox", { name: "Nhóm khách", exact: true }).fill("Bạn đại học");
      await page.getByLabel("Bàn tiệc").fill("Bàn 05");
      await page.getByLabel("Số khách tối đa").fill("2");
      await page.getByRole("button", { name: "Thêm khách" }).last().click();

      await expect(page.getByRole("table").getByText("Nguyễn Minh Anh", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Sửa thông tin Nguyễn Minh Anh" }).click();
      await page.getByLabel("Bàn tiệc").fill("Bàn 08");
      await expect(page.getByLabel("Bàn tiệc")).toHaveValue("Bàn 08");
      await page.getByRole("button", { name: "Lưu thay đổi" }).click();

      await expect.poll(() => getDb().prepare(
        "SELECT groupName, tableName, maxGuests FROM Guest WHERE invitationId = ? AND name = ?",
      ).get(inv.id, "Nguyễn Minh Anh")).toEqual({ groupName: "Bạn đại học", tableName: "Bàn 08", maxGuests: 2 });
      await expect(page.getByRole("table").getByText("Bàn 08", { exact: true })).toBeVisible();
    } finally {
      cleanupUser(user.id);
    }
  });

  test("owner can import a CSV guest list", async ({ page, context }) => {
    const user = createUser();
    const inv = createInvitation(user.id);
    publishInvitation(inv.id);
    try {
      await loginAsUser(context, user.id);
      await page.goto(`/dashboard/${inv.id}/guests`);
      await page.getByRole("button", { name: "Nhập CSV" }).click();
      await page.locator('input[type="file"]').setInputFiles({
        name: "khach-moi.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(
          "Họ và tên,Vai trò,Nhà,Nhóm khách,Bàn,Số khách tối đa\nTrần Thu Hà,Chị,Nhà gái,Đồng nghiệp,Bàn 02,2\nLê Minh Quân,Anh,Nhà trai,Họ hàng,Bàn 03,1",
        ),
      });
      await expect(page.getByText("Sẵn sàng nhập 2 khách")).toBeVisible();
      await page.getByRole("button", { name: "Nhập 2 khách" }).click();
      await expect(page.getByText("Trần Thu Hà", { exact: true })).toBeVisible();
      await expect(page.getByText("Lê Minh Quân", { exact: true })).toBeVisible();
    } finally {
      cleanupUser(user.id);
    }
  });
});
