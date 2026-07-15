import { test, expect } from "@playwright/test";
import sharp from "sharp";

import { loginAsUser } from "./helpers/auth";
import { getDb } from "./helpers/db";
import { createUser, cleanupUser } from "./helpers/fixtures";

// Template gallery + detail + demo coverage.
//
// Data facts (src/data/chungdoi.ts):
//  - The vi listing renders localized names and metadata for every completed
//    template. Known names: "Song Hỷ Đỏ" (song-hy-red),
//    "Lâu Đài Lam" (chateau-blue), "Hoàng Kim Đỏ" (royal-red).
//  - Under the `vi` locale the route slug is the Vietnamese alias:
//    song-hy-red → song-hy-do, chateau-blue → lau-dai-lam, royal-red → hoang-kim-do.
//    findTemplateByRouteSlug() accepts BOTH the source slug and the vi alias.
//  - /[locale]/templates/[slug] has no page of its own — it redirect()s to
//    /[locale]/templates/[slug]/demo (src/app/[locale]/templates/[slug]/page.tsx).
//  - The demo page renders <ChungDoiDemo> which always mounts <main id="top">
//    plus an <audio> tag. The "Mở thiệp" open button lives in a client-only
//    dynamic (ssr:false) Envelope3D, so it appears after hydration.

const KNOWN_NAMES = {
  songHy: "Song Hỷ Đỏ",
  chateau: "Lâu Đài Lam",
  royal: "Hoàng Kim Đỏ",
} as const;

const ANIMATED_ENVELOPE_SLUGS = [
  "song-hy-red",
  "song-hy-green",
  "double-dragon-red",
  "elegant-leaf-green",
  "dragon-phoenix-v3-red",
  "double-dragon-green",
  "boho-floral-green",
  "crystal-floral-blue",
  "qasr-green",
  "qasr-gold",
  "hoa-tinh-red",
  "boho-floral-brown",
  "spring-garden-blue",
  "cherry-blossom-pink",
  "dragon-phoenix-red",
  "dragon-phoenix-blue",
  "dragon-phoenix-black",
  "baroque-gold",
  "royal-red",
  "royal-blue",
  "royal-green",
  "co-ba-red",
] as const;

const ANIMATED_GIFT_BOX_SLUGS = ["chateau-green", "glass-garden-green"] as const;

const STATIC_QR_SLUGS = [
  "jasmine-white",
  "silk-flora-brown",
  "double-dragon-blue",
  "dragon-phoenix-v2-red",
  "chateau-blue",
  "brocade-flower-red",
  "spring-garden-red",
] as const;

const TRANSPARENT_FOOTER_SLUGS = [
  "elegant-leaf-green",
  "dragon-phoenix-v3-red",
  "boho-floral-green",
  "crystal-floral-blue",
  "chateau-blue",
  "chateau-green",
  "baroque-gold",
  "qasr-green",
  "qasr-gold",
  "glass-garden-green",
  "hoa-tinh-red",
  "spring-garden-green",
  "boho-floral-brown",
  "spring-garden-red",
  "spring-garden-blue",
  "cherry-blossom-pink",
  "chibi-red",
  "jasmine-white",
  "silk-flora-brown",
] as const;

function invitationCount(userId: string): number {
  const row = getDb()
    .prepare(`SELECT count(*) AS n FROM Invitation WHERE userId = ?`)
    .get(userId) as { n: number };
  return row.n;
}

function latestInvitation(userId: string): { id: string; templateId: string } | undefined {
  return getDb()
    .prepare(
      `SELECT id, templateId
       FROM Invitation
       WHERE userId = ?
       ORDER BY createdAt DESC
       LIMIT 1`,
    )
    .get(userId) as { id: string; templateId: string } | undefined;
}

