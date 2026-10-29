import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";
import { cleanupUser, createInvitation, createUser } from "./helpers/fixtures";
import { getDb } from "./helpers/db";

type Uploaded = { name: string; type: string; bytes: Buffer };
const users: string[] = [];
const savedFiles: string[] = [];
let photo: Buffer;
let portrait: Buffer;
let transparent: Buffer;

test.beforeAll(async () => {
  photo = await sharp(randomBytes(3200 * 2400 * 3), { raw: { width: 3200, height: 2400, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
  portrait = await sharp(randomBytes(2400 * 1600 * 3), { raw: { width: 2400, height: 1600, channels: 3 } }).jpeg({ quality: 95 }).withMetadata({ orientation: 6 }).toBuffer();
  const width = 2200, height = 1800;
  const pixels = randomBytes(width * height * 4);
  for (let i = 0; i < width * height; i++) pixels[i * 4 + 3] = i % width < width / 2 ? 0 : 255;
  transparent = await sharp(pixels, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 0 }).toBuffer();
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === "passed" && /\/editor2\/[^/]+$/.test(new URL(page.url()).pathname)) {
    await expect(page.getByRole("status").first()).toHaveText("Đã lưu");
  }
  while (users.length) cleanupUser(users.pop()!);
  await Promise.all(savedFiles.splice(0).map(filename => rm(path.join(process.cwd(), "tests/e2e/.data/editor-uploads", filename), { force: true })));
});

async function openAlbum(page: Page, context: Parameters<typeof loginAsUser>[0], legacy = false) {
  const user = createUser(); users.push(user.id);
  const invitation = createInvitation(user.id, { templateId: "song-hy-red" });
  getDb().prepare("UPDATE InvitationContent SET brideFullName = ?, groomFullName = ?, date = ? WHERE invitationId = ?").run("Nguyễn Mai", "Trần Nam", "2026-11-29", invitation.id);
  await loginAsUser(context, user.id);
  await page.goto(`/${legacy ? "editor" : "editor2"}/${invitation.id}`);
  if (legacy) return page.locator('input[type="file"][multiple]');
  await page.getByRole("button", { name: "Nội dung", exact: true }).click();
  await page.getByRole("button", { name: "Album ảnh cưới", exact: true }).click();
  return page.locator('input[type="file"]');
}

async function observeUploads(page: Page) {
  const sent: Uploaded[] = [];
  // WebKit's protocol may omit multipart file bytes from postDataBuffer.
  // Capture the actual File passed to fetch consistently in both engines.
  await page.exposeFunction("captureImageUpload", (file: { name: string; type: string; base64: string }) => {
    sent.push({ name: file.name, type: file.type, bytes: Buffer.from(file.base64, "base64") });
  });
  await page.evaluate(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/api/upload") && init?.body instanceof FormData) {
        const file = init.body.get("file");
        if (file instanceof File) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(",")[1]);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
          await (window as typeof window & { captureImageUpload: (file: { name: string; type: string; base64: string }) => Promise<void> })
            .captureImageUpload({ name: file.name, type: file.type, base64 });
        }
      }
      return originalFetch.call(window, input, init);
    };
  });
  page.on("response", response => {
    if (response.url().endsWith("/api/upload") && response.ok()) void response.json().then((result: { url: string }) => savedFiles.push(path.basename(result.url)));
  });
  return sent;
}

async function canEncodeWebp(page: Page) {
  return page.evaluate(() => new Promise<boolean>(resolve => {
    const canvas = document.createElement("canvas"); canvas.width = 1; canvas.height = 1;
    canvas.toBlob(blob => resolve(blob?.type === "image/webp"), "image/webp");
  }));
}

