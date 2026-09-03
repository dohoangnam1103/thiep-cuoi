import { expect, test, type Page } from "@playwright/test";
import vi from "../../messages/vi.json";
import { templates, retiredTemplateSlugs } from "@/data/chungdoi";
import { getVietnameseTemplateSlug } from "@/data/template-route-slugs";
import { loginAsAdmin, loginAsUser } from "./helpers/auth";
import { cleanupUser, createInvitation, createUser, publishInvitation, seededAdminId } from "./helpers/fixtures";

const rawKey = new RegExp(`\\b(?:${Object.keys(vi).join("|")})\\.[a-zA-Z][\\w.-]*`, "i");
const intlError = /MISSING_MESSAGE|INVALID_MESSAGE|FORMATTING_ERROR|INSUFFICIENT_PATH|UNRESOLVED_MESSAGE|No intl context|NextIntlClientProvider.*(?:not found|missing)/i;

function watchTranslations(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (intlError.test(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => {
    if (intlError.test(error.message)) errors.push(error.message);
  });
  return errors;
}

async function expectTranslated(page: Page, errors: string[]) {
  await expect.poll(() => page.locator("body").innerText()).not.toMatch(rawKey);
  expect(errors, "The browser reported an i18n failure").toEqual([]);
}

// Capture uses the same provider and renderer as a public invitation, but opens
// the detail immediately so every template's translated sections are mounted.
for (const template of templates) {
  if (retiredTemplateSlugs.has(template.slug)) {
    test(`retired demo is unavailable: ${template.slug}`, async ({ page, context }) => {
      const slug = getVietnameseTemplateSlug(template.slug);
      for (const suffix of ["demo", "demo/capture"]) {
        const response = await page.goto(`/mau-thiep/${slug}/${suffix}`);
        expect(response?.status()).toBe(404);
      }
      const user = createUser();
      const demo = createInvitation(user.id, { templateId: template.slug, isDemo: true });
      try {
        await loginAsAdmin(context, seededAdminId());
        const response = await page.goto(`/admin/demos/${demo.id}`);
        expect(response?.status()).toBe(404);
        await page.goto("/admin/demos");
        await expect(page.locator(`a[href="/admin/demos/${demo.id}"]`)).toHaveCount(0);
      } finally {
        cleanupUser(user.id);
      }
    });
    continue;
  }
  test(`i18n public template: ${template.slug}`, async ({ page }) => {
    const errors = watchTranslations(page);
    const slug = getVietnameseTemplateSlug(template.slug);
    const response = await page.goto(`/mau-thiep/${slug}/demo/capture`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main[data-capture-mode="true"]')).toBeVisible();
    // Wait for hydration and any next/dynamic template renderer to mount.
    await expect(page.locator("main#top")).toContainText(/[\s\S]{100}/);
    // Exclude script payloads: catalogs legitimately contain namespace keys.
    const rendered = await page.locator("body").innerText();
    expect(rendered).not.toMatch(rawKey);
    expect(errors).toEqual([]);
  });
}

for (const route of ["/", "/bang-gia", "/blog", "/help", "/cong-cu", "/tao-thiep-cuoi-online", "/chinh-sach-bao-mat", "/dieu-khoan-su-dung", "/chinh-sach-hoan-tien", "/home-2/lab/v9", "/home-2/lab/v10", "/home-2/lab/v11"]) {
  test(`i18n public page: ${route}`, async ({ page }) => {
    const errors = watchTranslations(page);
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expectTranslated(page, errors);
  });
}

for (const templateId of ["royal-v2-green", "comic-hero-assemble", "long-phung-gatefold", "nguyet-anh-sleeve", "doraemon-door", "detective-conan-casebook"]) {
  test(`i18n editor and admin previews: ${templateId}`, async ({ page, context }) => {
    const errors = watchTranslations(page);
    const user = createUser();
    const invitation = createInvitation(user.id, { templateId });
    const demo = createInvitation(user.id, { templateId, isDemo: true });
    try {
      await loginAsUser(context, user.id);
      await loginAsAdmin(context, seededAdminId());
      for (const route of [`/editor/${invitation.id}`, `/admin/invitations/${invitation.id}/edit`, `/admin/demos/${demo.id}`]) {
        const response = await page.goto(route);
        expect(response?.status()).toBe(200);
        await page.getByRole("button", { name: "Xem trước", exact: true }).click();
        await expect(page.locator("main#top")).toBeVisible();
        if (templateId === "royal-v2-green") {
          await expect(page.getByText(vi.invitationTemplate.invitedToWedding, { exact: true })).toBeVisible();
        }
        await expectTranslated(page, errors);
      }
      const publishedSlug = publishInvitation(invitation.id);
      await page.goto(`/thiep/${publishedSlug}`);
      await expect(page.locator("main#top")).toBeVisible();
      await expectTranslated(page, errors);
    } finally {
      cleanupUser(user.id);
    }
  });
}


test("i18n authenticated dashboard, listing and admin pages", async ({ page, context }) => {
  const errors = watchTranslations(page);
  const user = createUser();
  const invitation = createInvitation(user.id);
  try {
    await loginAsUser(context, user.id);
    await loginAsAdmin(context, seededAdminId());
    for (const route of [
      "/mau-thiep", "/dashboard", `/dashboard/${invitation.id}/guests`,
      `/dashboard/${invitation.id}/thanh-toan`,
      "/admin", "/admin/demos", "/admin/invitations", "/admin/users",
      `/admin/users/${user.id}`, "/admin/template-studio", "/admin/settings",
      "/admin/blogs", "/admin/payments", "/admin/vouchers", "/admin/email-logs",
    ]) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expectTranslated(page, errors);
    }
  } finally {
    cleanupUser(user.id);
  }
});
