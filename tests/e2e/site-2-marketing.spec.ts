import { test, expect } from "@playwright/test";

// Homepage acceptance: one clear browse intent, real template imagery, real
// numbers only, and a guided path from hero to register.

test("homepage presents one clear browse intent and real template imagery", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Một lời mời đáng nhớ.",
  );
  await expect(
    page.getByRole("link", { name: "Xem mẫu thiệp" }),
  ).toHaveAttribute("href", "/mau-thiep");
  await expect.poll(() => page.locator("main img").count()).toBeGreaterThan(0);
  await expect(page.getByText(/110\+|99\.9%|50\.000/)).toHaveCount(0);
});

test("homepage guides visitors from hero to register", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Tạo thiệp ngay" }),
  ).toHaveAttribute("href", "/dang-nhap?mode=register");
  await expect(
    page.getByRole("link", { name: "Bắt đầu miễn phí" }),
  ).toHaveAttribute("href", "/dang-nhap?mode=register");
});
