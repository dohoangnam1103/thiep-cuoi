import { chromium } from "playwright-core";

const executablePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// route slugs (vi) for completed templates that fall back to generic InvitationBody
// (i.e. NOT handled by a dedicated component in the switch of chungdoi-demo.tsx)
const generic = [
  ["chateau-blue", "lau-dai-lam"],
  ["chateau-green", "lau-dai-xanh"],
  ["qasr-green", "thanhcung-xanh"],
  ["qasr-gold", "thanhcung-vang"],
  ["dragon-phoenix-v2-red", "long-phung-v2-do"],
  ["dragon-phoenix-v3-red", "long-phung-v3-do"],
  ["elegant-leaf-green", "thanh-diep-xanh"],
  ["jasmine-white", "mai-lan-trang"],
  ["silk-flora-brown", "hoa-lua-nau"],
  ["brocade-flower-red", "gam-hoa-do"],
  ["crystal-floral-blue", "hoa-thuy-tinh-lam"],
  ["baroque-gold", "hoang-gia-vang"],
  ["glass-garden-green", "vuonkinh-xanh"],
  ["hoa-tinh-red", "hoa-tinh-do"],
  ["chibi-red", "chibi-red"],
  ["minimalism-red", "minimalism-do"],
  ["cherry-blossom-pink", "anh-dao-hong"],
  ["boho-floral-green", "hoa-moc-xanh"],
  ["boho-floral-pink", "hoa-moc-hong"],
  ["boho-floral-brown", "hoa-moc-nau"],
  ["spring-garden-green", "vuon-xuan-xanh"],
  ["spring-garden-red", "vuon-xuan-do"],
  ["spring-garden-blue", "vuon-xuan-lam"],
];

const browser = await chromium.launch({ executablePath, headless: true });
const results = [];

for (const [source, route] of generic) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 2000 } });
  const url = `http://localhost:3000/mau-thiep/${route}/demo`;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const btn = page.getByRole("button", { name: "Mở thiệp" });
    if (await btn.count()) { await btn.first().click().catch(() => {}); await page.waitForTimeout(1500); }
    // scroll to force lazy images
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    });
    await page.waitForTimeout(600);
    const assets = await page.evaluate(() => {
      const set = new Set();
      for (const i of document.querySelectorAll("img")) {
        const s = i.currentSrc || i.src || "";
        const m = s.match(/\/images\/themes\/(?:_decor\/)?([a-z0-9_-]+)\/([^/?#]+)/i);
        if (m) set.add(`${m[1]}/${m[2]}`);
      }
      return [...set];
    });
    results.push({ source, route, count: assets.length, assets });
    console.log(`${route.padEnd(20)} (${source}) → ${assets.length} theme imgs`);
  } catch (e) {
    results.push({ source, route, error: String(e).slice(0, 120) });
    console.log(`${route.padEnd(20)} (${source}) → ERROR ${String(e).slice(0, 80)}`);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log("\n===JSON===");
console.log(JSON.stringify(results, null, 2));
