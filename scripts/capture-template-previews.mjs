#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import nextEnv from "@next/env";
import Database from "better-sqlite3";
import { SignJWT } from "jose";
import { chromium } from "playwright";
import sharp from "sharp";
import { rasterizeEmbeddedFrames, routeMapEmbedFallback } from "./lib/capture-embedded-frames.mjs";

const ROOT = process.cwd();
const { loadEnvConfig } = nextEnv;
loadEnvConfig(ROOT);

const DATA_FILE = path.join(ROOT, "src/data/chungdoi.ts");
const ROUTE_SLUGS_FILE = path.join(ROOT, "src/data/template-route-slugs.ts");
const RETIRED_SLUGS_FILE = path.join(ROOT, "src/data/retired-template-slugs.ts");
const TEMPLATE_MANIFESTS_DIR = path.join(ROOT, "src/data/templates");
const PREVIEW_VERSION_FILE = path.join(ROOT, "src/data/template-preview-version.ts");
const DEFAULT_SERVER_URL = "http://127.0.0.1:3000";
// Match Next's normalized rewrite hostname so next-intl rewrites stay internal.
const MANAGED_SERVER_URL = "http://localhost:3200";
const CAPTURE_WIDTH = 480;
const CAPTURE_HEIGHT = 844;
const CAPTURE_DEVICE_SCALE_FACTOR = 2;
const RAW_CAPTURE_WIDTH = CAPTURE_WIDTH * CAPTURE_DEVICE_SCALE_FACTOR;
const OUTPUT_WIDTH = 768;
const PORTRAIT_WIDTH = 750;
const PORTRAIT_HEIGHT = 1_333;
const LANDSCAPE_WIDTH = 2_400;
const LANDSCAPE_HEIGHT = 1_260;
const MIN_PREVIEW_HEIGHT = 1_200;
const PRODUCTION_TABLES = [
  "Invitation",
  "InvitationContent",
  "CeremonyItem",
  "ScheduleItem",
  "GalleryPhoto",
  "Wish",
];
const EDITOR_UPLOAD_FILENAME = /^[0-9a-f-]{36}\.webp$/;
const WEBP_QUALITY = Number(process.env.CAPTURE_QUALITY ?? 84);
const CAPTURE_CONCURRENCY = Number(process.env.CAPTURE_CONCURRENCY ?? 1);
const VERBOSE = process.env.CAPTURE_VERBOSE === "1";
const AUDIT_DIR = process.env.CAPTURE_AUDIT_DIR ? path.resolve(process.env.CAPTURE_AUDIT_DIR) : undefined;

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
  --slug <ids>          Chỉ chụp một hoặc nhiều source slug, phân cách bằng dấu phẩy
  --no-sync-production  Không đồng bộ demo và asset từ production
  --no-write            Dry-run capture, không đồng bộ production hoặc ghi đè ảnh
  --help                Hiện hướng dẫn

