import { formatCalendarDate } from "../../src/lib/calendar-date";
import { expect, test } from "@playwright/test";
import { completedTemplates } from "../../src/data/chungdoi";
import { heroImageCount } from "../../src/data/editor-template-capabilities";
import { loginAsUser } from "./helpers/auth";
import { cleanupUser, createUser } from "./helpers/fixtures";
import { getDb } from "./helpers/db";
import {
  canvasCoupleName, canvasEventTime, canvasPhoto, canvasText, clickCanvas, closeMatrixDialog, editor2Copy as t,
  expectSection, matrixContent, matrixInitial, saveMatrix, seedEditor2Matrix,
} from "./helpers/editor2-matrix";

test.use({ actionTimeout: 10_000 });

// Do not derive expectations from [data-e2-*]: a missing binding is precisely
// the regression this audit must detect. Every section below is required by the
// current completed catalog. New exceptions need an explicit reviewed contract.
for (const template of completedTemplates) {
  for (const width of [1440, 390]) {
    test(`${template.slug} / ${width}px / click, edit, persist and guest preview`, async ({ page, context }, testInfo) => {
      const user = createUser();
      const invitation = seedEditor2Matrix(user.id, template.slug, width === 1440);
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => {
        if (message.type() === "error" && /hydrat|uncaught|react error|maximum update depth/i.test(message.text())) errors.push(message.text());
      });
      const expected = { ...matrixInitial };
      const field = (key: keyof typeof t.fields) => page.getByRole("dialog").getByLabel(t.fields[key], { exact: true });
      const renderer = page.locator(`[data-template-renderer="${template.slug}"]`);
      const initialUrl = `/editor2/${invitation.id}`;
      try {
        await loginAsUser(context, user.id);
        await page.setViewportSize({ width, height: 1000 });
        expect((await page.goto(initialUrl))?.status()).toBe(200);
        // Renderers using display:contents have no box; their content still must.
        await expect(renderer).toHaveCount(1);
        await expect(canvasCoupleName(page, "bride", expected)).toBeVisible();

        await test.step("both names open the couple modal and preserve the other person", async () => {
          for (const person of ["bride", "groom"] as const) {
            await clickCanvas(page, canvasCoupleName(page, person, expected));
            await expectSection(page, "couple");
            await expect(field(`${person}FullName`)).toHaveValue(expected[`${person}FullName`]);
            expected[`${person}FullName`] = person === "bride" ? "Nguyễn Hoàng Ngọc Bảo Anh" : "Trần Hoàng Gia Minh";
            expected[`${person}ShortName`] = person === "bride" ? "Bảo Anh" : "Gia Minh";
            await field(`${person}FullName`).fill(expected[`${person}FullName`]);
            await field(`${person}ShortName`).fill(expected[`${person}ShortName`]);
            await closeMatrixDialog(page);
            await expect(canvasCoupleName(page, person, expected)).toBeVisible();
          }
        });

        await test.step("all four parent names target the correct family field", async () => {
          for (const key of ["brideFather", "brideMother", "groomFather", "groomMother"] as const) {
            await clickCanvas(page, canvasText(page, expected[key]));
            await expectSection(page, "family");
            await expect(field(key)).toBeFocused();
            await expect(field(key)).toHaveValue(expected[key]);
            expected[key] = `${expected[key]} An`;
            await field(key).fill(expected[key]);
            await closeMatrixDialog(page);
            await expect(canvasText(page, expected[key])).toBeVisible();
          }
        });

        await test.step("wedding time opens event, separately from venue and ceremonies", async () => {
          await clickCanvas(page, canvasEventTime(page, expected.time));
          const dialog = await expectSection(page, "event");
          await expect(field("date")).toHaveValue(formatCalendarDate(expected.date));
          await expect(field("time")).toHaveValue(expected.time);
          await expect(dialog.getByLabel(t.fields.address, { exact: true })).toHaveCount(0);
          expected.date = "2026-12-20"; expected.time = "19:41"; expected.banquetTime = expected.time;
          await field("date").fill(formatCalendarDate(expected.date));
          await field("time").fill(expected.time);
          await closeMatrixDialog(page);
          await expect(canvasEventTime(page, expected.time)).toBeVisible();
          // Keyboard activation exercises the same real text, then Escape must
          // dismiss and release the scroll lock on every template.
          const time = canvasEventTime(page, expected.time);
          await time.focus(); await time.press("Enter");
          await expectSection(page, "event");
          await page.keyboard.press("Escape");
          await expect(page.getByRole("dialog")).toHaveCount(0);
        });

        await test.step("venue text opens venue and updates the actual invitation", async () => {
          // venueDisplayAddress combines name and address in a single text node.
          await clickCanvas(page, renderer.getByText(new RegExp(expected.venueName)).filter({ visible: true }).first());
          await expectSection(page, "venue");
          await expect(field("venueName")).toHaveValue(expected.venueName);
          await expect(field("address")).toHaveValue(expected.address);
          await expect(field("date")).toHaveCount(0);
          expected.venueName = "Trung Tâm Hội Nghị Hoa Sen";
          expected.address = "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh";
          await field("venueName").fill(expected.venueName);
          await field("address").fill(expected.address);
          await closeMatrixDialog(page);
          await expect(renderer.getByText(new RegExp(expected.address)).first()).toBeVisible();
        });

        await test.step("native ceremony and timeline open their own collection modals", async () => {
          await clickCanvas(page, canvasText(page, "Lễ Vu Quy Kiểm Tra"));
          await expectSection(page, "ceremonies");
          await expect(page.getByLabel(t.ceremonyDate, { exact: true })).toHaveValue("28/11/2026");
          await page.getByLabel(t.ceremonyTitle, { exact: true }).fill("Lễ Thành Hôn Đã Sửa");
          await closeMatrixDialog(page);
          await expect(canvasText(page, "Lễ Thành Hôn Đã Sửa")).toBeVisible();
          await clickCanvas(page, canvasText(page, "Đón Khách Kiểm Tra"));
          await expectSection(page, "schedule");
          await expect(page.getByLabel(t.scheduleLabel, { exact: true })).toHaveValue("Đón Khách Kiểm Tra");
          await page.getByLabel(t.scheduleLabel, { exact: true }).fill("Khai Tiệc Đã Sửa");
          await closeMatrixDialog(page);
          await expect(canvasText(page, "Khai Tiệc Đã Sửa")).toBeVisible();
        });

        await test.step("album photos open album instead of a guest lightbox", async () => {
          await clickCanvas(page, canvasPhoto(page, invitation.gallery[0]));
          await expectSection(page, "album");
          await page.getByRole("dialog").locator("label").filter({ has: page.getByRole("radio", { name: t.layouts.mosaic, exact: true }) }).click();
          await expect(page.getByRole("radio", { name: t.layouts.mosaic, exact: true })).toBeChecked();
          await closeMatrixDialog(page);
        });

        await test.step("opening photos match zero, one or two actual slots", async () => {
          const count = heroImageCount(template.slug);
          for (const key of (count === 2 ? ["heroImage", "heroImage2"] : count === 1 ? ["heroImage"] : []) as ("heroImage" | "heroImage2")[]) {
            await clickCanvas(page, canvasPhoto(page, expected[key]));
            const dialog = await expectSection(page, "photos");
            await expect(dialog.locator("[data-e2-hero-slot]")).toHaveCount(count);
            await expect(page.locator(`#e2-${key}`)).toBeFocused();
            await closeMatrixDialog(page);
          }
          if (count === 0) {
            await expect(canvasPhoto(page, expected.heroImage)).toHaveCount(0);
            await expect(canvasPhoto(page, expected.heroImage2)).toHaveCount(0);
            await page.getByRole("button", { name: t.content, exact: true }).click();
            await expect(page.getByRole("button", { name: t.sections.photos, exact: true })).toHaveCount(0);
            await closeMatrixDialog(page);
          }
        });

        await test.step("gift click configures the gift without opening guest transfer UI", async () => {
          const gift = renderer.locator('[data-testid="gift-envelope"], [data-testid="gift-flip-card"], [data-testid="gift-qr-grid"]');
          await expect(gift).toHaveCount(1);
          await clickCanvas(page, gift);
          await expectSection(page, "gift");
          await expect(field("groomAccountNumber")).toHaveValue("");
          await field("groomAccountName").fill("Tran Hoang Gia Minh");
          await closeMatrixDialog(page);
        });

        await test.step("music control opens the saved background-music configuration", async () => {
          // The shared music control lives in the demo shell, outside the
          // template renderer, but still inside the editable canvas.
          const music = page.locator("[data-editor2-inline] [data-invitation-music]").filter({ visible: true }).first();
          await expect(music).toHaveCount(1);
          await clickCanvas(page, music);
          const dialog = await expectSection(page, "music");
          await expect(dialog.locator(".e2-music-copy strong")).toHaveText(expected.musicTitle);
          await expect(dialog.locator(".e2-music-copy > span")).toHaveText(expected.musicArtist);
          await expect(dialog.getByRole("slider")).toHaveValue(String(expected.musicStartAt));
          await expect(dialog).toContainText("Bắt đầu từ");
          await expect(dialog.getByLabel(t.musicAutoPlay, { exact: true })).toBeChecked();
          await closeMatrixDialog(page);
        });

        await test.step("save reaches the server before reload and preserves unrelated fields", async () => {
          await saveMatrix(page);
          expect(matrixContent(invitation.id)).toMatchObject({ ...expected, albumLayout: "mosaic", groomAccountName: "Tran Hoang Gia Minh" });
          expect(getDb().prepare("SELECT title, date, time FROM CeremonyItem WHERE invitationId = ?").all(invitation.id))
            .toEqual([{ title: "Lễ Thành Hôn Đã Sửa", date: "2026-11-28", time: "09:23" }]);
          expect(getDb().prepare("SELECT label, time FROM ScheduleItem WHERE invitationId = ?").all(invitation.id))
            .toEqual([{ label: "Khai Tiệc Đã Sửa", time: "17:45" }]);
          expect(getDb().prepare("SELECT url FROM GalleryPhoto WHERE invitationId = ? ORDER BY sortOrder").all(invitation.id))
            .toEqual(invitation.gallery.map(url => ({ url })));
          // Remove the browser recovery cache: this reload must read server data.
          await page.evaluate(() => localStorage.clear());
          await page.reload();
          await expect(canvasCoupleName(page, "bride", expected)).toBeVisible();
          await expect(canvasCoupleName(page, "groom", expected)).toBeVisible();
          await expect(canvasEventTime(page, expected.time)).toBeVisible();
          for (const text of [expected.brideFather, expected.groomMother, "Lễ Thành Hôn Đã Sửa", "Khai Tiệc Đã Sửa"]) {
            await expect(canvasText(page, text)).toBeVisible();
          }
          await clickCanvas(page, canvasText(page, expected.brideFather));
          await expectSection(page, "family");
          for (const key of ["brideFather", "brideMother", "groomFather", "groomMother"] as const) await expect(field(key)).toHaveValue(expected[key]);
          // Exercise partial-family/intentional clearing, without allowing defaults
          // to silently resurrect the deleted parent's name after another reload.
          await field("brideFather").fill(""); expected.brideFather = "";
          await closeMatrixDialog(page); await saveMatrix(page);
          await page.evaluate(() => localStorage.clear()); await page.reload();
          await expect(canvasText(page, `${matrixInitial.brideFather} An`)).toHaveCount(0);
          await expect(canvasText(page, expected.brideMother)).toBeVisible();
          expect(matrixContent(invitation.id).brideFather).toBe("");
        });

        await test.step("guest preview removes bindings and retains saved content", async () => {
          await page.getByRole("button", { name: t.preview, exact: true }).click();
          await expect(renderer.locator("[data-e2-section]")).toHaveCount(0);
          await expect(page.locator(".e2-suggestions, [data-editor2-gift-placeholder]")).toHaveCount(0);
          await expect(canvasCoupleName(page, "bride", expected)).toBeVisible();
          await expect(canvasText(page, expected.brideMother)).toBeVisible();
          await expect(canvasEventTime(page, expected.time)).toBeVisible();
          await expect(canvasText(page, "Khai Tiệc Đã Sửa")).toBeVisible();
          await page.getByRole("button", { name: t.edit, exact: true }).click();
          await clickCanvas(page, canvasCoupleName(page, "bride", expected));
          const dialog = await expectSection(page, "couple");
          await expect(field("brideFullName")).toHaveValue(expected.brideFullName);
          const modalImage = testInfo.outputPath("couple-modal.png");
          await dialog.screenshot({ path: modalImage });
          await testInfo.attach("couple-modal", { path: modalImage, contentType: "image/png" });
          await closeMatrixDialog(page);
          await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          expect(new URL(page.url()).pathname).toBe(initialUrl);
          expect(errors, "runtime/hydration errors across the entire editing session").toEqual([]);
          await page.evaluate(() => window.scrollTo(0, 0));
          const invitationImage = testInfo.outputPath("invitation-after-edit.png");
          await page.screenshot({ path: invitationImage });
          await testInfo.attach("invitation-after-edit", { path: invitationImage, contentType: "image/png" });
        });
      } finally {
        // Close before deleting the owner: queued autosaves cannot race cleanup.
        await context.close();
        cleanupUser(user.id);
      }
    });
  }
}
