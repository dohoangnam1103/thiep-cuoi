import { chromium } from "playwright";

const url = process.env.URL || "http://localhost:3000/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle" });

const carousel = page.locator('section:has-text("Mẫu thiệp cưới đẹp nhất")').first();
await carousel.scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await carousel.screenshot({ path: "scripts/_carousel.png" });

const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.waitForTimeout(300);
console.log("errors:", errors.length ? errors : "none");

await browser.close();
