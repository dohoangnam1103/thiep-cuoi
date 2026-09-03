import { randomUUID } from "node:crypto";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";
import { cleanupUser, createInvitation, createUser, seededAdminId } from "./helpers/fixtures";
import { getDb } from "./helpers/db";

for (const [templateId, count] of [["minimalism-purple", 1], ["minimalism-green", 2], ["minimalism-brown", 1]] as const) {
  test(`${templateId}: album default, dedicated upload, removal and saved reload`, async ({ page, context }) => {
    test.setTimeout(90_000);
    const db = getDb();
    const user = createUser();
    const demo = createInvitation(user.id, { templateId, isDemo: true });
    const album = [
      "/chungdoi/images/gallery/minimalism-purple/photo-1.jpg",
      "/chungdoi/images/gallery/minimalism-purple/photo-2.jpg",
    ];
    db.prepare("UPDATE InvitationContent SET groomFullName=?,brideFullName=?,date=?,heroImage=?,heroImage2=?,brideFirst=1 WHERE invitationId=?")
      .run("Nguyễn Minh Khang", "Trần Thùy Linh", "2027-12-12", "/chungdoi/images/gallery/minimalism-purple/photo-6.jpg", count === 2 ? "/chungdoi/images/gallery/minimalism-green/hero-groom.webp" : "", demo.id);
    for (const [index, url] of album.entries()) {
      db.prepare("INSERT INTO GalleryPhoto(id,invitationId,url,sortOrder) VALUES(?,?,?,?)").run(randomUUID(), demo.id, url, index);
    }
    const savedHero = () => (db.prepare("SELECT heroImage FROM InvitationContent WHERE invitationId=?").get(demo.id) as { heroImage: string }).heroImage;
    const openEditor = async () => {
      await page.goto(`/admin/demos/${demo.id}`);
    };
    const preview = async (expected: string[]) => {
      await page.getByRole("button", { name: "Xem trước", exact: true }).click();
      const header = page.getByTestId(`${templateId}-template`).locator("header");
      await expect(header).toBeVisible();
      for (const url of expected) await expect(header.locator(`img[src="${url}"]`)).toHaveCount(1);
      await expect(header.locator('img[src$="photo-6.jpg"]')).toHaveCount(0);
    };
    try {
      await loginAsAdmin(context, seededAdminId());
      await openEditor();
      await expect(page.locator('input[name="heroImage"]')).toHaveValue("");
      await expect(page.getByRole("button", { name: "Bấm để chọn ảnh", exact: true })).toHaveCount(count);
      await preview(album.slice(0, count));
      await openEditor();
      const chooser = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: "Bấm để chọn ảnh", exact: true }).first().click();
      await (await chooser).setFiles(path.join(process.cwd(), "public/chungdoi/images/gallery/minimalism-purple/photo-3.jpg"));
      await expect(page.locator('input[name="heroImage"]')).toHaveValue(/^\/uploads\//);
      const uploaded = await page.locator('input[name="heroImage"]').inputValue();
      await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
      await expect.poll(savedHero).toBe(uploaded);
      await openEditor();
      await expect(page.locator('input[name="heroImage"]')).toHaveValue(uploaded);
      await preview(count === 2 ? [uploaded, album[0]] : [uploaded]);
      await openEditor();
      await page.getByRole("button", { name: "Xoá", exact: true }).first().click();
      await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
      await expect.poll(savedHero).toBe("");
      await openEditor();
      await preview(album.slice(0, count));
    } finally {
      cleanupUser(user.id);
    }
  });
}
