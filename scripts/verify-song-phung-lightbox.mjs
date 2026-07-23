import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const url = process.env.TEST_URL || "http://localhost:3000/thiep/quynh-anh-gia-khanh-t35fx6";
const executablePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator("[data-open-invitation-control]").evaluate((button) => {
    button.click();
  });
  await page.locator('div.fixed.inset-0.z-\\[90\\]').waitFor({ state: "detached", timeout: 5000 });
  await page.getByRole("heading", { name: "Album Ảnh Cưới" }).waitFor({ state: "visible", timeout: 5000 });
  await page.mouse.click(10, 10);
  const albumImage = page.getByRole("img", { name: "Ảnh cưới 1" });
  await albumImage.evaluate((image) => image.scrollIntoView({ block: "center", behavior: "instant" }));
  await albumImage.click({ force: true });

  const lightbox = page.locator('div[class*="fixed"][class*="z-[100]"]').filter({
    has: page.getByRole("img", { name: "Wedding photo 1" }),
  });
  const lightboxImage = lightbox.getByRole("img", { name: "Wedding photo 1" });
  await lightboxImage.waitFor({ state: "visible", timeout: 2000 });
  assert.equal(await lightboxImage.isVisible(), true);

  const lightboxRoot = await lightbox.elementHandle();
  assert.ok(lightboxRoot, "lightbox root must be present");

  const floatingControls = [
    page.getByRole("button", { name: "Khoảnh khắc" }),
    page.getByRole("button", { name: "Xác nhận tham dự" }),
    page.getByRole("button", { name: /^(Tạm dừng|Phát) nhạc$/ }),
  ];
  for (const control of floatingControls) {
    const coveredByLightbox = await control.evaluate((element, lightboxElement) => {
      const rect = element.getBoundingClientRect();
      const topAppElement = document.elementsFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      ).find((candidate) => candidate.closest("nextjs-portal") === null);
      return topAppElement !== undefined && lightboxElement instanceof HTMLElement && lightboxElement.contains(topAppElement);
    }, lightboxRoot);
    assert.equal(coveredByLightbox, true, `${await control.getAttribute("aria-label") ?? await control.textContent()} must stay below the lightbox`);
  }

  await page.getByRole("button", { name: "Ảnh sau" }).click();
  await page.locator('div[class*="fixed"][class*="z-[100]"] img[alt="Wedding photo 2"]').waitFor({ state: "visible", timeout: 2000 });

  await page.keyboard.press("Escape");
  await page.locator('div[class*="fixed"][class*="z-[100]"]').waitFor({ state: "detached", timeout: 2000 });
} finally {
  await browser.close();
}
