import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.UYEN_UONG_BASE_URL || "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "This interaction audit is local only.");
const output = "docs/research/uyen-uong";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 1440, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce", locale: "vi-VN" });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/mau-thiep/uyen-uong/demo`, { waitUntil: "networkidle" });
    const cover = page.locator("[data-uyen-cover]");
    await cover.waitFor({ state: "visible" });
    await cover.screenshot({ path: `${output}/${width}-cover.png` });
    await cover.getByRole("button", { name: "Mở thiệp", exact: true }).click();
    await page.waitForTimeout(3500);
    const toggle = page.getByTestId("invitation-auto-scroll-toggle");
    if (await toggle.count() && await toggle.getAttribute("aria-pressed") === "true") await toggle.click();
    // A real wheel event also cancels the delayed auto-scroll through the app's handler.
    await page.mouse.wheel(0, 1);
    await page.waitForTimeout(500);
    assert.equal(await page.locator('[data-invitation-detail="visible"]').count(), 1);
    const article = page.locator('[data-template="uyen-uong"]');
    assert.equal(await article.locator("h1").innerText(), "Minh Quân\nvà\nNgọc Uyên");
    // Capture route removes cover/control chrome without modifying the rendered design.
    await page.goto(`${base}/mau-thiep/uyen-uong/demo/capture`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "nextjs-portal { display: none; }" });
    await page.evaluate(async () => { await document.fonts.ready; for (const img of document.images) img.loading = "eager"; });
    await page.waitForTimeout(800);
    const sections = await page.locator("[data-uyen-section]").all();
    for (const section of sections) {
      const name = await section.getAttribute("data-uyen-section");
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await section.screenshot({ path: `${output}/${width}-${name}.png`, animations: "disabled" });
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `No horizontal overflow at ${width}`);
    const calendarCells = page.getByTestId("uyen-calendar").locator(".grid > span");
    assert.equal(Math.ceil(((await calendarCells.count()) - 7) / 7), 6, "November 2026 occupies six calendar rows");
    console.log(`Sections captured ${width}`);
    const album = page.locator('[data-uyen-section="album"]');
    await album.locator("button").first().click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Ảnh sau", exact: true }).click();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    console.log(`Album passed ${width}`);
    const gifts = page.getByTestId("gift-envelope");
    assert.equal(await gifts.count(), 2);
    for (let i = 0; i < 2; i++) {
      await gifts.nth(i).click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      assert.ok((await dialog.innerText()).includes(i === 0 ? "Nguyễn Minh Quân" : "Trần Ngọc Uyên"));
      await dialog.screenshot({ path: `${output}/${width}-gift-${i}.png` });
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert.equal(await gifts.nth(i).evaluate((el) => el === document.activeElement), true, "Focus returns to envelope");
    }
    console.log(`Gifts passed ${width}`);
    const wishSection = page.locator('[data-uyen-section="guestbook"]');
    assert.equal(await wishSection.locator('input[name="name"]').isDisabled(), true);
    assert.equal(await wishSection.locator("textarea").first().isDisabled(), true);
    assert.equal(await wishSection.getByRole("button", { name: "Gửi lời chúc", exact: true }).isDisabled(), true, "Demo never submits a real wish");
    assert.ok((await wishSection.innerText()).includes("Biểu mẫu sẽ hoạt động sau khi thiệp được xuất bản."));
    const broken = await page.locator('[data-template="uyen-uong"] img').evaluateAll((imgs) => imgs.filter((img) => img.complete && !img.naturalWidth).map((img) => img.src));
    assert.deepEqual(broken, []);
    assert.deepEqual(errors, []);
    results.push({ width, sections: sections.length, cover: true, calendarSixRows: true, album: true, giftDialogsAndFocus: true, previewForm: true, overflow: false, brokenImages: broken, errors });
    await context.close();
    console.log(`Passed ${width}px`);
  }
  await writeFile(`${output}/audit.json`, JSON.stringify({ at: new Date().toISOString(), base, results }, null, 2));
} finally {
  await browser.close();
}
