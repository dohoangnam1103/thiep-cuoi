import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAP_ERROR = /Google Maps Platform rejected|RefererNotAllowed|InvalidKeyMapError|ApiNotActivated|RequestDenied|API (?:key|project).*(?:invalid|not authorized|not allowed)|This page can't load Google Maps|Oops! Something went wrong|REQUEST_DENIED/i;

export function assertMapHasNoError(text) {
  if (MAP_ERROR.test(text)) {
    // Do not include Google's response text: it can contain an API key.
    throw new Error("Google Maps báo lỗi quyền truy cập/API; không xuất thumbnail lỗi.");
  }
}

/**
 * NEXT_PUBLIC_GOOGLE_MAPS_KEY is referrer-locked to the production domain, so a
 * capture served from localhost gets an error page instead of a map. Swap only
 * the rejected requests for the keyless embed URL — the same fallback the app
 * itself renders when no key is configured.
 */
export async function routeMapEmbedFallback(context) {
  await context.route(/\/maps\/embed\/v1\//, async (route) => {
    const query = new URL(route.request().url()).searchParams.get("q");
    if (!query) return route.continue();
    const response = await route.fetch();
    const body = await response.text();
    if (!MAP_ERROR.test(body)) return route.fulfill({ response, body });
    await route.fulfill({
      status: 302,
      headers: { location: `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` },
      body: "",
    });
  });
}

async function waitForGoogleMap(element) {
  const handle = await element.elementHandle();
  const frame = await handle?.contentFrame();
  if (!frame) throw new Error("Không truy cập được khung Google Maps để kiểm tra.");
  await frame.waitForLoadState("load", { timeout: 30_000 });
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const state = await frame.evaluate(() => {
      const visibleImages = [...document.images].filter((image) => {
        const rect = image.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 &&
          rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
      });
      return {
        text: document.body?.innerText ?? "",
        tiles: visibleImages.filter((image) => image.complete &&
          image.naturalWidth >= 256 && image.naturalHeight >= 256).length,
        pending: visibleImages.filter((image) => !image.complete || !image.naturalWidth).length,
      };
    });
    assertMapHasNoError(state.text);
    if (state.tiles > 0 && state.pending === 0) return state.tiles;
    await element.page().waitForTimeout(250);
  }
  throw new Error("Google Maps chưa tải đủ ảnh bản đồ sau 30 giây; giữ thumbnail cũ.");
}

export async function rasterizeEmbeddedFrames(page, { auditDir, slug } = {}) {
  const audit = [];
  // Use handles: replacing an iframe must not shift a live locator's indices.
  const frames = await page.locator("iframe").elementHandles();
  for (const [index, handle] of frames.entries()) {
    const id = `capture-frame-${index}`;
    await handle.evaluate((element, value) => element.setAttribute("data-capture-frame", value), id);
    const element = page.locator(`[data-capture-frame="${id}"]`);
    const source = await element.getAttribute("src");
    let googleMap = false;
    try {
      const url = new URL(source);
      googleMap = /(^|\.)google\.[a-z.]+$/.test(url.hostname) && url.pathname.startsWith("/maps");
    } catch { /* A missing src is rejected below rather than captured blank. */ }
    if (!source || source === "about:blank") throw new Error("Khung nhúng chưa có nội dung để chụp.");
    await element.scrollIntoViewIfNeeded();
    const loadedTiles = googleMap ? await waitForGoogleMap(element) : undefined;
    await page.waitForTimeout(1_200);
    if (googleMap) await waitForGoogleMap(element);
    const box = await element.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height };
    });
    const png = await element.screenshot({ animations: "disabled", type: "png" });
    const file = `${slug}-frame-${index}.png`;
    if (auditDir) {
      await mkdir(auditDir, { recursive: true });
      await writeFile(path.join(auditDir, file), png);
    }
    audit.push({ index, googleMap, loadedTiles, box, ...(auditDir ? { file } : {}) });
    await element.evaluate(async (el, dataUrl) => {
      const image = document.createElement("img");
      image.src = dataUrl;
      image.alt = el.title || "Bản đồ địa điểm cưới";
      image.className = el.className;
      image.style.cssText = el.style.cssText;
      // The screenshot already includes the iframe's opacity/filter. Applying
      // those classes a second time makes translucent maps noticeably darker.
      image.style.setProperty("opacity", "1", "important");
      image.style.setProperty("filter", "none", "important");
      image.width = Math.round(el.getBoundingClientRect().width);
      image.height = Math.round(el.getBoundingClientRect().height);
      image.setAttribute("data-captured-iframe", "true");
      await image.decode();
      el.replaceWith(image);
    }, `data:image/png;base64,${png.toString("base64")}`);
  }
  if (frames.length) {
    await page.evaluate(async () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      window.dispatchEvent(new Event("scroll"));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
  }
  return audit;
}