Environment:
  CAPTURE_BASE_URL             Dùng server có sẵn thay vì tự khởi động Next.js
  CAPTURE_QUALITY              Chất lượng WebP, mặc định 84
  CAPTURE_CONCURRENCY          Số mẫu chụp đồng thời, 1–4, mặc định 1
  CAPTURE_VERBOSE=1            Hiện log của Next.js server
  CAPTURE_AUDIT_DIR            Lưu ảnh từng bản đồ và báo cáo kiểm tra
  CAPTURE_PRODUCTION_HOST      SSH host production, mặc định root@163.223.9.198
  CAPTURE_PRODUCTION_APP_DIR   App production, mặc định /srv/thiepmungonline
  CAPTURE_SKIP_PRODUCTION_SYNC=1 Bỏ qua đồng bộ production
  CHROME_PATH                  Đường dẫn Chrome/Chromium tùy chỉnh`);
}

function parseCatalog(source, routeSource, manifestSources = []) {
  const completedBlock = source.match(
    /completedTemplateSlugs = new Set<string>\(\[([\s\S]*?)\]\)/,
  )?.[1];
  const vietnameseBlock = routeSource.match(
    /vietnameseTemplateSlugs = \[([\s\S]*?)\] as const/,
  )?.[1];

  if (!completedBlock || !vietnameseBlock) {
    throw new Error(
      "Không đọc được danh sách template từ src/data/chungdoi.ts hoặc src/data/template-route-slugs.ts",
    );
  }

  const completedSlugs = [...completedBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  const routeBySlug = new Map(
    [...vietnameseBlock.matchAll(/\["([^"]+)",\s*"([^"]+)"\]/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
  const assetsBySlug = new Map(
    [
      ...source.matchAll(
        /\{\s*"slug":\s*"([^"]+)"[\s\S]*?"listing":\s*"([^"]+)"[\s\S]*?"portrait":\s*"([^"]+)"[\s\S]*?"landscape":\s*"([^"]+)"/g,
      ),
    ].map((match) => [
      match[1],
      {
        listing: match[2],
        portrait: match[3],
        landscape: match[4],
      },
    ]),
  );

  for (const manifestSource of manifestSources) {
    const slug =
      manifestSource.match(/const slug = "([^"]+)";/)?.[1] ??
      manifestSource.match(/\bslug:\s*"([^"]+)"/)?.[1];
    const route = manifestSource.match(/viRouteSlug:\s*"([^"]+)"/)?.[1];
    if (!slug || !route) {
      throw new Error("Không đọc được slug hoặc viRouteSlug từ template manifest");
    }
    const previewStem = slug.replaceAll("-", "_");
    completedSlugs.push(slug);
    routeBySlug.set(slug, route);
    assetsBySlug.set(slug, {
      listing: `/chungdoi/images/template-previews/en/listing/${previewStem}.webp`,
      portrait: `/chungdoi/images/template-previews/en/portrait/${previewStem}.webp`,
      landscape: `/chungdoi/images/template-previews/en/landscape/${previewStem}.webp`,
    });
  }

  const templates = completedSlugs.map((slug) => {
    const assets = assetsBySlug.get(slug);
    const route = routeBySlug.get(slug);
    if (!assets || !route) {
      throw new Error(`Thiếu route hoặc preview asset cho template ${slug}`);
    }
    return { slug, route, ...assets };
  });

  for (const kind of ["listing", "portrait", "landscape"]) {
    const owners = new Map();
    for (const template of templates) {
      const existingOwner = owners.get(template[kind]);
      if (existingOwner) {
        throw new Error(
          `${kind} asset dùng chung giữa ${existingOwner} và ${template.slug}: ${template[kind]}`,
        );
      }
      owners.set(template[kind], template.slug);
    }
  }

  return templates;
}

/**
 * Slug của các mẫu đã rút khỏi catalog — cả slug nguồn và slug route tiếng Việt.
 *
 * next.config.ts 301 mọi URL `/mau-thiep/<slug>` và `/mau-thiep/<slug>/demo` của
 * nhóm này về trang danh sách, nên trang demo không còn tồn tại để chụp: script
 * sẽ treo ở `waitFor(main#top[data-capture-mode])` rồi timeout. Manifest của
 * chúng vẫn nằm trong src/data/templates nên phải lọc theo danh sách này.
 */
function parseRetiredSlugs(routeSource, catalogSource) {
  const block = routeSource.match(/retiredTemplateRouteSlugs = \[([\s\S]*?)\] as const/)?.[1];
  const catalogBlock = catalogSource.match(/retiredTemplateSlugs = new Set<string>\(\[([\s\S]*?)\]\)/)?.[1];
  if (!block || !catalogBlock) {
    throw new Error("Không đọc được danh sách mẫu đã rút từ src/data/retired-template-slugs.ts");
  }
  // Some retired demos return 404 directly rather than using a redirect entry.
  return new Set([...`${block}\n${catalogBlock}`.matchAll(/"([^"]+)"/g)].map((match) => match[1]));
}

function runProcess(command, args, { input, cwd = ROOT } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];

    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code) => {
      const output = Buffer.concat(stdout).toString("utf8");
      const errorOutput = Buffer.concat(stderr).toString("utf8");
      if (code === 0) {
        resolve({ output, errorOutput });
        return;
      }
      reject(
        new Error(
          `${command} dừng với mã ${code}${errorOutput ? `:\n${errorOutput.trim()}` : ""}`,
        ),
      );
    });

    child.stdin.end(input);
  });
}

function localDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Đồng bộ production chỉ hỗ trợ DATABASE_URL SQLite dạng file:");
  }

  const rawPath = decodeURIComponent(databaseUrl.slice("file:".length).split("?")[0]);
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(ROOT, rawPath);
}

function productionConnectionConfig() {
  const host = process.env.CAPTURE_PRODUCTION_HOST ?? "root@163.223.9.198";
  const appDir =
    process.env.CAPTURE_PRODUCTION_APP_DIR ?? "/srv/thiepmungonline";
  if (!/^[a-zA-Z0-9._@-]+$/.test(host)) {
    throw new Error("CAPTURE_PRODUCTION_HOST chứa ký tự không hợp lệ");
  }
  if (!/^\/[a-zA-Z0-9_./-]+$/.test(appDir)) {
    throw new Error("CAPTURE_PRODUCTION_APP_DIR phải là đường dẫn tuyệt đối an toàn");
  }
  return {
    host,
    appDir,
    databasePath: `${appDir}/data/prod.db`,
    uploadRoot: `${appDir}/data/editor-uploads`,
  };
}

async function exportProductionDemos(config) {
  const python = String.raw`
import json
import sqlite3
import sys

database_path = sys.argv[1]
connection = sqlite3.connect(f"file:{database_path}?mode=ro", uri=True)
connection.row_factory = sqlite3.Row
connection.execute("begin")

quick_check = connection.execute("pragma quick_check").fetchone()[0]
invitations = [
    dict(row)
    for row in connection.execute(
        "select * from Invitation where isDemo=1 order by templateId, id"
    )
]
invitation_ids = [row["id"] for row in invitations]

tables = {"Invitation": invitations}
child_tables = [
    "InvitationContent",
    "CeremonyItem",
    "ScheduleItem",
    "GalleryPhoto",
    "Wish",
]
if invitation_ids:
    placeholders = ",".join("?" for _ in invitation_ids)
    for table in child_tables:
        rows = connection.execute(
            f'select * from "{table}" where invitationId in ({placeholders}) '
            "order by invitationId, id",
            invitation_ids,
        )
        tables[table] = [dict(row) for row in rows]
else:
    for table in child_tables:
        tables[table] = []

print(
    json.dumps(
        {"quickCheck": quick_check, "tables": tables},
        ensure_ascii=False,
        separators=(",", ":"),
    )
)
`;
  const { output, errorOutput } = await runProcess(
    "ssh",
    [
      "-T",
      "-o",
      "BatchMode=yes",
      config.host,
      "python3",
      "-",
      config.databasePath,
    ],
    { input: python },
  );
  if (errorOutput && VERBOSE) process.stderr.write(errorOutput);

  let payload;
  try {
    payload = JSON.parse(output);
  } catch {
    throw new Error("Không đọc được JSON demo export từ production");
  }
  if (payload.quickCheck !== "ok") {
    throw new Error(`Production SQLite quick_check thất bại: ${payload.quickCheck}`);
  }
  if (!payload.tables || !Array.isArray(payload.tables.Invitation)) {
    throw new Error("Production demo export thiếu bảng Invitation");
  }
  if (payload.tables.Invitation.length === 0) {
    throw new Error("Production không có thiệp demo; từ chối xóa dữ liệu demo local");
  }
  for (const table of PRODUCTION_TABLES) {
    if (!Array.isArray(payload.tables[table])) {
      throw new Error(`Production demo export thiếu bảng ${table}`);
    }
  }
  return payload.tables;
}

