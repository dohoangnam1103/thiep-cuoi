import { test, expect } from "@playwright/test";

// Guest manager: owner-scoped CRUD and site-2 personal links. (RSVP overview
// tests join this file in Task 10.)

async function registerAndCreateInvitation(page, email: string) {
  await page.goto("/dang-nhap?mode=register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByLabel("Tạo thiệp mới").selectOption("jasmine-white");
  await page.getByRole("button", { name: "Tạo thiệp" }).click();
  await expect(page).toHaveURL(/\/editor\//);
  const invitationId = new URL(page.url()).pathname.split("/").pop() ?? "";
  expect(invitationId).not.toBe("");
  return invitationId;
}

test("guest manager creates, edits and deletes guests", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const invitationId = await registerAndCreateInvitation(
    page,
    `site2-guest-${Date.now()}@example.com`,
  );
  await page.goto(`/dashboard/${invitationId}/khach-moi`);
  // Desktop viewport renders the semantic table; the card list is mobile-only.
  const rows = () => page.locator('table [data-testid="guest-row"]');

  await page.getByRole("button", { name: "Thêm khách" }).click();
  await page.getByLabel("Tên khách").fill("Nguyễn Văn A");
  await page.getByLabel("Nhóm").fill("Nhà trai");
  await page.getByRole("button", { name: "Lưu khách" }).click();
  const row = rows().filter({ hasText: "Nguyễn Văn A" });
  await expect(row).toBeVisible();
  await expect(row.getByText("Nhà trai")).toBeVisible();

  const personalLink = row.getByRole("link", { name: "Link thiệp" });
  await expect(personalLink).toHaveAttribute("href", /\/thiep\/.+\?guest=.+/);
  await row.getByRole("button", { name: "Sao chép link" }).click();
  await expect(row.getByText("Đã sao chép!")).toBeVisible();

  await row.getByRole("button", { name: "Sửa" }).click();
  await page.getByLabel("Tên khách").fill("Nguyễn Văn B");
  await page.getByRole("button", { name: "Lưu khách" }).click();
  await expect(rows().filter({ hasText: "Nguyễn Văn B" })).toBeVisible();

  await rows()
    .filter({ hasText: "Nguyễn Văn B" })
    .getByRole("button", { name: "Xóa" })
    .click();
  await expect(rows().filter({ hasText: "Nguyễn Văn B" })).toHaveCount(0);
});

test("guest manager searches and filters by attendance", async ({ page }) => {
  const invitationId = await registerAndCreateInvitation(
    page,
    `site2-gfilter-${Date.now()}@example.com`,
  );
  await page.goto(`/dashboard/${invitationId}/khach-moi`);
  const rows = () => page.locator('table [data-testid="guest-row"]');

  for (const name of ["Trần Thị C", "Lê Văn D"]) {
    await page.getByRole("button", { name: "Thêm khách" }).click();
    await page.getByLabel("Tên khách").fill(name);
    await page.getByRole("button", { name: "Lưu khách" }).click();
    await expect(rows().filter({ hasText: name })).toBeVisible();
  }

  await page.getByRole("searchbox").fill("Trần Thị");
  await expect(rows()).toHaveCount(1);
  await page.getByRole("searchbox").fill("");
  await expect(rows()).toHaveCount(2);
});
