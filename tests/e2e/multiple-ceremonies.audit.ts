import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

import { templates, retiredTemplateSlugs, getVietnameseTemplateSlug } from "@/data/chungdoi";
import { retiredTemplateRouteSlugs } from "@/data/retired-template-slugs";
import { getDb } from "./helpers/db";
import { CEREMONY_AUDIT_ITEMS as ceremonies, CEREMONY_AUDIT_USER } from "./helpers/ceremony-audit";

const evidence = path.join(process.cwd(), "docs/research/multiple-ceremonies-audit");
const retiredRoutes = new Set<string>(retiredTemplateRouteSlugs);
const physical = new Set(["long-phung-gatefold", "nguyet-anh-sleeve", "coi-trau-kham-trai", "doraemon-door", "detective-conan-casebook"]);

async function openPublished(page: Page, slug: string) {
  if (physical.has(slug)) {
    await expect(page.getByTestId(`${slug}-stage`)).toHaveAttribute("data-cover-assets-ready", "true", { timeout: 45_000 });
    await page.getByTestId(`${slug}-open`).click();
    return;
  }
  const button = slug === "to-hong"
    ? page.locator("[data-to-hong-cover] [data-open-btn]")
    : page.locator("[data-open-invitation-control]");
  await expect(async () => {
    if (await button.count()) {
      await expect(button).toBeEnabled();
      await button.focus();
      await button.press("Enter");
    }
    await expect(page.locator("[data-invitation-detail=visible]")).toBeAttached({ timeout: 1_000 });
  }).toPass({ timeout: 45_000 });
}

for (const template of templates) {
  test(`${template.slug}: every ceremony stays inside the template before its footer`, async ({ page }) => {
    test.setTimeout(120_000);
    const fixture = getDb().prepare("SELECT Invitation.slug FROM Invitation JOIN User ON User.id = Invitation.userId WHERE User.email = ? AND Invitation.templateId = ?")
      .get(CEREMONY_AUDIT_USER, template.slug) as { slug: string } | undefined;
    expect(fixture, "Three-ceremony fixture must be seeded before server startup").toBeDefined();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route(/googletagmanager|google-analytics/, (route) => route.abort());
    const routeSlug = getVietnameseTemplateSlug(template.slug);
    // Retiring a demo route must not remove test coverage of historical
    // published invitations. Use a real paid/published fixture in that case.
    const published = retiredTemplateSlugs.has(template.slug) || retiredRoutes.has(template.slug) || retiredRoutes.has(routeSlug);
    const results = [];
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(published ? `/thiep/${fixture!.slug}` : `/mau-thiep/${routeSlug}/demo/capture`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${width}px: invitation route`).toBe(200);
      if (published) await openPublished(page, template.slug);
      const renderer = page.locator(`[data-template-renderer="${template.slug}"]`);
      await expect(renderer).toBeAttached();
      if (template.slug === "detective-conan-casebook") {
        await page.getByTestId("detective-conan-casebook-navigation")
          .getByRole("button", { name: "Đi đến chương Thời gian thành hôn", exact: true }).click();
        await expect(page.getByTestId("detective-conan-casebook-chapter-ceremony")).toBeVisible();
      }
      const toggle = page.getByTestId("invitation-auto-scroll-toggle");
      if (await toggle.count() && await toggle.getAttribute("aria-pressed") === "true") await toggle.click();
      const native = renderer.locator("[data-template-ceremonies]");
      await expect(native).toHaveCount(1);
      const items = native.locator("[data-template-ceremony-item]");
      await expect(items).toHaveCount(3);
      for (const [index, ceremony] of ceremonies.entries()) {
        await expect(items.nth(index)).toContainText(ceremony.title);
        await expect(items.nth(index)).toContainText(ceremony.time);
        await expect(items.nth(index)).toContainText(["11", "22", "30"][index]);
        await expect(items.nth(index).getByText(ceremony.title, { exact: false })).toBeVisible();
      }
      await expect(page.locator("[data-additional-ceremonies]")).toHaveCount(0);
      const beforeFooter = await renderer.evaluate((root) => {
        const items = [...root.querySelectorAll("[data-template-ceremony-item]")];
        const footers = [...root.querySelectorAll("footer,[data-template-footer]")];
        return footers.every((footer) => items.every((item) => !footer.contains(item) && Boolean(item.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING)));
      });
      expect(beforeFooter, `${width}px: ceremonies precede the native footer`).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}px: no horizontal overflow`).toBeLessThanOrEqual(width);
      await page.evaluate(() => document.fonts.ready);
      const section = native.locator("xpath=ancestor-or-self::section[1]");
      mkdirSync(evidence, { recursive: true });
      // Opening the cover and swapping physical experiences can replace the
      // section between measurement and capture. Re-resolve and retry instead
      // of failing a passed layout assertion on a detached node.
      await expect(async () => {
        if (await section.count()) {
          await section.screenshot({ path: path.join(evidence, `${template.slug}-${width}-native.png`), animations: "disabled", timeout: 5_000 });
        } else {
          await items.first().getByText(ceremonies[0].title).scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(evidence, `${template.slug}-${width}-native.png`), animations: "disabled", timeout: 5_000 });
        }
      }).toPass({ timeout: 20_000 });
      expect(errors, `${width}px: no page errors`).toEqual([]);
      results.push({ width, route: published ? "published" : "capture", items: await items.allTextContents(), beforeFooter, pageErrors: errors.slice() });
    }
    writeFileSync(path.join(evidence, `${template.slug}.json`), JSON.stringify(results, null, 2) + "\n");
  });
}
