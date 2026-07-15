#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "src/data/chungdoi.ts");
const DEFAULT_SERVER_URL = "http://127.0.0.1:3000";
const MANAGED_SERVER_URL = "http://127.0.0.1:3200";
const CAPTURE_WIDTH = 384;
const CAPTURE_HEIGHT = 844;
const MIN_PREVIEW_HEIGHT = 1_200;
const WEBP_QUALITY = Number(process.env.CAPTURE_QUALITY ?? 84);
const VERBOSE = process.env.CAPTURE_VERBOSE === "1";

function readOption(name) {
  const exactIndex = process.argv.indexOf(name);
  if (exactIndex >= 0) return process.argv[exactIndex + 1];
  const inline = process.argv.find((value) => value.startsWith(`${name}=`));
  return inline?.slice(name.length + 1);
}

function printHelp() {
  console.log(`Tạo lại ảnh preview toàn trang cho các mẫu thiệp.

Usage:
  npm run screenshots:templates
  npm run screenshots:templates -- --slug song-hy-red
  npm run screenshots:templates -- --slug song-hy-red,song-hy-green --no-write

Options:
  --slug <ids>  Chỉ chụp một hoặc nhiều source slug, phân cách bằng dấu phẩy
  --no-write    Kiểm tra quy trình nhưng không ghi đè ảnh hiện tại
  --help        Hiện hướng dẫn

Environment:
  CAPTURE_BASE_URL  Dùng server có sẵn thay vì tự khởi động Next.js
  CAPTURE_QUALITY   Chất lượng WebP, mặc định 84
  CAPTURE_VERBOSE=1 Hiện log của Next.js server
  CHROME_PATH       Đường dẫn Chrome/Chromium tùy chỉnh`);
}

function parseCatalog(source) {
  const completedBlock = source.match(
    /completedTemplateSlugs = new Set<string>\(\[([\s\S]*?)\]\)/,
  )?.[1];
  const vietnameseBlock = source.match(
    /vietnameseTemplateSlugs = \[([\s\S]*?)\] as const/,
  )?.[1];

  if (!completedBlock || !vietnameseBlock) {
    throw new Error("Không đọc được danh sách template từ src/data/chungdoi.ts");
  }

  const completedSlugs = [...completedBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  const routeBySlug = new Map(
    [...vietnameseBlock.matchAll(/\["([^"]+)",\s*"([^"]+)"\]/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
  const listingBySlug = new Map(
    [...source.matchAll(/\{\s*"slug":\s*"([^"]+)"[\s\S]*?"listing":\s*"([^"]+)"/g)].map(
      (match) => [match[1], match[2]],
    ),
  );

  return completedSlugs.map((slug) => {
    const listing = listingBySlug.get(slug);
    const route = routeBySlug.get(slug);
    if (!listing || !route) throw new Error(`Thiếu route hoặc listing asset cho template ${slug}`);
    return { slug, route, listing };
  });
}

async function serverIsReady(baseUrl) {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(2_000) });
    return response.status < 500;
  } catch {
    return false;
  }
}

function captureServerOutput(child) {
  const lines = [];
  const collect = (chunk) => {
    const text = chunk.toString();
    if (VERBOSE) process.stdout.write(text);
    lines.push(...text.split(/\r?\n/).filter(Boolean));
    if (lines.length > 40) lines.splice(0, lines.length - 40);
  };
  child.stdout?.on("data", collect);
  child.stderr?.on("data", collect);
  return lines;
}

async function waitForServer(baseUrl, child, output) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next.js server đã dừng trước khi sẵn sàng:\n${output.join("\n")}`);
    }
    if (await serverIsReady(baseUrl)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Next.js server không sẵn sàng sau 120 giây:\n${output.join("\n")}`);
}

