import { test, expect, type Page } from "@playwright/test";

// Shell isolation: marketing routes own the marketing chrome, workspace routes
// own the workspace chrome, and public invitations render neither. Reuses the
// isolated database helpers flow from site-2-mvp.spec.ts (register on the
// site-2 server, never master data).

async function registerSite2Account(page: Page, email: string) {
  await page.goto("/dang-nhap?mode=register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function createAndPublishSite2Invitation(page: Page): Promise<string> {
  await page.getByLabel("Tạo thiệp mới").selectOption("jasmine-white");
  await page.getByRole("button", { name: "Tạo thiệp" }).click();
  await expect(page).toHaveURL(/\/editor\//);

  await page.getByLabel("Tên cô dâu").fill("Nguyễn Mai Lan");
  await page.getByLabel("Tên chú rể").fill("Trần Đức Minh");
  await page.getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByText("Đã lưu thay đổi.")).toBeVisible();

  await page.getByRole("button", { name: "Xuất bản" }).click();
  await expect(page.getByText("Đã xuất bản.")).toBeVisible();

  const publicLink = page.getByText("/thiep/");
  await expect(publicLink).toBeVisible();
  const href = await publicLink.getAttribute("href");
  expect(href).toMatch(/\/thiep\//);
  return href ?? "";
}

test("marketing shell owns the homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("marketing-nav")).toBeVisible();
  await expect(page.getByTestId("workspace-nav")).toHaveCount(0);
});

test("workspace shell owns the dashboard", async ({ page }) => {
  await registerSite2Account(page, `site2-shell-${Date.now()}@example.com`);
  await expect(page.getByTestId("workspace-nav")).toBeVisible();
  await expect(page.getByTestId("marketing-nav")).toHaveCount(0);
});

test("public invitation shell has no marketing or workspace chrome", async ({
  page,
}) => {
  await registerSite2Account(page, `site2-shell-pub-${Date.now()}@example.com`);
  const invitationUrl = await createAndPublishSite2Invitation(page);
  await page.goto(invitationUrl);
  await expect(page.getByTestId("marketing-nav")).toHaveCount(0);
  await expect(page.getByTestId("workspace-nav")).toHaveCount(0);
});
