// Extract the real rendered invitation DOM + theme tokens from a chungdoi.com demo.
// Usage: node scripts/extract-original-dom.mjs <vnSlug> [outSlug]
//   node scripts/extract-original-dom.mjs song-hy-xanh song-hy-green
//
// Writes to docs/research/original-dom/<outSlug>/:
//   cover.html          - rendered cover overlay outerHTML
//   opened.html         - rendered opened-invitation container outerHTML
//   opened.pretty.html  - same, lightly formatted for reading
//   theme-vars.json     - computed CSS custom properties on :root + invitation root
//   css/*.css           - downloaded _next CSS bundles + font-face.css

import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const vnSlug = process.argv[2] || "song-hy-xanh";
const outSlug = process.argv[3] || vnSlug;
const URL = `https://chungdoi.com/mau-thiep/${vnSlug}/demo`;
const OUT = path.join(process.cwd(), "docs/research/original-dom", outSlug);

function prettyHtml(html) {
  // extremely light indenter: newline before every tag, then indent by depth
  const withBreaks = html.replace(/></g, ">\n<");
  let depth = 0;
  return withBreaks
    .split("\n")
    .map((line) => {
      const isClose = /^<\//.test(line);
      const isSelfContained = /^<[^>]+>.*<\/[^>]+>$/.test(line) || /\/>$/.test(line);
      if (isClose) depth = Math.max(0, depth - 1);
      const indented = "  ".repeat(depth) + line;
      if (!isClose && !isSelfContained && /^<[^/!]/.test(line) && !/<\/[^>]+>$/.test(line)) {
        depth += 1;
      }
      return indented;
    })
    .join("\n");
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1200);

await mkdir(path.join(OUT, "css"), { recursive: true });

// 1) capture the cover overlay before opening
const coverHtml = await page.evaluate(() => {
  const root = document.querySelector(".demo-page") || document.querySelector("main");
  return root ? root.outerHTML : document.body.outerHTML;
});
await writeFile(path.join(OUT, "cover.html"), coverHtml);
console.log("cover.html", coverHtml.length);

// 2) download the CSS bundles + font-face.css referenced by the page
const cssHrefs = await page.evaluate(() =>
  Array.from(document.styleSheets)
    .map((s) => s.href)
    .filter((h) => h && (h.includes("/_next/static/css/") || h.includes("font-face.css")))
);
for (const href of cssHrefs) {
  try {
    const res = await fetch(href);
    const text = await res.text();
    const name = href.split("/").pop().split("?")[0];
    await writeFile(path.join(OUT, "css", name), text);
    console.log("css", name, text.length);
  } catch (e) {
    console.warn("css failed", href, e.message);
  }
}

// 3) open the invitation
const btn = page.getByRole("button", { name: /Mở thiệp|Open Invitation/i }).first();
await btn.click({ force: true, timeout: 8000 }).catch((e) => console.log("open click:", e.message));
await page.waitForTimeout(3500);

// 4) capture the opened invitation container + theme tokens
const result = await page.evaluate(() => {
  // the invitation card is the max-w-[480px] md:max-w-[900px] container
  const candidates = Array.from(document.querySelectorAll("div"));
  const card =
    candidates.find(
      (el) =>
        /max-w-\[480px\]/.test(el.className) && /md:max-w-\[900px\]/.test(el.className)
    ) ||
    candidates.find((el) => /max-w-\[480px\]/.test(el.className)) ||
    document.querySelector("main");

  const readVars = (el) => {
    const cs = getComputedStyle(el);
    const out = {};
    for (let i = 0; i < cs.length; i++) {
      const prop = cs[i];
      if (prop.startsWith("--")) out[prop] = cs.getPropertyValue(prop).trim();
    }
    // also pull a few resolved values
    out["__color"] = cs.color;
    out["__backgroundColor"] = cs.backgroundColor;
    out["__fontFamily"] = cs.fontFamily;
    return out;
  };

  return {
    openedHtml: card ? card.outerHTML : "",
    cardClassName: card ? card.className : null,
    rootVars: readVars(document.documentElement),
    bodyVars: readVars(document.body),
    cardVars: card ? readVars(card) : {},
    pageHeight: document.body.scrollHeight,
  };
});

await writeFile(path.join(OUT, "opened.html"), result.openedHtml);
await writeFile(path.join(OUT, "opened.pretty.html"), prettyHtml(result.openedHtml));
await writeFile(
  path.join(OUT, "theme-vars.json"),
  JSON.stringify(
    {
      url: URL,
      cardClassName: result.cardClassName,
      pageHeight: result.pageHeight,
      rootVars: result.rootVars,
      bodyVars: result.bodyVars,
      cardVars: result.cardVars,
    },
    null,
    2
  )
);
console.log("opened.html", result.openedHtml.length, "pageHeight", result.pageHeight);
console.log("cardClassName:", result.cardClassName);

await browser.close();
console.log("done ->", OUT);
