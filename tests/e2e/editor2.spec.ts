import { mkdir } from "node:fs/promises";
import path from "node:path";
import { encode } from "next-auth/jwt";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";
import { cleanupUser, createInvitation, createUser } from "./helpers/fixtures";
import { getDb } from "./helpers/db";
import { EDITOR2_BASICS_STORAGE_KEY, editor2BasicsDraftKey } from "../../src/lib/editor2-basics-storage";
import { completedTemplates } from "../../src/data/chungdoi";
import { chungdoiDemoContent } from "../../src/data/chungdoi-demo-content";
import { heroImageCount } from "../../src/data/editor-template-capabilities";

test.use({ actionTimeout: 15_000 });

const users: string[] = [];
const evidence = "/tmp/editor2-evidence";
function invitationPreview(page: Page) { return page; }

function seed(templateId = "song-hy-red") {
  const user = createUser(); users.push(user.id);
  const invitation = createInvitation(user.id, { templateId });
  getDb().prepare("UPDATE InvitationContent SET brideFullName = ?, groomFullName = ?, date = ? WHERE invitationId = ?")
    .run("Nguyễn Quỳnh Anh", "Trần Gia Khánh", "2026-11-29", invitation.id);
  return { user, invitation };
}
function content(id: string) {
  return getDb().prepare("SELECT * FROM InvitationContent WHERE invitationId = ?").get(id) as Record<string, string>;
}
function seedGallery(id: string, template: string) {
  const photos = chungdoiDemoContent[template].gallery.slice(0, 6);
  const insert = getDb().prepare("INSERT INTO GalleryPhoto (id, invitationId, url, sortOrder) VALUES (?, ?, ?, ?)");
  photos.forEach((url, index) => insert.run(`${id}-album-${index}`, id, url, index));
  return photos;
}
async function section(page: Page, name: string) {
  await page.getByRole("button", { name: "Nội dung", exact: true }).click();
  await page.getByRole("button", { name, exact: true }).click();
}
async function close(page: Page) {
  await page.getByRole("button", { name: "Xong", exact: true }).click();
  await expect(page.locator(".e2-dialog")).toHaveCount(0);
}
async function save(page: Page) {
  const state = page.getByRole("status").first();
  // Saving is automatic; wait for the debounced autosave to acknowledge.
  await expect(state).toHaveText("Đã lưu", { timeout: 10_000 });
}
test.afterEach(() => { while (users.length) cleanupUser(users.pop()!); });
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

test("editor2 starts publicly and restricts editor and canvas to the session owner", async ({ page, context }) => {
  const { user, invitation } = seed();
  const before = getDb().prepare("SELECT COUNT(*) AS n FROM User").get();
  await page.goto("/editor2");
  await expect(page).toHaveURL(/\/editor2$/);
  await expect(page.locator("input:not([type=hidden])")).toHaveCount(3);
  expect(getDb().prepare("SELECT COUNT(*) AS n FROM User").get()).toEqual(before);
  expect((await page.goto(`/editor2/${invitation.id}`))?.status()).toBe(404);
  expect((await page.goto(`/editor2/${invitation.id}/canvas`))?.status()).toBe(404);
  const stranger = createUser(); users.push(stranger.id);
  await loginAsUser(context, stranger.id);
  expect((await page.goto(`/editor2/${invitation.id}`))?.status()).toBe(404);
  expect((await page.goto(`/editor2/${invitation.id}/canvas`))?.status()).toBe(404);
  await loginAsUser(context, user.id);
  expect((await page.goto(`/editor2/${invitation.id}`))?.status()).toBe(200);
  await expect(page.locator("[data-editor2-inline]")).toBeVisible();
  await expect(page.locator("iframe.e2-canvas")).toHaveCount(0);
  await page.goto(`/editor2/${invitation.id}/canvas`);
  await expect(page).toHaveURL(new RegExp(`/editor2/${invitation.id}$`));
  await expect(page.locator("iframe.e2-canvas")).toHaveCount(0);
});

for (const width of [1440, 390]) test(`every available template exposes exactly its supported opening-photo slots at ${width}px`, async ({ page, context }) => {
  test.setTimeout(240_000);
  const { user, invitation } = seed();
  const first = "/chungdoi/icon.png?opening=bride";
  const second = "/chungdoi/icon.png?opening=groom";
  getDb().prepare("UPDATE InvitationContent SET heroImage = ?, heroImage2 = ? WHERE invitationId = ?").run(first, second, invitation.id);
  await loginAsUser(context, user.id);
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`/editor2/${invitation.id}`);
  const mismatches: { template: string; expected: number; actual: string[] }[] = [];
  for (const template of completedTemplates) {
    await section(page, "Mẫu & giao diện");
    await page.getByLabel("Đổi mẫu", { exact: true }).selectOption(template.slug);
    await close(page);
    const renderer = page.locator(`[data-template-renderer="${template.slug}"]`);
    await expect(renderer).toBeVisible();
    const count = heroImageCount(template.slug);
    const actual = await renderer.locator("img").evaluateAll((images, values) => [...new Set(images
      .filter(image => image.getClientRects().length > 0)
      .map(image => { const src = image.getAttribute("src") ?? ""; const url = new URL(src, location.origin); return url.pathname === "/_next/image" ? url.searchParams.get("url") ?? src : src; })
      .filter(src => values.includes(src)))], [first, second]);
    if (actual.length !== count) mismatches.push({ template: template.slug, expected: count, actual });
    const bindings = () => renderer.locator("img").evaluateAll((images, values) => images.flatMap(image => {
      const raw = image.getAttribute("src") ?? "";
      const url = new URL(raw, location.origin);
      const src = url.pathname === "/_next/image" ? url.searchParams.get("url") ?? raw : raw;
      if (!values.includes(src) || !image.getClientRects().length) return [];
      const hidden = image.closest('.sr-only,[aria-hidden="true"]');
      if (hidden && image.closest("[data-template-renderer]")?.contains(hidden)) return [];
      const target = image.closest<HTMLElement>("[data-e2-section]");
      return [{ section: target?.dataset.e2Section, field: target?.dataset.e2Field, expected: src === values[0] ? "heroImage" : "heroImage2", src: raw }];
    }), [first, second]);
    await expect.poll(async () => (await bindings()).filter(binding => binding.section !== "photos" || binding.field !== binding.expected), { message: template.slug }).toEqual([]);
    await expect.poll(async () => new Set((await bindings()).map(binding => binding.field)).size, { message: template.slug }).toBe(count);
    await page.getByRole("button", { name: "Nội dung", exact: true }).click();
    const photos = page.getByRole("button", { name: "Ảnh mở đầu", exact: true });
    if (!count) {
      await expect(photos).toHaveCount(0);
      await close(page);
      continue;
    }
    await photos.click();
    const slots = page.getByRole("dialog").locator("[data-e2-hero-slot]");
    await expect(slots).toHaveCount(count);
    await expect(slots.locator('input[type="file"]')).toHaveCount(count);
    await expect(slots.nth(0).locator("img")).toHaveAttribute("src", first);
    if (count === 2) {
      await expect(slots.nth(1).locator("img")).toHaveAttribute("src", second);
      await expect(slots.nth(0).getByRole("heading")).toHaveText("Ảnh cô dâu");
      await expect(slots.nth(1).getByRole("heading")).toHaveText("Ảnh chú rể");
    }
    await close(page);
    for (const field of count === 2 ? ["heroImage", "heroImage2"] : ["heroImage"]) {
      const photo = renderer.locator(`[data-e2-section="photos"][data-e2-field="${field}"]:visible`).first();
      await photo.evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
      // Some templates continuously float overlapping portraits. Click an
      // actually exposed point rather than waiting for the animation to stop.
      const point = await photo.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        for (const dy of [0.25, 0.5, 0.75, 0.1, 0.9]) for (const dx of [0.25, 0.5, 0.75, 0.1, 0.9]) {
          const x = bounds.x + bounds.width * dx;
          const y = bounds.y + bounds.height * dy;
          const hit = document.elementFromPoint(x, y);
          if (hit && (hit === element || element.contains(hit))) return { x, y };
        }
        return null;
      });
      expect(point, `${template.slug}: ${field} must have a tappable photo area`).not.toBeNull();
      await page.mouse.click(point!.x, point!.y);
      await expect(page.locator(`#e2-${field}`)).toBeFocused();
      await close(page);
    }
  }
  expect(mismatches).toEqual([]);
});

for (const width of [1440, 390]) test(`two opening-photo uploads stay person-scoped across zero, one and two-photo templates at ${width}px`, async ({ page, context }) => {
  const { user, invitation } = seed("double-dragon-red");
  const gallery = seedGallery(invitation.id, "double-dragon-red");
  getDb().prepare("UPDATE InvitationContent SET brideFirst = 0 WHERE invitationId = ?").run(invitation.id);
  await loginAsUser(context, user.id);
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`/editor2/${invitation.id}`);
  const portraits = page.locator('[data-editor2-inline] [data-e2-section="photos"]');
  await expect(portraits).toHaveCount(2);
  await section(page, "Album ảnh cưới");
  await page.getByRole("button", { name: "Ẩn phần này", exact: true }).click();
  await expect(portraits).toHaveCount(2);
  const fallback = await portraits.evaluateAll(images => images.map(image => image.getAttribute("src")));
  expect(new Set(fallback).size).toBe(2);
  await page.locator('[data-editor2-inline] [data-e2-field="heroImage2"]').first().click();
  await expect(page.locator("#e2-heroImage2")).toBeFocused();
  await close(page);
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await page.locator('[data-editor2-inline] [data-e2-field="heroImage2"]').first().click();
  const dialog = page.getByRole("dialog");
  await expect(page.locator("#e2-heroImage2")).toBeFocused();
  await expect(dialog).toContainText("Mỗi vị trí dùng 1 ảnh.");
  await expect(dialog).not.toContainText("Tối đa 30 ảnh.");
  await expect(dialog.locator(".e2-photo-row img")).toHaveCount(0);
  const bride = dialog.locator('[data-e2-hero-slot="heroImage"]');
  const groom = dialog.locator('[data-e2-hero-slot="heroImage2"]');
  const brideBounds = (await bride.boundingBox())!;
  const groomBounds = (await groom.boundingBox())!;
  expect(width >= 768 ? groomBounds.x > brideBounds.x + brideBounds.width : groomBounds.y > brideBounds.y + brideBounds.height).toBe(true);
  await bride.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "public/chungdoi/images/gallery/song-hy-red/photo-1.jpg"));
  await expect(bride.locator(".e2-photo-row img")).toHaveCount(1);
  await groom.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "public/chungdoi/images/gallery/song-hy-red/photo-2.jpg"));
  await expect(groom.locator(".e2-photo-row img")).toHaveCount(1);
  const first = await bride.locator(".e2-photo-row img").getAttribute("src");
  const second = await groom.locator(".e2-photo-row img").getAttribute("src");
  expect(first).not.toBe(second);
  await page.screenshot({ path: path.join(evidence, `opening-photos-${width}.png`) });
  await close(page); await save(page); await page.reload();
  await expect(page.locator('[data-editor2-inline] [data-e2-field="heroImage"]')).toHaveAttribute("src", first!);
  await expect(page.locator('[data-editor2-inline] [data-e2-field="heroImage2"]')).toHaveAttribute("src", second!);
  expect(content(invitation.id).brideFirst).toBe(0);
  const storedGallery = () => (getDb().prepare("SELECT url FROM GalleryPhoto WHERE invitationId = ? ORDER BY sortOrder").all(invitation.id) as { url: string }[]).map(photo => photo.url);
  expect(storedGallery()).toEqual(gallery);
  for (const template of ["song-hy-red", "spring-garden-green", "double-dragon-red"]) {
    await section(page, "Mẫu & giao diện");
    await page.getByLabel("Đổi mẫu", { exact: true }).selectOption(template);
    await close(page);
    await expect(page.locator(`[data-template-renderer="${template}"]`)).toBeVisible();
    if (template === "spring-garden-green") {
      await page.getByRole("button", { name: "Nội dung", exact: true }).click();
      await expect(page.getByRole("button", { name: "Ảnh mở đầu", exact: true })).toHaveCount(0);
      await close(page);
    } else {
      await section(page, "Ảnh mở đầu");
      await expect(dialog.locator('[data-e2-hero-slot="heroImage"] img')).toHaveAttribute("src", first!);
      if (template === "double-dragon-red") await expect(dialog.locator('[data-e2-hero-slot="heroImage2"] img')).toHaveAttribute("src", second!);
      else await expect(dialog.locator('[data-e2-hero-slot="heroImage2"]')).toHaveCount(0);
      await close(page);
    }
  }
  await save(page); await page.reload();
  expect(content(invitation.id).heroImage).toBe(first);
  expect(content(invitation.id).heroImage2).toBe(second);
  expect(storedGallery()).toEqual(gallery);
});

