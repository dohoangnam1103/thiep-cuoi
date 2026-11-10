import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";

import { cleanupUser, createInvitation, createUser, publishInvitation } from "./helpers/fixtures";

test("listing keeps its initial HTML below 80 KiB compressed and opens translated previews", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/MISSING_MESSAGE|INVALID_MESSAGE|FORMATTING_ERROR/.test(message.text())) errors.push(message.text());
  });

  const response = await page.goto("/mau-thiep");
  expect(response?.ok()).toBe(true);
  expect(gzipSync(await response!.body()).length).toBeLessThan(80 * 1024);
  await page.locator('button[data-ga-event="preview_template"]').first().click();
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await modal.getByRole("button", { name: /Đóng/ }).click();
  await expect(modal).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("guide video fetches its media near the viewport and plays", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const mediaRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/wedding-guide-720p")) mediaRequests.push(request.url());
  });

  await page.goto("/", { waitUntil: "load" });
  const video = page.locator("video").first();
  await expect(video).toHaveAttribute("preload", "none");
  await expect(video).not.toHaveAttribute("poster");
  expect(mediaRequests).toEqual([]);

  await video.scrollIntoViewIfNeeded();
  await expect(video).toHaveAttribute("poster", /wedding-guide-720p-poster\.webp$/);
  await expect.poll(() => mediaRequests.some((url) => url.includes("poster.webp"))).toBe(true);
  await video.evaluate(async (element: HTMLVideoElement) => {
    element.muted = true;
    await element.play();
  });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0);
  await video.evaluate((element: HTMLVideoElement) => element.pause());
});

for (const [templateId, filename] of [
  ["royal-red", "flower"],
  ["minimalism-dark-red", "flower2-decoration"],
]) {
  test(`${templateId} selects mobile artwork, restores desktop artwork and opens`, async ({ page }) => {
    const user = createUser();
    try {
      const invitation = createInvitation(user.id, { templateId });
      const slug = publishInvitation(invitation.id, {
        brideFullName: "Trần An Nhiên",
        groomFullName: "Nguyễn Minh Khôi",
      });
      await page.setViewportSize({ width: 390, height: 844 });
      const requests: string[] = [];
      page.on("request", (request) => requests.push(request.url()));
      await page.goto(`/thiep/${slug}`);
      const cover = page.locator('[data-envelope-renderer="2d"]');
      const image = cover.locator(`picture img[src$="/${filename}.webp"]`).first();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.currentSrc))
        .toContain(`/${filename}-mobile.webp`);
      expect(requests.some((url) => url.endsWith(`/${filename}.webp`))).toBe(false);

      await page.setViewportSize({ width: 1440, height: 900 });
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.currentSrc))
        .toMatch(new RegExp(`/${filename}\\.webp$`));
      await cover.locator("[data-open-btn]").focus();
      await page.keyboard.press("Enter");
      await expect(cover).toHaveCount(0);
      await expect(page.locator('[data-invitation-detail="visible"]')).toBeAttached();
    } finally {
      cleanupUser(user.id);
    }
  });
}
