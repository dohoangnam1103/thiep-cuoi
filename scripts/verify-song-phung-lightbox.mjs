import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const url = process.env.TEST_URL || "http://localhost:3000/mau-thiep/song-phung-do/demo";
const executablePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto(url, { waitUntil: "networkidle" });
  const openButton = page.getByRole("button", { name: "Mở thiệp" });
  await openButton.click();
  await openButton.waitFor({ state: "detached", timeout: 3000 });
  await page.getByRole("heading", { name: "Album Ảnh Cưới" }).waitFor({ state: "visible", timeout: 3000 });
  await page.mouse.click(10, 10);
  await page.evaluate(() => document.querySelector('img[alt="Wedding photo 1"]')?.scrollIntoView({ block: "center" }));
  await page.getByRole("img", { name: "Wedding photo 1" }).click();

  const lightboxImage = page.locator('div[class*="fixed"][class*="z-[100]"] img[alt="Wedding photo 1"]');
  await lightboxImage.waitFor({ state: "visible", timeout: 2000 });
  assert.equal(await lightboxImage.isVisible(), true);

  await page.getByRole("button", { name: "Ảnh sau" }).click();
  await page.locator('div[class*="fixed"][class*="z-[100]"] img[alt="Wedding photo 2"]').waitFor({ state: "visible", timeout: 2000 });

  await page.keyboard.press("Escape");
  await page.locator('div[class*="fixed"][class*="z-[100]"]').waitFor({ state: "detached", timeout: 2000 });
} finally {
  await browser.close();
}
