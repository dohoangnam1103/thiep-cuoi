import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const root = process.cwd();
const baseUrl = process.env.CAPTURE_BASE_URL ?? "http://localhost:3200";
const templates = [
  {
    slug: "porcelain-red",
    route: "bach-su-do",
    galleryCount: 7,
    expectedGiftAsset: "/chungdoi/images/envelope/porcelain_red.webp",
    sourceHeights: { desktop: 6004, mobile: 5150, narrow: 5104 },
  },
  {
    slug: "porcelain-brown",
    route: "bach-su-nau",
    galleryCount: 6,
    expectedGiftAsset: "/chungdoi/images/envelope/porcelain_brown.webp",
    sourceHeights: { desktop: 6100, mobile: 5205, narrow: 5159 },
  },
  {
    slug: "porcelain-v2-red",
    route: "bach-su-v2-do",
    galleryCount: 8,
    expectedGiftAsset: "/chungdoi/images/envelope/porcelain_v2_red.webp",
    sourceHeights: { desktop: 6337, mobile: 5505, narrow: 5525 },
  },
  {
    slug: "porcelain-v2-green",
    route: "bach-su-v2-xanh",
    galleryCount: 8,
    expectedGiftAsset: "/chungdoi/images/envelope/porcelain_v2_green.webp",
    sourceHeights: { desktop: 6279, mobile: 5410, narrow: 5485 },
  },
];
const requestedSlug = process.env.QA_SLUG;
if (requestedSlug) {
  const selected = templates.find((template) => template.slug === requestedSlug);
  if (!selected) throw new Error(`Unknown QA_SLUG: ${requestedSlug}`);
  templates.splice(0, templates.length, selected);
}
const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
  narrow: { width: 320, height: 700 },
};

function relativeDifference(actual, expected) {
  return Number(((actual - expected) / expected).toFixed(4));
}

async function waitForImages(page) {
  await page.evaluate(async () => {
    const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const root = document.documentElement;
    root.style.scrollBehavior = "auto";
    document.querySelectorAll("img").forEach((image) => {
      image.loading = "eager";
    });
    document.querySelectorAll("iframe").forEach((frame) => {
      frame.loading = "eager";
    });

    for (let y = 0; y < document.documentElement.scrollHeight; y += 640) {
      window.scrollTo(0, y);
      root.scrollTop = y;
      window.dispatchEvent(new Event("scroll"));
      await nextFrame();
      await nextFrame();
      await sleep(35);
    }

    window.scrollTo(0, 0);
    root.scrollTop = 0;
    window.dispatchEvent(new Event("scroll"));
    await nextFrame();
    await nextFrame();

    if (document.fonts?.ready) await document.fonts.ready;
    const images = Array.from(document.images);
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
  });
}

async function waitForCoverAssets(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const visibleImages = Array.from(document.images).filter((image) => {
      const rect = image.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    await Promise.all(visibleImages.map((image) => image.decode().catch(() => undefined)));
  });
  await page.waitForTimeout(300);
}

