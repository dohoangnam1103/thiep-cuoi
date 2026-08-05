import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";

import { getVietnameseTemplateSlug } from "@/data/template-route-slugs";

import { loginAsUser } from "./helpers/auth";
import { getDb } from "./helpers/db";
import {
  createInvitation,
  createUser,
  cleanupUser,
} from "./helpers/fixtures";

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

// Rollout batches from docs/superpowers/plans/2026-07-28-all-template-envelope-sizing-rollout.md.
// Source slugs only — route slugs are resolved through the registry at test time.
const ENVELOPE_GROUP_A_SLUGS = [
  "song-hy-red",
  "song-hy-green",
  "double-dragon-red",
  "double-dragon-green",
  "double-dragon-blue",
  "double-phoenix-red",
  "double-phoenix-green",
  "dragon-phoenix-red",
  "dragon-phoenix-green",
] as const;

const ENVELOPE_GROUP_B_SLUGS = [
  "dragon-phoenix-v3-red",
  "dragon-phoenix-v2-red",
  "dragon-phoenix-blue",
  "dragon-phoenix-black",
  "royal-red",
  "royal-blue",
  "royal-green",
  "nhat-binh-red",
  "hoa-tinh-red",
  "co-ba-red",
] as const;

const ENVELOPE_GROUP_C_SLUGS = [
  "elegant-leaf-green",
  "boho-floral-green",
  "boho-floral-pink",
  "boho-floral-brown",
  "jasmine-white",
  "silk-flora-brown",
  "brocade-flower-red",
  "crystal-floral-blue",
  "glass-garden-green",
  "spring-garden-green",
  "spring-garden-red",
  "spring-garden-blue",
] as const;

const ENVELOPE_GROUP_D_SLUGS = [
  "chateau-blue",
  "chateau-green",
  "baroque-gold",
  "qasr-green",
  "qasr-gold",
] as const;

const ENVELOPE_GROUP_E_SLUGS = [
  "chibi-red",
  "minimalism-red",
  "maroon-love",
] as const;

// Chung Đôi capture widths per breakpoint (responsiveEnvelopeWidth()).
const ENVELOPE_SIZING_CASES = [
  { viewport: { width: 1440, height: 900 }, expectedWidth: 600 },
  { viewport: { width: 800, height: 900 }, expectedWidth: 520 },
  { viewport: { width: 700, height: 900 }, expectedWidth: 340 },
  { viewport: { width: 390, height: 844 }, expectedWidth: 310 },
] as const;

const ART_OPENING_CASES = [
  ["dong-ho-folk", 1420],
  ["tho-cam-highland", 1360],
  ["son-mai-lacquer", 1480],
  ["bat-trang-blue", 1400],
  ["hang-trong-folk", 1500],
  ["sen-monoline", 1340],
  ["truc-chi-minimal", 1450],
  ["long-phung-deco", 1500],
  ["ao-dai-hue", 1380],
  ["art-deco-gatsby", 1460],
  ["celestial-map", 1440],
  ["coastal-mediterranean", 1350],
  ["swiss-brutalist", 1300],
  ["riso-duotone", 1370],
  ["cinema-credit", 1490],
  ["aurora-glass-dark", 1410],
  ["y2k-chrome", 1390],
  ["botanical-lavender", 1430],
  ["trong-dong-dong-son", 1470],
  ["chim-lac-ivory", 1320],
] as const;

/**
 * Assert an unopened envelope tracks the Chung Đôi capture width at each
 * breakpoint. Height is intentionally unchecked — it follows real content, so
 * it legitimately differs per template.
 *
 * Each case is a viewport resize on an already-loaded WebGL page, so the cost
 * per extra breakpoint is far below a fresh `goto`. Batches may still narrow to
 * the mobile/desktop ends when a full sweep would blow up suite runtime.
 */
