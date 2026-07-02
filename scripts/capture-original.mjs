import { chromium } from "playwright-core";
import { writeFile } from "node:fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.argv[2] || "https://chungdoi.com/mau-thiep/song-phung-do/demo";
const OUT = process.argv[3] || "/tmp/orig";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);

await page.screenshot({ path: `${OUT}-cover.png` });
console.log("cover shot done");

// Click the open button (VN "Mở thiệp" / EN "Open Invitation")
const btn = page.getByRole("button", { name: /Mở thiệp|Open Invitation|Xác nhận/i }).first();
try {
  await btn.click({ timeout: 8000, force: true });
} catch (e) {
  console.log("button click failed:", e.message);
  // try any button
  await page.locator("button").first().click({ force: true }).catch(() => {});
}
await page.waitForTimeout(3500);

await page.screenshot({ path: `${OUT}-opened-top.png` });
console.log("opened top shot done");

// Full page screenshot of the opened invitation
await page.screenshot({ path: `${OUT}-opened-full.png`, fullPage: true });
console.log("opened full shot done");

// Dump the opened invitation DOM (strip scripts/styles noise but keep structure)
const html = await page.content();
await writeFile(`${OUT}-opened.html`, html);
console.log("dom dumped, length", html.length);

await browser.close();
