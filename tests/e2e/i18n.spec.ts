import { test, expect } from "@playwright/test";

/**
 * i18n coverage for next-intl.
 *
 * The app is Vietnamese-only (src/i18n/routing.ts: locales ["vi"],
 * defaultLocale "vi", localePrefix "as-needed"). vi is served WITHOUT a prefix
 * at "/", next-intl redirects an explicit "/vi" back to "/", and every other
 * locale prefix must 404 — the en/ko/ja/zh catalogs were removed.
 */

// Stable strings pulled from messages/vi.json ("home" namespace).
const HERO_TITLE = "Tạo thiệp cưới online đơn giản, miễn phí chỉ trong 15 phút";
const CREATE_NOW = "TẠO THIỆP NGAY";

test.describe("i18n default locale", () => {
  test('"/" serves Vietnamese without a prefix', async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok()).toBeTruthy();

    await expect(page.locator("h1", { hasText: HERO_TITLE })).toBeVisible();

    // A second independent key guards against a partial/stale catalog.
    await expect(page.getByText(CREATE_NOW, { exact: true }).first()).toBeVisible();

    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test('explicit "/vi" redirects to "/" (as-needed prefix)', async ({ page }) => {
    await page.goto("/vi");
    // next-intl strips the redundant default-locale prefix.
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.locator("h1", { hasText: HERO_TITLE })).toBeVisible();
  });
});

test.describe("i18n retired locales", () => {
  // en/ko/ja/zh were indexed before the app went Vietnamese-only, so
  // next.config.ts keeps a permanent redirect to "/" instead of letting them
  // 404. Requested without following redirects so the status is observable.
  for (const locale of ["en", "ko", "ja", "zh"] as const) {
    test(`"/${locale}" permanently redirects to "/"`, async ({ request }) => {
      const res = await request.get(`/${locale}`, { maxRedirects: 0 });

      expect(res.status()).toBe(308);
      expect(res.headers()["location"]).toBe("/");
    });
  }
});

test.describe("i18n invalid locale", () => {
  test('unknown locale "/xx" returns 404', async ({ page }) => {
    // as-needed: "/xx" is treated as a path under the default locale; no route
    // matches, so the [locale] layout's hasLocale guard triggers notFound().
    const res = await page.goto("/xx");
    expect(res?.status()).toBe(404);
  });
});
