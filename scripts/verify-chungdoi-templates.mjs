import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "fs";

const routes = [
  ["hoa-tinh-do", "love-art", 14],
  ["lau-dai-xanh", "chateau-green", 15],
  ["thanhcung-xanh", "qasr-green", 12],
  ["thanhcung-vang", "qasr-gold", 5],
  ["gam-hoa-do", "brocade-flower-red", 12],
  ["hoa-thuy-tinh-lam", "crystal-floral-blue", 10],
  ["vuonkinh-xanh", "glass-garden-green", 9],
  ["hoang-gia-vang", "baroque-gold", 6],
  ["hoa-moc-nau", "boho-floral-brown", 6],
  ["long-phung-v2-do", "longphung-v2-red", 4],
  ["long-phung-v3-do", "longphung-v3-red", 4],
  ["thanh-diep-xanh", "thanhdiep-green", 4],
  ["anh-dao-hong", "anhdao-pink", 3],
];

mkdirSync("/tmp/chungdoi-verify", { recursive: true });

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1 });
const results = [];

for (const [route, folder, expected] of routes) {
  const errors = [];
  const failed = [];
  page.removeAllListeners("console");
  page.removeAllListeners("requestfailed");
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) errors.push(`${msg.type()}: ${msg.text()}`.slice(0, 220));
  });
  page.on("requestfailed", (req) => {
    const url = req.url();
    if (url.includes("/chungdoi/images/themes/_decor/") || url.includes("/_next/")) failed.push(`${req.failure()?.errorText || "failed"}: ${url}`.slice(0, 220));
  });

  const url = `http://localhost:3002/mau-thiep/${route}/demo`;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.evaluate(() => document.querySelector('[data-open-btn="true"]')?.click());
    await page.waitForTimeout(1600);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
    const data = await page.evaluate(({ folder, route }) => {
      const imgs = [...document.querySelectorAll("img")].map((img) => img.currentSrc || img.src || "");
      const decor = imgs.filter((src) => src.includes(`/chungdoi/images/themes/_decor/${folder}/`));
      const visibleText = document.body.innerText;
      return {
        decor: [...new Set(decor)].length,
        imgs: imgs.length,
        height: document.body.scrollHeight,
        hasCeremony: visibleText.includes("Thông Tin Lễ Cưới"),
        hasQr: /(?:QR|Phong Bao) Mừng Cưới/.test(visibleText),
        hasForbiddenCombinedDragonPhoenix: route === "long-phung-v2-do" && imgs.some((src) => src.endsWith("/rong-phuong.webp")),
      };
    }, { folder, route });
    await page.screenshot({ path: `/tmp/chungdoi-verify/${route}.jpg`, fullPage: true, type: "jpeg", quality: 70 });
    results.push({ route, folder, expected, ...data, errors: [...new Set(errors)].slice(0, 5), failed: [...new Set(failed)].slice(0, 5), screenshot: `/tmp/chungdoi-verify/${route}.jpg` });
    console.log(`${route} ${data.decor}/${expected} decor, imgs=${data.imgs}, h=${data.height}, errors=${errors.length}, failed=${failed.length}`);
  } catch (e) {
    results.push({ route, folder, expected, error: String(e).slice(0, 300), errors, failed });
    console.log(`${route} ERROR ${String(e).slice(0, 120)}`);
  }
}

await browser.close();
writeFileSync("/tmp/chungdoi-verify/results.json", JSON.stringify(results, null, 2));

const bad = results.filter((r) => r.error || r.decor < r.expected || r.errors.length || r.failed.length || !r.hasCeremony || !r.hasQr || r.hasForbiddenCombinedDragonPhoenix);
console.log("\nSUMMARY");
console.table(results.map((r) => ({ route: r.route, decor: `${r.decor ?? 0}/${r.expected}`, imgs: r.imgs ?? 0, height: r.height ?? 0, hasCeremony: !!r.hasCeremony, hasQr: !!r.hasQr, errors: r.errors?.length ?? 0, failed: r.failed?.length ?? 0, error: r.error ? "YES" : "" })));
console.log(`bad=${bad.length}`);
if (bad.length) console.log(JSON.stringify(bad, null, 2));
