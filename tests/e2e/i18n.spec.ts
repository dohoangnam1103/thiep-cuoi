import { test, expect } from "@playwright/test";

/**
 * i18n coverage for next-intl.
 *
 * Routing (src/i18n/routing.ts): locales vi/en/ko/ja/zh, defaultLocale "vi",
 * localePrefix "as-needed" — the default locale (vi) is served WITHOUT a prefix
 * at "/", while other locales use a "/{locale}" prefix. next-intl middleware
 * redirects an explicit "/vi" back to "/".
 */

type Locale = "vi" | "en" | "ko" | "ja" | "zh";

const LOCALES: Locale[] = ["vi", "en", "ko", "ja", "zh"];

// Path where each locale's home page is served. vi (default) has no prefix.
const HOME_PATH: Record<Locale, string> = {
  vi: "/",
  en: "/en",
  ko: "/ko",
  ja: "/ja",
  zh: "/zh",
};

// Stable, locale-distinct strings pulled from messages/*.json ("home" namespace).
const HERO_TITLE: Record<Locale, string> = {
  vi: "Tạo thiệp cưới online, miễn phí trong 10 phút",
  en: "Create wedding invitations online, free in 10 minutes",
  ko: "온라인 청첩장, 10분 만에 무료로 만들기",
  ja: "オンライン結婚式招待状を10分で無料作成",
  zh: "在线婚礼请柬，10分钟免费创建",
};

const CREATE_NOW: Record<Locale, string> = {
  vi: "Tạo ngay",
  en: "Create Now",
  ko: "지금 만들기",
  ja: "今すぐ作成",
  zh: "立即创建",
};

// Language switcher option labels (src/components/language-switcher.tsx).
const LOCALE_LABELS: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
};

test.describe("i18n locale routes", () => {
  for (const locale of LOCALES) {
    test(`${locale}: renders localized home copy at ${HOME_PATH[locale]}`, async ({ page }) => {
      await page.goto(HOME_PATH[locale]);

      // Localized hero title (rendered inside the single <h1>).
      await expect(page.locator("h1", { hasText: HERO_TITLE[locale] })).toBeVisible();

      // A second independent key to guard against a partial/stale catalog.
      await expect(page.getByText(CREATE_NOW[locale], { exact: true }).first()).toBeVisible();

      // <html lang> reflects the active locale.
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });

    test(`${locale}: URL prefix matches locale-prefix policy`, async ({ page }) => {
      await page.goto(HOME_PATH[locale]);
      const pathname = new URL(page.url()).pathname;

      if (locale === "vi") {
        // Default locale served without a prefix.
        expect(pathname).toBe("/");
      } else {
        expect(pathname).toBe(`/${locale}`);
      }
    });
  }
});

test.describe("i18n default locale", () => {
  test('"/" serves the default locale (vi)', async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("h1", { hasText: HERO_TITLE.vi })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test('explicit "/vi" redirects to "/" (as-needed prefix)', async ({ page }) => {
    await page.goto("/vi");
    // next-intl strips the redundant default-locale prefix.
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.locator("h1", { hasText: HERO_TITLE.vi })).toBeVisible();
  });
});

test.describe("i18n language switcher", () => {
  for (const target of ["en", "zh"] as const) {
    test(`switches vi -> ${target}, updating URL prefix and copy`, async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("h1", { hasText: HERO_TITLE.vi })).toBeVisible();

      // Open the switcher dropdown (trigger label may be hidden on small viewports).
      await page.locator('button[aria-haspopup="listbox"]').click();

      // Pick the target locale option by its accessible name.
      await page.getByRole("option", { name: LOCALE_LABELS[target] }).click();

      await page.waitForURL(`**/${target}`);
      expect(new URL(page.url()).pathname).toBe(`/${target}`);
      await expect(page.locator("h1", { hasText: HERO_TITLE[target] })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", target);
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
