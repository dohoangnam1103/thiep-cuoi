import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { expect, test, type Page } from "@playwright/test";

import { getDb } from "./helpers/db";
import { cleanupUser, createInvitation, createUser, publishInvitation } from "./helpers/fixtures";

const users: string[] = [];
const photoUrl = (index: number) => `/chungdoi/images/gallery/minimalism-purple/photo-1.jpg?coverflow-test=${index}`;
let photo: Buffer;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test.beforeAll(async () => {
  photo = await sharp({ create: { width: 3600, height: 2400, channels: 3, background: "#c79d81" } }).webp().toBuffer();
});

test.afterEach(() => {
  while (users.length) cleanupUser(users.pop()!);
});

async function openInvitation(page: Page, count = 25, deferAlbum = false) {
  const user = createUser();
  users.push(user.id);
  const invitation = createInvitation(user.id, { templateId: "song-hy-red" });
  const slug = publishInvitation(invitation.id, {
    groomFullName: "Trần Minh Quốc", brideFullName: "Nguyễn Kiều Tiên",
    date: "2027-12-02", albumLayout: "coverflow", heroImage: "/chungdoi/icon.png",
  });
  const insert = getDb().prepare("INSERT INTO GalleryPhoto (id, invitationId, url, sortOrder) VALUES (?, ?, ?, ?)");
  for (let index = 0; index < count; index++) insert.run(randomUUID(), invitation.id, photoUrl(index), index);
  const requested = new Set<string>();
  await page.route("**/*coverflow-test=*", route => {
    requested.add(route.request().url());
    return route.fulfill({ body: photo, contentType: "image/webp" });
  });
  await page.goto(`/thiep/${slug}`);
  if (deferAlbum) {
    // Deliberately place the album well below the preload margin. Opening-cover
    // animations and late fonts must not determine the network assertion.
    await page.addStyleTag({ content: '[data-invitation-album="coverflow"] { margin-top: 2000px; }' });
  }
  const open = page.getByRole("button", { name: "Mở thiệp", exact: true }).first();
  await expect(open).toBeEnabled();
  await open.press("Enter");
  const album = page.locator('[data-invitation-album="coverflow"]');
  const autoScroll = page.getByTestId("invitation-auto-scroll-toggle");
  await expect(autoScroll).toHaveAttribute("aria-pressed", "true");
  await autoScroll.click();
  await expect(autoScroll).toHaveAttribute("aria-pressed", "false");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  if (count) {
    await expect(album).toBeVisible();
  }
  return { album, requested };
}