async function stabilize(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0.001ms !important;
        transition-delay: 0s !important;
        transition-duration: 0.001ms !important;
      }
    `,
  });
  await page.waitForTimeout(100);
}

async function captureFullPage(browser, template, viewportName, auditDir) {
  const viewport = viewports[viewportName];
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  const url = `${baseUrl}/mau-thiep/${template.route}/demo/capture?captureRun=porcelain-qa-${Date.now()}`;
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  if (!response?.ok()) throw new Error(`${template.slug}/${viewportName}: HTTP ${response?.status() ?? 0}`);
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.waitForSelector(`[data-template-visual="${template.slug}"]`, { state: "visible" });
  await waitForImages(page);
  await stabilize(page);

  const metrics = await page.evaluate((slug) => {
    const root = document.querySelector(`[data-template-visual="${slug}"]`);
    const brokenImages = Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.getAttribute("src") ?? "");
    return {
      documentHeight: document.documentElement.scrollHeight,
      documentWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      rootWidth: root?.getBoundingClientRect().width ?? 0,
      brokenImages,
      footerPresent: Boolean(document.querySelector("[data-template-footer]")),
      giftKind: document.querySelector('[data-testid="gift-envelope"]')?.getAttribute("data-gift-visual-kind") ?? null,
      giftSlug: document.querySelector('[data-testid="gift-envelope"]')?.getAttribute("data-gift-visual-slug") ?? null,
    };
  }, template.slug);

  const screenshotName = viewportName === "narrow" ? "local-320-full.png" : `local-${viewportName}-full.png`;
  await page.screenshot({ path: path.join(auditDir, screenshotName), fullPage: true });
  if (viewportName === "narrow") {
    await page.screenshot({ path: path.join(auditDir, "local-320-top.png") });
  }

  await page.close();
  return {
    ...metrics,
    consoleErrors: [...new Set(errors)].filter((message) => !message.includes("favicon")),
    sourceHeight: template.sourceHeights[viewportName],
    heightDifferenceRatio: relativeDifference(metrics.documentHeight, template.sourceHeights[viewportName]),
  };
}

async function captureCover(browser, template, viewportName, auditDir) {
  const viewport = viewports[viewportName];
  const page = await browser.newPage({ viewport });
  const url = `${baseUrl}/mau-thiep/${template.route}/demo`;
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  if (!response?.ok()) throw new Error(`${template.slug}/${viewportName} cover: HTTP ${response?.status() ?? 0}`);
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.locator('[data-open-btn]').waitFor({ state: "visible" });
  await waitForCoverAssets(page);
  await page.screenshot({ path: path.join(auditDir, `local-${viewportName}-cover.png`) });

  await page.locator('[data-open-btn]').click();
  await page.waitForTimeout(650);
  await page.screenshot({ path: path.join(auditDir, `local-${viewportName}-opening-mid.png`) });
  await page.locator(`[data-template-visual="${template.slug}"]`).waitFor({ state: "visible", timeout: 5_000 });
  await page.locator('[data-open-btn]').waitFor({ state: "detached", timeout: 5_000 });
  const state = await page.evaluate((slug) => ({
    coverRemoved: !document.querySelector('[data-open-btn]'),
    bodyOverflow: document.body.style.overflow,
    rendererVisible: Boolean(document.querySelector(`[data-template-renderer="${slug}"]`)),
  }), template.slug);
  await page.close();
  return state;
}

async function captureInteractions(browser, template, auditDir) {
  const page = await browser.newPage({ viewport: viewports.desktop });
  const failedRequests = [];
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.startsWith(baseUrl) || url.includes("/chungdoi/")) {
      failedRequests.push(`${request.failure()?.errorText ?? "failed"}: ${url}`);
    }
  });

  await page.goto(`${baseUrl}/mau-thiep/${template.route}/demo`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.locator('[data-open-btn]').click();
  await page.locator(`[data-template-visual="${template.slug}"]`).waitFor({ state: "visible", timeout: 5_000 });
  await page.locator('[data-open-btn]').waitFor({ state: "detached", timeout: 5_000 });
  await waitForImages(page);
  await page.waitForTimeout(2_300);
  const stopAutoScroll = page.getByRole("button", { name: /Dừng tự động cuộn/i });
  if (await stopAutoScroll.count()) await stopAutoScroll.click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));

  const firstAlbumImage = page.getByRole("button", { name: "Ảnh cưới 1" });
  await firstAlbumImage.scrollIntoViewIfNeeded();
  await firstAlbumImage.click();
  const lightboxCount = page.getByText(`1 / ${template.galleryCount}`, { exact: true });
  await lightboxCount.waitFor({ state: "visible" });
  await page.screenshot({ path: path.join(auditDir, "local-desktop-album-modal.png") });
  await page.getByRole("button", { name: "Đóng" }).click();

  const rsvpProxy = page.getByTestId(`${template.slug}-rsvp-proxy`);
  const rsvpProxyPresent = await rsvpProxy.isVisible();
  await rsvpProxy.scrollIntoViewIfNeeded();
  await rsvpProxy.click();
  await page.waitForTimeout(250);
  const rsvpDialogOpened = await page.getByRole("dialog").isVisible().catch(() => false);
  const publicRsvpTriggerPresent = await page.getByTestId("public-rsvp-trigger").isVisible().catch(() => false);
  await page.screenshot({ path: path.join(auditDir, "local-desktop-rsvp-state.png") });
  if (rsvpDialogOpened) {
    await page.getByRole("dialog").getByRole("button", { name: /Đóng/i }).click();
  }

  const venueSection = page.locator("section").filter({ has: page.getByRole("heading", { name: /SẼ TỔ CHỨC TẠI/i }) }).first();
  await venueSection.scrollIntoViewIfNeeded();
  await venueSection.screenshot({ path: path.join(auditDir, "local-desktop-map.png") });

  const gift = page.getByTestId("gift-envelope");
  await gift.scrollIntoViewIfNeeded();
  const giftAuditBefore = await gift.evaluate((element) => ({
    kind: element.getAttribute("data-gift-visual-kind"),
    slug: element.getAttribute("data-gift-visual-slug"),
    images: Array.from(element.querySelectorAll("img[data-gift-image]")).map((image) => ({
      src: image.getAttribute("src"),
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    })),
  }));
  await gift.click();
  const giftModal = page.locator(".gift-modal-panel");
  await giftModal.waitFor({ state: "visible" });
  const giftModalDesktop = await giftModal.boundingBox();
  const overflowWhileGiftOpen = await page.evaluate(() => ({
    body: document.body.style.overflow,
    html: document.documentElement.style.overflow,
  }));
  await page.screenshot({ path: path.join(auditDir, "local-desktop-gift-modal.png") });
  const bankCardCount = await page.getByTestId("gift-bank-card").count();
  await giftModal.getByRole("button", { name: "Đóng" }).click();

  const footer = page.locator("[data-template-footer]");
  await footer.scrollIntoViewIfNeeded();
  await footer.screenshot({ path: path.join(auditDir, "local-desktop-footer.png") });
  const guestbookPresent = await page.getByRole("heading", { name: /SỔ LƯU BÚT/i }).isVisible();
  const footerText = (await footer.innerText()).trim();

  await page.setViewportSize(viewports.mobile);
  await gift.scrollIntoViewIfNeeded();
  await gift.click();
  await giftModal.waitFor({ state: "visible" });
  const giftModalMobile = await giftModal.boundingBox();
  await page.screenshot({ path: path.join(auditDir, "local-mobile-gift-modal.png") });
  await giftModal.getByRole("button", { name: "Đóng" }).click();

  await page.close();
  return {
    galleryCountLabel: `1 / ${template.galleryCount}`,
    rsvpProxyPresent,
    rsvpDialogOpened,
    publicRsvpTriggerPresent,
    guestbookPresent,
    gift: {
      ...giftAuditBefore,
      expectedAsset: template.expectedGiftAsset,
      expectedAssetPresent: giftAuditBefore.images.some((image) => image.src === template.expectedGiftAsset),
      bankCardCount,
      modalDesktop: giftModalDesktop,
      modalMobile: giftModalMobile,
      overflowWhileOpen: overflowWhileGiftOpen,
    },
    footerText,
    failedLocalRequests: [...new Set(failedRequests)],
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const template of templates) {
      const auditDir = path.join(root, "docs/research", template.slug);
      await mkdir(auditDir, { recursive: true });
      const audit = {
        slug: template.slug,
        route: template.route,
        capturedAt: new Date().toISOString(),
        viewports: {},
        cover: {},
      };
      for (const viewportName of Object.keys(viewports)) {
        audit.viewports[viewportName] = await captureFullPage(browser, template, viewportName, auditDir);
      }
      audit.cover.desktop = await captureCover(browser, template, "desktop", auditDir);
      audit.cover.mobile = await captureCover(browser, template, "mobile", auditDir);
      audit.interactions = await captureInteractions(browser, template, auditDir);
      await writeFile(path.join(auditDir, "local-qa-audit.json"), `${JSON.stringify(audit, null, 2)}\n`);
      results.push(audit);
      console.log(`${template.slug}: desktop ${audit.viewports.desktop.documentHeight}px, mobile ${audit.viewports.mobile.documentHeight}px, narrow ${audit.viewports.narrow.documentHeight}px`);
    }
  } finally {
    await browser.close();
  }

  const failures = [];
  for (const audit of results) {
    for (const [name, metrics] of Object.entries(audit.viewports)) {
      if (metrics.documentWidth > metrics.innerWidth) failures.push(`${audit.slug}/${name}: horizontal overflow ${metrics.documentWidth} > ${metrics.innerWidth}`);
      if (metrics.brokenImages.length) failures.push(`${audit.slug}/${name}: broken images ${metrics.brokenImages.join(", ")}`);
      if (!metrics.footerPresent) failures.push(`${audit.slug}/${name}: footer missing`);
      if (metrics.giftKind !== "layered-image") failures.push(`${audit.slug}/${name}: gift kind ${metrics.giftKind}`);
      if (metrics.consoleErrors.length) failures.push(`${audit.slug}/${name}: console errors ${metrics.consoleErrors.join(" | ")}`);
    }
    if (!audit.cover.desktop.coverRemoved || !audit.cover.mobile.coverRemoved) failures.push(`${audit.slug}: cover did not open cleanly`);
    if (!audit.interactions.gift.expectedAssetPresent) failures.push(`${audit.slug}: expected gift asset missing`);
    if (!audit.interactions.rsvpProxyPresent) failures.push(`${audit.slug}: RSVP proxy missing`);
    if (!audit.interactions.guestbookPresent) failures.push(`${audit.slug}: guestbook missing`);
    if (audit.interactions.failedLocalRequests.length) failures.push(`${audit.slug}: local request failures ${audit.interactions.failedLocalRequests.join(" | ")}`);
  }
  if (failures.length) throw new Error(`QA failures:\n${failures.join("\n")}`);
  console.log(`QA passed for ${results.length} porcelain templates.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
