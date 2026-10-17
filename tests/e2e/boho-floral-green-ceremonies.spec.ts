import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

import { getDb } from "./helpers/db";
import { cleanupUser, createInvitation, createUser, publishInvitation } from "./helpers/fixtures";

for (const width of [1440, 768, 390, 320]) {
  test(`Hoa Mộc Xanh: both ceremonies stay in the native section at ${width}px`, async ({ page }) => {
    const user = createUser();
    const invitation = createInvitation(user.id, { templateId: "boho-floral-green" });
    const db = getDb();
    const slug = publishInvitation(invitation.id, {
      groomFullName: "Trần Nhựt Khánh", brideFullName: "Nguyễn Thị Hoàng Thi",
      groomShortName: "Nhựt Khánh", brideShortName: "Hoàng Thi",
      date: "2026-11-07", time: "11:00", banquetTime: "11:00",
      ceremonyHeader: "LỄ VU QUY SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA", ceremonyDate: "2026-11-07", ceremonyTime: "07:00",
      heroImage: "/chungdoi/images/themes/boho-floral-green/hero-bride.webp",
      heroImage2: "/chungdoi/images/themes/boho-floral-green/hero-groom.webp",
    });
    for (const [index, ceremony] of [
      { title: "LỄ VU QUY SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA", date: "2026-11-07", time: "07:00" },
      { title: "LỄ TÂN HÔN SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA", date: "2026-11-08", time: "09:15" },
    ].entries()) {
      db.prepare("INSERT INTO CeremonyItem (id, invitationId, title, date, time, sortOrder) VALUES (?, ?, ?, ?, ?, ?)")
        .run(randomUUID(), invitation.id, ceremony.title, ceremony.date, ceremony.time, index);
    }
    db.prepare("INSERT INTO GalleryPhoto (id, invitationId, url, sortOrder) VALUES (?, ?, ?, ?)")
      .run(randomUUID(), invitation.id, "/chungdoi/images/gallery/boho-floral-green/photo-1.webp", 0);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/thiep/${slug}`, { waitUntil: "domcontentloaded" });
      const open = page.locator("[data-open-invitation-control]");
      await expect(open).toBeEnabled({ timeout: 45_000 });
      await open.evaluate((button: HTMLButtonElement) => button.click());
      const ceremonies = page.locator("[data-boho-green-ceremonies]");
      await expect(ceremonies).toBeVisible();
      const toggle = page.getByTestId("invitation-auto-scroll-toggle");
      if (await toggle.count() && await toggle.getAttribute("aria-pressed") === "true") await toggle.click();
      const items = ceremonies.locator("[data-template-ceremony-item]");
      await expect(items).toHaveCount(2);
      await expect(items.nth(0)).toContainText("07:00");
      await expect(items.nth(0)).toContainText("Thứ Bảy");
      await expect(items.nth(1)).toContainText("09:15");
      await expect(items.nth(1)).toContainText("Chủ Nhật");
      await expect(page.locator("[data-additional-ceremonies]")).toHaveCount(0);
      const album = page.getByRole("heading", { name: "Album Ảnh Cưới", exact: true });
      const first = await items.nth(0).boundingBox();
      const second = await items.nth(1).boundingBox();
      const albumBox = await album.boundingBox();
      expect(first!.y + first!.height).toBeLessThan(second!.y);
      expect(second!.y + second!.height).toBeLessThan(albumBox!.y);
      expect(first!.width).toBeCloseTo(second!.width, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await page.evaluate(() => document.fonts.ready);
      await ceremonies.scrollIntoViewIfNeeded();
      const evidence = path.join(process.cwd(), "docs/research/boho-floral-green-ceremonies");
      mkdirSync(evidence, { recursive: true });
      await ceremonies.screenshot({ path: path.join(evidence, `local-${width}-ceremonies.png`) });
      expect(errors).toEqual([]);
    } finally {
      cleanupUser(user.id);
    }
  });
}
