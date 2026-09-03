import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import sharp from "sharp";
import { rasterizeEmbeddedFrames } from "./capture-embedded-frames.mjs";

let browser;
before(async () => {
  const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const executablePath = process.env.CHROME_PATH || (existsSync(macChrome) ? macChrome : undefined);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
});
after(async () => { await browser?.close(); });

test("rejects an API/referrer error before turning it into a thumbnail", async () => {
  const page = await browser.newPage();
  try {
    await page.route("https://www.google.com/maps/embed/**", (route) => route.fulfill({
      contentType: "text/html",
      body: "<body>Google Maps Platform rejected your request. The provided API key is invalid.</body>",
    }));
    await page.setContent('<iframe src="https://www.google.com/maps/embed/test-error"></iframe>');
    await assert.rejects(rasterizeEmbeddedFrames(page), /Google Maps báo lỗi/);
    assert.equal(await page.locator("[data-captured-iframe]").count(), 0);
  } finally { await page.close(); }
});

test("waits for map tiles and captures every iframe without shifting indices", async () => {
  const tile = await sharp({ create: { width: 256, height: 256, channels: 3, background: "#85b88d" } }).png().toBuffer();
  const page = await browser.newPage();
  try {
    await page.route("https://www.google.com/maps/embed/**", (route) => route.fulfill({
      contentType: "text/html",
      body: `<body style="margin:0"><img width="256" height="256" src="data:image/png;base64,${tile.toString("base64")}"></body>`,
    }));
    await page.setContent([1, 2].map((n) => `<iframe width="300" height="300" style="opacity:${n === 2 ? 0.25 : 1}" src="https://www.google.com/maps/embed/test-${n}"></iframe>`).join(""));
    const translucentBefore = await page.locator("iframe").nth(1).screenshot();
    const audit = await rasterizeEmbeddedFrames(page);
    assert.equal(audit.length, 2);
    assert.ok(audit.every((entry) => entry.googleMap && entry.loadedTiles === 1));
    assert.equal(await page.locator("iframe").count(), 0);
    assert.equal(await page.locator("[data-captured-iframe]").count(), 2);
    assert.ok(await page.locator("[data-captured-iframe]").evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)));
    const translucentAfter = await page.locator("[data-captured-iframe]").nth(1).screenshot();
    const beforePixels = await sharp(translucentBefore).raw().toBuffer();
    const afterPixels = await sharp(translucentAfter).raw().toBuffer();
    assert.deepEqual(afterPixels, beforePixels, "rasterizing must not apply opacity twice");
  } finally { await page.close(); }
});
