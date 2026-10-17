import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

import { getDb } from "./helpers/db";
import { cleanupUser, createInvitation, createUser, publishInvitation } from "./helpers/fixtures";

for (const width of [1440, 768, 390, 320]) {
  test(`Nhật Bình Đỏ: both ceremonies stay in the native section at ${width}px`, async ({ page }) => {
    const user = createUser();
    const invitation = createInvitation(user.id, { templateId: "nhat-binh-red" });
    const db = getDb();
    const slug = publishInvitation(invitation.id, {
      groomFullName: "Trần Nhựt Khánh", brideFullName: "Nguyễn Thị Hoàng Thi",
      groomShortName: "Nhựt Khánh", brideShortName: "Hoàng Thi",
      date: "2026-11-07", time: "11:00", banquetTime: "11:00",
      ceremonyHeader: "LỄ VU QUY SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA", ceremonyDate: "2026-11-07", ceremonyTime: "07:00",
    });
    for (const [index, ceremony] of [
      { title: "LỄ VU QUY SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA", date: "2026-11-07", time: "07:00" },
      { title: "LỄ TÂN HÔN SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA", date: "2026-11-08", time: "09:15" },
    ].entries()) {
      db.prepare("INSERT INTO CeremonyItem (id, invitationId, title, date, time, sortOrder) VALUES (?, ?, ?, ?, ?, ?)")
        .run(randomUUID(), invitation.id, ceremony.title, ceremony.date, ceremony.time, index);
    }
    db.prepare("INSERT INTO GalleryPhoto (id, invitationId, url, sortOrder) VALUES (?, ?, ?, ?)")
      .run(randomUUID(), invitation.id, "/chungdoi/images/gallery/nhat-binh-red/photo-1.webp", 0);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/thiep/${slug}`, { waitUntil: "domcontentloaded" });
      const open = page.locator("[data-open-invitation-control]");
      await expect(open).toBeEnabled({ timeout: 45_000 });
      const ceremonies = page.locator("[data-nhat-binh-ceremonies]");
      // The 2D cover is enabled in server HTML before hydration. Retry the
      // user interaction until its visible result appears; do not depend on
      // cover-art warming, which is separate from the ceremony layout.
      await expect(async () => {
        if (await open.count()) {
          await open.focus();
          await open.press("Enter");
        }
        await expect(ceremonies).toBeVisible({ timeout: 1_000 });
      }).toPass({ timeout: 45_000 });
      const toggle = page.getByTestId("invitation-auto-scroll-toggle");
      if (await toggle.count() && await toggle.getAttribute("aria-pressed") === "true") await toggle.click();
      const items = ceremonies.locator("[data-template-ceremony-item]");
      await expect(items).toHaveCount(2);
      await expect(items.nth(0)).toContainText("07:00");
      await expect(items.nth(0)).toContainText("Thứ Bảy");
      await expect(items.nth(1)).toContainText("09:15");
      await expect(items.nth(1)).toContainText("Chủ Nhật");
      await expect(page.locator("[data-additional-ceremonies]")).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      // Read all rectangles in one frame: cover auto-scroll can still settle
      // between separate protocol calls, changing viewport-relative positions.
      const layout = await ceremonies.evaluate((region) => {
        const items = region.querySelectorAll("[data-template-ceremony-item]");
        const rect = (element: Element) => {
          const { y, width, height } = element.getBoundingClientRect();
          return { y, width, height };
        };
        const album = Array.from(document.querySelectorAll("h2")).find((heading) => heading.textContent === "Album Ảnh Cưới");
        const footer = document.querySelector("[data-template-footer]");
        if (!album || !footer) throw new Error("Missing album or footer");
        return { first: rect(items[0]), second: rect(items[1]), album: rect(album), footer: rect(footer) };
      });
      expect(layout.first.y + layout.first.height).toBeLessThan(layout.second.y);
      expect(layout.second.y + layout.second.height).toBeLessThan(layout.album.y);
      expect(layout.second.y + layout.second.height).toBeLessThan(layout.footer.y);
      expect(layout.first.width).toBeCloseTo(layout.second.width, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await ceremonies.scrollIntoViewIfNeeded();
      const evidence = path.join(process.cwd(), "docs/research/nhat-binh-red-ceremonies");
      mkdirSync(evidence, { recursive: true });
      await ceremonies.screenshot({ path: path.join(evidence, `local-${width}-ceremonies.png`) });
      expect(errors).toEqual([]);
    } finally {
      cleanupUser(user.id);
    }
  });
}