for (const width of [1440, 390]) test(`fixed bride and groom frames select the matching opening-photo slot with album fallbacks at ${width}px`, async ({ page, context }) => {
  const { user, invitation } = seed("hoa-tinh-red");
  seedGallery(invitation.id, "hoa-tinh-red");
  getDb().prepare("UPDATE InvitationContent SET brideFirst = 0 WHERE invitationId = ?").run(invitation.id);
  await loginAsUser(context, user.id);
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`/editor2/${invitation.id}`);
  const bride = page.locator('[data-editor2-inline] header img[alt="Nguyễn Quỳnh Anh"]');
  const groom = page.locator('[data-editor2-inline] header img[alt="Trần Gia Khánh"]');
  for (const withoutAlbum of [false, true]) {
    if (withoutAlbum) {
      await section(page, "Album ảnh cưới");
      await page.getByRole("button", { name: "Ẩn phần này", exact: true }).click();
    }
    await expect(bride).toHaveAttribute("data-e2-field", "heroImage");
    await expect(groom).toHaveAttribute("data-e2-field", "heroImage2");
    expect(await bride.getAttribute("src")).not.toBe(await groom.getAttribute("src"));
    await bride.click();
    await expect(page.locator("#e2-heroImage")).toBeFocused();
    await close(page);
    await groom.click();
    await expect(page.locator("#e2-heroImage2")).toBeFocused();
    await close(page);
  }
});