function productionUploadFilenames(tables) {
  const urls = new Set();
  for (const content of tables.InvitationContent) {
    for (const value of [content.heroImage, content.heroImage2]) {
      if (typeof value === "string" && value.startsWith("/uploads/")) urls.add(value);
    }
  }
  for (const gallery of tables.GalleryPhoto) {
    if (typeof gallery.url === "string" && gallery.url.startsWith("/uploads/")) {
      urls.add(gallery.url);
    }
  }

  const filenames = [...urls]
    .map((url) => path.posix.basename(new URL(url, "https://production.local").pathname))
    .sort();
  const invalid = filenames.filter((filename) => !EDITOR_UPLOAD_FILENAME.test(filename));
  if (invalid.length) {
    throw new Error(`Production có tên upload không hợp lệ: ${invalid.join(", ")}`);
  }
  return filenames;
}

function tableColumns(database, table) {
  return database.prepare(`pragma table_info("${table}")`).all().map((column) => column.name);
}

function importProductionDemos(databasePath, tables) {
  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");

  try {
    const importTransaction = database.transaction(() => {
      let systemUser = database
        .prepare("select id from User where email = ?")
        .get("system@demo.local");
      if (!systemUser) {
        database
          .prepare(
            "insert into User (id, email, passwordHash, createdAt) values (?, ?, ?, ?)",
          )
          .run(
            "production-demo-sync-system",
            "system@demo.local",
            "",
            new Date().toISOString(),
          );
        systemUser = { id: "production-demo-sync-system" };
      }

      database.prepare("delete from Invitation where isDemo = 1").run();

      for (const table of PRODUCTION_TABLES) {
        const rows = tables[table];
        if (!rows.length) continue;
        const available = new Set(Object.keys(rows[0]));
        const columns = tableColumns(database, table).filter((column) =>
          available.has(column),
        );
        const quotedColumns = columns.map((column) => `"${column}"`).join(", ");
        const placeholders = columns.map(() => "?").join(", ");
        const statement = database.prepare(
          `insert into "${table}" (${quotedColumns}) values (${placeholders})`,
        );
        for (const row of rows) {
          statement.run(
            ...columns.map((column) =>
              table === "Invitation" && column === "userId"
                ? systemUser.id
                : row[column],
            ),
          );
        }
      }
    });

    importTransaction();

    for (const table of PRODUCTION_TABLES) {
      const where =
        table === "Invitation"
          ? "isDemo = 1"
          : "invitationId in (select id from Invitation where isDemo = 1)";
      const localCount = database
        .prepare(`select count(*) as count from "${table}" where ${where}`)
        .get().count;
      if (localCount !== tables[table].length) {
        throw new Error(
          `Số bản ghi ${table} không khớp: local=${localCount}, production=${tables[table].length}`,
        );
      }
    }

    const quickCheck = database.pragma("quick_check", { simple: true });
    if (quickCheck !== "ok") {
      throw new Error(`Local SQLite quick_check thất bại sau sync: ${quickCheck}`);
    }
  } finally {
    database.close();
  }
}

async function backupLocalDatabase(databasePath, backupPath) {
  const database = new Database(databasePath, { readonly: true });
  try {
    await database.backup(backupPath);
  } finally {
    database.close();
  }
}

async function restoreDownloadedAssets(filenames, existingFiles, localRoot, backupRoot) {
  for (const filename of filenames) {
    const localPath = path.join(localRoot, filename);
    if (existingFiles.has(filename)) {
      await copyFile(path.join(backupRoot, filename), localPath);
    } else {
      await rm(localPath, { force: true });
    }
  }
}

