// Crawl chungdoi.com demo pages to recover the assets our clone is still missing:
//  - font "DFVN New Eddy" (7 templates)   -> capture the real font-file URL from network
//  - 4 background textures (__ASSET_VAR__) -> capture the real background-image URL
// Run: node scripts/crawl-missing-assets.mjs
import { chromium } from "playwright";

const BASE = "https://chungdoi.com/vi/mau-thiep";
const HEADERS = { Referer: "https://chungdoi.com/", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" };

// internal slug -> route slug, + what we need from each
const TARGETS = [
  { slug: "baroque-gold", route: "hoang-gia-vang", need: ["bg", "font"] },
  { slug: "brocade-flower-red", route: "gam-hoa-do", need: ["bg"] },
  { slug: "chateau-blue", route: "lau-dai-lam", need: ["font"] },
  { slug: "chateau-green", route: "lau-dai-xanh", need: ["font"] },
  { slug: "crystal-floral-blue", route: "hoa-thuy-tinh-lam", need: ["font"] },
  { slug: "glass-garden-green", route: "vuonkinh-xanh", need: ["bg", "font"] },
  { slug: "qasr-gold", route: "thanhcung-vang", need: ["bg", "font"] },
  { slug: "qasr-green", route: "thanhcung-xanh", need: ["font"] },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ extraHTTPHeaders: HEADERS, viewport: { width: 430, height: 900 } });
const results = {};

for (const t of TARGETS) {
  const page = await ctx.newPage();
  const fonts = new Set();
  const images = new Set();
  page.on("response", (res) => {
    const u = res.url();
    if (/\.(woff2?|ttf|otf)(\?|$)/i.test(u)) fonts.add(u);
    if (/\.(webp|png|jpg|jpeg|svg)(\?|$)/i.test(u)) images.add(u);
  });

  const url = `${BASE}/${t.route}/demo`;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  } catch (e) {
    results[t.slug] = { error: String(e).slice(0, 120), url };
    await page.close();
    continue;
  }
  // give lazy fonts/bg a beat
  await page.waitForTimeout(2500);

  // find the couple-name element font + any element with a background-image
  const info = await page.evaluate(() => {
    const out = { coupleFont: null, bgImages: [] };
    // heuristic: biggest cursive-ish text near top = couple names
    const all = [...document.querySelectorAll("h1,h2,div,span,p")];
    let best = null, bestSize = 0;
    for (const el of all) {
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize) || 0;
      const txt = (el.textContent || "").trim();
      if (txt && txt.length < 40 && size > bestSize && el.getBoundingClientRect().top < 1200) {
        best = cs.fontFamily; bestSize = size;
      }
    }
    out.coupleFont = best;
    for (const el of all) {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg.includes("url(")) {
        const m = [...bg.matchAll(/url\((['"]?)(.*?)\1\)/g)].map((x) => x[2]);
        for (const src of m) if (!src.startsWith("data:")) out.bgImages.push(src);
      }
    }
    out.bgImages = [...new Set(out.bgImages)];
    return out;
  });

  results[t.slug] = {
    need: t.need,
    coupleFont: info.coupleFont,
    bgImages: info.bgImages,
    fontUrls: [...fonts],
    imageSample: [...images].slice(0, 40),
  };
  console.error(`done ${t.slug}`);
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