async function expectResponsiveEnvelopeSizing(
  page: Page,
  routeSlug: string,
  cases: readonly { viewport: { width: number; height: number }; expectedWidth: number }[] =
    ENVELOPE_SIZING_CASES,
) {
  await page.setViewportSize(cases[0].viewport);
  await page.goto(`/mau-thiep/${routeSlug}/demo`, { timeout: 60_000 });

  // The capture root only mounts after the client-only Envelope3D hydrates, and
  // that waits on `document.fonts.ready` plus two `toCanvas` passes. On a
  // freshly built server with several workers rendering WebGL at once that
  // exceeds the 10s default, so give hydration its own budget — a short timeout
  // here reports a sizing failure for what is really a cold start.
  const capture = page.locator('[data-envelope-capture-root="responsive-natural"]');
  await expect(capture, `${routeSlug} must use the responsive capture root`).toHaveCount(1, {
    timeout: 45_000,
  });

  // Shared CoverCard contract for every template: whenever cardImages exist,
  // their in-card copy must sit below the text/button layer. Templates with no
  // cardImages legitimately have no decor layer.
  const cardContent = capture.locator("[data-envelope-card-content]");
  await expect(cardContent).toHaveCount(1);
  const cardDecor = capture.locator("[data-envelope-decor-overflow]");
  const cardDecorCount = await cardDecor.count();
  expect(
    cardDecorCount,
    `${routeSlug} has at most one in-card decor layer`,
  ).toBeLessThanOrEqual(1);
  if (cardDecorCount === 1) {
    const stacking = await capture.evaluate((root) => {
      const content = root.querySelector<HTMLElement>(
        "[data-envelope-card-content]",
      );
      const decor = root.querySelector<HTMLElement>(
        "[data-envelope-decor-overflow]",
      );
      return {
        content: Number.parseInt(
          content ? getComputedStyle(content).zIndex : "0",
          10,
        ),
        decor: Number.parseInt(
          decor ? getComputedStyle(decor).zIndex : "0",
          10,
        ),
      };
    });
    expect(
      stacking.content,
      `${routeSlug} content must sit above decor`,
    ).toBeGreaterThan(stacking.decor);
  }

  for (const current of cases) {
    await page.setViewportSize(current.viewport);
    await expect
      .poll(
        async () =>
          Math.round(await capture.evaluate((node) => node.getBoundingClientRect().width)),
        { message: `${routeSlug} @ ${current.viewport.width}px` },
      )
      .toBe(current.expectedWidth);
  }
}

