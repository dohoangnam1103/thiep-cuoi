import { expect, test } from "@playwright/test";
import { completedTemplates } from "../../src/data/chungdoi";
import { loginAsUser } from "./helpers/auth";
import { cleanupUser, createUser } from "./helpers/fixtures";
import { getDb } from "./helpers/db";
import {
  canvasText, clickCanvas, closeMatrixDialog, editor2Copy as t,
  expectSection, matrixContent, matrixInitial, saveMatrix, seedEditor2Matrix,
} from "./helpers/editor2-matrix";

test("editor2 template picker covers the complete catalog without duplicates", async ({ page, context }) => {
  expect(completedTemplates.length).toBeGreaterThan(0);
  const slugs = completedTemplates.map(template => template.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  const user = createUser();
  try {
    const invitation = seedEditor2Matrix(user.id, slugs[0], true);
    await loginAsUser(context, user.id);
    await page.goto(`/editor2/${invitation.id}`);
    await page.getByRole("button", { name: t.content, exact: true }).click();
    await page.getByRole("button", { name: t.sections.appearance, exact: true }).click();
    await expect(page.getByLabel(t.chooseTemplate, { exact: true }).locator("option")).toHaveCount(slugs.length);
    expect(await page.getByLabel(t.chooseTemplate, { exact: true }).locator("option").evaluateAll(options => options.map(option => option.getAttribute("value")).sort())).toEqual([...slugs].sort());
  } finally { await context.close(); cleanupUser(user.id); }
});

for (const viewport of [
  { width: 1440, height: 900, mobile: false },
  { width: 768, height: 900, mobile: false },
  { width: 390, height: 844, mobile: true },
  { width: 320, height: 700, mobile: true },
  { width: 844, height: 390, mobile: true },
]) {
  test(`autosave/publish footer and header template picker at ${viewport.width}x${viewport.height} with touch=${viewport.mobile}`, async ({ browser, baseURL }, testInfo) => {
    const user = createUser();
    const context = await browser.newContext({
      baseURL, locale: "vi-VN", viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.mobile, isMobile: viewport.mobile,
    });
    try {
      const invitation = seedEditor2Matrix(user.id, "double-phoenix-red", true);
      await loginAsUser(context, user.id);
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(`/editor2/${invitation.id}`);
      await expect(canvasText(page, matrixInitial.brideShortName)).toBeVisible();
      const actions = page.locator(".e2-publish-actions");
      const templates = page.locator(".e2-header-tools").getByRole("button", { name: t.chooseTemplate, exact: true });
      const publish = actions.getByRole("button", { name: t.publish, exact: true });
      await expect(templates).toHaveCount(1);
      await expect(publish).toHaveCount(1);
      // "Đổi mẫu" belongs to the top header, never the sticky action bar.
      await expect(actions.getByRole("button", { name: t.chooseTemplate, exact: true })).toHaveCount(0);
      await expect(templates).toBeInViewport();
      expect(await templates.evaluate(element => element.closest(".e2-header") !== null)).toBe(true);
      expect(await actions.evaluate(element => getComputedStyle(element).position)).toBe(viewport.mobile ? "fixed" : "static");
      const header = await page.locator(".e2-header").boundingBox();
      if (viewport.mobile) {
        const heading = await page.locator(".e2-heading").boundingBox();
        expect(header!.height - heading!.height).toBeLessThan(36);
        for (const offset of [0, 1600, Number.MAX_SAFE_INTEGER]) {
          await page.evaluate(top => window.scrollTo({ top, behavior: "instant" }), offset);
          const bounds = await actions.boundingBox();
          expect(bounds!.x).toBe(0);
          expect(Math.abs(bounds!.width - viewport.width)).toBeLessThanOrEqual(1);
          expect(Math.abs(bounds!.y + bounds!.height - viewport.height)).toBeLessThanOrEqual(1);
          await expect(publish).toBeInViewport();
        }
        const workspace = page.locator(".e2-workspace");
        await expect(workspace).toBeVisible();
        const bottom = await workspace.boundingBox();
        const bounds = await actions.boundingBox();
        expect(bottom!.y + bottom!.height).toBeLessThanOrEqual(bounds!.y);
      } else {
        const bounds = await actions.boundingBox();
        expect(bounds!.y).toBeGreaterThanOrEqual(header!.y);
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(header!.y + header!.height);
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      const screenshot = testInfo.outputPath("save-publish-controls.png");
      await page.screenshot({ path: screenshot });
      await testInfo.attach("responsive-save-publish", { path: screenshot, contentType: "image/png" });
      await clickCanvas(page, canvasText(page, matrixInitial.brideShortName));
      await expectSection(page, "couple");
      await page.getByLabel(t.fields.brideShortName, { exact: true }).fill("An Bình");
      await closeMatrixDialog(page);
      await expect(actions.getByRole("status")).toHaveText(t.saved, { timeout: 10_000 });
      expect(matrixContent(invitation.id).brideShortName).toBe("An Bình");
      if (viewport.width === 320) {
        await clickCanvas(page, canvasText(page, "An Bình"));
        await page.getByLabel(t.fields.brideShortName, { exact: true }).fill("Bình Minh");
        await closeMatrixDialog(page);
        await page.route("**/editor2/**", route => route.request().method() === "POST" ? route.abort() : route.continue());
        await expect(actions.getByRole("status")).toHaveText(t.saveError, { timeout: 10_000 });
        const bounds = await actions.boundingBox();
        expect(Math.abs(bounds!.y + bounds!.height - viewport.height)).toBeLessThanOrEqual(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.unroute("**/editor2/**");
        await clickCanvas(page, canvasText(page, "Bình Minh"));
        await page.getByLabel(t.fields.brideShortName, { exact: true }).fill("Bình An");
        await closeMatrixDialog(page);
        await expect(actions.getByRole("status")).toHaveText(t.saved, { timeout: 10_000 });
        expect(matrixContent(invitation.id).brideShortName).toBe("Bình An");
      }
      await publish.click();
      await expect(actions.getByRole("button", { name: t.sharePublished, exact: true })).toBeVisible();
      expect(getDb().prepare("SELECT status FROM Invitation WHERE id = ?").get(invitation.id)).toEqual({ status: "published" });
      await expect(templates).toBeVisible();
      // Once published, the primary action changes from publishing to saving.
      await expect(actions.getByRole("button", { name: t.save, exact: true })).toBeVisible();
      await expect(publish).toHaveCount(0);
      expect(errors).toEqual([]);
    } finally { await context.close(); cleanupUser(user.id); }
  });
}

for (const width of [1440, 768, 390, 320]) {
  test(`schedule keeps each activity on one row and preserves edits at ${width}px`, async ({ page, context }, testInfo) => {
    const user = createUser();
    try {
      const invitation = seedEditor2Matrix(user.id, "song-hy-red", true);
      const additional = [
        ["18:30", "Khai tiệc"], ["19:00", "Nghi thức cưới"], ["19:30", "Nâng ly"],
        ["20:00", "Chụp ảnh"], ["20:30", "Tiễn khách"],
      ];
      const insert = getDb().prepare("INSERT INTO ScheduleItem (id, invitationId, time, label, sortOrder) VALUES (?, ?, ?, ?, ?)");
      additional.forEach(([time, label], index) => insert.run(`${invitation.id}-activity-${index}`, invitation.id, time, label, index + 1));
      await loginAsUser(context, user.id);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/editor2/${invitation.id}`);
      await clickCanvas(page, canvasText(page, "Đón Khách Kiểm Tra"));
      const dialog = await expectSection(page, "schedule");
      const times = dialog.getByLabel(t.scheduleTime, { exact: true });
      const labels = dialog.getByLabel(t.scheduleLabel, { exact: true });
      await expect(labels).toHaveCount(6);
      const edited = "Đón khách và chụp ảnh cùng gia đình trước giờ khai tiệc";
      await times.first().fill("17:30");
      await labels.first().fill(edited);
      for (let index = 0; index < 6; index++) {
        const remove = dialog.getByRole("button", { name: t.removeSchedule.replace("{number}", String(index + 1)), exact: true });
        const boxes = await Promise.all([times.nth(index).boundingBox(), labels.nth(index).boundingBox(), remove.boundingBox()]);
        expect(boxes.every(Boolean)).toBe(true);
        const [timeBox, labelBox, removeBox] = boxes;
        // Native time/text inputs can differ by a couple of sub-pixel border
        // rounds while still rendering as one visual row.
        expect(Math.abs(timeBox!.y - labelBox!.y)).toBeLessThanOrEqual(2);
        expect(Math.abs(timeBox!.y - removeBox!.y)).toBeLessThanOrEqual(2);
        expect(timeBox!.height).toBeLessThanOrEqual(46);
        expect(timeBox!.x + timeBox!.width).toBeLessThan(labelBox!.x);
        expect(labelBox!.x + labelBox!.width).toBeLessThan(removeBox!.x);
        expect(removeBox!.width).toBeGreaterThanOrEqual(44);
      }
      expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      await labels.first().focus();
      await page.keyboard.press("Tab");
      await expect(dialog.getByRole("button", { name: t.removeSchedule.replace("{number}", "1"), exact: true })).toBeFocused();
      const screenshot = testInfo.outputPath(`schedule-modal-${width}.png`);
      await dialog.screenshot({ path: screenshot });
      await testInfo.attach("compact-schedule", { path: screenshot, contentType: "image/png" });
      await dialog.getByRole("button", { name: t.addSchedule, exact: true }).click();
      await expect(labels).toHaveCount(7);
      await dialog.getByRole("button", { name: t.removeSchedule.replace("{number}", "7"), exact: true }).click();
      await dialog.getByRole("button", { name: t.removeSchedule.replace("{number}", "2"), exact: true }).click();
      await expect(labels).toHaveCount(5);
      await expect(labels.first()).toHaveValue(edited);
      await expect(labels.nth(1)).toHaveValue("Nghi thức cưới");
      await closeMatrixDialog(page);
      await saveMatrix(page);
      expect(getDb().prepare("SELECT time, label FROM ScheduleItem WHERE invitationId = ? ORDER BY sortOrder").all(invitation.id))
        .toEqual([{ time: "17:30", label: edited }, ...additional.slice(1).map(([time, label]) => ({ time, label }))]);
      await page.reload();
      await clickCanvas(page, canvasText(page, edited));
      await expectSection(page, "schedule");
      await expect(labels).toHaveCount(5);
      await expect(times.first()).toHaveValue("17:30");
      await expect(labels.first()).toHaveValue(edited);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    } finally { await context.close(); cleanupUser(user.id); }
  });
}

for (const template of ["song-hy-red", "lien-hoa-pink", "hoa-tinh-red"]) {
  for (const width of [1440, 390]) {
    test(`${template} / ${width}px / reception heading and venue map open venue editing`, async ({ page, context }) => {
      const user = createUser();
      try {
        const invitation = seedEditor2Matrix(user.id, template, false);
        await loginAsUser(context, user.id);
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`/editor2/${invitation.id}`);
        const renderer = page.locator(`[data-template-renderer="${template}"]`);
        const heading = renderer.locator("h1, h2, h3, h4, h5, h6").filter({ hasText: /Tiệc cưới sẽ tổ chức tại/i }).filter({ visible: true }).first();
        await clickCanvas(page, heading);
        await expectSection(page, "venue");
        await closeMatrixDialog(page);
        const frame = renderer.locator("iframe").filter({ visible: true }).first();
        await expect(frame).toHaveCount(1);
        await clickCanvas(page, frame.locator("xpath=.."));
        await expectSection(page, "venue");
        await closeMatrixDialog(page);
      } finally { await context.close(); cleanupUser(user.id); }
    });
  }
}

for (const template of ["song-hy-red", "lien-hoa-pink", "hoa-tinh-red"]) {
  for (const width of [1440, 390]) {
    test(`${template} / ${width}px / identical ceremony and reception times retain their context`, async ({ page, context }) => {
      const user = createUser();
      try {
        const invitation = seedEditor2Matrix(user.id, template, false);
        getDb().prepare("UPDATE CeremonyItem SET date = ?, time = ? WHERE invitationId = ?")
          .run(matrixInitial.date, matrixInitial.time, invitation.id);
        await loginAsUser(context, user.id);
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`/editor2/${invitation.id}`);
        const ceremony = page.locator("[data-template-ceremonies]").getByText(new RegExp(`${matrixInitial.time}$`)).filter({ visible: true }).first();
        await clickCanvas(page, ceremony);
        await expectSection(page, "ceremonies");
        await expect(page.getByLabel(t.ceremonyTime, { exact: true })).toHaveValue(matrixInitial.time);
        await closeMatrixDialog(page);
        // Duplicate couple names still expose both independent inputs, and
        // changing the groom must not overwrite the bride's matching name.
        await clickCanvas(page, canvasText(page, matrixInitial.brideShortName));
        await expectSection(page, "couple");
        for (const name of ["brideFullName", "groomFullName"] as const) await page.getByLabel(t.fields[name], { exact: true }).fill("Nguyễn Minh Anh");
        for (const name of ["brideShortName", "groomShortName"] as const) await page.getByLabel(t.fields[name], { exact: true }).fill("Minh Anh");
        await closeMatrixDialog(page);
        await clickCanvas(page, canvasText(page, "Minh Anh"));
        await expectSection(page, "couple");
        await page.getByLabel(t.fields.groomFullName, { exact: true }).fill("Trần Hoàng Nam");
        await expect(page.getByLabel(t.fields.brideFullName, { exact: true })).toHaveValue("Nguyễn Minh Anh");
        await closeMatrixDialog(page);
      } finally { await context.close(); cleanupUser(user.id); }
    });
  }
}