test("three-field creation, click editing, autosave, and sample-free guest preview", async ({ page, context }) => {
  test.setTimeout(100_000);
  const user = createUser(); users.push(user.id);
  await loginAsUser(context, user.id);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/editor2");
  await expect(page.locator("input:not([type=hidden])")).toHaveCount(3);
  await page.screenshot({ path: path.join(evidence, "start-desktop.png") });
  await page.getByLabel("Họ tên cô dâu", { exact: true }).fill("Nguyễn Quỳnh Anh");
  await page.getByLabel("Họ tên chú rể", { exact: true }).fill("Trần Gia Khánh");
  await page.getByLabel("Ngày cưới", { exact: true }).fill("2026-11-29");
  await page.getByRole("button", { name: "Tạo thiệp và chỉnh trực tiếp" }).click();
  await expect(page).toHaveURL(/\/editor2\/[^/?]+$/);
  const id = page.url().split("/").pop()!;
  const frame = invitationPreview(page);
  await expect(frame.locator("[data-e2-section=couple]").first()).toBeVisible();
  await frame.locator('[data-e2-field="brideFather"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Bố cô dâu", { exact: true })).toHaveValue("Tên Cha Cô Dâu");
  await page.getByLabel("Bố chú rể", { exact: true }).fill("");
  await page.getByLabel("Bố cô dâu", { exact: true }).fill("Nguyễn Văn Thành");
  await close(page);
  await expect.poll(() => content(id).brideFather).toBe("Nguyễn Văn Thành");
  expect(content(id).groomFather).toBe(""); expect(content(id).venueName).toBe("Tên địa điểm tổ chức"); expect(content(id).address).toBe("Địa chỉ địa điểm tổ chức"); expect(content(id).time).toBe("18:00");
  await frame.locator('[data-invitation-short-name]').first().click();
  await page.getByLabel("Họ tên cô dâu", { exact: true }).fill("Nguyễn Lan Anh");
  await close(page); await save(page);
  await expect(frame.locator("[data-e2-section=couple]").filter({ hasText: "Lan Anh" }).first()).toBeVisible();
  await page.screenshot({ path: path.join(evidence, "workspace-desktop.png") });
  await page.getByRole("button", { name: "Xem như khách", exact: true }).click();
  await expect(frame.locator("[data-e2-section]")).toHaveCount(0);
  await expect(frame.getByText("Tên Cha Chú Rể", { exact: true })).toHaveCount(0);
  await expect(frame.locator(".e2-suggestions")).toHaveCount(0);
  await page.reload();
  await expect(frame.locator('[data-e2-field="brideFather"]')).toHaveText("Nguyễn Văn Thành");
  await page.goto(`/editor/${id}`);
  await expect(page.locator("#brideFullName")).toHaveValue("Nguyễn Lan Anh");
  expect(errors).toEqual([]);
});

for (const width of [1440, 768, 390]) test(`new invitations start with editable family names and birth orders at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const guest = await createGuestDraft(page);
  const expected = {
    brideBirthOrder: "Trưởng Nữ", groomBirthOrder: "Trưởng Nam",
    brideFather: "Tên Cha Cô Dâu", brideMother: "Tên Mẹ Cô Dâu",
    groomFather: "Tên Cha Chú Rể", groomMother: "Tên Mẹ Chú Rể",
  };
  // Defaults must exist in the database before opening or editing any field.
  expect(content(guest.id)).toMatchObject(expected);
  const preview = page.locator("[data-editor2-inline]");
  await expect(preview).toBeVisible();
  for (const name of Object.values(expected)) await expect(preview.getByText(name, { exact: true }).first()).toBeVisible();
  await section(page, "Thông tin hai gia đình");
  for (const key of ["brideFather", "brideMother", "groomFather", "groomMother"] as const) {
    await expect(page.locator(`[name="${key}"]`)).toHaveValue(expected[key]);
  }
  await page.screenshot({ path: path.join(evidence, `starter-family-${width}.png`) });
  await page.getByLabel("Bố chú rể", { exact: true }).fill("Trần Văn An");
  await close(page);
  await section(page, "Tên hai bạn & lời mời");
  await expect(page.getByLabel("Thứ bậc cô dâu", { exact: true })).toHaveValue(expected.brideBirthOrder);
  await expect(page.getByLabel("Thứ bậc chú rể", { exact: true })).toHaveValue(expected.groomBirthOrder);
  await page.getByLabel("Thứ bậc cô dâu", { exact: true }).selectOption("Út Nữ");
  await page.getByLabel("Thứ bậc chú rể", { exact: true }).selectOption("");
  await close(page); await save(page); await page.reload();
  await expect(preview.getByText("Trần Văn An", { exact: true })).toBeVisible();
  await section(page, "Tên hai bạn & lời mời");
  await expect(page.getByLabel("Thứ bậc cô dâu", { exact: true })).toHaveValue("Út Nữ");
  await expect(page.getByLabel("Thứ bậc chú rể", { exact: true })).toHaveValue("");
  expect(content(guest.id)).toMatchObject({ ...expected, brideBirthOrder: "Út Nữ", groomBirthOrder: "", groomFather: "Trần Văn An" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("dashboard creation persists the same editable family defaults", async ({ page, context }) => {
  const user = createUser(); users.push(user.id);
  await loginAsUser(context, user.id);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "+ Tạo thiệp mới", exact: true }).click();
  await page.locator('[data-template-id="song-hy-red"]').click();
  await expect(page).toHaveURL(/\/editor\/[^/?]+$/);
  const id = page.url().split("/").pop()!;
  expect(content(id)).toMatchObject({
    brideBirthOrder: "Trưởng Nữ", groomBirthOrder: "Trưởng Nam",
    brideFather: "Tên Cha Cô Dâu", brideMother: "Tên Mẹ Cô Dâu",
    groomFather: "Tên Cha Chú Rể", groomMother: "Tên Mẹ Chú Rể",
    brideParentTitle: "Ông Bà", groomParentTitle: "Ông Bà",
    brideAddress: "Địa chỉ nhà gái", groomAddress: "Địa chỉ nhà trai",
  });
});

test("add native ceremonies, gift and uploaded album; hide, undo, save and publication validation", async ({ page, context }) => {
  test.setTimeout(120_000);
  const { user, invitation } = seed();
  await loginAsUser(context, user.id);
  await page.goto(`/editor2/${invitation.id}`);
  const frame = invitationPreview(page);
  await expect(frame.locator(".e2-suggestions")).toBeVisible();
  await frame.getByRole("button", { name: "Thêm Lễ cưới", exact: true }).click();
  await page.getByRole("button", { name: "Thêm một lễ" }).click();
  await page.getByRole("textbox", { name: "Nội dung lễ" }).fill("Lễ vu quy tại nhà gái");
  await page.locator('input[name="ceremony-0-date"]').fill("2026-11-28");
  await page.locator('input[name="ceremony-0-time"]').fill("08:00");
  await page.getByRole("button", { name: "Thêm một lễ" }).click();
  await page.getByRole("textbox", { name: "Nội dung lễ" }).nth(1).fill("Lễ thành hôn tại nhà trai");
  await page.locator('input[name="ceremony-1-date"]').fill("2026-11-29");
  await page.locator('input[name="ceremony-1-time"]').fill("09:30");
  await close(page);
  await expect(frame.locator("[data-template-ceremony-item]")).toHaveCount(2);
  await expect(frame.locator("[data-additional-ceremonies]")).toHaveCount(0);
  await section(page, "Hộp quà mừng");
  await page.getByLabel("Ngân hàng cô dâu", { exact: true }).selectOption({ label: "ACB" });
  await page.getByLabel("Số tài khoản cô dâu", { exact: true }).fill("123456789");
  await page.getByLabel("Chủ tài khoản cô dâu", { exact: true }).fill("Nguyễn Quỳnh Anh");
  await close(page);
  await expect(frame.getByTestId("gift-envelope")).toBeVisible();
  await frame.getByTestId("gift-envelope").click();
  await expect(page.getByLabel("Số tài khoản cô dâu", { exact: true })).toHaveValue("123456789");
  await close(page);
  await section(page, "Album ảnh cưới");
  await expect(page.getByRole("radio", { name: "Lưới ảnh", exact: true })).toBeChecked();
  await page.screenshot({ path: path.join(evidence, "album-layout-empty.png") });
  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "public/chungdoi/icon.png"));
  await expect(page.locator(".e2-photo-row img")).toHaveCount(1);
  await close(page);
  await section(page, "Album ảnh cưới");
  await page.getByRole("button", { name: "Ẩn phần này" }).click();
  await expect(frame.getByRole("button", { name: "Thêm Album ảnh cưới", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await save(page);
  expect(getDb().prepare("SELECT COUNT(*) AS n FROM GalleryPhoto WHERE invitationId = ?").get(invitation.id)).toEqual({ n: 1 });
  expect(getDb().prepare("SELECT COUNT(*) AS n FROM CeremonyItem WHERE invitationId = ?").get(invitation.id)).toEqual({ n: 2 });
  await section(page, "Thời gian tiệc cưới");
  await expect(page.getByLabel("Giờ tiệc", { exact: true })).toHaveValue("18:00");
  await page.getByLabel("Giờ tiệc", { exact: true }).fill("");
  await close(page);
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(page.locator(".e2-alert")).toHaveText("Cần giờ tiệc cưới trước khi xuất bản.");
  await section(page, "Thời gian tiệc cưới");
  await page.getByLabel("Giờ tiệc", { exact: true }).fill("18:30");
  await close(page);
  await section(page, "Địa điểm tổ chức");
  await page.getByLabel("Địa chỉ địa điểm", { exact: true }).fill("Trung tâm tiệc cưới, 123 Nguyễn Huệ, TP. Hồ Chí Minh");
  await close(page);
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(page.getByRole("button", { name: "Chia sẻ", exact: true })).toBeVisible();
  expect(getDb().prepare("SELECT status FROM Invitation WHERE id = ?").get(invitation.id)).toEqual({ status: "published" });
  await page.getByRole("button", { name: "Chia sẻ", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Chia sẻ thiệp", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Đường dẫn thiệp", exact: true })).toHaveValue(/\/thiep\/quynh-anh-gia-khanh$/);
});

test("publishing silently adds the wedding day when the names-only slug is taken", async ({ page, context }) => {
  const user = createUser(); users.push(user.id);
  const first = createInvitation(user.id);
  const second = createInvitation(user.id);
  const statement = getDb().prepare("UPDATE InvitationContent SET brideFullName = ?, groomFullName = ?, date = ? WHERE invitationId = ?");
  for (const invitation of [first, second]) statement.run("Nguyễn Quỳnh Anh", "Trần Gia Khánh", "2026-11-29", invitation.id);
  await loginAsUser(context, user.id);
  await page.goto(`/editor2/${first.id}`);
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(page.getByRole("button", { name: "Chia sẻ", exact: true })).toBeVisible();
  await page.goto(`/editor2/${second.id}`);
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(page.getByRole("button", { name: "Chia sẻ", exact: true })).toBeVisible();
  const rows = getDb().prepare("SELECT id, slug FROM Invitation WHERE id IN (?, ?)").all(first.id, second.id) as { id: string; slug: string }[];
  expect(rows.find(row => row.id === first.id)?.slug).toBe("quynh-anh-gia-khanh");
  expect(rows.find(row => row.id === second.id)?.slug).toBe("quynh-anh-gia-khanh-29112026");
});

for (const width of [768, 390, 320]) {
  test(`visual editing is usable without horizontal overflow at ${width}px`, async ({ page, context }) => {
    test.setTimeout(90_000);
    const { user, invitation } = seed(width === 768 ? "lien-hoa-pink" : "song-hy-red");
    await loginAsUser(context, user.id);
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/editor2/${invitation.id}`);
    const frame = invitationPreview(page);
    await expect(frame.locator("[data-e2-section=couple]").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await frame.locator("[data-e2-section=couple]").first().click();
    await page.getByLabel("Họ tên cô dâu", { exact: true }).fill("Nguyễn Thị Hoàng Quỳnh Anh");
    await page.screenshot({ path: path.join(evidence, `context-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await save(page);
    await page.screenshot({ path: path.join(evidence, `workspace-${width}.png`) });
    await expect(page.locator("iframe.e2-canvas")).toHaveCount(0);
    await expect(page.locator("[data-editor2-inline]")).toBeVisible();
    await page.getByRole("button", { name: "Nội dung", exact: true }).click();
    await page.getByRole("button", { name: "Mẫu & giao diện", exact: true }).click();
    await page.getByLabel("Đổi mẫu").selectOption("song-hy-green");
    await close(page);
    await expect(frame.locator('[data-template-renderer="song-hy-green"]')).toBeVisible();
  });
}


async function createGuestDraft(page: Page, template?: string) {
  await page.goto(template ? `/editor2?template=${encodeURIComponent(template)}` : "/editor2");
  await page.getByLabel("Họ tên cô dâu", { exact: true }).fill("Nguyễn Quỳnh Anh");
  await page.getByLabel("Họ tên chú rể", { exact: true }).fill("Trần Gia Khánh");
  await page.getByLabel("Ngày cưới", { exact: true }).fill("2026-11-29");
  await page.getByRole("button", { name: "Tạo thiệp và chỉnh trực tiếp" }).click();
  await expect(page).toHaveURL(/\/editor2\/[^/?]+$/);
  const id = page.url().split("/").pop()!;
  const row = getDb().prepare("SELECT userId FROM Invitation WHERE id = ?").get(id) as { userId: string };
  users.push(row.userId);
  expect(getDb().prepare("SELECT email,passwordHash FROM User WHERE id = ?").get(row.userId)).toEqual({ email: null, passwordHash: null });
  return { id, userId: row.userId };
}

/** Simulate Google's already-verified Auth.js session, then run the real app
 * completion route, ownership adoption, cookie replacement and return URL. */
async function verifiedGoogleSession(context: BrowserContext, email: string) {
  for (const name of ["authjs.session-token", "__Secure-authjs.session-token"]) {
    const value = await encode({ token: { email, name: "Editor2 guest", sub: `google-${email}` }, secret: "e2e-auth-secret-do-not-use-in-prod", salt: name });
    await context.addCookies([{ name, value, domain: "127.0.0.1", path: "/", httpOnly: true, secure: name.startsWith("__Secure-"), sameSite: "Lax" }]);
  }
}

for (const existingAccount of [false, true]) {
  test(`guest can create, edit and upload before login; Google ${existingAccount ? "adopts into existing account" : "upgrades guest account"} at publication`, async ({ page, context }) => {
    const guest = await createGuestDraft(page);
    const frame = invitationPreview(page);
    await expect(frame.locator("[data-e2-section=couple]").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Mở editor hiện tại" })).toHaveCount(0);
    await frame.locator('[data-e2-field="brideFather"]').click();
    await page.getByLabel("Bố cô dâu", { exact: true }).fill("Nguyễn Văn Thành");
    await close(page);
    await section(page, "Album ảnh cưới");
    await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "public/chungdoi/icon.png"));
    await expect(page.locator(".e2-photo-row img")).toHaveCount(1);
    await close(page);
    await save(page);
    await page.reload();
    await expect(frame.locator('[data-e2-field="brideFather"]')).toHaveText("Nguyễn Văn Thành");
    // Last keystrokes must survive even before the autosave debounce expires.
    await section(page, "Thời gian tiệc cưới");
    await page.getByLabel("Giờ tiệc", { exact: true }).fill("18:30");
    await close(page);
    await section(page, "Địa điểm tổ chức");
    await page.getByLabel("Địa chỉ địa điểm", { exact: true }).fill("Trung tâm tiệc cưới, 123 Nguyễn Huệ");
    await close(page);
    await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
    await expect(page).toHaveURL(/\/login\?reason=publish&next=/);
    expect(content(guest.id).time).toBe("18:30");
    expect(content(guest.id).address).toContain("123 Nguyễn Huệ");
    expect(getDb().prepare("SELECT status FROM Invitation WHERE id = ?").get(guest.id)).toEqual({ status: "draft" });
    const next = new URL(page.url()).searchParams.get("next")!;
    expect(new URL(next, page.url()).pathname).toBe(`/editor2/${guest.id}`);
    expect(new URL(next, page.url()).searchParams.get("publish")).toBe("1");
    await expect(page.getByText(/Thiệp của bạn đã được lưu/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Tiếp tục với Google" })).toBeVisible();
    // Cancelling login can return to the still-private, editable guest draft.
    await page.getByRole("link", { name: "Quay lại chỉnh sửa thiệp" }).click();
    await expect(page).toHaveURL(new RegExp(`/editor2/${guest.id}$`));
    await expect(frame.locator('[data-e2-field="brideFather"]')).toHaveText("Nguyễn Văn Thành");
    await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
    await expect(page).toHaveURL(/\/login\?reason=publish&next=/);
    const email = `editor2-google-${guest.id}@e2e.test`;
    const account = existingAccount ? createUser({ email }) : null;
    if (account) users.push(account.id);
    await verifiedGoogleSession(context, email);
    await page.goto(`/auth/google/complete?next=${encodeURIComponent(next)}`);
    await expect(page).toHaveURL(new RegExp(`/editor2/${guest.id}\\?publish=1`));
    const owner = getDb().prepare("SELECT userId,status FROM Invitation WHERE id = ?").get(guest.id) as { userId: string; status: string };
    expect(owner.userId).toBe(account?.id ?? guest.userId);
    expect(getDb().prepare("SELECT email FROM User WHERE id = ?").get(owner.userId)).toEqual({ email });
    if (account) expect(getDb().prepare("SELECT id FROM User WHERE id = ?").get(guest.userId)).toBeUndefined();
    await expect(page.getByRole("button", { name: "Chia sẻ", exact: true })).toBeVisible();
    await expect.poll(() => getDb().prepare("SELECT status FROM Invitation WHERE id = ?").get(guest.id)).toEqual({ status: "published" });
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM GalleryPhoto WHERE invitationId = ?").get(guest.id)).toEqual({ n: 1 });
    expect(content(guest.id).brideFather).toBe("Nguyễn Văn Thành");
  });
}

test("failed Google completion retains the guest draft and publication return path", async ({ page }) => {
  const guest = await createGuestDraft(page);
  const next = `/editor2/${guest.id}?publish=1`;
  await page.goto(`/auth/google/complete?next=${encodeURIComponent(next)}`);
  await expect(page).toHaveURL(/\/login\?authError=google/);
  expect(new URL(page.url()).searchParams.get("next")).toBe(next);
  await page.getByRole("link", { name: "Quay lại chỉnh sửa thiệp" }).click();
  await expect(page).toHaveURL(new RegExp(`/editor2/${guest.id}$`));
  expect(getDb().prepare("SELECT status FROM Invitation WHERE id = ?").get(guest.id)).toEqual({ status: "draft" });
});

test("an already signed-in account follows a safe publication return URL", async ({ page, context }) => {
  const { user, invitation } = seed();
  await loginAsUser(context, user.id);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);
  const next = `/editor2/${invitation.id}?publish=1`;
  await page.goto(`/login?reason=publish&next=${encodeURIComponent(next)}`);
  await expect(page.getByRole("button", { name: "Chia sẻ", exact: true })).toBeVisible();
  await expect.poll(() => getDb().prepare("SELECT status FROM Invitation WHERE id = ?").get(invitation.id)).toEqual({ status: "published" });
});


test("names and wedding date survive start-page refresh, clearing and switching templates", async ({ page }) => {
  await page.goto("/editor2");
  await page.getByLabel("Họ tên cô dâu", { exact: true }).fill("Nguyễn Lan Anh");
  await page.getByLabel("Họ tên chú rể", { exact: true }).fill("Trần Minh Đức");
  await page.getByLabel("Ngày cưới", { exact: true }).fill("2026-12-20");
  await page.reload();
  await expect(page.getByLabel("Họ tên cô dâu", { exact: true })).toHaveValue("Nguyễn Lan Anh");
  await expect(page.getByLabel("Họ tên chú rể", { exact: true })).toHaveValue("Trần Minh Đức");
  await expect(page.getByLabel("Ngày cưới", { exact: true })).toHaveValue("2026-12-20");
  await page.getByLabel("Họ tên chú rể", { exact: true }).clear();
  await page.reload();
  await expect(page.getByLabel("Họ tên chú rể", { exact: true })).toHaveValue("");
  await page.getByLabel("Họ tên chú rể", { exact: true }).fill("Trần Minh Đức");
  await page.goto("/editor2?template=song-hy-green");
  await expect(page.locator('input[name="templateId"]')).toHaveValue("song-hy-green");
  await expect(page.getByLabel("Họ tên cô dâu", { exact: true })).toHaveValue("Nguyễn Lan Anh");
  await expect(page.getByLabel("Họ tên chú rể", { exact: true })).toHaveValue("Trần Minh Đức");
  await expect(page.getByLabel("Ngày cưới", { exact: true })).toHaveValue("2026-12-20");
  await page.getByRole("button", { name: "Tạo thiệp và chỉnh trực tiếp" }).click();
  await expect(page).toHaveURL(/\/editor2\/[^/?]+$/);
  const id = page.url().split("/").pop()!;
  const invitation = getDb().prepare("SELECT userId,templateId FROM Invitation WHERE id = ?").get(id) as { userId: string; templateId: string };
  users.push(invitation.userId);
  expect(invitation.templateId).toBe("song-hy-green");
  expect(content(id).brideFullName).toBe("Nguyễn Lan Anh");
  expect(content(id).groomFullName).toBe("Trần Minh Đức");
  expect(content(id).date).toBe("2026-12-20");
});

test("editor changes and undo update remembered basics; refresh recovers edits before server save", async ({ page, context }) => {
  const { user, invitation } = seed();
  await loginAsUser(context, user.id);
  page.on("dialog", dialog => dialog.accept());
  await page.goto(`/editor2/${invitation.id}`);
  // Keep the server baseline unchanged while exercising browser recovery.
  await page.route("**/editor2/**", route => route.request().method() === "POST" ? route.abort() : route.continue());
  await section(page, "Tên hai bạn & lời mời");
  await page.getByLabel("Họ tên cô dâu", { exact: true }).fill("Nguyễn Lan Anh");
  await page.getByLabel("Họ tên chú rể", { exact: true }).fill("Trần Minh Đức");
  await close(page);
  await section(page, "Thời gian tiệc cưới");
  await page.getByLabel("Ngày cưới", { exact: true }).fill("2026-12-20");
  await close(page);
  const remembered = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? "null")?.values, EDITOR2_BASICS_STORAGE_KEY);
  await expect.poll(remembered).toEqual({ brideFullName: "Nguyễn Lan Anh", groomFullName: "Trần Minh Đức", date: "2026-12-20" });
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await expect.poll(remembered).toEqual({ brideFullName: "Nguyễn Lan Anh", groomFullName: "Trần Minh Đức", date: "2026-11-29" });
  await page.getByRole("button", { name: "Làm lại", exact: true }).click();
  await expect.poll(remembered).toEqual({ brideFullName: "Nguyễn Lan Anh", groomFullName: "Trần Minh Đức", date: "2026-12-20" });
  await page.reload();
  await section(page, "Tên hai bạn & lời mời");
  await expect(page.getByLabel("Họ tên cô dâu", { exact: true })).toHaveValue("Nguyễn Lan Anh");
  await expect(page.getByLabel("Họ tên chú rể", { exact: true })).toHaveValue("Trần Minh Đức");
  await expect(page.getByLabel("Tên ngắn cô dâu", { exact: true })).toHaveValue("Lan Anh");
  await close(page);
  await section(page, "Thời gian tiệc cưới");
  await expect(page.getByLabel("Ngày cưới", { exact: true })).toHaveValue("2026-12-20");
  await close(page);
  expect(content(invitation.id).brideFullName).toBe("Nguyễn Quỳnh Anh");
  const other = createInvitation(user.id);
  getDb().prepare("UPDATE InvitationContent SET brideFullName = ?, groomFullName = ?, date = ? WHERE invitationId = ?")
    .run("Lê Mai Chi", "Võ Hoàng Nam", "2027-01-16", other.id);
  await page.goto(`/editor2/${other.id}`);
  await section(page, "Tên hai bạn & lời mời");
  await expect(page.getByLabel("Họ tên cô dâu", { exact: true })).toHaveValue("Lê Mai Chi");
  await expect(page.getByLabel("Họ tên chú rể", { exact: true })).toHaveValue("Võ Hoàng Nam");
  await close(page);
  await page.goto(`/editor2/${invitation.id}`);
  await page.unroute("**/editor2/**");
  await save(page);
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), editor2BasicsDraftKey(invitation.id))).toBeNull();
  await page.goto("/editor2?template=song-hy-green");
  await expect(page.getByLabel("Họ tên cô dâu", { exact: true })).toHaveValue("Nguyễn Lan Anh");
  await expect(page.getByLabel("Họ tên chú rể", { exact: true })).toHaveValue("Trần Minh Đức");
  await expect(page.getByLabel("Ngày cưới", { exact: true })).toHaveValue("2026-12-20");
});

test("birth order dropdowns save standard choices and preserve custom values", async ({ page, context }) => {
  const { user, invitation } = seed();
  getDb().prepare("UPDATE InvitationContent SET brideBirthOrder = ? WHERE invitationId = ?").run("Con gái út", invitation.id);
  await loginAsUser(context, user.id);
  await page.goto(`/editor2/${invitation.id}`);
  await section(page, "Tên hai bạn & lời mời");
  const bride = page.getByRole("combobox", { name: "Thứ bậc cô dâu", exact: true });
  const groom = page.getByRole("combobox", { name: "Thứ bậc chú rể", exact: true });
  await expect(bride).toHaveValue("__custom__");
  await expect(page.getByLabel("Thứ bậc cô dâu (tự nhập)", { exact: true })).toHaveValue("Con gái út");
  await bride.selectOption({ label: "Trưởng Nữ" });
  await groom.selectOption({ label: "Út Nam" });
  await close(page); await save(page);
  expect(content(invitation.id).brideBirthOrder).toBe("Trưởng Nữ");
  expect(content(invitation.id).groomBirthOrder).toBe("Út Nam");
  await page.reload();
  await section(page, "Tên hai bạn & lời mời");
  await expect(bride).toHaveValue("Trưởng Nữ");
  await expect(groom).toHaveValue("Út Nam");
  await bride.selectOption("");
  await groom.selectOption("__custom__");
  await page.getByLabel("Thứ bậc chú rể (tự nhập)", { exact: true }).fill("Con trai thứ hai");
  await close(page); await save(page);
  await page.reload();
  await section(page, "Tên hai bạn & lời mời");
  await expect(bride).toHaveValue("");
  await expect(groom).toHaveValue("__custom__");
  await expect(page.getByLabel("Thứ bậc chú rể (tự nhập)", { exact: true })).toHaveValue("Con trai thứ hai");
});

test("one component tree uses native page scrolling and responds to the phone preview width", async ({ page, context }) => {
  const { user, invitation } = seed();
  await loginAsUser(context, user.id);
  await page.setViewportSize({ width: 1440, height: 900 });
  const canvasRequests: string[] = [];
  page.on("request", request => { if (request.isNavigationRequest() && /\/canvas(?:\?|$)/.test(request.url())) canvasRequests.push(request.url()); });
  await page.goto(`/editor2/${invitation.id}`);
  const track = page.locator(".e2-canvas-track");
  const preview = invitationPreview(page);
  await expect(preview.locator("[data-e2-section=couple]").first()).toBeVisible();
  await expect(page.locator("iframe.e2-canvas")).toHaveCount(0);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect.poll(async () => (await track.boundingBox())!.height).toBeGreaterThan(2000);
  await track.hover({ position: { x: 100, y: 400 } });
  await page.mouse.wheel(0, 1000);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
  await page.screenshot({ path: path.join(evidence, "single-scroll-desktop.png") });
  await page.locator("body").click({ position: { x: 10, y: 400 } });
  const beforeKey = await page.evaluate(() => scrollY);
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeKey + 300);
  await page.keyboard.press("Home");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const initialHeight = (await track.boundingBox())!.height;
  await section(page, "Lễ cưới");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Thêm một lễ" }).click();
  await close(page);
  await expect.poll(async () => (await track.boundingBox())!.height).toBeGreaterThan(initialHeight + 300);
  const addedHeight = (await track.boundingBox())!.height;
  await section(page, "Lễ cưới");
  await page.getByRole("button", { name: "Ẩn phần này" }).click();
  await expect.poll(async () => (await track.boundingBox())!.height).toBeLessThan(addedHeight - 300);
  const header = preview.locator('[data-template-renderer="song-hy-red"] header');
  await expect.poll(() => header.evaluate(element => getComputedStyle(element).paddingBottom)).toBe("130px");
  await page.getByRole("button", { name: "Khung điện thoại", exact: true }).click();
  await expect.poll(async () => (await track.boundingBox())!.width).toBeLessThanOrEqual(390);
  await expect.poll(() => header.evaluate(element => getComputedStyle(element).paddingBottom)).toBe("100px");
  await page.getByRole("button", { name: "Khung rộng", exact: true }).click();
  await expect.poll(() => header.evaluate(element => getComputedStyle(element).paddingBottom)).toBe("130px");
  expect(canvasRequests).toEqual([]);
  await save(page);
});

test("touch swipes over the invitation scroll the page on mobile", async ({ browser }) => {
  const { user, invitation } = seed();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await loginAsUser(context, user.id);
    const page = await context.newPage();
    const canvasRequests: string[] = [];
    page.on("request", request => { if (request.isNavigationRequest() && /\/canvas(?:\?|$)/.test(request.url())) canvasRequests.push(request.url()); });
    await page.goto(`/editor2/${invitation.id}`);
    const track = page.locator(".e2-canvas-track");
    await expect.poll(async () => (await track.boundingBox())?.height ?? 0).toBeGreaterThan(2000);
    const client = await context.newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 180, y: 700 }] });
    for (let y = 660; y >= 200; y -= 40) await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 180, y }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(250);
    await expect(page.locator("iframe.e2-canvas")).toHaveCount(0);
    await expect(page.locator("[data-editor2-inline]")).toBeVisible();
    await expect(page.getByRole("main")).toHaveCount(1);
    expect(page.frames().some(frame => frame.url().includes("/canvas"))).toBe(false);
    expect(canvasRequests).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: path.join(evidence, "single-scroll-mobile.png") });
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator("[data-editor2-inline]")).toBeVisible();
    await expect(page.locator("iframe.e2-canvas")).toHaveCount(0);
    expect(canvasRequests).toEqual([]);
  } finally { await context.close(); }
});

test("draft edits survive switching between native mobile, desktop and phone previews", async ({ page, context }) => {
  const { user, invitation } = seed("double-dragon-red");
  await loginAsUser(context, user.id);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/editor2/${invitation.id}`);
  const preview = invitationPreview(page);
  await expect(page.locator("[data-editor2-inline]")).toBeVisible();
  await preview.locator('[data-invitation-short-name]').first().click();
  await page.getByLabel("Tên ngắn cô dâu", { exact: true }).fill("Lan Anh");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByLabel("Tên ngắn cô dâu", { exact: true })).toHaveValue("Lan Anh");
  await close(page);
  await expect(page.locator("[data-editor2-inline]")).toBeVisible();
  await expect(page.locator("iframe.e2-canvas")).toHaveCount(0);
  await expect(preview.locator('[data-invitation-short-name]').filter({ hasText: "Lan Anh" }).first()).toHaveText("Lan Anh");
  await page.getByRole("button", { name: "Khung điện thoại", exact: true }).click();
  await expect.poll(async () => (await page.locator(".e2-canvas-track").boundingBox())!.width).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(page.locator("iframe.e2-canvas")).toHaveCount(0);
  await expect(preview.locator('[data-invitation-short-name]').filter({ hasText: "Lan Anh" }).first()).toHaveText("Lan Anh");
  await save(page);
  await page.reload();
  await expect(preview.locator('[data-invitation-short-name]').filter({ hasText: "Lan Anh" }).first()).toHaveText("Lan Anh");
  expect(content(invitation.id).brideShortName).toBe("Lan Anh");
});

for (const width of [1440, 390]) test(`guest gift and album dialogs stay in the visible canvas and release page scroll at ${width}px`, async ({ page, context }) => {
  const { user, invitation } = seed("song-hy-green");
  getDb().prepare("UPDATE InvitationContent SET brideBankName = ?, brideAccountNumber = ?, brideAccountName = ? WHERE invitationId = ?")
    .run("ACB", "123456789", "Nguyễn Quỳnh Anh", invitation.id);
  getDb().prepare("INSERT INTO GalleryPhoto (id,invitationId,url,sortOrder) VALUES (?,?,?,0)")
    .run(`${invitation.id}-photo`, invitation.id, "/chungdoi/images/gallery/song-hy-red/photo-1.jpg");
  await loginAsUser(context, user.id);
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/editor2/${invitation.id}`);
  const preview = invitationPreview(page);
  await expect(preview.getByTestId("gift-envelope")).toBeVisible();
  await page.getByRole("button", { name: "Xem như khách", exact: true }).click();
  await preview.getByTestId("gift-envelope").click();
  await expect.poll(() => page.locator("body").evaluate(body => getComputedStyle(body).overflow)).toBe("hidden");
  await expect(preview.getByRole("heading", { name: "Phong Bao Mừng Cưới", exact: true }).last()).toBeInViewport();
  const giftScroll = await page.evaluate(() => scrollY);
  await page.mouse.move(width / 2, 450); await page.mouse.wheel(0, 500);
  expect(Math.abs(await page.evaluate(() => scrollY) - giftScroll)).toBeLessThan(3);
  await page.screenshot({ path: path.join(evidence, `single-scroll-gift-${width}.png`) });
  await preview.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect.poll(() => page.locator("body").evaluate(body => getComputedStyle(body).overflow)).not.toBe("hidden");
  await preview.getByRole("img", { name: "Wedding photo 1", exact: true }).click();
  await expect(preview.getByTestId("wedding-lightbox")).toBeInViewport();
  await expect.poll(() => page.locator("body").evaluate(body => getComputedStyle(body).overflow)).toBe("hidden");
  const albumScroll = await page.evaluate(() => scrollY);
  await page.mouse.move(width / 2, 450); await page.mouse.wheel(0, 500);
  expect(Math.abs(await page.evaluate(() => scrollY) - albumScroll)).toBeLessThan(3);
  await preview.getByTestId("wedding-lightbox").getByRole("button", { name: "Đóng album", exact: true }).click();
  await expect.poll(() => page.locator("body").evaluate(body => getComputedStyle(body).overflow)).not.toBe("hidden");

});

for (const [template, width] of [["song-hy-red", 1440], ["song-hy-red", 768], ["song-hy-red", 390], ["song-hy-red", 320], ["boho-floral-green", 1440], ["boho-floral-green", 390]] as const) {
  test(`family defaults, responsive columns and single-parent alignment: ${template} ${width}px`, async ({ page, context }) => {
    test.setTimeout(90_000);
    const { user, invitation } = seed(template);
    await loginAsUser(context, user.id);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/editor2/${invitation.id}`);
    const frame = invitationPreview(page);
    const families = frame.locator("[data-family-column]");
    await expect(families).toHaveCount(2);
    const positions = () => families.evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      const address = node.querySelector("[data-family-address]")!.getBoundingClientRect();
      const parent = node.querySelector("[data-family-parent]")?.getBoundingClientRect();
      return { address: address.top - rect.top, addressY: address.top, parentY: parent?.top };
    }));
    const before = await positions();
    await section(page, "Thông tin hai gia đình");
    await expect(page.getByLabel("Danh xưng nhà gái", { exact: true })).toHaveValue("Ông Bà");
    await expect(page.getByLabel("Danh xưng nhà trai", { exact: true })).toHaveValue("Ông Bà");
    await expect(page.getByLabel("Bố chú rể", { exact: true })).toHaveValue("Tên Cha Chú Rể");
    const columns = page.getByRole("dialog").locator(".e2-couple-grid > .e2-dialog-fields");
    expect(await columns.nth(0).locator("input,textarea").evaluateAll(nodes => nodes.map(node => node.getAttribute("name"))))
      .toEqual(["brideParentTitle", "brideFather", "brideMother", "brideAddress"]);
    const bride = (await columns.nth(0).boundingBox())!;
    const groom = (await columns.nth(1).boundingBox())!;
    expect(width >= 768 ? groom.x > bride.x + bride.width : Math.abs(groom.x - bride.x) < 1).toBe(true);
    const dialog = (await page.getByRole("dialog").boundingBox())!;
    expect(Math.abs(dialog.x + dialog.width / 2 - width / 2)).toBeLessThan(2);
    await page.screenshot({ path: path.join(evidence, `family-modal-${template}-${width}.png`) });
    // Both columns lose a different parent. The surviving names occupy row one,
    // while the empty second row continues to reserve space above the addresses.
    await page.getByLabel("Bố chú rể", { exact: true }).fill("");
    await page.getByLabel("Mẹ cô dâu", { exact: true }).fill("");
    await close(page); await save(page);
    await expect(frame.locator("[data-family-parent]")).toHaveCount(2);
    await expect(frame.locator("[data-family-parent=mother]")).toHaveText("Tên Mẹ Chú Rể");
    await expect.poll(async () => {
      const rows = await positions();
      return Math.max(Math.abs(rows[0].addressY - rows[1].addressY), Math.abs(rows[0].parentY! - rows[1].parentY!),
        ...rows.map((row, index) => Math.abs(row.address - before[index].address)));
    }).toBeLessThan(2);
    await frame.locator("[data-family-address]").first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(evidence, `family-single-${template}-${width}.png`) });
    await page.reload();
    await expect(frame.locator("[data-family-parent]")).toHaveCount(2);
    await section(page, "Thông tin hai gia đình");
    await expect(page.getByLabel("Bố chú rể", { exact: true })).toHaveValue("");
    await page.getByLabel("Mẹ chú rể", { exact: true }).fill("");
    await close(page); await save(page);
    expect(content(invitation.id).groomMother).toBe("");
    await expect(frame.locator("[data-family-parent]")).toHaveCount(1);
    const last = await positions();
    expect(Math.abs(last[0].addressY - last[1].addressY)).toBeLessThan(2);
    await page.getByRole("button", { name: "Xem như khách", exact: true }).click();
    await expect(frame.locator("[data-family-parent]")).toHaveCount(1);
    expect(content(invitation.id).groomFather).toBe("");
    expect(content(invitation.id).groomMother).toBe("");
  });
}