async function resolveServer() {
  const explicitUrl = process.env.CAPTURE_BASE_URL?.replace(/\/$/, "");
  if (explicitUrl) {
    if (!(await serverIsReady(explicitUrl))) {
      throw new Error(`CAPTURE_BASE_URL không truy cập được: ${explicitUrl}`);
    }
    console.log(`Dùng server có sẵn: ${explicitUrl}`);
    return { baseUrl: explicitUrl, child: null };
  }

  if (await serverIsReady(DEFAULT_SERVER_URL)) {
    console.log(`Dùng server có sẵn: ${DEFAULT_SERVER_URL}`);
    return { baseUrl: DEFAULT_SERVER_URL, child: null };
  }
  if (await serverIsReady(MANAGED_SERVER_URL)) {
    console.log(`Dùng server có sẵn: ${MANAGED_SERVER_URL}`);
    return { baseUrl: MANAGED_SERVER_URL, child: null };
  }

  const nextBin = path.join(ROOT, "node_modules/next/dist/bin/next");
  console.log(`Khởi động Next.js tạm tại ${MANAGED_SERVER_URL}...`);
  const child = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", "127.0.0.1", "-p", "3200"],
    {
      cwd: ROOT,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const output = captureServerOutput(child);
  await waitForServer(MANAGED_SERVER_URL, child, output);
  return { baseUrl: MANAGED_SERVER_URL, child };
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function settleInvitation(page) {
  await page.addStyleTag({
    content: `
      html { scroll-behavior: auto !important; }
      html, body { overflow: visible !important; }
      main#top > audio,
      main#top > button.fixed { display: none !important; }
      * { caret-color: transparent !important; }
    `,
  });

  await page.evaluate(() => {
    document.querySelectorAll("audio, video").forEach((media) => media.pause());
    document.querySelectorAll("img").forEach((image) => {
      image.loading = "eager";
    });
    document.querySelectorAll("iframe").forEach((frame) => {
      frame.loading = "eager";
    });
    window.dispatchEvent(new Event("wheel"));
  });

  await page.evaluate(async () => {
    const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const root = document.documentElement;
    root.style.scrollBehavior = "auto";

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
  });

  const brokenImages = await page.evaluate(async () => {
    await document.fonts.ready;
    const images = [...document.images];
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
    return images
      .filter((image) => image.currentSrc && image.naturalWidth === 0)
      .map((image) => image.currentSrc);
  });
  if (brokenImages.length) {
    throw new Error(`Có ${brokenImages.length} ảnh không tải được:\n${brokenImages.join("\n")}`);
  }
}

async function rasterizeEmbeddedFrames(page) {
  const frames = page.locator("iframe");
  const count = await frames.count();
  for (let index = 0; index < count; index += 1) {
    const frame = frames.nth(index);
    await frame.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1_200);
    const png = await frame.screenshot({ animations: "disabled", type: "png" });
    const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
    await frame.evaluate((element, source) => {
      const image = document.createElement("img");
      image.src = source;
      image.alt = element.title || "Bản đồ địa điểm cưới";
      image.className = element.className;
      image.style.cssText = element.style.cssText;
      image.setAttribute("data-captured-iframe", "true");
      element.replaceWith(image);
    }, dataUrl);
  }

  if (count) {
    await page.evaluate(async () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      window.dispatchEvent(new Event("scroll"));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
  }
}

async function captureTemplate(browser, baseUrl, template, stagingDir) {
  const context = await browser.newContext({
    viewport: { width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT },
    deviceScaleFactor: 1,
    locale: "vi-VN",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    const url = `${baseUrl}/mau-thiep/${template.route}/demo?capture=1`;
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (!response?.ok()) throw new Error(`Trang demo trả về HTTP ${response?.status() ?? 0}: ${url}`);
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
    await page
      .locator('main#top[data-capture-mode="true"]')
      .waitFor({ state: "attached", timeout: 30_000 });
    await settleInvitation(page);
    const embeddedFrames = page.frames().filter((frame) => frame !== page.mainFrame());
    await Promise.all(
      embeddedFrames.map((frame) =>
        frame.waitForLoadState("load", { timeout: 15_000 }).catch(() => undefined),
      ),
    );
    await rasterizeEmbeddedFrames(page);
    await page.waitForTimeout(400);

    if (pageErrors.length) {
      throw new Error(`JavaScript lỗi khi render:\n${[...new Set(pageErrors)].join("\n")}`);
    }

    const png = await page.screenshot({ fullPage: true, animations: "disabled", type: "png" });
    const pngMetadata = await sharp(png).metadata();
    if (pngMetadata.width !== CAPTURE_WIDTH) {
      throw new Error(`Chiều rộng ảnh không hợp lệ: ${pngMetadata.width}px`);
    }
    if (!pngMetadata.height || pngMetadata.height < MIN_PREVIEW_HEIGHT) {
      throw new Error(`Chiều cao ảnh quá ngắn: ${pngMetadata.height ?? 0}px`);
    }

    const outputName = path.basename(template.listing);
    const stagedPath = path.join(stagingDir, outputName);
    await sharp(png)
      .webp({ quality: WEBP_QUALITY, effort: 6, smartSubsample: true })
      .toFile(stagedPath);

    const [metadata, file] = await Promise.all([sharp(stagedPath).metadata(), stat(stagedPath)]);
    if (metadata.format !== "webp" || metadata.width !== CAPTURE_WIDTH || file.size < 20_000) {
      throw new Error(`WebP đầu ra không hợp lệ: ${outputName}`);
    }

    return {
      slug: template.slug,
      route: template.route,
      outputName,
      stagedPath,
      height: metadata.height,
      size: file.size,
    };
  } finally {
    await context.close();
  }
}

async function installOutputs(results, templatesBySlug) {
  for (const result of results) {
    const template = templatesBySlug.get(result.slug);
    const outputPath = path.join(ROOT, "public", template.listing.replace(/^\//, ""));
    await mkdir(path.dirname(outputPath), { recursive: true });
    const pendingPath = `${outputPath}.capture-new`;
    await copyFile(result.stagedPath, pendingPath);
    await rename(pendingPath, outputPath);
  }
}

async function main() {
  if (process.argv.includes("--help")) {
    printHelp();
    return;
  }
  if (!Number.isInteger(WEBP_QUALITY) || WEBP_QUALITY < 1 || WEBP_QUALITY > 100) {
    throw new Error("CAPTURE_QUALITY phải là số nguyên từ 1 đến 100");
  }

  const source = await readFile(DATA_FILE, "utf8");
  const allTemplates = parseCatalog(source);
  const templatesBySlug = new Map(allTemplates.map((template) => [template.slug, template]));
  const requested = readOption("--slug")
    ?.split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
  const unknown = requested?.filter((slug) => !templatesBySlug.has(slug)) ?? [];
  if (unknown.length) throw new Error(`Template slug không hợp lệ: ${unknown.join(", ")}`);

  const targets = requested?.length
    ? requested.map((slug) => templatesBySlug.get(slug))
    : allTemplates;
  const writeOutputs = !process.argv.includes("--no-write");
  const stagingDir = await mkdtemp(path.join(os.tmpdir(), "chungdoi-template-previews-"));
  let managedServer = null;
  let browser = null;

  try {
    const server = await resolveServer();
    managedServer = server.child;

    const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    const executablePath = process.env.CHROME_PATH || (existsSync(macChrome) ? macChrome : undefined);
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

    console.log(`Chụp ${targets.length} mẫu ở ${CAPTURE_WIDTH}px, WebP quality ${WEBP_QUALITY}...`);
    const results = [];
    for (const [index, template] of targets.entries()) {
      process.stdout.write(`[${index + 1}/${targets.length}] ${template.slug}... `);
      const result = await captureTemplate(browser, server.baseUrl, template, stagingDir);
      results.push(result);
      console.log(`${result.height}px, ${(result.size / 1024).toFixed(0)} KB`);
    }

    if (writeOutputs) {
      await installOutputs(results, templatesBySlug);
      console.log(`Đã cập nhật ${results.length} ảnh trong public/chungdoi/images/template-previews/en/listing/.`);
    } else {
      console.log(`Đã kiểm tra ${results.length} ảnh; --no-write nên không ghi đè asset.`);
    }
  } finally {
    await browser?.close();
    await stopServer(managedServer);
    await rm(stagingDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`\n[capture-template-previews] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