async function openCapturedEnvelope(page: Page) {
  const stage = page.locator('[data-envelope-renderer="3d"]');
  const capture = page.locator("[data-envelope-capture-root]");
  await expect(stage).toBeVisible({ timeout: 30_000 });
  await expect(capture).toHaveCount(1, { timeout: 45_000 });

  const buttonRatio = await capture.evaluate((root) => {
    const button = root.querySelector<HTMLElement>("[data-open-btn]");
    if (!button) throw new Error("captured envelope has no open button");
    const rootBox = root.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    return {
      x: (buttonBox.left + buttonBox.width / 2 - rootBox.left) / rootBox.width,
      y: (buttonBox.top + buttonBox.height / 2 - rootBox.top) / rootBox.height,
    };
  });
  const projectedSize = (await stage.getAttribute("data-envelope-projected-size"))
    ?.split("x")
    .map(Number);
  const stageBox = await stage.boundingBox();
  if (!stageBox || !projectedSize || projectedSize.length !== 2) {
    throw new Error("3D envelope has no projected layout");
  }
  await page.mouse.click(
    stageBox.x + stageBox.width / 2 + (buttonRatio.x - 0.5) * projectedSize[0],
    stageBox.y + stageBox.height / 2 + (buttonRatio.y - 0.5) * projectedSize[1],
  );
  return stage;
}

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

  test("Vườn Kính uses one continuous glass surface with its floral layers", async ({ page }) => {
    await page.goto("/mau-thiep/vuonkinh-xanh/demo?capture=1", { timeout: 60_000 });

    const surface = page.locator("[data-glass-garden-surface]");
    await expect(surface).toHaveCount(1);
    await expect(surface).toHaveCSS("background-color", "rgba(255, 255, 255, 0.4)");
    await expect(surface).toHaveCSS("backdrop-filter", "blur(7px) saturate(1.08)");
    await expect(surface.locator("[data-template-footer]")).toHaveCount(1);

    const sections = surface.locator(":scope > section");
    expect(await sections.count()).toBeGreaterThan(3);
    for (const section of await sections.all()) {
      await expect(section).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(section).toHaveCSS("backdrop-filter", "none");
    }

    const floralLayers = surface.locator("[data-glass-garden-background-flower]");
    await expect(floralLayers).toHaveCount(4);
    await expect(surface.locator('img[src$="/flower5-bottom.webp"]')).toHaveCount(1);
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
    await expect(envelope).toHaveAttribute("data-gift-visual-slug", "boho-floral-pink");
    await expect(envelope.locator('img[src$="/giftbox/boho-floral-pink/envelope.webp"]')).toHaveCount(2);
    await expect(envelope.locator(".igb-bob")).toHaveCSS("animation-name", "igb-gift-bob");

    await expect(page.locator("[data-template-footer]")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(page.locator("[data-template-lower-decor]")).toHaveCSS("opacity", "0.07");

    await envelope.click();
    await expect(page.getByRole("heading", { name: "Phong Bao Mừng Cưới" }).last()).toBeVisible();
  });

  test("gift modal hides bank labels and separates adjacent QR codes", async ({ page, context }) => {
    const user = createUser();
    await loginAsUser(context, user.id);

    try {
      await page.goto("/mau-thiep/hoa-moc-hong/demo?capture=1", { timeout: 60_000 });
      await page.getByTestId("gift-envelope").click();

      const panel = page.locator(".gift-modal-panel");
      await expect(panel).toBeVisible();
      await expect(panel.getByRole("heading", { level: 3 })).toHaveCount(0);

      const cards = panel.getByTestId("gift-bank-card");
      await expect(cards).toHaveCount(2);
      const first = await cards.nth(0).boundingBox();
      const second = await cards.nth(1).boundingBox();

      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(second!.x - (first!.x + first!.width)).toBeGreaterThanOrEqual(90);

      await page.setViewportSize({ width: 375, height: 812 });
      const mobileFirst = await cards.nth(0).boundingBox();
      const mobileSecond = await cards.nth(1).boundingBox();

      expect(mobileFirst).not.toBeNull();
      expect(mobileSecond).not.toBeNull();
      expect(mobileSecond!.y).toBeGreaterThanOrEqual(mobileFirst!.y + mobileFirst!.height);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("every source gift envelope uses its template artwork", async ({ page }) => {
    test.setTimeout(300_000);

    for (const slug of ANIMATED_ENVELOPE_SLUGS) {
      const response = await page.goto(`/mau-thiep/${slug}/demo?capture=1`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      expect(response?.ok(), slug).toBeTruthy();

      const envelope = page.getByTestId("gift-envelope");
      await expect(envelope, slug).toBeAttached();
      await expect(envelope.locator(`img[src$="/giftbox/${slug}/envelope.webp"]`), slug).toHaveCount(2);
      await expect(envelope.locator(".igb-bob"), slug).toHaveCSS("animation-name", "igb-gift-bob");
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

  test("previously QR-only source sections use their template envelope", async ({ page }) => {
    test.setTimeout(180_000);

    for (const slug of STATIC_QR_SLUGS) {
      const response = await page.goto(`/mau-thiep/${slug}/demo?capture=1`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      expect(response?.ok(), slug).toBeTruthy();
      const envelope = page.getByTestId("gift-envelope");
      await expect(envelope, slug).toBeAttached();
      await expect(envelope.locator(`img[src$="/giftbox/${slug}/envelope.webp"]`), slug).toHaveCount(2);
    }
  });

  test("bank QR images resolve to a locally generated VietQR SVG", async ({ page }) => {
    await page.goto("/mau-thiep/vuon-xuan-do/demo?capture=1", { timeout: 60_000 });
    await page.getByTestId("gift-envelope").click();

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

  test("song-hy cover never swaps back to a visible 2D fallback", async ({ page }) => {
    await page.goto("/mau-thiep/song-hy-xanh/demo", { timeout: 60_000 });

    const stage = page.locator("[data-envelope-renderer]");
    await expect(stage).toBeVisible();

    const visibleOpenButtonCount = () => page.locator("[data-open-btn]").evaluateAll(
      (buttons) => buttons.filter((button) => {
        const rect = button.getBoundingClientRect();
        return rect.left >= 0 && rect.top >= 0 && rect.width > 0 && rect.height > 0;
      }).length,
    );

    await expect(stage).toHaveAttribute("data-envelope-renderer", "3d");
    expect(await visibleOpenButtonCount()).toBe(0);

    await page.waitForTimeout(3_000);
    await expect(stage).toBeVisible();
    await expect(stage).toHaveAttribute("data-envelope-renderer", "3d");
    expect(await visibleOpenButtonCount()).toBe(0);
  });

  test("fly-on-open decorations stay visible while the 3D cover leaves", async ({ page }) => {
    const port = Number(process.env.E2E_PORT ?? 3100);
    await page.goto(`http://localhost:${port}/mau-thiep/song-phung-do/demo`, {
      timeout: 60_000,
    });

    const stage = page.locator('[data-envelope-renderer="3d"]');
    await expect(stage).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("[data-envelope-opening-fly]")).toHaveCount(0);

    const capture = page.locator("[data-envelope-capture-root]");
    await expect(capture).toHaveCount(1, { timeout: 45_000 });
    const buttonRatio = await capture.evaluate((root) => {
      const button = root.querySelector<HTMLElement>("[data-open-btn]");
      if (!button) throw new Error("captured envelope has no open button");
      const rootBox = root.getBoundingClientRect();
      const buttonBox = button.getBoundingClientRect();
      return {
        x: (buttonBox.left + buttonBox.width / 2 - rootBox.left) / rootBox.width,
        y: (buttonBox.top + buttonBox.height / 2 - rootBox.top) / rootBox.height,
      };
    });
    const projectedSize = (await stage.getAttribute("data-envelope-projected-size"))
      ?.split("x")
      .map(Number);
    const stageBox = await stage.boundingBox();
    if (!stageBox || !projectedSize || projectedSize.length !== 2) {
      throw new Error("3D envelope has no projected layout");
    }
    await page.mouse.click(
      stageBox.x + stageBox.width / 2 + (buttonRatio.x - 0.5) * projectedSize[0],
      stageBox.y + stageBox.height / 2 + (buttonRatio.y - 0.5) * projectedSize[1],
    );

    const flyingDecor = page.locator("[data-envelope-opening-fly]");
    await expect(flyingDecor).toHaveCount(2);
    for (const image of await flyingDecor.all()) {
      await expect(image).toBeVisible();
      await expect(image).toHaveCSS("animation-name", "demo-dragon-fly");
    }
    await expect(stage).toHaveCSS("animation-name", "demo-envelope-away");
  });

  test("zodiac cover resolves selected masks, clips them, and preserves the fly-on-open contract", async ({
    page,
  }) => {
    await page.goto("/mau-thiep/thap-nhi-chi-do/demo", { timeout: 60_000 });

    const capture = page.locator('[data-envelope-capture-root="responsive-natural"]');
    await expect(capture).toHaveCount(1, { timeout: 45_000 });
    const clippedDecor = capture.locator('[data-envelope-decor-overflow="clip"]');
    await expect(clippedDecor).toHaveCount(1);
    await expect(clippedDecor).toHaveCSS("overflow", "hidden");

    const coverMasks = clippedDecor.locator("[data-zodiac-artwork]");
    await expect(coverMasks).toHaveCount(2);
    expect(await coverMasks.evaluateAll((nodes) => (
      nodes.map((node) => node.getAttribute("data-zodiac-artwork"))
    ))).toEqual([
      "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-meo.webp",
      "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-rong.webp",
    ]);

    await page.locator("[data-open-invitation-control]").evaluate((button) => {
      (button as HTMLButtonElement).click();
    });
    const flyingMasks = page.locator("[data-envelope-opening-fly]");
    await expect(flyingMasks).toHaveCount(2);
    for (const mask of await flyingMasks.all()) {
      await expect(mask).toHaveCSS("animation-name", "demo-dragon-fly");
    }
    await flyingMasks.evaluateAll((nodes) => {
      for (const node of nodes) {
        const animation = node.getAnimations()[0];
        if (!animation) continue;
        animation.pause();
        animation.currentTime = 720;
      }
    });
    const cardBounds = await capture.boundingBox();
    const flyingBounds = await Promise.all(
      (await flyingMasks.all()).map((mask) => mask.boundingBox()),
    );
    expect(cardBounds).not.toBeNull();
    expect(flyingBounds.some((bounds) => (
      bounds !== null && cardBounds !== null && (
        bounds.x < cardBounds.x - 1 ||
        bounds.y < cardBounds.y - 1 ||
        bounds.x + bounds.width > cardBounds.x + cardBounds.width + 1 ||
        bounds.y + bounds.height > cardBounds.y + cardBounds.height + 1
      )
    ))).toBe(true);

    const renderer = page.locator('[data-template-renderer="thap-nhi-chi-do"]');
    await expect(renderer).toBeAttached({ timeout: 30_000 });
    const openedMasks = renderer.locator("[data-zodiac-artwork]");
    await expect(openedMasks).toHaveCount(4);
    expect(await openedMasks.evaluateAll((nodes) => (
      nodes.map((node) => node.getAttribute("data-zodiac-artwork"))
    ))).toEqual([
      "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-meo-line.webp",
      "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-rong-line.webp",
      "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-meo.webp",
      "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-rong.webp",
    ]);
  });

  test("blank zodiac values fall back to the traditional phoenix and dragon pair", async ({
    page,
    context,
  }) => {
    const user = createUser();
    try {
      const invitation = createInvitation(user.id, { templateId: "thap-nhi-chi-do" });
      await loginAsUser(context, user.id);
      await page.goto(`/editor/${invitation.id}`, { timeout: 60_000 });
      await expect(page.locator("#brideZodiac")).toHaveValue("");
      await expect(page.locator("#groomZodiac")).toHaveValue("");
      await page.getByRole("button", { name: "Xem trước", exact: true }).click();

      const renderer = page.locator('[data-template-renderer="thap-nhi-chi-do"]');
      await expect(renderer).toBeAttached({ timeout: 30_000 });
      const masks = renderer.locator("[data-zodiac-artwork]");
      await expect(masks).toHaveCount(4);
      expect(await masks.evaluateAll((nodes) => (
        nodes.map((node) => node.getAttribute("data-zodiac-artwork"))
      ))).toEqual([
        "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-phuong-line.webp",
        "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-rong-line.webp",
        "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-phuong.webp",
        "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-rong.webp",
      ]);
    } finally {
      cleanupUser(user.id);
    }
  });

  test("zodiac invitation is overflow-safe and disables parallax motion at 390px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/mau-thiep/thap-nhi-chi-do/demo", { timeout: 60_000 });
    await expect(
      page.locator('[data-envelope-capture-root="responsive-natural"]'),
    ).toHaveCount(1, { timeout: 45_000 });
    await page.locator("[data-open-invitation-control]").evaluate((button) => {
      (button as HTMLButtonElement).click();
    });
    const reducedMotionFly = page.locator("[data-envelope-opening-fly]");
    await expect(reducedMotionFly).toHaveCount(2);
    for (const mask of await reducedMotionFly.all()) {
      await expect(mask).toHaveCSS("animation-name", "none");
      await expect(mask).toHaveCSS("transform", "none");
      await expect(mask).toHaveCSS("filter", "none");
    }

    await page.goto("/mau-thiep/thap-nhi-chi-do/demo?capture=1", { timeout: 60_000 });

    const renderer = page.locator('[data-template-renderer="thap-nhi-chi-do"]');
    await expect(renderer).toBeAttached({ timeout: 30_000 });
    const parallax = renderer.locator("[data-parallax]");
    await expect(parallax.first()).toBeAttached();
    const transforms = await parallax.evaluateAll((nodes) => (
      nodes.map((node) => getComputedStyle(node).transform)
    ));
    expect(transforms.length).toBeGreaterThan(0);
    expect(transforms.every((transform) => transform === "none")).toBe(true);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("zodiac line art and foreground move at visibly different parallax rates", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/mau-thiep/thap-nhi-chi-do/demo?capture=1", { timeout: 60_000 });
    const renderer = page.locator('[data-template-renderer="thap-nhi-chi-do"]');
    await expect(renderer).toBeAttached({ timeout: 30_000 });

    await page.evaluate(() => {
      window.scrollTo(0, 900);
      window.dispatchEvent(new Event("scroll"));
    });
    const readTransforms = () => renderer.evaluate((root) => {
      const line = root.querySelector<HTMLElement>(
        '[data-zodiac-artwork$="-line.webp"]',
      )?.closest<HTMLElement>("[data-parallax]");
      const foreground = root.querySelector<HTMLElement>(
        '[data-zodiac-artwork$="zodiac-meo.webp"]',
      )?.closest<HTMLElement>("[data-parallax]");
      return {
        line: line ? getComputedStyle(line).transform : "none",
        foreground: foreground ? getComputedStyle(foreground).transform : "none",
      };
    });
    await expect.poll(async () => {
      const transforms = await readTransforms();
      return transforms.line !== "none" && transforms.line !== transforms.foreground;
    }).toBe(true);

    const transforms = await readTransforms();
    expect(transforms.line).not.toBe(transforms.foreground);
  });

  test("isolated art opening layers replace the WebGL decor without removing the 3D stage", async ({ page }) => {
    const port = Number(process.env.E2E_PORT ?? 3100);
    await page.goto(`http://localhost:${port}/mau-thiep/dong-ho-dan-gian/demo`, {
      timeout: 60_000,
    });

    const stage = page.locator('[data-envelope-renderer="3d"]');
    const capture = page.locator("[data-envelope-capture-root]");
    const staticEffect = page.locator('[data-opening-effect-mode="static"]');
    await expect(stage).toBeVisible({ timeout: 30_000 });
    await expect(capture).toHaveCount(1, { timeout: 45_000 });
    await expect(staticEffect).toHaveCount(1);
    await expect(staticEffect.locator("[data-opening-layer]")).toHaveCount(3);
    const staticClip = page.locator('[data-opening-static-clip="card"]');
    await expect(staticClip).toHaveCount(1);
    await expect(staticClip).toHaveCSS("overflow", "hidden");

    const buttonRatio = await capture.evaluate((root) => {
      const button = root.querySelector<HTMLElement>("[data-open-btn]");
      if (!button) throw new Error("captured art envelope has no open button");
      const rootBox = root.getBoundingClientRect();
      const buttonBox = button.getBoundingClientRect();
      return {
        x: (buttonBox.left + buttonBox.width / 2 - rootBox.left) / rootBox.width,
        y: (buttonBox.top + buttonBox.height / 2 - rootBox.top) / rootBox.height,
      };
    });
    const projectedSize = (await stage.getAttribute("data-envelope-projected-size"))
      ?.split("x")
      .map(Number);
    const stageBox = await stage.boundingBox();
    if (!stageBox || !projectedSize || projectedSize.length !== 2) {
      throw new Error("art envelope has no projected layout");
    }

    await page.mouse.click(
      stageBox.x + stageBox.width / 2 + (buttonRatio.x - 0.5) * projectedSize[0],
      stageBox.y + stageBox.height / 2 + (buttonRatio.y - 0.5) * projectedSize[1],
    );

    const openingEffect = page.locator('[data-opening-effect-mode="opening"]');
    await expect(openingEffect).toHaveCount(1);
    await expect(openingEffect.locator('[data-opening-static-clip="card"]')).toHaveCount(0);
    await expect(openingEffect).toHaveAttribute(
      "data-opening-effect",
      "dong-ho-folk-layered-opening",
    );
    await expect(openingEffect).toHaveAttribute("data-opening-effect-duration", "1420");
    const layers = openingEffect.locator("[data-opening-layer]");
    await expect(layers).toHaveCount(3);
    const sources = await layers.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-opening-layer-src")),
    );
    expect(sources.every((source) => source?.includes("/opening-") && !source.endsWith("/artwork.webp"))).toBe(true);
    await expect(stage).toBeAttached();
    await expect(stage).toHaveCSS("animation-name", "demo-art-envelope-away");
    await expect(stage).toHaveCSS("animation-duration", "1.42s");

    await page.waitForTimeout(1_050);
    await expect(page.locator('[data-template-renderer="dong-ho-folk"]')).toHaveCount(0);
    await expect(page.locator('[data-template-renderer="dong-ho-folk"]')).toBeAttached({
      timeout: 1_000,
    });
    await expect(openingEffect).toHaveCount(0);
  });

  test("optional opening layer failure never falls back to the composite artwork", async ({ page }) => {
    const port = Number(process.env.E2E_PORT ?? 3100);
    await page.route("**/dong-ho-folk/opening-right-chicken.webp", (route) => route.abort());
    await page.goto(`http://localhost:${port}/mau-thiep/dong-ho-dan-gian/demo`, {
      timeout: 60_000,
    });

    await expect(page.locator('[data-opening-effect-mode="static"] [data-opening-layer]')).toHaveCount(2, {
      timeout: 45_000,
    });
    await page.locator("[data-open-invitation-control]").evaluate((button) =>
      (button as HTMLButtonElement).click(),
    );
    const openingLayers = page.locator(
      '[data-opening-effect-mode="opening"] [data-opening-layer]',
    );
    await expect(openingLayers).toHaveCount(2);
    const sources = await openingLayers.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-opening-layer-src")),
    );
    expect(sources.some((source) => source?.endsWith("/artwork.webp"))).toBe(false);
    await expect(page.locator('[data-template-renderer="dong-ho-folk"]')).toBeAttached({
      timeout: 2_000,
    });
  });

  test("reduced art opening uses a short opacity-only reveal", async ({ page }) => {
    const port = Number(process.env.E2E_PORT ?? 3100);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`http://localhost:${port}/mau-thiep/dong-ho-dan-gian/demo`, {
      timeout: 60_000,
    });

    await openCapturedEnvelope(page);
    await expect(page.locator('[data-template-renderer="dong-ho-folk"]')).toBeAttached({
      timeout: 600,
    });
    await expect(page.locator('[data-opening-effect-mode="opening"]')).toHaveCount(0);
  });

  test("all art invitation opening effects mount and reveal on desktop and mobile", async ({ page }) => {
    test.setTimeout(900_000);
    const port = Number(process.env.E2E_PORT ?? 3100);

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      for (const [slug, durationMs] of ART_OPENING_CASES) {
        const routeSlug = getVietnameseTemplateSlug(slug);
        await page.goto(`http://localhost:${port}/mau-thiep/${routeSlug}/demo`, {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        });

        const staticEffect = page.locator('[data-opening-effect-mode="static"]');
        await expect(staticEffect, `${slug} static effect @ ${viewport.width}`).toHaveCount(1, {
          timeout: 45_000,
        });
        await expect(staticEffect).toHaveAttribute(
          "data-opening-effect",
          `${slug}-layered-opening`,
        );
        await expect(staticEffect).toHaveAttribute(
          "data-opening-effect-duration",
          String(durationMs),
        );
        const staticLayers = staticEffect.locator("[data-opening-layer]");
        await expect(staticLayers).toHaveCount(3);
        const staticSources = await staticLayers.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-opening-layer-src")),
        );
        expect(
          staticSources.every(
            (source) => source?.includes("/opening-") && !source.endsWith("/artwork.webp"),
          ),
          slug,
        ).toBe(true);

        const stage = page.locator('[data-envelope-renderer="3d"]');
        await expect(stage).toBeVisible({ timeout: 30_000 });
        await page.locator("[data-open-invitation-control]").evaluate((button) =>
          (button as HTMLButtonElement).click(),
        );
        const openingEffect = page.locator('[data-opening-effect-mode="opening"]');
        await expect(openingEffect, `${slug} opening effect @ ${viewport.width}`).toHaveCount(1);
        await expect(openingEffect.locator("[data-opening-layer]")).toHaveCount(3);
        await expect(stage).toBeAttached();
        await expect(page.locator(`[data-template-renderer="${slug}"]`)).toBeAttached({
          timeout: durationMs + 1_500,
        });
        await expect(openingEffect).toHaveCount(0);
        const hasHorizontalOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        );
        expect(hasHorizontalOverflow, `${slug} overflow @ ${viewport.width}`).toBe(false);
      }
    }
  });

  // Width per breakpoint is covered by the rollout matrix; this guards the other
  // half of the rule — height comes from real card content, so it must sit near
  // the Chung Đôi reference instead of stretching to the viewport or snapping
  // back to the legacy 3 / 4.5 ratio.
  test("cherry blossom cover height follows real content, not the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/mau-thiep/anh-dao-hong/demo", { timeout: 60_000 });

    const cherryCapture = page.locator('[data-envelope-capture-root="responsive-natural"]');
    await expect(cherryCapture).toHaveCount(1);
    await expect.poll(() => cherryCapture.evaluate((node) => ({
      width: Math.round(node.getBoundingClientRect().width),
      height: Math.round(node.getBoundingClientRect().height),
    }))).toMatchObject({ width: 600 });

    const desktopSize = await cherryCapture.evaluate((node) => ({
      width: Math.round(node.getBoundingClientRect().width),
      height: Math.round(node.getBoundingClientRect().height),
    }));
    expect(desktopSize.height).toBeGreaterThanOrEqual(480);
    expect(desktopSize.height).toBeLessThanOrEqual(560);
    expect(desktopSize.height).not.toBe(900);
    // The legacy fixed path would force 600 × 900 at a 3 / 4.5 ratio.
    expect(desktopSize.height).not.toBe(Math.round((desktopSize.width / 3) * 4.5));
  });

  test("envelope decorations match the Chung Đôi clipping policy", async ({
    page,
  }) => {
    await page.goto("/mau-thiep/song-hy-do/demo", { timeout: 60_000 });

    await expect(page.locator("[data-envelope-background-glass]")).toHaveCount(
      0,
    );

    const clippedDecor = page.locator(
      '[data-envelope-capture-root="responsive-natural"] [data-envelope-decor-overflow="clip"]',
    );
    await expect(clippedDecor).toHaveCount(1, { timeout: 45_000 });
    await expect(clippedDecor).toHaveCSS("overflow", "hidden");
    await expect(clippedDecor.locator("img")).toHaveCount(2);
    await expect(page.locator("[data-envelope-decor-card]")).toHaveCount(0);

    await page.goto("/mau-thiep/vuonkinh-xanh/demo", { timeout: 60_000 });

    const backgroundGlass = page.locator("[data-envelope-background-glass]");
    await expect(backgroundGlass).toHaveCount(1);
    await expect(backgroundGlass).toHaveCSS(
      "background-color",
      "rgba(255, 255, 255, 0.12)",
    );
    await expect(backgroundGlass).toHaveCSS(
      "backdrop-filter",
      "blur(8px) saturate(1.05)",
    );

    const overflowDecor = page.locator("[data-envelope-decor-card]");
    await expect(overflowDecor).toHaveCount(1, { timeout: 45_000 });
    await expect(overflowDecor.locator("img")).toHaveCount(3);
    await expect(overflowDecor).toHaveAttribute(
      "data-envelope-decor-compositing",
      "full-layer",
    );
    await expect(
      page.locator("[data-envelope-content-overlay-root]"),
    ).toHaveCount(1);
    await expect(
      page.locator(
        '[data-envelope-capture-root="responsive-natural"] [data-envelope-decor-overflow="visible"]',
      ),
    ).toHaveCount(0);
  });

  // Drives the rollout matrix helper through the already-approved baseline, so a
  // regression in the helper itself surfaces before a batch relies on it. Route
  // slugs come from the registry — never a second hand-written mapping.
  test("envelope sizing baseline holds at every breakpoint", async ({ page }) => {
    await expectResponsiveEnvelopeSizing(
      page,
      getVietnameseTemplateSlug("cherry-blossom-pink"),
    );
  });

  for (const sourceSlug of ENVELOPE_GROUP_A_SLUGS) {
    test(`envelope sizing group A — ${sourceSlug}`, async ({ page }) => {
      await expectResponsiveEnvelopeSizing(page, getVietnameseTemplateSlug(sourceSlug));
    });
  }

  for (const sourceSlug of ENVELOPE_GROUP_B_SLUGS) {
    test(`envelope sizing group B — ${sourceSlug}`, async ({ page }) => {
      await expectResponsiveEnvelopeSizing(page, getVietnameseTemplateSlug(sourceSlug));
    });
  }

  for (const sourceSlug of ENVELOPE_GROUP_C_SLUGS) {
    test(`envelope sizing group C — ${sourceSlug}`, async ({ page }) => {
      await expectResponsiveEnvelopeSizing(page, getVietnameseTemplateSlug(sourceSlug));
    });
  }

  for (const sourceSlug of ENVELOPE_GROUP_D_SLUGS) {
    test(`envelope sizing group D — ${sourceSlug}`, async ({ page }) => {
      await expectResponsiveEnvelopeSizing(page, getVietnameseTemplateSlug(sourceSlug));
    });
  }

  for (const sourceSlug of ENVELOPE_GROUP_E_SLUGS) {
    test(`envelope sizing group E — ${sourceSlug}`, async ({ page }) => {
      await expectResponsiveEnvelopeSizing(page, getVietnameseTemplateSlug(sourceSlug));
    });
  }

  test("royal-red demo loads without crashing", async ({ page }) => {
    const res = await page.goto("/vi/templates/hoang-kim-do/demo", { timeout: 60_000 });
    expect(res?.ok()).toBeTruthy();

    await expect(page.locator("main#top")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("main#top audio")).toHaveCount(1);
  });

  // The cover sets `autoRotate={false}` and runs no animation loop, so an idle
  // canvas only jitters by OrbitControls damping (measured 0.1–0.4% of channels
  // — below any threshold worth asserting). Drag rotation is the real contract,
  // and it is what the responsive sizing rollout must not break.
  test("3D invitation rotates when dragged", async ({ page }) => {
    await page.goto("/vi/templates/song-long-xanh/demo", { timeout: 60_000 });

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    // Textures are captured from the DOM after fonts settle; drag before they
    // land would diff two loading frames instead of two rotations.
    await page.waitForTimeout(2_500);

    const box = await canvas.boundingBox();
    if (!box) throw new Error("cover canvas has no layout box");
    const midY = box.y + box.height / 2;

    const beforeDrag = await sharp(await canvas.screenshot()).raw().toBuffer();

    // Drag well clear of the "Mở thiệp" hit area so the gesture rotates the
    // card instead of opening the invitation.
    await page.mouse.move(box.x + box.width * 0.5, midY);
    await page.mouse.down();
    for (const step of [0.6, 0.7, 0.8, 0.85]) {
      await page.mouse.move(box.x + box.width * step, midY, { steps: 4 });
    }
    await page.mouse.up();
    await page.waitForTimeout(600);

    const afterDrag = await sharp(await canvas.screenshot()).raw().toBuffer();
    expect(afterDrag.length).toBe(beforeDrag.length);

    let changedChannels = 0;
    for (let index = 0; index < beforeDrag.length; index += 1) {
      if (Math.abs(beforeDrag[index] - afterDrag[index]) > 8) {
        changedChannels += 1;
      }
    }

    // Dragging turns the card in 3D, which repaints far more than damping noise.
    expect(changedChannels / beforeDrag.length).toBeGreaterThan(0.02);
    // The invitation must not have opened — the cover stage is still mounted.
    await expect(page.locator("[data-envelope-renderer]")).toHaveAttribute(
      "data-envelope-renderer",
      "3d",
    );
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