test("new guest modals match real defaults and Song Hy provides a configurable gift envelope", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const guest = await createGuestDraft(page);
  const frame = invitationPreview(page);
  await expect(frame.getByTestId("gift-envelope")).toBeVisible();
  await frame.getByTestId("gift-envelope").click();
  await expect(page.getByRole("dialog")).toContainText("Hộp quà mừng");
  await expect(page.getByLabel("Số tài khoản chú rể", { exact: true })).toHaveValue("");
  await page.screenshot({ path: path.join(evidence, "gift-modal-desktop.png") });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({ path: path.join(evidence, "gift-modal-mobile.png") });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await close(page);
  await section(page, "Thời gian tiệc cưới");
  await expect(page.getByLabel("Ngày cưới", { exact: true })).toHaveValue("2026-11-29");
  await expect(page.getByLabel("Giờ tiệc", { exact: true })).toHaveValue("18:00");
  await close(page);
  await section(page, "Địa điểm tổ chức");
  await expect(page.getByLabel("Tên địa điểm", { exact: true })).toHaveValue("Tên địa điểm tổ chức");
  await expect(page.getByLabel("Địa chỉ địa điểm", { exact: true })).toHaveValue("Địa chỉ địa điểm tổ chức");
  await close(page);
  await section(page, "Thời gian tiệc cưới");
  await page.getByLabel("Giờ tiệc", { exact: true }).fill("19:15");
  await close(page); await save(page); await page.reload();
  await section(page, "Thời gian tiệc cưới");
  await expect(page.getByLabel("Giờ tiệc", { exact: true })).toHaveValue("19:15");
  await close(page);
  await page.getByRole("button", { name: "Xem như khách", exact: true }).click();
  await expect(frame.getByTestId("gift-envelope")).toHaveCount(0);
  expect(content(guest.id).groomAccountNumber).toBe("");
});

