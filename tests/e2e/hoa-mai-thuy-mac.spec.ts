import { expect, test, type Page } from "@playwright/test";

test.use({ baseURL: `http://localhost:${process.env.E2E_PORT ?? 3100}` });

const demo = "/mau-thiep/hoa-mai-thuy-mac/demo";
const template = "[data-hoa-mai-template]";

async function stopAutoScroll(page: Page) {
  const toggle = page.getByTestId("invitation-auto-scroll-toggle");
  if (await toggle.count() === 0) return;
  if (await toggle.getAttribute("aria-pressed") === "true") await toggle.click();
}

async function openInvitation(page: Page) {
  const control = page.locator("[data-open-invitation-control]");
  await expect(control).toBeEnabled({ timeout: 45_000 });
  await control.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator(template)).toBeVisible({ timeout: 20_000 });
  await stopAutoScroll(page);
}

test.beforeEach(async ({ page }) => {
  await page.route(/googletagmanager|google-analytics/, (route) => route.abort());
});

test("opening, album, map, forms, ceremonies, and gift stay functional", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(demo, { waitUntil: "domcontentloaded", timeout: 60_000 });

  await expect(page.locator('[data-opening-static-clip="card"]')).toHaveCount(1, {
    timeout: 45_000,
  });
  await openInvitation(page);

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await expect(page.locator("[data-template-ceremonies]")).toHaveCount(1);
  await expect(page.locator("[data-template-ceremony-item]")).toHaveCount(2);

  const album = page.locator('[data-hoa-mai-section="gallery"]');
  await album.getByRole("button", { name: "Album cưới" }).click();
  const lightbox = page.getByTestId("wedding-lightbox");
  await expect(lightbox).toBeVisible();
  await lightbox.getByRole("button", { name: "Đóng album" }).click();
  await expect(lightbox).toHaveCount(0);

  const map = page.locator('[data-hoa-mai-section="map"]');
  await expect(map.locator("iframe")).toHaveAttribute("src", /google\.com\/maps\/embed/);
  await expect(map.getByRole("link", { name: "Chỉ đường" })).toHaveAttribute(
    "href",
    /google\.com\/maps\/dir/,
  );

  const rsvp = page.locator('[data-hoa-mai-section="rsvp"]');
  await expect(rsvp.getByText(/Khách mời sẽ có thể xác nhận tham dự/)).toBeVisible();

  const wishes = page.locator('[data-hoa-mai-section="wishes"]');
  await expect(wishes.getByPlaceholder("Tên của bạn")).toBeDisabled();
  await expect(wishes.getByRole("button", { name: "Gửi lời chúc" })).toBeDisabled();
  await expect(wishes.getByText(/Biểu mẫu sẽ hoạt động sau khi thiệp được xuất bản/)).toBeVisible();

  const gift = page.locator('[data-hoa-mai-section="gift"]');
  await gift.getByTestId("gift-envelope").click();
  await expect(page.getByTestId("gift-bank-card")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Lưu QR" })).toHaveCount(2);
  await page.locator(".gift-modal-panel").getByRole("button", { name: "Đóng" }).click();
  await expect(page.locator(".gift-modal-panel")).toHaveCount(0);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 700 },
] as const) {
  test(`${viewport.width}px keeps one centered rail without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${demo}/capture`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator(template)).toBeVisible({ timeout: 30_000 });

    const layout = await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>("[data-hoa-mai-template]");
      const sections = [...document.querySelectorAll<HTMLElement>("[data-hoa-mai-section]")];
      return {
        documentWidth: document.documentElement.scrollWidth,
        railCounts: sections.map((section) => section.children.length),
        rootWidth: root?.getBoundingClientRect().width ?? 0,
        viewportWidth: window.innerWidth,
      };
    });

    expect(layout.documentWidth).toBe(viewport.width);
    expect(layout.rootWidth).toBeLessThanOrEqual(viewport.width);
    expect(layout.railCounts.every((count) => count >= 1)).toBe(true);
    await expect(page.locator("[data-template-ceremony-item]")).toHaveCount(2);
  });
}

test("320px tolerates long names, a three-line address, six calendar rows, and twelve wishes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(`${demo}/capture`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page.locator(template)).toBeVisible({ timeout: 30_000 });

  await page.evaluate(() => {
    const familyNames = document.querySelectorAll<HTMLElement>(
      '[data-hoa-mai-section="families"] h3',
    );
    familyNames.forEach((heading, index) => {
      heading.textContent = index % 2 === 0
        ? "Nguyễn Hoàng Minh Khang Phúc"
        : "Trần Thị Ngọc An Nhiên";
    });
    const address = document.querySelector<HTMLElement>(
      '[data-hoa-mai-section="map"] p',
    );
    if (address) {
      address.textContent = "Trung tâm Hội nghị Riverside Palace\n360D Bến Vân Đồn, Quận 4\nThành phố Hồ Chí Minh";
    }
    const list = document.querySelector<HTMLElement>('[data-testid="wish-list"]');
    const wish = list?.firstElementChild;
    if (list && wish) {
      for (let index = 1; index < 12; index += 1) {
        const copy = wish.cloneNode(true) as HTMLElement;
        copy.setAttribute("data-stress-wish", String(index + 1));
        list.append(copy);
      }
    }
  });

  // Six leading blanks plus 30 days make the final date land on calendar row six.
  await expect(page.locator('[data-hoa-mai-section="date"] span[class*="calendarDay"]')).toHaveCount(36);
  await expect(page.locator('[data-testid="wish-list"] > *')).toHaveCount(12);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
