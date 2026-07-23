import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync, readFileSync } from "fs";

const source = readFileSync("src/data/chungdoi.ts", "utf8");
const routeSource = readFileSync("src/data/template-route-slugs.ts", "utf8");
const completedBlock = source.match(/completedTemplateSlugs = new Set<string>\(\[([\s\S]*?)\]\)/)?.[1] ?? "";
const completed = [...completedBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
const viBlock = routeSource.match(/vietnameseTemplateSlugs = \[([\s\S]*?)\] as const/)?.[1] ?? "";
const routeBySlug = new Map([...viBlock.matchAll(/\["([^"]+)",\s*"([^"]+)"\]/g)].map((match) => [match[1], match[2]]));

const routes = completed.map((slug) => ({ slug, route: routeBySlug.get(slug) ?? slug }));
const outDir = "/tmp/chungdoi-compare";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

async function inspectPage(url, screenshotPath) {
  const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1 });
  const consoleMessages = [];
  const failedRequests = [];

  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) consoleMessages.push(`${msg.type()}: ${msg.text()}`.slice(0, 260));
  });

  page.on("requestfailed", (req) => {
    failedRequests.push(`${req.failure()?.errorText ?? "failed"}: ${req.url()}`.slice(0, 260));
  });

  try {
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1200);

    await page.evaluate(async () => {
      const buttons = [...document.querySelectorAll("button, [role='button'], a")];
      const open = buttons.find((el) => /mở|open|xem|view|bấm|click/i.test(el.textContent ?? ""));
      if (open instanceof HTMLElement) open.click();
      await new Promise((resolve) => setTimeout(resolve, 900));
      for (let y = 0; y < document.body.scrollHeight; y += 650) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      window.scrollTo(0, 0);
    });

    await page.waitForTimeout(600);

    const data = await page.evaluate(() => {
      const normalize = (text) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const text = document.body.innerText;
      const normalized = normalize(text);
      const imgs = [...document.querySelectorAll("img")].map((img) => img.currentSrc || img.src || "").filter(Boolean);
      const decor = imgs.filter((src) => /\/images\/themes\//.test(src));
      const decorFiles = [...new Set(decor.map((src) => {
        const url = new URL(src, location.href);
        return decodeURIComponent(url.pathname.replace(/^.*\/images\/themes\/(?:_decor\/)?/, ""));
      }))].sort();
      return {
        status: null,
        title: document.title,
        height: document.body.scrollHeight,
        imageCount: imgs.length,
        decorCount: decorFiles.length,
        decorFiles,
        hasCeremony: normalized.includes("thong tin le cuoi"),
        hasQr: normalized.includes("qr"),
        hasAlbum: normalized.includes("album") || normalized.includes("khoanh khac"),
        textSample: text.slice(0, 500),
      };
    });

    await page.screenshot({ path: screenshotPath, fullPage: true, type: "jpeg", quality: 62 });

    return {
      ...data,
      status: response?.status() ?? 0,
      consoleMessages: [...new Set(consoleMessages)],
      failedRequests: [...new Set(failedRequests)],
      error: "",
    };
  } catch (error) {
    return {
      status: 0,
      title: "",
      height: 0,
      imageCount: 0,
      decorCount: 0,
      decorFiles: [],
      hasCeremony: false,
      hasQr: false,
      hasAlbum: false,
      textSample: "",
      consoleMessages: [...new Set(consoleMessages)],
      failedRequests: [...new Set(failedRequests)],
      error: String(error).slice(0, 500),
    };
  } finally {
    await page.close();
  }
}

const results = [];
for (const { slug, route } of routes) {
  const localUrl = `http://localhost:3002/mau-thiep/${route}/demo`;
  const prodUrl = `https://chungdoi.com/vi/mau-thiep/${route}/demo`;
  const [local, prod] = await Promise.all([
    inspectPage(localUrl, `${outDir}/${route}-local.jpg`),
    inspectPage(prodUrl, `${outDir}/${route}-prod.jpg`),
  ]);

  const localSet = new Set(local.decorFiles);
  const prodSet = new Set(prod.decorFiles);
  const missingDecor = prod.decorFiles.filter((file) => !localSet.has(file));
  const extraDecor = local.decorFiles.filter((file) => !prodSet.has(file));
  const heightRatio = prod.height ? Number((local.height / prod.height).toFixed(2)) : 0;
  const seriousConsole = local.consoleMessages.filter((msg) => !msg.includes("THREE.Clock"));
  const bad =
    local.status !== 200 ||
    prod.status !== 200 ||
    !!local.error ||
    local.failedRequests.length > 0 ||
    seriousConsole.some((msg) => msg.startsWith("error:")) ||
    missingDecor.length > 0 ||
    heightRatio < 0.75 ||
    local.hasCeremony !== prod.hasCeremony ||
    local.hasQr !== prod.hasQr;

  const row = {
    slug,
    route,
    localStatus: local.status,
    prodStatus: prod.status,
    localDecor: local.decorCount,
    prodDecor: prod.decorCount,
    missingDecor,
    extraDecor,
    localHeight: local.height,
    prodHeight: prod.height,
    heightRatio,
    localSections: { ceremony: local.hasCeremony, qr: local.hasQr, album: local.hasAlbum },
    prodSections: { ceremony: prod.hasCeremony, qr: prod.hasQr, album: prod.hasAlbum },
    localConsole: seriousConsole,
    localFailed: local.failedRequests,
    localError: local.error,
    prodError: prod.error,
    screenshots: {
      local: `${outDir}/${route}-local.jpg`,
      prod: `${outDir}/${route}-prod.jpg`,
    },
    bad,
  };
  results.push(row);
  console.log(`${bad ? "BAD" : "OK "} ${route} decor ${local.decorCount}/${prod.decorCount} height ${local.height}/${prod.height} sections local=${JSON.stringify(row.localSections)} prod=${JSON.stringify(row.prodSections)} failed=${local.failedRequests.length}`);
}

await browser.close();

writeFileSync(`${outDir}/results.json`, JSON.stringify(results, null, 2));
console.log("\nSUMMARY");
console.table(results.map((row) => ({
  route: row.route,
  status: `${row.localStatus}/${row.prodStatus}`,
  decor: `${row.localDecor}/${row.prodDecor}`,
  missing: row.missingDecor.length,
  extra: row.extraDecor.length,
  height: `${row.localHeight}/${row.prodHeight}`,
  ratio: row.heightRatio,
  ceremony: `${row.localSections.ceremony}/${row.prodSections.ceremony}`,
  qr: `${row.localSections.qr}/${row.prodSections.qr}`,
  failed: row.localFailed.length,
  bad: row.bad,
})));
console.log(`bad=${results.filter((row) => row.bad).length}`);
console.log(`${outDir}/results.json`);
