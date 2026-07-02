import { chromium } from "playwright-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function measure(url) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  const btn = page.getByRole("button", { name: /Mở thiệp|Open Invitation/i }).first();
  await btn.click({ force: true, timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(3000);

  const data = await page.evaluate(() => {
    const pick = (sel, txt) => {
      const els = Array.from(document.querySelectorAll(sel));
      const el = txt ? els.find((e) => e.textContent && e.textContent.includes(txt)) : els[0];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      pageHeight: document.body.scrollHeight,
      chuHy: (() => { const i = Array.from(document.images).find((im) => im.src.includes("CHU%20HY") || im.src.includes("CHU HY")); if (!i) return null; const r = i.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })(),
      names: pick("h1,div", "Ngọc Ánh"),
      thongTin: pick("h2", "hông"),
      soLuuBut: pick("h2", "lưu bút"),
    };
  });
  await browser.close();
  return data;
}

const orig = await measure("https://chungdoi.com/mau-thiep/song-phung-do/demo");
const clone = await measure("http://127.0.0.1:3000/mau-thiep/song-phung-do/demo");
console.log("ORIGINAL:", JSON.stringify(orig, null, 1));
console.log("CLONE:   ", JSON.stringify(clone, null, 1));