test("illustrated album choices support photos, keyboard selection and save/reload", async ({ page, context }) => {
  const { user, invitation } = seed("boho-floral-green");
  const insert = getDb().prepare("INSERT INTO GalleryPhoto (id, invitationId, url, sortOrder) VALUES (?, ?, ?, ?)");
  for (let index = 0; index < 6; index++) {
    insert.run(`${invitation.id}-photo-${index}`, invitation.id, `/chungdoi/icon.png?uploaded=${index + 1}`, index);
  }
  await loginAsUser(context, user.id);
  await page.goto(`/editor2/${invitation.id}`);
  await section(page, "Album ảnh cưới");
  await expect(page.getByRole("radio", { name: "Lưới ảnh", exact: true })).toBeChecked();
  const previews = page.locator(".e2-album-option img");
  await expect(previews).toHaveCount(13);
  await expect.poll(() => previews.evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.getByText("Ghép ảnh", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Ghép ảnh", exact: true })).toBeChecked();
  // Native radios keep normal arrow-key navigation and update the same draft.
  await page.getByRole("radio", { name: "Ghép ảnh", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Ảnh trượt", exact: true })).toBeChecked();
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const dialog = page.getByRole("dialog");
    expect(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.screenshot({ path: path.join(evidence, `album-layout-${width}.png`) });
  }
  await close(page); await save(page);
  expect(content(invitation.id).albumLayout).toBe("coverflow");
  await page.reload();
  await section(page, "Album ảnh cưới");
  await expect(page.getByRole("radio", { name: "Ảnh trượt", exact: true })).toBeChecked();
  await close(page);
  await page.getByRole("button", { name: "Xem như khách", exact: true }).click();
  await expect(invitationPreview(page).getByRole("button", { name: "Xem ảnh cưới 1", exact: true })).toBeVisible();
});

test("the music suggestion opens the background-music config and saves the chosen track", async ({ page, context }) => {
  const { user, invitation } = seed();
  getDb().prepare("INSERT INTO Track (id, title, artist, duration, url, tags, status, market, addedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run("e2e-music-track", "Song Hỷ — Đỏ", "Nhạc nền", 231, "/chungdoi/music/song-hy-red.mp3", "[]", "ready", "all", new Date().toISOString());
  await loginAsUser(context, user.id);
  await page.goto(`/editor2/${invitation.id}`);
  const frame = invitationPreview(page);
  await frame.getByRole("button", { name: "Thêm Nhạc nền", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".e2-dialog-title")).toHaveText("Nhạc nền");
  await expect(dialog.locator(".e2-music-copy strong")).toHaveText("Thế giới của anh");
  await dialog.getByRole("button", { name: "Đổi bài", exact: true }).click();
  await dialog.getByRole("button", { name: /Song Hỷ — Đỏ/ }).click();
  await expect(dialog.locator(".e2-music-copy strong")).toHaveText("Song Hỷ — Đỏ");
  await expect(dialog.getByRole("slider")).toBeEnabled();
  for (let step = 0; step < 6; step++) await dialog.getByLabel("Tiến 5 giây").click();
  await expect(dialog.getByRole("slider")).toHaveValue("30");
  await dialog.getByLabel("Tự phát nhạc khi khách mở thiệp").uncheck();
  await close(page);
  await save(page);
  const stored = content(invitation.id);
  expect(stored.music).toBe("/chungdoi/music/song-hy-red.mp3");
  expect(stored.musicTitle).toBe("Song Hỷ — Đỏ");
  expect(stored.musicStartAt).toBe(30);
  expect(stored.musicEnabled).toBe(0);
  await expect(frame.getByRole("button", { name: "Thêm Nhạc nền", exact: true })).toHaveCount(0);
  await page.reload();
  await section(page, "Nhạc nền");
  await expect(page.locator(".e2-music-copy strong")).toHaveText("Song Hỷ — Đỏ");
  await expect(page.getByRole("slider")).toHaveValue("30");
  await expect(page.getByLabel("Tự phát nhạc khi khách mở thiệp")).not.toBeChecked();
});

for (const width of [1440, 390]) test(`upload modals preview template album photos, preserve defaults without uploads and replace them with user photos at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const guest = await createGuestDraft(page);
  const storedGallery = () => (getDb().prepare("SELECT url FROM GalleryPhoto WHERE invitationId = ? ORDER BY sortOrder").all(guest.id) as { url: string }[]).map(row => row.url);
  const samples = storedGallery();
  expect(samples).toHaveLength(6);
  const header = page.locator('[data-template-renderer="song-hy-red"] header');
  await expect(header.locator(`img[src="${samples[0]}"]`)).toBeVisible();
  await section(page, "Album ảnh cưới");
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator('img[src^="/chungdoi/images/"]')).toHaveCount(13);
  await page.screenshot({ path: path.join(evidence, `empty-upload-modal-${width}.png`) });
  await close(page); await save(page); await page.reload();
  expect(storedGallery()).toEqual(samples);
  await expect(header.locator(`img[src="${samples[0]}"]`)).toBeVisible();
  await section(page, "Ảnh mở đầu");
  await expect(dialog.locator("img")).toHaveCount(0);
  await close(page);
  await expect(header.locator(`img[src="${samples[0]}"]`)).toBeVisible();
  await section(page, "Ảnh mở đầu");
  await dialog.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "public/chungdoi/icon.png"));
  await expect(dialog.locator(".e2-photo-row img")).toHaveCount(1);
  const hero = await dialog.locator(".e2-photo-row img").getAttribute("src");
  expect(hero).toMatch(/^\/uploads\//);
  await close(page); await save(page); await page.reload();
  await expect(header.locator(`img[src="${hero}"]`)).toBeVisible();
  await section(page, "Ảnh mở đầu");
  await expect(dialog.locator(".e2-photo-row img")).toHaveAttribute("src", hero!);
  await close(page);
  await section(page, "Album ảnh cưới");
  await expect(dialog.locator('img[src^="/chungdoi/images/"]')).toHaveCount(13);
  await dialog.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "public/chungdoi/images/gallery/song-hy-red/photo-2.jpg"));
  await expect(dialog.locator(".e2-photo-row img")).toHaveCount(1);
  const photo = await dialog.locator(".e2-photo-row img").getAttribute("src");
  expect(photo).toMatch(/^\/uploads\//);
  await expect(dialog.locator('img[src^="/chungdoi/images/"]')).toHaveCount(0);
  await page.screenshot({ path: path.join(evidence, `user-upload-modal-${width}.png`) });
  await close(page); await save(page); await page.reload();
  expect(storedGallery()).toEqual([photo]);
  await expect(header.locator(`img[src="${hero}"]`)).toBeVisible();
  await section(page, "Album ảnh cưới");
  await expect(dialog.locator(".e2-photo-row img")).toHaveAttribute("src", photo!);
});

for (const outcome of ["success", "error"] as const) {
  test(`album upload prevents dismissal until ${outcome} and then unlocks`, async ({ page, context }) => {
    const { user, invitation } = seed();
    getDb().prepare("INSERT INTO GalleryPhoto (id, invitationId, url, sortOrder) VALUES (?, ?, ?, ?)")
      .run(`${invitation.id}-existing-photo`, invitation.id, "/chungdoi/icon.png", 0);
    await loginAsUser(context, user.id);
    await page.goto(`/editor2/${invitation.id}`);
    await section(page, "Album ảnh cưới");
    const dialog = page.getByRole("dialog");
    const done = dialog.getByRole("button", { name: "Xong", exact: true });
    const exit = dialog.getByRole("button", { name: "Đóng", exact: true });
    const releases: (() => void)[] = [];
    let requests = 0;
    const batchSize = outcome === "success" ? 2 : 1;
    await page.route("**/api/upload", async route => {
      const requestNumber = ++requests;
      if (requestNumber <= batchSize) await new Promise<void>(resolve => { releases.push(resolve); });
      if (outcome === "error" && requestNumber === 1) {
        await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Upload unavailable" }) });
      } else await route.continue();
    });
    const assertLocked = async () => {
      await expect(dialog.getByRole("status")).toHaveText("Đang tải ảnh…");
      await expect(done).toBeDisabled();
      await expect(exit).toBeDisabled();
      await expect(dialog.getByRole("button", { name: "Xóa toàn bộ ảnh", exact: true })).toBeDisabled();
      await expect(dialog.getByRole("button", { name: "Ẩn phần này", exact: true })).toHaveCount(0);
      await exit.click({ force: true });
      await done.click({ force: true });
      await page.keyboard.press("Escape");
      await expect(dialog).toBeVisible();
      await page.mouse.click(4, 4);
      await expect(dialog).toBeVisible();
    };
    try {
      const file = path.join(process.cwd(), "public/chungdoi/icon.png");
      await page.locator('input[type="file"]').setInputFiles(outcome === "success"
        ? [file, path.join(process.cwd(), "public/chungdoi/images/gallery/song-hy-red/photo-2.jpg")] : file);
      await expect.poll(() => releases.length).toBe(1);
      await assertLocked();
      releases[0]();
      if (batchSize === 2) {
        await expect.poll(() => releases.length).toBe(2);
        await assertLocked();
        await page.screenshot({ path: path.join(evidence, "album-upload-locked.png") });
        releases[1]();
      }
      await expect(done).toBeEnabled();
      await expect(exit).toBeEnabled();
      await expect(dialog.locator('input[type="file"]')).toBeEnabled();
      if (outcome === "error") {
        await expect(dialog.getByRole("alert")).toHaveText("Không tải được ảnh. Vui lòng thử lại.");
        await close(page);
        await expect(dialog).toHaveCount(0);
        await section(page, "Album ảnh cưới");
        await page.locator('input[type="file"]').setInputFiles(file);
        await expect(page.locator(".e2-photo-row img")).toHaveCount(2);
        await expect(done).toBeEnabled();
        await page.keyboard.press("Escape");
      } else {
        await expect(page.locator(".e2-photo-row img")).toHaveCount(3);
        await page.mouse.click(4, 4);
      }
      await expect(dialog).toHaveCount(0);
      await save(page);
      expect(getDb().prepare("SELECT COUNT(*) AS n FROM GalleryPhoto WHERE invitationId = ?").get(invitation.id))
        .toEqual({ n: outcome === "success" ? 3 : 2 });
      await page.reload();
      await section(page, "Album ảnh cưới");
      await expect(page.locator(".e2-photo-row img")).toHaveCount(outcome === "success" ? 3 : 2);
    } finally { releases.forEach(release => release()); }
  });
}

for (const template of ["song-hy-red", "double-dragon-red", "boho-floral-green", "lien-hoa-pink", "hy-uoc", "baroque-gold"]) {
  test(`new ${template} invitation starts with an album, exactly one ceremony, schedule and configurable gift`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    const guest = await createGuestDraft(page, template);
    const frame = invitationPreview(page);
    await expect(frame.locator(`[data-template-renderer="${template}"]`)).toBeVisible();
    await expect(frame.locator("[data-template-ceremony-item]")).toHaveCount(1);
    const photos = getDb().prepare("SELECT url FROM GalleryPhoto WHERE invitationId = ? ORDER BY sortOrder").all(guest.id);
    expect(photos.length).toBeGreaterThan(0);
    const ceremonies = getDb().prepare("SELECT title,date,time FROM CeremonyItem WHERE invitationId = ?").all(guest.id) as { title: string; date: string; time: string }[];
    expect(ceremonies).toHaveLength(1);
    expect(ceremonies[0].date).toBe("2026-11-29");
    const schedule = getDb().prepare("SELECT time,label FROM ScheduleItem WHERE invitationId = ? ORDER BY sortOrder").all(guest.id) as { time: string; label: string }[];
    expect(schedule.length).toBeGreaterThan(0);
    // Reload before editing: server-created starter rows must survive hydration,
    // not only appear transiently in the browser's initial draft.
    await page.reload();
    await expect(frame.locator("[data-template-ceremony-item]")).toHaveCount(1);
    await expect(frame.getByRole("button", { name: "Thêm Album ảnh cưới", exact: true })).toHaveCount(0);
    await expect(frame.getByRole("button", { name: "Thêm Lịch trình", exact: true })).toHaveCount(0);
    await expect(frame.getByText(schedule[0].label, { exact: true }).first()).toBeVisible();
    expect(content(guest.id).music).toBe("/chungdoi/music/the-gioi-cua-anh.mp3");
    expect(content(guest.id).musicTitle).toBe("Thế giới của anh");
    expect(content(guest.id).groomAccountNumber).toBe("");
    await expect(frame.locator('[data-testid="gift-envelope"]')).toHaveCount(1);
    await frame.locator('[data-testid="gift-envelope"]').click();
    await expect(page.getByRole("dialog")).toContainText("Hộp quà mừng");
    await expect(page.getByLabel("Số tài khoản cô dâu", { exact: true })).toHaveValue("");
    await close(page);
    await section(page, "Lễ cưới");
    await expect(page.locator('input[name="ceremony-0-date"]')).toHaveValue("2026-11-29");
    await expect(page.locator('input[name="ceremony-0-time"]')).toHaveValue(ceremonies[0].time);
    await close(page);
    await section(page, "Album ảnh cưới");
    await expect(page.locator(".e2-photo-row img")).toHaveCount(0);
    await close(page);
    await section(page, "Lịch trình");
    await expect(page.getByLabel("Hoạt động", { exact: true })).toHaveCount(schedule.length);
    await expect(page.getByLabel("Giờ", { exact: true }).first()).toHaveValue(schedule[0].time);
    await expect(page.getByLabel("Hoạt động", { exact: true }).first()).toHaveValue(schedule[0].label);
    await page.getByLabel("Hoạt động", { exact: true }).first().fill("Đón khách tại sảnh chính");
    await page.getByLabel("Giờ", { exact: true }).first().fill("17:45");
    await close(page); await save(page);
    expect(getDb().prepare("SELECT time,label FROM ScheduleItem WHERE invitationId = ? ORDER BY sortOrder LIMIT 1").get(guest.id))
      .toEqual({ time: "17:45", label: "Đón khách tại sảnh chính" });
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      if (template === "double-dragon-red" || template === "baroque-gold") {
        const timeline = frame.getByText("Đón khách tại sảnh chính", { exact: true }).first().locator("xpath=ancestor::ol[1]");
        await timeline.evaluate(async () => { await document.fonts.ready; });
        await expect.poll(async () => {
          const offset = await timeline.evaluate(element => element.getBoundingClientRect().top + window.scrollY);
          await page.evaluate(top => window.scrollTo({ top: top - 120, behavior: "instant" }), offset);
          return Math.abs((await timeline.boundingBox())!.y - 120);
        }).toBeLessThan(3);
        await timeline.screenshot({ path: path.join(evidence, `starter-timeline-${template}-${width}.png`) });
      }
      await frame.locator('[data-testid="gift-envelope"]').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(evidence, `starter-${template}-${width}.png`) });
    }
    await page.reload();
    await section(page, "Lịch trình");
    await expect(page.getByLabel("Hoạt động", { exact: true }).first()).toHaveValue("Đón khách tại sảnh chính");
    await page.getByRole("button", { name: "Ẩn phần này", exact: true }).click();
    await section(page, "Album ảnh cưới");
    await expect(page.locator(".e2-photo-row img")).toHaveCount(0);
    await page.getByRole("button", { name: "Ẩn phần này", exact: true }).click();
    await section(page, "Lễ cưới");
    await page.getByRole("button", { name: "Ẩn phần này", exact: true }).click();
    await save(page); await page.reload();
    await section(page, "Lễ cưới");
    await expect(page.locator('input[name="ceremony-0-date"]')).toHaveCount(0);
    await close(page);
    await section(page, "Album ảnh cưới");
    await expect(page.locator(".e2-photo-row img")).toHaveCount(0);
    await close(page);
    await section(page, "Lịch trình");
    await expect(page.getByLabel("Hoạt động", { exact: true })).toHaveCount(0);
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM CeremonyItem WHERE invitationId = ?").get(guest.id)).toEqual({ n: 0 });
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM ScheduleItem WHERE invitationId = ?").get(guest.id)).toEqual({ n: 0 });
    expect(errors).toEqual([]);
  });
}

for (const [template, width] of [["song-hy-red", 1440], ["song-hy-red", 390], ["double-dragon-red", 1440], ["double-dragon-red", 390]] as const) {
  test(`bank setup hint configures empty gifts and hides for guests: ${template} ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    const guest = await createGuestDraft(page, template);
    const preview = page.locator("[data-editor2-inline]");
    const suggestions = page.getByRole("complementary", { name: "Gợi ý thêm cho thiệp" });
    const hint = suggestions.locator("[data-editor2-gift-hint]");
    await expect(preview.locator("[data-editor2-gift-hint]")).toHaveCount(0);
    await expect.poll(() => suggestions.evaluate(element => {
      const invitation = document.querySelector("[data-editor2-inline]")!;
      return !invitation.contains(element) && element.getBoundingClientRect().top >= invitation.getBoundingClientRect().bottom;
    })).toBe(true);
    await expect(hint).toHaveText("Điền thông tin ngân hàng để nhận quà mừng từ bạn bè và người thân.");
    await expect(hint).toHaveCount(1);
    await hint.scrollIntoViewIfNeeded();
    await expect(hint).toBeVisible();
    await page.screenshot({ path: path.join(evidence, `gift-hint-${template}-${width}.png`) });
    await hint.click();
    await expect(page.getByRole("dialog")).toContainText("Hộp quà mừng");
    await expect(page.getByLabel("Số tài khoản cô dâu", { exact: true })).toHaveValue("");
    await page.getByLabel("Chủ tài khoản cô dâu", { exact: true }).fill("Nguyễn Quỳnh Anh");
    await close(page); await save(page); await page.reload();
    await expect(hint).toHaveCount(1);
    await page.getByRole("button", { name: "Xem như khách", exact: true }).click();
    await expect(hint).toHaveCount(0);
    await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    await expect(hint).toHaveCount(1);
    await hint.focus(); await expect(hint).toBeFocused(); await hint.press("Enter");
    await expect(page.getByRole("dialog")).toContainText("Hộp quà mừng");
    await page.getByLabel("Ngân hàng cô dâu", { exact: true }).selectOption({ label: "ACB" });
    await page.getByLabel("Số tài khoản cô dâu", { exact: true }).fill("123456789");
    await close(page); await save(page); await page.reload();
    await expect(hint).toHaveCount(0);
    expect(content(guest.id).brideAccountNumber).toBe("123456789");
    expect(content(guest.id).groomAccountNumber).toBe("");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 390]) test(`every available template offers one editable gift without fake accounts at ${width}px`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width, height: 900 });
  const guest = await createGuestDraft(page);
  const frame = invitationPreview(page);
  for (const template of completedTemplates) {
    await section(page, "Mẫu & giao diện");
    await page.getByLabel("Đổi mẫu", { exact: true }).selectOption(template.slug);
    await close(page);
    await expect(frame.locator(`[data-template-renderer="${template.slug}"]`)).toBeVisible();
    if (width < 768) {
      await expect(page.locator("iframe.e2-canvas")).toHaveCount(0);
      await expect.poll(() => page.locator("body").evaluate(body => getComputedStyle(body).overflow)).not.toBe("hidden");
    }
    await expect(frame.locator('[data-testid="gift-envelope"], [data-testid="gift-flip-card"], [data-testid="gift-qr-grid"]')).toHaveCount(1);
    await expect(frame.locator('.e2-suggestions [data-editor2-gift-hint]')).toHaveCount(1);
    await expect(frame.locator('[data-editor2-inline] [data-editor2-gift-hint]')).toHaveCount(0);
    await expect.poll(() => frame.locator('[data-testid="gift-envelope"] img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await frame.locator('[data-testid="gift-envelope"], [data-testid="gift-flip-card"], [data-testid="gift-qr-grid"]').click();
    await expect(page.getByRole("dialog")).toContainText("Hộp quà mừng");
    await expect(page.getByLabel("Số tài khoản chú rể", { exact: true })).toHaveValue("");
    await close(page);
  }
  await save(page);
  expect(content(guest.id).groomAccountNumber).toBe("");
});

for (const [template, width] of [["song-hy-red", 1440], ["song-hy-green", 390], ["spring-garden-green", 1440], ["minimalism-red", 1440], ["chibi-red", 390]] as const) {
  test(`explicit short names stay intact on ${template} at ${width}px`, async ({ page, context }) => {
    const { user, invitation } = seed(template);
    const brideFirst = width !== 390;
    getDb().prepare("UPDATE InvitationContent SET brideFirst = ? WHERE invitationId = ?").run(brideFirst ? 1 : 0, invitation.id);
    await loginAsUser(context, user.id);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/editor2/${invitation.id}`);
    const frame = invitationPreview(page);
    const headerNames = frame.locator("[data-template-renderer] header [data-invitation-short-name]");
    const orderedNames = (bride: string) => brideFirst ? [bride, "Gia Khánh 2"] : ["Gia Khánh 2", bride];
    await section(page, "Tên hai bạn & lời mời");
    await page.getByLabel("Họ tên cô dâu", { exact: true }).fill("Nguyễn Quỳnh Anh 1");
    await page.getByLabel("Tên ngắn cô dâu", { exact: true }).fill("Quỳnh Anh 2");
    await page.getByLabel("Tên ngắn chú rể", { exact: true }).fill("Gia Khánh 2");
    await page.getByLabel("Họ tên cô dâu", { exact: true }).fill("Nguyễn Quỳnh Anh 3");
    await expect(page.getByLabel("Tên ngắn cô dâu", { exact: true })).toHaveValue("Quỳnh Anh 2");
    await close(page);
    await expect(headerNames).toHaveText(orderedNames("Quỳnh Anh 2"));
    await save(page);
    expect(content(invitation.id).brideShortName).toBe("Quỳnh Anh 2");
    await headerNames.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(evidence, `custom-short-name-${template}-${width}.png`) });
    await page.reload();
    await expect(headerNames).toHaveText(orderedNames("Quỳnh Anh 2"));
    await page.getByRole("button", { name: "Xem như khách", exact: true }).click();
    await expect(headerNames).toHaveText(orderedNames("Quỳnh Anh 2"));
    await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    await section(page, "Tên hai bạn & lời mời");
    const shortName = page.getByLabel("Tên ngắn cô dâu", { exact: true });
    await shortName.click();
    await expect(shortName).toBeFocused();
    await shortName.press("ControlOrMeta+A");
    await shortName.press("Backspace");
    await expect(shortName).toHaveValue("");
    await close(page); await save(page);
    expect(content(invitation.id).brideShortName).toBe("");
    await expect(headerNames).toHaveText(orderedNames("Anh 3"));
    expect(content(invitation.id).brideFullName).toBe("Nguyễn Quỳnh Anh 3");
    expect(content(invitation.id).brideShortName).toBe("");
  });
}

for (const width of [1440, 768, 390, 320]) {
  test(`calendar opens time editing separately from venue at ${width}px`, async ({ page, context }) => {
    const { user, invitation } = seed();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    getDb().prepare("UPDATE InvitationContent SET address = ?, time = ? WHERE invitationId = ?")
      .run("Nhà hàng cũ, 12 Nguyễn Huệ", "18:00", invitation.id);
    await loginAsUser(context, user.id);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/editor2/${invitation.id}`);
    const frame = invitationPreview(page);
    const calendar = frame.locator("[data-invitation-calendar]");
    await expect(calendar).toHaveAttribute("data-e2-section", "event");
    // A day cell, rather than only the month heading, opens the same time modal.
    await calendar.getByText("11", { exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading")).toHaveText("Thời gian tiệc cưới");
    await expect(page.getByLabel("Ngày cưới", { exact: true })).toHaveValue("2026-11-29");
    await expect(page.getByLabel("Giờ tiệc", { exact: true })).toHaveValue("18:00");
    await expect(page.getByLabel("Tên địa điểm", { exact: true })).toHaveCount(0);
    await page.getByLabel("Ngày cưới", { exact: true }).fill("2026-12-20");
    await page.getByLabel("Giờ tiệc", { exact: true }).fill("19:15");
    await page.screenshot({ path: path.join(evidence, `time-modal-${width}.png`) });
    await close(page);
    await expect(calendar).toContainText("Tháng 12 / 2026");
    await calendar.focus();
    await page.keyboard.press("Enter");
    await expect(dialog.getByRole("heading")).toHaveText("Thời gian tiệc cưới");
    await close(page);
    await frame.getByText("Nhà hàng cũ, 12 Nguyễn Huệ", { exact: true }).click();
    await expect(dialog.getByRole("heading")).toHaveText("Địa điểm tổ chức");
    await expect(page.getByLabel("Ngày cưới", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Tên địa điểm", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Địa chỉ địa điểm", { exact: true })).toHaveValue("Nhà hàng cũ, 12 Nguyễn Huệ");
    const mapPreview = dialog.getByTitle("Xem trước vị trí nơi tổ chức", { exact: true });
    const mapLink = page.getByLabel("Liên kết Google Maps", { exact: true });
    await expect(mapLink).not.toBeVisible();
    await expect(dialog.getByText("Đang tự ghim theo địa chỉ phía trên", { exact: true })).toBeVisible();
    await page.getByLabel("Tên địa điểm", { exact: true }).fill("Trung tâm Hội nghị Hoa Mai");
    await page.getByLabel("Địa chỉ địa điểm", { exact: true }).fill("123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh");
    await expect.poll(async () => new URL((await mapPreview.getAttribute("src"))!).searchParams.get("q"))
      .toBe("123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh");
    await page.screenshot({ path: path.join(evidence, `venue-auto-map-${width}.png`) });
    const toggle = dialog.locator(".e2-map-toggle");
    await toggle.focus(); await page.keyboard.press("Enter");
    await expect(mapLink).toBeVisible();
    const mapUrl = "https://www.google.com/maps?q=10.773,106.703";
    await mapLink.fill(mapUrl);
    await expect.poll(async () => new URL((await mapPreview.getAttribute("src"))!).searchParams.get("q")).toBe("10.773,106.703");
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(Math.abs(bounds!.x + bounds!.width / 2 - width / 2)).toBeLessThan(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: path.join(evidence, `venue-modal-${width}.png`) });
    await close(page); await save(page); await page.reload();
    expect(content(invitation.id).venueName).toBe("Trung tâm Hội nghị Hoa Mai");
    expect(content(invitation.id).address).toBe("123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh");
    expect(content(invitation.id).mapAddress).toBe(mapUrl);
    expect(content(invitation.id).date).toBe("2026-12-20");
    expect(content(invitation.id).time).toBe("19:15");
    await section(page, "Địa điểm tổ chức");
    await expect(page.getByLabel("Tên địa điểm", { exact: true })).toHaveValue("Trung tâm Hội nghị Hoa Mai");
    await expect(page.getByLabel("Địa chỉ địa điểm", { exact: true })).toHaveValue("123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh");
    await close(page);
    await page.getByRole("button", { name: "Xem như khách", exact: true }).click();
    await expect(frame.getByText(/Trung tâm Hội nghị Hoa Mai/)).toContainText("123 Nguyễn Huệ");
    await expect(calendar).not.toHaveAttribute("role", "button");
    await expect(calendar).not.toHaveAttribute("data-e2-section");
    await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    await frame.getByRole("link", { name: "Chỉnh sửa Địa điểm tổ chức", exact: true }).click();
    await expect(dialog.getByRole("heading")).toHaveText("Địa điểm tổ chức");
    await expect(page.getByLabel("Liên kết Google Maps", { exact: true })).toHaveValue(mapUrl);
    // Clearing the name never removes or replaces the address.
    const name = page.getByLabel("Tên địa điểm", { exact: true });
    await name.click(); await name.press("ControlOrMeta+A"); await name.press("Backspace");
    await close(page); await save(page); await page.reload();
    await section(page, "Địa điểm tổ chức");
    await expect(page.getByLabel("Tên địa điểm", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Địa chỉ địa điểm", { exact: true })).toHaveValue("123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh");
    await page.getByRole("button", { name: "Bỏ link và dùng lại địa chỉ", exact: true }).click();
    await expect(mapLink).not.toBeVisible();
    await expect.poll(async () => new URL((await mapPreview.getAttribute("src"))!).searchParams.get("q"))
      .toBe("123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh");
    await close(page); await save(page); await page.reload();
    expect(content(invitation.id).mapAddress).toBe("");
    await section(page, "Địa điểm tổ chức");
    await expect(mapLink).not.toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("guest venue map uses the address, reports invalid links and discards a late short-link response after reset", async ({ page }) => {
  const guest = await createGuestDraft(page);
  await section(page, "Địa điểm tổ chức");
  const dialog = page.getByRole("dialog");
  const address = page.getByLabel("Địa chỉ địa điểm", { exact: true });
  const input = page.getByLabel("Liên kết Google Maps", { exact: true });
  const preview = dialog.getByTitle("Xem trước vị trí nơi tổ chức", { exact: true });
  await address.fill("123 Nguyễn Huệ, TP. Hồ Chí Minh");
  await dialog.locator(".e2-map-toggle").click();
  await input.fill("https://example.com/not-google-maps");
  await address.click();
  await expect(dialog.getByRole("alert")).toContainText("Không đọc được link này");
  await expect.poll(async () => new URL((await preview.getAttribute("src"))!).searchParams.get("q")).toBe("123 Nguyễn Huệ, TP. Hồ Chí Minh");

  let release: (() => void) | undefined;
  await page.route("**/editor2/**", async route => {
    const body = route.request().postData() ?? "";
    if (route.request().method() === "POST" && body.startsWith("[") && body.includes("maps.app.goo.gl/editor2-invalid-location")) {
      await new Promise<void>(resolve => { release = resolve; });
    }
    await route.continue();
  });
  await input.fill("https://maps.app.goo.gl/editor2-invalid-location");
  await address.click();
  try {
    await expect.poll(() => Boolean(release)).toBe(true);
    await expect(dialog.getByRole("status").filter({ hasText: "Đang kiểm tra vị trí từ link" })).toBeVisible();
    await page.getByRole("button", { name: "Bỏ link và dùng lại địa chỉ", exact: true }).click();
    await expect(input).toHaveValue("");
    await expect(input).not.toBeVisible();
    const response = page.waitForResponse(response => response.request().method() === "POST" && (response.request().postData() ?? "").startsWith("[") && (response.request().postData() ?? "").includes("maps.app.goo.gl/editor2-invalid-location"));
    release!();
    await response;
    await expect(input).toHaveValue("");
    await expect(page).toHaveURL(new RegExp(`/editor2/${guest.id}$`));
    await expect(dialog.getByRole("alert")).toHaveCount(0);
    await close(page); await save(page); await page.reload();
    expect(content(guest.id).mapAddress).toBe("");
    expect(content(guest.id).address).toBe("123 Nguyễn Huệ, TP. Hồ Chí Minh");
    await section(page, "Địa điểm tổ chức");
    await expect(input).not.toBeVisible();
  } finally { release?.(); }
});

for (const template of ["song-hy-red", "song-hy-green"]) {
  test(`${template} renders grid tiles instead of a carousel and can clear the entire album`, async ({ page, context }) => {
    const { user, invitation } = seed(template);
    seedGallery(invitation.id, template);
    await loginAsUser(context, user.id);
    await page.goto(`/editor2/${invitation.id}`);
    const frame = invitationPreview(page);
    let grid = frame.locator('[data-invitation-album="grid"]');
    await expect(grid.locator("button")).toHaveCount(4);
    const rectangles = await grid.locator("button").evaluateAll(items => items.map(item => {
      const { x, y } = item.getBoundingClientRect(); return { x, y };
    }));
    expect(rectangles[1].x).toBeGreaterThan(rectangles[0].x);
    expect(rectangles[1].y).toBeCloseTo(rectangles[0].y, 0);
    expect(rectangles[2].y).toBeGreaterThan(rectangles[0].y);
    await section(page, "Album ảnh cưới");
    await page.getByText("Ảnh trượt", { exact: true }).click();
    await close(page);
    await expect(grid).toHaveCount(0);
    await section(page, "Album ảnh cưới");
    await page.getByText("Lưới ảnh", { exact: true }).click();
    await close(page); await save(page); await page.reload();
    await expect(grid.locator("button")).toHaveCount(4);
    await page.getByRole("button", { name: "Xem như khách", exact: true }).click();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      grid = frame.locator('[data-invitation-album="grid"]');
      const offset = await grid.evaluate(element => element.getBoundingClientRect().top + window.scrollY);
      await page.evaluate(top => window.scrollTo({ top: top - 120, behavior: "instant" }), offset);
      await expect.poll(async () => Math.abs((await grid.boundingBox())!.y - 120)).toBeLessThan(3);
      await expect(grid.locator("img").first()).toBeVisible();
      await grid.screenshot({ path: path.join(evidence, `${template}-album-grid-${width}.png`) });
    }
    await grid.locator("button").first().click();
    await expect(frame.getByTestId("wedding-lightbox")).toBeVisible();
    await frame.getByTestId("wedding-lightbox").getByRole("button", { name: "Đóng album", exact: true }).click();
    await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    await section(page, "Album ảnh cưới");
    // Bundled photos are card defaults, not user uploads. Only real uploads
    // offer bulk deletion; clearing them restores the template's default album.
    await expect(page.getByRole("button", { name: "Xóa toàn bộ ảnh", exact: true })).toHaveCount(0);
    await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "public/chungdoi/icon.png"));
    await expect(page.locator(".e2-photo-row img")).toHaveCount(1);
    await page.getByRole("button", { name: "Xóa toàn bộ ảnh", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(".e2-photo-row")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Xóa toàn bộ ảnh", exact: true })).toHaveCount(0);
    await close(page);
    await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
    await section(page, "Album ảnh cưới");
    await expect(page.locator(".e2-photo-row img")).toHaveCount(1);
    await page.getByRole("button", { name: "Xóa toàn bộ ảnh", exact: true }).click();
    await close(page); await save(page); await page.reload();
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM GalleryPhoto WHERE invitationId = ?").get(invitation.id)).toEqual({ n: 0 });
    await section(page, "Album ảnh cưới");
    await expect(page.locator(".e2-photo-row")).toHaveCount(0);
    await expect(page.locator('input[type="file"]')).toBeEnabled();
    await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "public/chungdoi/icon.png"));
    await expect(page.locator(".e2-photo-row img")).toHaveCount(1);
    await close(page); await save(page);
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM GalleryPhoto WHERE invitationId = ?").get(invitation.id)).toEqual({ n: 1 });
  });
}