async function syncProductionDemos() {
  const config = productionConnectionConfig();
  console.log(`Đồng bộ demo production từ ${config.host}...`);
  const tables = await exportProductionDemos(config);
  const filenames = productionUploadFilenames(tables);
  const databasePath = localDatabasePath();
  if (!existsSync(databasePath)) {
    throw new Error(`Không tìm thấy SQLite local: ${databasePath}`);
  }

  const backupRoot = path.join(ROOT, "temp", "demo-sync-backups");
  await mkdir(backupRoot, { recursive: true });
  const backupDir = await mkdtemp(path.join(backupRoot, "capture-"));
  const uploadBackupRoot = path.join(backupDir, "editor-uploads");
  const localUploadRoot = path.join(ROOT, "data", "editor-uploads");
  const manifestPath = path.join(backupDir, "production-upload-manifest.txt");
  await Promise.all([
    mkdir(uploadBackupRoot, { recursive: true }),
    mkdir(localUploadRoot, { recursive: true }),
    backupLocalDatabase(databasePath, path.join(backupDir, "dev.db")),
    writeFile(manifestPath, filenames.length ? `${filenames.join("\n")}\n` : ""),
  ]);

  const existingFiles = new Set();
  for (const filename of filenames) {
    const localPath = path.join(localUploadRoot, filename);
    if (!existsSync(localPath)) continue;
    existingFiles.add(filename);
    await copyFile(localPath, path.join(uploadBackupRoot, filename));
  }

  try {
    if (filenames.length) {
      await runProcess(
        "rsync",
        [
          "-az",
          `--files-from=${manifestPath}`,
          `${config.host}:${config.uploadRoot}/`,
          `${localUploadRoot}/`,
        ],
      );
    }
    const missingUploads = filenames.filter(
      (filename) => !existsSync(path.join(localUploadRoot, filename)),
    );
    if (missingUploads.length) {
      throw new Error(
        `Thiếu ${missingUploads.length} upload production: ${missingUploads.join(", ")}`,
      );
    }

    importProductionDemos(databasePath, tables);
  } catch (error) {
    await restoreDownloadedAssets(
      filenames,
      existingFiles,
      localUploadRoot,
      uploadBackupRoot,
    );
    throw error;
  }

  console.log(
    `Đã đồng bộ ${tables.Invitation.length} demo, ${tables.GalleryPhoto.length} ảnh gallery và ${filenames.length} upload production.`,
  );
  console.log(`Backup local trước sync: ${path.relative(ROOT, backupDir)}`);
}

