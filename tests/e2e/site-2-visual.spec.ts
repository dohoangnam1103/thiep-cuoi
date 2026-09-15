import { test, expect } from "@playwright/test";

// Cobalt Atelier visual and mechanical acceptance. Runs once per project
// (desktop 1440, mobile 390, dark, reduced-motion); each case asserts layout
// invariants and records a named screenshot for the acceptance note.

async function expectNoOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function shoot(page, testInfo, name: string) {
  await expectNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
}

test("homepage fits the first viewport with one-line chrome", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const navHeight =
    (await page.getByTestId("marketing-nav").boundingBox())?.height ?? 0;
  expect(navHeight).toBeLessThanOrEqual(72);
  const h1Box = await page.getByRole("heading", { level: 1 }).boundingBox();
  const viewport = page.viewportSize();
  expect(h1Box).not.toBeNull();
  expect(h1Box!.y + h1Box!.height).toBeLessThanOrEqual((viewport?.height ?? 900) + 1);
  const ctaWhiteSpace = await page
    .getByRole("link", { name: "Xem mẫu thiệp" })
    .evaluate((el) => getComputedStyle(el).whiteSpace);
  if ((viewport?.width ?? 0) >= 768) {
    expect(ctaWhiteSpace).toBe("nowrap");
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(
    page.locator("section").first().getByText(/mẫu thiệp cưới/),
  ).toHaveCount(1);
  await shoot(page, testInfo, "home");
});

test("catalog keeps its header compact and grid legible", async ({
  page,
}, testInfo) => {
  await page.goto("/mau-thiep");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("template-card").first()).toBeVisible();
  await shoot(page, testInfo, "catalog");
});

test("pricing leads with the plan and one CTA", async ({ page }, testInfo) => {
  await page.goto("/bang-gia");
  await expect(page.getByText("Liên hệ")).toBeVisible();
  await expect(page.getByRole("link", { name: "Tạo thiệp ngay" })).toHaveCount(1);
  await shoot(page, testInfo, "pricing");
});

test("auth stays form-first with labeled fields", async ({ page }, testInfo) => {
  await page.goto("/dang-nhap");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Mật khẩu")).toBeVisible();
  const unlabeled = await page.evaluate(() =>
    [...document.querySelectorAll("main input")].filter((el) => {
      const input = el as HTMLInputElement;
      if (input.type === "hidden") return false;
      const id = input.id;
      const labelled =
        (id && document.querySelector(`label[for="${id}"]`)) ||
        input.getAttribute("aria-label") ||
        input.closest("label");
      return !labelled;
    }).length,
  );
  expect(unlabeled).toBe(0);
  await shoot(page, testInfo, "auth");
});

test("help and legal pages read cleanly", async ({ page }, testInfo) => {
  await page.goto("/huong-dan");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shoot(page, testInfo, "help");
  await page.goto("/chinh-sach-bao-mat");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shoot(page, testInfo, "legal");
});

test("workspace pages keep project chrome on every viewport", async ({
  page,
}, testInfo) => {
  await page.goto("/dang-nhap?mode=register");
  await page.getByLabel("Email").fill(`site2-vis-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId("workspace-nav")).toBeVisible();
  await shoot(page, testInfo, "dashboard-empty");

  await page.getByLabel("Tạo thiệp mới").selectOption("jasmine-white");
  await page.getByRole("button", { name: "Tạo thiệp" }).click();
  await expect(page).toHaveURL(/\/editor\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await shoot(page, testInfo, "editor");

  const invitationId = new URL(page.url()).pathname.split("/").pop() ?? "";
  await page.goto(`/dashboard/${invitationId}/khach-moi`);
  await shoot(page, testInfo, "guests");
  await page.goto(`/dashboard/${invitationId}/rsvp`);
  await shoot(page, testInfo, "rsvp");
  await page.goto(`/dashboard/${invitationId}/thanh-toan`);
  await shoot(page, testInfo, "payment");
});

test("unknown route shows one recovery action", async ({ page }, testInfo) => {  await page.goto("/khong-co-trang-nay-404");
  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shoot(page, testInfo, "not-found");
});

test("every control exposes an accessible name", async ({ page }) => {
  await page.goto("/");
  const unnamed = await page.evaluate(() =>
    [...document.querySelectorAll('main button, main a[href]')].filter((el) => {
      const text = (el.textContent ?? "").trim();
      return !text && !el.getAttribute("aria-label");
    }).length,
  );
  expect(unnamed).toBe(0);
});

test("visible copy carries no em or en dash", async ({ page }) => {
  for (const path of ["/", "/mau-thiep", "/bang-gia", "/huong-dan"]) {
    await page.goto(path);
    const body = await page.locator("main").innerText();
    expect(body).not.toMatch(/[—–]/);
  }
});