test.describe("templates — gallery listing", () => {
  test("/vi/templates renders many template cards", async ({ page }) => {
    const res = await page.goto("/vi/templates");
    expect(res?.ok()).toBeTruthy();

    // Header heading (messages/vi.json → listing.title).
    await expect(
      page.getByRole("heading", { level: 1, name: "Mẫu thiệp cưới online thủ công" }),
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

  test("Vietnamese locale localizes template metadata and filters", async ({ page }) => {
    await page.goto("/vi/templates");

    const card = page.getByRole("heading", { name: KNOWN_NAMES.songHy }).locator("xpath=ancestor::article");
    await expect(card.getByText("Truyền thống", { exact: true })).toBeVisible();
    await expect(card.getByText("Đỏ", { exact: true })).toBeVisible();
    await expect(card.getByText("Thiệp cưới Song Hỷ Đỏ", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Truyền thống", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Đỏ", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Double Happiness Red" })).toHaveCount(0);
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
    await expect(dialog.getByRole("heading", { name: "Xem trước mẫu thiệp" })).toBeVisible();
    const fullPreview = dialog.getByRole("img", { name: "Ảnh xem trước toàn bộ mẫu thiệp cưới" });
    await expect(fullPreview).toHaveAttribute("src", /(?:\/|%2F)listing(?:\/|%2F)/i);

    const initialPosition = await fullPreview.evaluate((image) => getComputedStyle(image).objectPosition);
    await fullPreview.hover();
    await page.waitForTimeout(500);
    const hoveredPosition = await fullPreview.evaluate((image) => getComputedStyle(image).objectPosition);
    expect(hoveredPosition).not.toBe(initialPosition);

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
  test("capture mode renders the opened invitation without 3D cover or audio", async ({ page }) => {
    const res = await page.goto("/vi/templates/song-hy-do/demo?capture=1", { timeout: 60_000 });
    expect(res?.ok()).toBeTruthy();

    const invitation = page.locator('main#top[data-capture-mode="true"]');
    await expect(invitation).toBeVisible({ timeout: 30_000 });
    await expect(invitation.locator("canvas")).toHaveCount(0);
    await expect(invitation.locator("audio")).toHaveCount(0);
    await expect(page.getByText("THÔNG TIN LỄ CƯỚI")).toBeAttached();
    await expect(page.getByRole("button", { name: "Sử dụng thiệp này" })).toHaveCount(0);

    await expect(page.getByRole("link", { name: /Mở Google Maps để chỉ đường/ })).toHaveCount(0);
  });

  test("long-phung V2 and V3 keep their original visual identities", async ({ page }) => {
    await page.goto("/mau-thiep/long-phung-v2-do/demo?capture=1", { timeout: 60_000 });

    const v2 = page.locator('[data-template-visual="dragon-phoenix-v2-red"]');
    await expect(v2).toBeVisible({ timeout: 30_000 });
    await expect(v2.getByTestId("dragon-phoenix-v2-hero")).toHaveCSS("background-image", /radial-gradient/);
    await expect(v2.locator('img[src$="/rong-phuong.webp"]')).toHaveCount(0);

    await page.goto("/mau-thiep/long-phung-v3-do/demo?capture=1", { timeout: 60_000 });

    const v3 = page.locator('[data-template-visual="dragon-phoenix-v3-red"]');
    await expect(v3).toBeVisible({ timeout: 30_000 });
    await expect(v3).toHaveCSS("background-image", /radial-gradient/);
    await expect(v3.getByTestId("dragon-phoenix-v3-hero-photo").getByRole("img")).toHaveAttribute("src", /\/photo-2\.jpg$/);
  });

  test("source-matched templates keep their bespoke hero assets and album order", async ({ page }) => {
    await page.goto("/mau-thiep/hoa-moc-xanh/demo?capture=1", { timeout: 60_000 });
    await expect(page.locator('img[src$="/boho-floral-green/flower.webp"]').first()).toBeVisible();

    await page.goto("/mau-thiep/vuon-xuan-lam/demo?capture=1", { timeout: 60_000 });
    await expect(page.getByText("ALBUM ẢNH CƯỚI").first()).toBeVisible();
    await expect(page.locator('img[src$="/spring-garden-blue/photo-1.webp"]').first()).toBeVisible();

    await page.goto("/mau-thiep/chibi-red/demo?capture=1", { timeout: 60_000 });
    await expect(page.locator('img[src$="/chibi_red/couple-main.webp"]')).toBeVisible();
  });

  test("all source-parity templates dispatch through their dedicated renderer", async ({ page }) => {
    test.setTimeout(180_000);
    const slugs = [
      "boho-floral-green", "boho-floral-pink", "boho-floral-brown",
      "spring-garden-red", "spring-garden-green", "spring-garden-blue",
      "elegant-leaf-green", "jasmine-white", "silk-flora-brown",
      "hoa-tinh-red", "minimalism-red", "brocade-flower-red",
      "crystal-floral-blue", "baroque-gold", "glass-garden-green",
      "chibi-red", "cherry-blossom-pink",
    ] as const;

    for (const slug of slugs) {
      const response = await page.goto(`/mau-thiep/${slug}/demo?capture=1`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      expect(response?.ok(), slug).toBeTruthy();
      await expect(page.locator(`[data-template-renderer="${slug}"]`), slug).toBeAttached();
    }
  });

  test("Hoa Mộc Hồng keeps its source hero and animated footer treatment", async ({ page }) => {
    await page.goto("/mau-thiep/hoa-moc-hong/demo?capture=1", { timeout: 60_000 });
    const hero = page.locator('[data-template-hero="boho-floral-pink"]');
    await expect(hero).toBeVisible();
    await expect(hero.locator('img[src$="/boho-floral-pink/photo-1.webp"]')).toBeVisible();
    await expect(hero.locator('img[src$="/boho-floral-pink/photo-2.webp"]')).toBeVisible();
    await expect(hero.locator('img[src$="/boho-floral-pink/asset_2.webp"]')).toBeVisible();

    const envelope = page.getByTestId("gift-envelope");
    await expect(envelope).toBeAttached();
    await expect(envelope.locator(".nhat-binh-envelope-body")).toHaveCSS("animation-name", "nhat-binh-envelope-shake");
    await expect(envelope.locator(".nhat-binh-envelope-front")).toHaveCSS("animation-name", "nhat-binh-glow-pulse");
    await expect(envelope.locator(".nhat-binh-coin-1")).toHaveCSS("animation-name", "nhat-binh-coin-float-1");

    await expect(page.locator("[data-template-footer]")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(page.locator("[data-template-lower-decor]")).toHaveCSS("opacity", "0.07");

    await envelope.click();
    await expect(page.getByRole("heading", { name: "Phong Bao Mừng Cưới" }).last()).toBeVisible();
  });

  test("every source-animated gift envelope keeps moving", async ({ page }) => {
    test.setTimeout(300_000);

    for (const slug of ANIMATED_ENVELOPE_SLUGS) {
      const response = await page.goto(`/mau-thiep/${slug}/demo?capture=1`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      expect(response?.ok(), slug).toBeTruthy();

      const envelope = page.getByTestId("gift-envelope");
      await expect(envelope, slug).toBeAttached();
      await expect(envelope.locator(".nhat-binh-envelope-body"), slug).toHaveCSS("animation-name", "nhat-binh-envelope-shake");
      await expect(envelope.locator(".nhat-binh-envelope-front"), slug).toHaveCSS("animation-name", "nhat-binh-glow-pulse");
    }
  });

  test("gift-box templates keep their dedicated animation", async ({ page }) => {
    for (const slug of ANIMATED_GIFT_BOX_SLUGS) {
      const response = await page.goto(`/mau-thiep/${slug}/demo?capture=1`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      expect(response?.ok(), slug).toBeTruthy();

      const giftBox = page.getByTestId("gift-envelope");
      await expect(giftBox, slug).toBeAttached();
      await expect(giftBox.locator(".igb-bob"), slug).toHaveCSS("animation-name", "igb-gift-bob");
    }
  });

  test("source-static gift sections stay QR-only", async ({ page }) => {
    test.setTimeout(180_000);

    for (const slug of STATIC_QR_SLUGS) {
      const response = await page.goto(`/mau-thiep/${slug}/demo?capture=1`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      expect(response?.ok(), slug).toBeTruthy();
      await expect(page.getByTestId("gift-envelope"), slug).toHaveCount(0);
      await expect(page.locator('img[alt^="QR -"]').first(), slug).toBeAttached();
    }
  });

  test("bank QR images resolve to a locally generated VietQR SVG", async ({ page }) => {
    await page.goto("/mau-thiep/vuon-xuan-do/demo?capture=1", { timeout: 60_000 });

    const qrImage = page.locator('img[alt^="QR -"]').first();
    await expect(qrImage).toBeVisible();
    await expect(qrImage).toHaveAttribute("src", /\/api\/vietqr\?/);
    await expect.poll(() => qrImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

    const src = await qrImage.getAttribute("src");
    const response = await page.request.get(new URL(src!, page.url()).toString(), { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
    expect(await response.text()).toContain("<svg");
    expect(response.headers().location).toBeUndefined();
  });

  test("watermark-style templates do not regress to a solid footer bar", async ({ page }) => {
    test.setTimeout(240_000);

    for (const slug of TRANSPARENT_FOOTER_SLUGS) {
      const response = await page.goto(`/mau-thiep/${slug}/demo?capture=1`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      expect(response?.ok(), slug).toBeTruthy();
      await expect(page.locator("[data-template-footer]"), slug).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    }
  });

  test("medium-drift templates keep their source hero composition", async ({ page }) => {
    for (const variant of ["green", "gold"] as const) {
      await page.goto(`/mau-thiep/thanhcung-${variant === "green" ? "xanh" : "vang"}/demo?capture=1`, { timeout: 60_000 });
      const scene = page.getByTestId(`qasr-${variant}-hero-scene`);
      const couple = page.getByTestId(`qasr-${variant}-hero-couple`);
      await expect(scene).toBeVisible();
      await expect(couple).toBeVisible();

      const [sceneBox, coupleBox] = await Promise.all([scene.boundingBox(), couple.boundingBox()]);
      expect(sceneBox).not.toBeNull();
      expect(coupleBox).not.toBeNull();
      expect(coupleBox!.y).toBeGreaterThanOrEqual(sceneBox!.y);
      expect(coupleBox!.y + coupleBox!.height).toBeLessThanOrEqual(sceneBox!.y + sceneBox!.height + 1);
    }

    for (const [slug, variant] of [["lau-dai-xanh", "green"], ["lau-dai-lam", "blue"]] as const) {
      await page.goto(`/mau-thiep/${slug}/demo?capture=1`, { timeout: 60_000 });
      await expect(page.getByTestId(`chateau-${variant}-hero-scene`)).toBeVisible();
      await expect(page.getByText("THÔNG TIN LỄ CƯỚI").first()).toBeVisible();
    }

    await page.goto("/mau-thiep/long-phung-do/demo?capture=1", { timeout: 60_000 });
    const albumHeading = page.getByText("ALBUM ẢNH CƯỚI", { exact: false }).first();
    const ceremonyHeading = page.getByText("THÔNG TIN LỄ CƯỚI", { exact: false }).first();
    await expect(albumHeading).toBeVisible();
    await expect(page.locator('img[src$="/dragon-phoenix-red/photo-1.webp"]')).toBeVisible();
    expect((await albumHeading.boundingBox())!.y).toBeLessThan((await ceremonyHeading.boundingBox())!.y);
  });

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

  test("3D invitation rotates automatically", async ({ page }) => {
    await page.goto("/vi/templates/song-long-xanh/demo", { timeout: 60_000 });

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 30_000 });

    const firstFrame = await sharp(await canvas.screenshot()).raw().toBuffer();
    await page.waitForTimeout(1_500);
    const secondFrame = await sharp(await canvas.screenshot()).raw().toBuffer();
    let changedChannels = 0;
    for (let index = 0; index < firstFrame.length; index += 1) {
      if (Math.abs(firstFrame[index] - secondFrame[index]) > 8) {
        changedChannels += 1;
      }
    }

    expect(changedChannels / firstFrame.length).toBeGreaterThan(0.01);
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
  test("fixed demo CTA creates a draft with the template being viewed", async ({
    page,
    context,
  }) => {
    const user = createUser();
    try {
      await loginAsUser(context, user.id);
      await page.goto("/mau-thiep/song-phung-do/demo");

      const useTemplateButton = page.getByRole("button", { name: "Sử dụng thiệp này" });
      await expect(useTemplateButton).toBeVisible();
      await expect(useTemplateButton).toHaveCSS("position", "static");
      await expect(useTemplateButton.locator("xpath=ancestor::form[1]")).toHaveCSS("position", "fixed");

      await useTemplateButton.click();
      await page.waitForURL("**/editor/**", { timeout: 30_000 });

      const invitation = latestInvitation(user.id);
      expect(invitation?.templateId).toBe("double-phoenix-red");
      expect(page.url()).toContain(`/editor/${invitation?.id}`);
    } finally {
      cleanupUser(user.id);
    }
  });

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
