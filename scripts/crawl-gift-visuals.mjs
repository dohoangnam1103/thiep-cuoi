import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const source = readFileSync("src/data/template-route-slugs.ts", "utf8");
const routes = [...source.matchAll(/\["([^"]+)", "([^"]+)"\]/g)].map((match) => ({
  slug: match[1],
  route: match[2],
}));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  extraHTTPHeaders: {
    Referer: "https://chungdoi.com/",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  },
  viewport: { width: 430, height: 900 },
});

async function inspect({ slug, route }) {
  const page = await context.newPage();
  const imageUrls = new Set();
  page.on("response", (response) => {
    const type = response.headers()["content-type"] ?? "";
    if (type.startsWith("image/")) imageUrls.add(response.url());
  });
  const url = `https://chungdoi.com/vi/mau-thiep/${route}/demo`;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    const opener = page.getByText(/Mở thiệp|Mở Thiệp|Open invitation/i).last();
    if (await opener.isVisible().catch(() => false)) await opener.click();
    await page.waitForTimeout(1_500);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 75));
      }
    });
    await page.waitForTimeout(500);
    const assets = [...imageUrls].filter((assetUrl) =>
      /\/images\/(?:envelope|giftbox)\//i.test(assetUrl),
    );
    console.log(`${slug}: ${assets.join(", ") || "NONE"}`);
    return { slug, route, sourceUrl: url, assets, error: null };
  } catch (error) {
    console.error(`${slug}: ERROR ${error.message}`);
    return { slug, route, sourceUrl: url, assets: [], error: error.message };
  } finally {
    await page.close();
  }
}

const results = [];
for (let index = 0; index < routes.length; index += 4) {
  results.push(...await Promise.all(routes.slice(index, index + 4).map(inspect)));
}
await browser.close();
writeFileSync("docs/research/gift-visual-audit.json", JSON.stringify(results, null, 2));
console.log(`Saved ${results.length} results to docs/research/gift-visual-audit.json`);