async function serverIsReady(baseUrl) {
  try {
    const response = await fetch(baseUrl, {
      signal: AbortSignal.timeout(2_000),
      redirect: "manual", // avoid throwing on redirect loops
    });
    // 3xx (opaque redirect) counts as server alive; only 5xx/network errors are not ready
    return response.status < 500 || response.type === "opaqueredirect";
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
    [nextBin, "dev", "--hostname", "localhost", "-p", "3200"],
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

async function createCaptureSessionCookie(baseUrl) {
  const base = new URL(baseUrl);
  const isLocal = base.hostname === "127.0.0.1" || base.hostname === "localhost";
  const secret = process.env.CAPTURE_SESSION_SECRET || (isLocal ? process.env.SESSION_SECRET : null);
  if (!secret) return null;

  const expiresAt = Math.floor(Date.now() / 1_000) + 60 * 60;
  const token = await new SignJWT({ userId: "template-preview-capture" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(new TextEncoder().encode(secret));

  return {
    name: "session",
    value: token,
    url: base.origin,
    httpOnly: true,
    secure: base.protocol === "https:",
    sameSite: "Lax",
    expires: expiresAt,
  };
}

async function settleInvitation(page) {
  await page.addStyleTag({
    content: `
      html { scroll-behavior: auto !important; }
      html, body { overflow: visible !important; }
      main#top > audio,
      main#top > button.fixed,
      nextjs-portal { display: none !important; }
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

async function captureTemplate(browser, baseUrl, template, stagingDir, sessionCookie) {
  const context = await browser.newContext({
    viewport: { width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT },
    deviceScaleFactor: CAPTURE_DEVICE_SCALE_FACTOR,
    locale: "vi-VN",
    reducedMotion: "reduce",
  });
  if (sessionCookie) await context.addCookies([sessionCookie]);
  await routeMapEmbedFallback(context);
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    const url = `${baseUrl}/mau-thiep/${template.route}/demo?capture=1&captureRun=${Date.now()}`;
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
    const embeddedFramesAudit = await rasterizeEmbeddedFrames(page, { auditDir: AUDIT_DIR, slug: template.slug });
    await page.waitForTimeout(400);

    if (pageErrors.length) {
      throw new Error(`JavaScript lỗi khi render:\n${[...new Set(pageErrors)].join("\n")}`);
    }

    const png = await page.screenshot({ fullPage: true, animations: "disabled", type: "png" });
    const pngMetadata = await sharp(png).metadata();
    if (pngMetadata.width !== RAW_CAPTURE_WIDTH) {
      throw new Error(`Chiều rộng ảnh chụp không hợp lệ: ${pngMetadata.width}px`);
    }
    if (!pngMetadata.height || pngMetadata.height < MIN_PREVIEW_HEIGHT) {
      throw new Error(`Chiều cao ảnh quá ngắn: ${pngMetadata.height ?? 0}px`);
    }

    const listingName = path.basename(template.listing);
    const portraitName = path.basename(template.portrait);
    const landscapeName = path.basename(template.landscape);
    const listingPath = path.join(stagingDir, "listing", listingName);
    const portraitPath = path.join(stagingDir, "portrait", portraitName);
    const landscapePath = path.join(stagingDir, "landscape", landscapeName);
    const pngPath = path.join(stagingDir, "png", listingName.replace(/\.webp$/, ".png"));
    await Promise.all([
      mkdir(path.dirname(listingPath), { recursive: true }),
      mkdir(path.dirname(portraitPath), { recursive: true }),
      mkdir(path.dirname(landscapePath), { recursive: true }),
      mkdir(path.dirname(pngPath), { recursive: true }),
    ]);
    await writeFile(pngPath, png);

    await sharp(png)
      .resize({ width: OUTPUT_WIDTH })
      .webp({ quality: WEBP_QUALITY, effort: 6, smartSubsample: true })
      .toFile(listingPath);
    await sharp(png)
      .resize({
        width: PORTRAIT_WIDTH,
        height: PORTRAIT_HEIGHT,
        fit: "cover",
        position: "top",
      })
      .webp({ quality: WEBP_QUALITY, effort: 6, smartSubsample: true })
      .toFile(portraitPath);
    await sharp(png)
      .resize({
        width: LANDSCAPE_WIDTH,
        height: LANDSCAPE_HEIGHT,
        fit: "cover",
        position: "top",
      })
      .webp({ quality: WEBP_QUALITY, effort: 6, smartSubsample: true })
      .toFile(landscapePath);

    const [
      listingMetadata,
      listingFile,
      portraitMetadata,
      portraitFile,
      landscapeMetadata,
      landscapeFile,
    ] = await Promise.all([
      sharp(listingPath).metadata(),
      stat(listingPath),
      sharp(portraitPath).metadata(),
      stat(portraitPath),
      sharp(landscapePath).metadata(),
      stat(landscapePath),
    ]);
    if (
      listingMetadata.format !== "webp" ||
      listingMetadata.width !== OUTPUT_WIDTH ||
      listingFile.size < 20_000
    ) {
      throw new Error(`Listing WebP đầu ra không hợp lệ: ${listingName}`);
    }
    if (
      portraitMetadata.format !== "webp" ||
      portraitMetadata.width !== PORTRAIT_WIDTH ||
      portraitMetadata.height !== PORTRAIT_HEIGHT ||
      portraitFile.size < 10_000
    ) {
      throw new Error(`Portrait WebP đầu ra không hợp lệ: ${portraitName}`);
    }
    if (
      landscapeMetadata.format !== "webp" ||
      landscapeMetadata.width !== LANDSCAPE_WIDTH ||
      landscapeMetadata.height !== LANDSCAPE_HEIGHT ||
      landscapeFile.size < 10_000
    ) {
      throw new Error(`Landscape WebP đầu ra không hợp lệ: ${landscapeName}`);
    }

    return {
      slug: template.slug,
      route: template.route,
      embeddedFrames: embeddedFramesAudit,
      height: listingMetadata.height,
      size: listingFile.size + portraitFile.size + landscapeFile.size,
      outputs: {
        png: { stagedPath: pngPath },
        listing: { stagedPath: listingPath },
        portrait: { stagedPath: portraitPath },
        landscape: { stagedPath: landscapePath },
      },
    };
  } finally {
    await context.close();
  }
}

async function installOutputs(results, templatesBySlug) {
  for (const result of results) {
    const template = templatesBySlug.get(result.slug);
    for (const kind of ["png", "listing", "portrait", "landscape"]) {
      const publicPath = kind === "png"
        ? template.listing.replace("/listing/", "/png/").replace(/\.webp$/, ".png")
        : template[kind];
      const outputPath = path.join(ROOT, "public", publicPath.replace(/^\//, ""));
      await mkdir(path.dirname(outputPath), { recursive: true });
      const pendingPath = `${outputPath}.capture-new`;
      await copyFile(result.outputs[kind].stagedPath, pendingPath);
      await rename(pendingPath, outputPath);
    }
  }
}

async function updatePreviewVersion(results) {
  const hash = createHash("sha256");
  for (const result of [...results].sort((a, b) => a.slug.localeCompare(b.slug))) {
    hash.update(result.slug);
    for (const kind of ["listing", "portrait", "landscape"]) {
      hash.update(await readFile(result.outputs[kind].stagedPath));
    }
  }

  const version = hash.digest("hex").slice(0, 16);
  const pendingPath = `${PREVIEW_VERSION_FILE}.capture-new`;
  await writeFile(
    pendingPath,
    `// Auto-generated by scripts/capture-template-previews.mjs.\nexport const templatePreviewVersion = "${version}";\n`,
  );
  await rename(pendingPath, PREVIEW_VERSION_FILE);
  return version;
}

async function main() {
  if (process.argv.includes("--help")) {
    printHelp();
    return;
  }
  if (!Number.isInteger(WEBP_QUALITY) || WEBP_QUALITY < 1 || WEBP_QUALITY > 100) {
    throw new Error("CAPTURE_QUALITY phải là số nguyên từ 1 đến 100");
  }
  if (!Number.isInteger(CAPTURE_CONCURRENCY) || CAPTURE_CONCURRENCY < 1 || CAPTURE_CONCURRENCY > 4) {
    throw new Error("CAPTURE_CONCURRENCY phải là số nguyên từ 1 đến 4");
  }

  const manifestFileNames = (await readdir(TEMPLATE_MANIFESTS_DIR))
    .filter((fileName) => fileName.endsWith(".manifest.ts"))
    .sort((a, b) => a.localeCompare(b));
  const [source, routeSource, retiredSource, ...manifestSources] = await Promise.all([
    readFile(DATA_FILE, "utf8"),
    readFile(ROUTE_SLUGS_FILE, "utf8"),
    readFile(RETIRED_SLUGS_FILE, "utf8"),
    ...manifestFileNames.map((fileName) =>
      readFile(path.join(TEMPLATE_MANIFESTS_DIR, fileName), "utf8"),
    ),
  ]);
  const allTemplates = parseCatalog(source, routeSource, manifestSources);
  const retiredSlugs = parseRetiredSlugs(retiredSource, source);
  const isRetired = (template) =>
    retiredSlugs.has(template.slug) || retiredSlugs.has(template.route);
  const liveTemplates = allTemplates.filter((template) => !isRetired(template));
  const templatesBySlug = new Map(allTemplates.map((template) => [template.slug, template]));
  const requested = readOption("--slug")
    ?.split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
  const unknown = requested?.filter((slug) => !templatesBySlug.has(slug)) ?? [];
  if (unknown.length) throw new Error(`Template slug không hợp lệ: ${unknown.join(", ")}`);
  const retiredRequested =
    requested?.filter((slug) => isRetired(templatesBySlug.get(slug))) ?? [];
  if (retiredRequested.length) {
    throw new Error(
      `Mẫu đã rút khỏi catalog nên trang demo 301 về /mau-thiep, không chụp được: ${retiredRequested.join(", ")}`,
    );
  }

  const targets = requested?.length
    ? requested.map((slug) => templatesBySlug.get(slug))
    : liveTemplates;
  const retiredCount = allTemplates.length - liveTemplates.length;
  if (!requested?.length && retiredCount) {
    console.log(`Bỏ qua ${retiredCount} mẫu đã rút khỏi catalog.`);
  }
  const writeOutputs = !process.argv.includes("--no-write");
  const skipProductionSync =
    process.argv.includes("--no-sync-production") ||
    process.env.CAPTURE_SKIP_PRODUCTION_SYNC === "1";
  const stagingDir = await mkdtemp(path.join(os.tmpdir(), "chungdoi-template-previews-"));
  let managedServer = null;
  let browser = null;

  try {
    if (writeOutputs && !skipProductionSync) {
      await syncProductionDemos();
    } else if (!writeOutputs) {
      console.log("Bỏ qua đồng bộ production vì đang chạy --no-write.");
    } else {
      console.log("Bỏ qua đồng bộ production theo cấu hình.");
    }

    const server = await resolveServer();
    managedServer = server.child;
    const sessionCookie = await createCaptureSessionCookie(server.baseUrl);

    const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    const executablePath = process.env.CHROME_PATH || (existsSync(macChrome) ? macChrome : undefined);
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

    console.log(
      `Chụp ${targets.length} mẫu ở viewport ${CAPTURE_WIDTH}px, xuất ${OUTPUT_WIDTH}px, WebP quality ${WEBP_QUALITY}...`,
    );
    const results = [];
    for (let offset = 0; offset < targets.length; offset += CAPTURE_CONCURRENCY) {
      const batch = await Promise.allSettled(
        targets.slice(offset, offset + CAPTURE_CONCURRENCY).map(async (template, index) => {
          const result = await captureTemplate(
            browser,
            server.baseUrl,
            template,
            stagingDir,
            sessionCookie,
          );
          console.log(`[${offset + index + 1}/${targets.length}] ${template.slug}: ${result.height}px, ${(result.size / 1024).toFixed(0)} KB`);
          return result;
        }),
      );
      // Let every context finish before cleanup if any capture fails.
      const failures = batch.filter((result) => result.status === "rejected");
      if (failures.length) {
        throw new Error(failures.map((result) => String(result.reason)).join("\n"));
      }
      results.push(...batch.map((result) => result.value));
    }

    if (AUDIT_DIR) {
      await mkdir(AUDIT_DIR, { recursive: true });
      await writeFile(path.join(AUDIT_DIR, "capture-audit.json"), JSON.stringify({
        baseUrl: server.baseUrl, capturedAt: new Date().toISOString(),
        templates: results.map(({ slug, route, height, embeddedFrames }) => ({ slug, route, height, embeddedFrames })),
      }, null, 2));
    }

    if (writeOutputs) {
      await installOutputs(results, templatesBySlug);
      const previewVersion = await updatePreviewVersion(results);
      console.log(
        `Đã cập nhật ${results.length} mẫu: PNG gốc trong png/ và WebP trong listing/, portrait/, landscape/ (version ${previewVersion}).`,
      );
    } else {
      console.log(
        `Đã kiểm tra ${results.length} mẫu (3 biến thể mỗi mẫu); --no-write nên không ghi đè asset.`,
      );
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
