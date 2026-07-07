import { test, expect } from "@playwright/test";

import { loginAsUser } from "./helpers/auth";
import { getDb } from "./helpers/db";
import { createUser, cleanupUser } from "./helpers/fixtures";

// Template gallery + detail + demo coverage.
//
// Data facts (src/data/chungdoi.ts):
//  - The listing renders `completedTemplates` (~40 cards), each with an English
//    `name` heading. Known names: "Double Happiness Red" (song-hy-red),
//    "Chateau Blue" (chateau-blue), "Royal Red" (royal-red).
//  - Under the `vi` locale the route slug is the Vietnamese alias:
//    song-hy-red → song-hy-do, chateau-blue → lau-dai-lam, royal-red → hoang-kim-do.
//    findTemplateByRouteSlug() accepts BOTH the source slug and the vi alias.
//  - /[locale]/templates/[slug] has no page of its own — it redirect()s to
//    /[locale]/templates/[slug]/demo (src/app/[locale]/templates/[slug]/page.tsx).
//  - The demo page renders <ChungDoiDemo> which always mounts <main id="top">
//    plus an <audio> tag. The "Mở thiệp" open button lives in a client-only
//    dynamic (ssr:false) Envelope3D, so it appears after hydration.

const KNOWN_NAMES = {
  songHy: "Double Happiness Red",
  chateau: "Chateau Blue",
  royal: "Royal Red",
} as const;

function invitationCount(userId: string): number {
  const row = getDb()
    .prepare(`SELECT count(*) AS n FROM Invitation WHERE userId = ?`)
    .get(userId) as { n: number };
  return row.n;
}

test.describe("templates — gallery listing", () => {
  test("/vi/templates renders many template cards", async ({ page }) => {
    const res = await page.goto("/vi/templates");
    expect(res?.ok()).toBeTruthy();

    // Header heading (messages/vi.json → listing.title).
    await expect(
      page.getByRole("heading", { name: "Mẫu thiệp cưới online thủ công" }),
    ).toBeVisible();

    // Each completed template is its own <article> card.
    const cards = page.locator("main article");
    expect(await cards.count()).toBeGreaterThan(1);
  });

  test("known template names are visible on the gallery", async ({ page }) => {
    await page.goto("/vi/templates");

    await expect(page.getByRole("heading", { name: KNOWN_NAMES.songHy })).toBeVisible();
    await expect(page.getByRole("heading", { name: KNOWN_NAMES.chateau })).toBeVisible();
    await expect(page.getByRole("heading", { name: KNOWN_NAMES.royal })).toBeVisible();
  });

  test("gallery shows the count summary and demo links", async ({ page }) => {
    await page.goto("/vi/templates");

    // Count pill: "{n} / {total} mẫu thiệp".
    await expect(page.getByText(/\d+\s*\/\s*\d+\s*mẫu thiệp/)).toBeVisible();

    // Each card exposes a "Xem demo" link to the demo route.
    const demoLinks = page.getByRole("link", { name: /Xem demo/ });
    expect(await demoLinks.count()).toBeGreaterThan(1);
  });

  test("clicking a card preview opens the template modal", async ({ page }) => {
    await page.goto("/vi/templates");

    await page.getByRole("button", { name: "Xem trước" }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // The modal exposes both the demo CTA and the "use this template" form.
    await expect(dialog.getByRole("link", { name: /Xem demo thiệp/ })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Dùng mẫu này" })).toBeVisible();
  });
});

test.describe("templates — detail redirect", () => {
  test("detail (source slug) redirects to the demo page", async ({ page }) => {
    // /[locale]/templates/[slug] resolves the template then redirect()s to /demo.
    const res = await page.goto("/vi/templates/song-hy-red");
    expect(res?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/mau-thiep\/[^/]+\/demo$/);
  });

  test("detail (vi alias slug) redirects to the demo page", async ({ page }) => {
    const res = await page.goto("/vi/templates/lau-dai-lam");
    expect(res?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/mau-thiep\/[^/]+\/demo$/);
  });
});

test.describe("templates — demo pages", () => {
  test("song-hy demo loads without crashing", async ({ page }) => {
    // Heavy 3D/canvas invitation — assert the shell mounts, not the 3D scene.
    const res = await page.goto("/vi/templates/song-hy-do/demo", { timeout: 60_000 });
    expect(res?.ok()).toBeTruthy();

    await expect(page.locator("main#top")).toBeVisible({ timeout: 30_000 });
    // <audio> is always rendered by ChungDoiDemo once content resolves.
    await expect(page.locator("main#top audio")).toHaveCount(1);
  });

  test("royal-red demo loads without crashing", async ({ page }) => {
    const res = await page.goto("/vi/templates/hoang-kim-do/demo", { timeout: 60_000 });
    expect(res?.ok()).toBeTruthy();

    await expect(page.locator("main#top")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("main#top audio")).toHaveCount(1);
  });

  test("demo gift envelope button appears after hydration", async ({ page }) => {
    await page.goto("/vi/templates/song-hy-do/demo", { timeout: 60_000 });

    await expect(page.getByRole("button", { name: "Mở hộp mừng cưới" })).toBeVisible({
      timeout: 45_000,
    });
  });
});

test.describe("templates — not found", () => {
  test("unknown detail slug returns 404", async ({ page }) => {
    const res = await page.goto("/vi/templates/does-not-exist");
    expect(res?.status()).toBe(404);
  });

  test("unknown demo slug returns 404", async ({ page }) => {
    const res = await page.goto("/vi/templates/does-not-exist/demo");
    expect(res?.status()).toBe(404);
  });
});

test.describe("templates — create with this template", () => {
  test("'Dùng mẫu này' creates an invitation and lands in the editor", async ({
    page,
    context,
  }) => {
    const user = createUser();
    try {
      // Forge a session so createInvitation's getOrCreateUserId() reuses this id
      // instead of minting an anonymous user (keeps cleanup deterministic).
      await loginAsUser(context, user.id);
      await page.goto("/vi/templates");
      expect(invitationCount(user.id)).toBe(0);

      // Open the modal, then submit the "use this template" form (server action).
      await page.getByRole("button", { name: "Xem trước" }).first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("dialog").getByRole("button", { name: "Dùng mẫu này" }).click();

      await page.waitForURL("**/editor/**", { timeout: 30_000 });
      expect(page.url()).toContain("/editor/");
      await expect.poll(() => invitationCount(user.id)).toBe(1);
    } finally {
      cleanupUser(user.id);
    }
  });
});