for (const width of [1440, 390]) test(`album sends a compressed image before upload at ${width}px`, async ({ page, context }) => {
  await page.setViewportSize({ width, height: 900 });
  const input = await openAlbum(page, context);
  const sent = await observeUploads(page);
  await input.setInputFiles({ name: "camera.JPG", mimeType: "image/jpeg", buffer: photo });
  await expect(page.locator(".e2-photo-row img")).toHaveCount(1);
  expect(sent).toHaveLength(1);
  const webp = await canEncodeWebp(page);
  expect(sent[0].name).toBe(webp ? "camera.webp" : "camera.jpg");
  expect(sent[0].type).toBe(webp ? "image/webp" : "image/jpeg");
  expect(sent[0].bytes.length).toBeLessThan(photo.length * .25);
  expect(await sharp(sent[0].bytes).metadata()).toMatchObject({ format: webp ? "webp" : "jpeg", width: 1600, height: 1200 });
  console.log(`upload_bytes source=${photo.length} sent=${sent[0].bytes.length} saved=${Math.round(100 * (1 - sent[0].bytes.length / photo.length))}%`);
  await page.getByRole("button", { name: "Xong", exact: true }).click();
  await expect(page.locator(".e2-dialog")).toHaveCount(0);
  await expect(page.getByRole("status").first()).toHaveText("Đã lưu");
});

test("compression preserves EXIF portrait orientation, alpha and selected album order", async ({ page, context }) => {
  const input = await openAlbum(page, context);
  const sent = await observeUploads(page);
  await input.setInputFiles([
    { name: "portrait.jpg", mimeType: "image/jpeg", buffer: portrait },
    { name: "transparent.png", mimeType: "image/png", buffer: transparent },
  ]);
  await expect(page.locator(".e2-photo-row img")).toHaveCount(2);
  const webp = await canEncodeWebp(page);
  expect(sent.map(file => file.name)).toEqual(webp ? ["portrait.webp", "transparent.webp"] : ["portrait.jpg", "transparent.png"]);
  expect(await sharp(sent[0].bytes).metadata()).toMatchObject({ width: 1067, height: 1600, format: webp ? "webp" : "jpeg" });
  // WebKit's JPEG encoder may add fresh density/normal-orientation EXIF.
  expect((await sharp(sent[0].bytes).metadata()).orientation ?? 1).toBe(1);
  await expect.poll(() => savedFiles.length).toBe(2);
  const storedPortrait = await sharp(await readFile(path.join(process.cwd(), "tests/e2e/.data/editor-uploads", savedFiles[0]))).metadata();
  expect(storedPortrait.exif).toBeUndefined();
  expect(storedPortrait.orientation).toBeUndefined();
  expect(storedPortrait.format).toBe("webp");
  expect(await sharp(sent[1].bytes).metadata()).toMatchObject({ hasAlpha: true, width: 1600, height: 1309 });
  const left = await sharp(sent[1].bytes).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
  const right = await sharp(sent[1].bytes).extract({ left: 1599, top: 0, width: 1, height: 1 }).raw().toBuffer();
  expect(left[3]).toBe(0);
  expect(right[3]).toBe(255);
  await page.getByRole("button", { name: "Xong", exact: true }).click();
  await expect(page.getByRole("status").first()).toHaveText("Đã lưu");
});

test("a browser without createImageBitmap still compresses with its image element decoder", async ({ page, context }) => {
  await page.addInitScript(() => { Object.defineProperty(window, "createImageBitmap", { value: undefined, configurable: true }); });
  const input = await openAlbum(page, context);
  const sent = await observeUploads(page);
  await input.setInputFiles({ name: "camera.jpg", mimeType: "image/jpeg", buffer: photo });
  await expect(page.locator(".e2-photo-row img")).toHaveCount(1);
  expect(sent[0].type).toBe(await canEncodeWebp(page) ? "image/webp" : "image/jpeg");
  expect(sent[0].bytes.length).toBeLessThan(photo.length * .25);
});

test("unsupported WebP encoding still reduces bytes with JPEG fallback and server conversion", async ({ page, context }) => {
  await page.addInitScript(() => {
    const encode = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) { encode.call(this, callback, type === "image/webp" ? "image/png" : type, quality); };
  });
  const input = await openAlbum(page, context);
  const sent = await observeUploads(page);
  await input.setInputFiles({ name: "camera.jpg", mimeType: "image/jpeg", buffer: photo });
  await expect(page.locator(".e2-photo-row img")).toHaveCount(1);
  expect(sent[0].name).toBe("camera.jpg");
  expect(sent[0].type).toBe("image/jpeg");
  expect(sent[0].bytes.length).toBeLessThan(photo.length * .25);
  expect(await sharp(sent[0].bytes).metadata()).toMatchObject({ format: "jpeg", width: 1600, height: 1200 });
});