for (const width of [1440, 768, 390, 320]) {
  test(`coverflow bounds full-resolution images and keeps navigation at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 600 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const { album, requested } = await openInvitation(page, 25, true);
    await expect(album.getByRole("button", { name: /^Tới ảnh / })).toHaveCount(25);
    // Nothing is fetched while the album remains below the preload margin.
    expect(await album.evaluate(node => node.getBoundingClientRect().top)).toBeGreaterThan(1200);
    expect(requested.size).toBe(0);
    await album.scrollIntoViewIfNeeded();
    await expect(album.locator("img")).toHaveCount(9);
    await expect.poll(() => album.locator("img").evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).naturalWidth === 3600))).toBe(true);
    expect(requested.size).toBe(9);
    expect(await album.locator("img").first().evaluate(node => (node as HTMLImageElement).naturalHeight)).toBe(2400);
    expect(await album.getByRole("button", { name: "Xem ảnh cưới 1", exact: true }).evaluate(node => getComputedStyle(node).transitionProperty)).toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await album.screenshot({ path: testInfo.outputPath(`album-${width}.png`) });

    // Jumping outside the rendered window must still address the original index.
    await album.getByRole("button", { name: "Tới ảnh 25", exact: true }).click();
    await expect(album.getByRole("button", { name: "Xem ảnh cưới 25", exact: true })).toBeVisible();
    await expect(album.locator("img")).toHaveCount(9);
    await album.getByRole("button", { name: "Tới ảnh 25", exact: true }).focus();
    await page.keyboard.press("Enter");
    await album.getByRole("button", { name: "Xem ảnh cưới 25", exact: true }).click();
    const lightbox = page.getByTestId("wedding-lightbox");
    await expect(lightbox).toBeVisible();
    await expect(lightbox.getByTestId("wedding-lightbox-image")).toHaveAttribute("src", photoUrl(24));
    await page.keyboard.press("ArrowRight");
    await expect(lightbox.getByTestId("wedding-lightbox-image")).toHaveAttribute("src", photoUrl(0));
    await page.keyboard.press("Escape");
    await expect(lightbox).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("coverflow pauses outside the viewport, on scroll and for reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const { album } = await openInvitation(page);
  await album.scrollIntoViewIfNeeded();
  await expect(album.locator("img")).toHaveCount(9);
  await expect(album.getByRole("button", { name: "Xem ảnh cưới 1", exact: true })).toBeVisible();
  // Install the clock after the opening animation and independent auto-scroll stop.
  await page.clock.install();
  await page.clock.runFor(4100);
  await expect(album.getByRole("button", { name: "Xem ảnh cưới 2", exact: true })).toBeVisible();
  await page.clock.runFor(3000);
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  await page.clock.runFor(1500);
  await expect(album.getByRole("button", { name: "Xem ảnh cưới 2", exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.clock.runFor(100);
  await page.clock.runFor(5000);
  await expect(album.getByRole("button", { name: "Xem ảnh cưới 2", exact: true })).toBeAttached();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await album.scrollIntoViewIfNeeded();
  await page.clock.runFor(5000);
  await expect(album.getByRole("button", { name: "Xem ảnh cưới 2", exact: true })).toBeVisible();
  // Manual navigation continues to work with reduced motion enabled.
  await album.getByRole("button", { name: "Tới ảnh 12", exact: true }).click();
  await expect(album.getByRole("button", { name: "Xem ảnh cưới 12", exact: true })).toBeVisible();
});

test("coverflow handles single and empty albums", async ({ page }) => {
  const { album } = await openInvitation(page, 1);
  await album.scrollIntoViewIfNeeded();
  await expect(album.locator("img")).toHaveCount(1);
  await expect(album.getByRole("button", { name: /^Tới ảnh / })).toHaveCount(0);
  const empty = await openInvitation(page, 0);
  await expect(empty.album).toHaveCount(0);
});

test("coverflow swipes wrap without opening the lightbox or capturing vertical gestures", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  const { album } = await openInvitation(page);
  await album.scrollIntoViewIfNeeded();
  await album.getByRole("button", { name: "Tới ảnh 25", exact: true }).click();
  const stage = album.locator(".touch-pan-y");
  const pointer = { pointerId: 1, isPrimary: true, pointerType: "touch" };
  await stage.dispatchEvent("pointerdown", { ...pointer, clientX: 260, clientY: 200 });
  await stage.dispatchEvent("pointerup", { ...pointer, clientX: 100, clientY: 200 });
  await expect(album.getByRole("button", { name: "Xem ảnh cưới 1", exact: true })).toBeVisible();
  // The compatibility click after a swipe must not select/open a card.
  await album.getByRole("button", { name: "Chuyển tới ảnh 25", exact: true }).dispatchEvent("click");
  await expect(album.getByRole("button", { name: "Xem ảnh cưới 1", exact: true })).toBeVisible();
  await expect(page.getByTestId("wedding-lightbox")).toHaveCount(0);
  await stage.dispatchEvent("pointerdown", { ...pointer, clientX: 200, clientY: 200 });
  await stage.dispatchEvent("pointerup", { ...pointer, clientX: 190, clientY: 100 });
  await expect(album.getByRole("button", { name: "Xem ảnh cưới 1", exact: true })).toBeVisible();
  await stage.dispatchEvent("pointerdown", { ...pointer, clientX: 260, clientY: 200 });
  await stage.dispatchEvent("pointercancel", pointer);
  await stage.dispatchEvent("pointerup", { ...pointer, clientX: 100, clientY: 200 });
  await expect(album.getByRole("button", { name: "Xem ảnh cưới 1", exact: true })).toBeVisible();
});