test("HEIC remains uploadable through the server fallback", async ({ page, context }) => {
  const input = await openAlbum(page, context);
  const sent = await observeUploads(page);
  const heic = await readFile(path.join(process.cwd(), "tests/fixtures/sample.heic"));
  await input.setInputFiles({ name: "iphone.HEIC", mimeType: "image/heic", buffer: heic });
  await expect(page.locator(".e2-photo-row img")).toHaveCount(1);
  expect(sent[0].bytes.equals(heic)).toBe(true);
});

test("legacy album uploads use the same precompression", async ({ page, context }) => {
  const input = await openAlbum(page, context, true);
  const sent = await observeUploads(page);
  await input.setInputFiles({ name: "camera.jpg", mimeType: "image/jpeg", buffer: photo });
  await expect.poll(() => sent.length).toBe(1);
  await expect(page.locator('input[name="galleryUrl"]')).toHaveCount(1);
  expect(sent[0].type).toBe(await canEncodeWebp(page) ? "image/webp" : "image/jpeg");
  expect(sent[0].bytes.length).toBeLessThan(photo.length * .25);
});

test("returning to the saved template during an older autosave preserves the uploaded draft", async ({ page, context }) => {
  const input = await openAlbum(page, context);
  await observeUploads(page);
  await input.setInputFiles({ name: "camera.jpg", mimeType: "image/jpeg", buffer: photo });
  await expect(page.locator(".e2-photo-row img")).toHaveCount(1);
  await page.getByRole("button", { name: "Xong", exact: true }).click();
  await expect(page.getByRole("status").first()).toHaveText("Đã lưu");
  const id = new URL(page.url()).pathname.split("/").pop()!;
  let releaseSave!: () => void;
  let saveStarted!: () => void;
  const released = new Promise<void>(resolve => { releaseSave = resolve; });
  const started = new Promise<void>(resolve => { saveStarted = resolve; });
  let intercepted = false;
  await page.route(`**/editor2/${id}`, async route => {
    if (route.request().method() === "POST" && !intercepted) {
      intercepted = true; saveStarted(); await released;
    }
    await route.continue();
  });
  const chooseTemplate = async (template: string) => {
    await page.getByRole("button", { name: "Nội dung", exact: true }).click();
    await page.getByRole("button", { name: "Mẫu & giao diện", exact: true }).click();
    await page.getByLabel("Đổi mẫu", { exact: true }).selectOption(template);
    await page.getByRole("button", { name: "Xong", exact: true }).click();
    await expect(page.locator(".e2-dialog")).toHaveCount(0);
  };
  try {
    await chooseTemplate("lien-hoa-pink");
    await started;
    await chooseTemplate("song-hy-red");
  } finally { releaseSave(); }
  await expect(page.getByRole("status").first()).toHaveText("Đã lưu");
  await expect.poll(() => getDb().prepare("SELECT templateId FROM Invitation WHERE id = ?").get(id)).toEqual({ templateId: "song-hy-red" });
  await page.reload();
  await expect(page.locator('[data-template-renderer="song-hy-red"]')).toBeVisible();
});

test("WebKit fallback preserves transparent PNG alpha before upload", async ({ page, context }) => {
  await page.addInitScript(() => {
    const encode = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) { encode.call(this, callback, type === "image/webp" ? "image/png" : type, quality); };
  });
  const input = await openAlbum(page, context);
  const sent = await observeUploads(page);
  await input.setInputFiles({ name: "transparent.png", mimeType: "image/png", buffer: transparent });
  await expect(page.locator(".e2-photo-row img")).toHaveCount(1);
  expect(sent[0].type).toBe("image/png");
  expect(sent[0].bytes.length).toBeLessThan(transparent.length);
  expect(await sharp(sent[0].bytes).metadata()).toMatchObject({ format: "png", hasAlpha: true, width: 1600, height: 1309 });
  const pixel = await sharp(sent[0].bytes).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
  expect(pixel[3]).toBe(0);
});
