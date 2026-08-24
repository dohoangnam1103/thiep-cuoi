#!/usr/bin/env node
/**
 * Sinh bộ app icon từ một file logo nguồn duy nhất.
 *
 * Vì sao cần script này: trước đây favicon trỏ thẳng vào
 * `public/chungdoi/icon-v2.png` — 1254x1254 và 1.03 MB — nên mọi trang phải tải
 * hơn một megabyte chỉ để vẽ một ô 16px trên tab. Ở đây ta phát sinh sẵn đúng
 * các kích thước cần dùng rồi để Next tự gắn thẻ <link> qua quy ước file trong
 * `src/app/`, thay vì khai `icons` thủ công ở từng layout.
 *
 * Kích thước chọn theo hướng dẫn của Google: favicon nên là hình vuông có cạnh
 * là bội số của 48px. 96 = 48 x 2, đủ nét cho màn hình retina mà vẫn chỉ vài KB.
 *
 * Chạy lại khi logo đổi:  node scripts/generate-app-icons.mjs
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = path.join(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "public/chungdoi/icon-v2.png");
const APP_DIR = path.join(ROOT, "src/app");

/** Nền của logo. Dùng để phẳng hoá icon iOS — xem chú thích bên dưới. */
const BRAND_RED = { r: 149, g: 25, b: 28 };

/** Kích thước nhúng trong favicon.ico, đủ cho cả client cũ lẫn tab retina. */
const ICO_SIZES = [16, 32, 48];

function resize(size) {
  return sharp(SOURCE).resize(size, size, { kernel: "lanczos3", fit: "cover" });
}

/**
 * Gói nhiều PNG vào một file .ico.
 *
 * Định dạng ICO cho phép payload là PNG nguyên vẹn (từ Windows Vista trở đi),
 * nên chỉ cần dựng phần header rồi nối các PNG lại — không phải encode BMP.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved, luôn 0
  header.writeUInt16LE(1, 2); // 1 = icon (2 sẽ là con trỏ chuột)
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // 0 nghĩa là 256
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // không dùng bảng màu
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

async function main() {
  const source = await sharp(SOURCE).metadata();
  console.log(`nguồn: ${path.relative(ROOT, SOURCE)} — ${source.width}x${source.height}`);

  const outputs = [];

  // Favicon chính. Next đọc kích thước thật của file để tự điền sizes/type.
  const icon = await resize(96).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(path.join(APP_DIR, "icon.png"), icon);
  outputs.push(["src/app/icon.png", "96x96", icon.length]);

  // iOS bỏ qua alpha và ghép ảnh lên nền đen, nên bốn góc trong suốt của logo sẽ
  // thành viền đen lởm chởm dưới lớp mask bo góc của hệ thống. Phẳng hoá lên nền
  // đỏ thương hiệu để iOS tự bo góc trên một khối màu liền.
  const appleIcon = await resize(180)
    .flatten({ background: BRAND_RED })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(APP_DIR, "apple-icon.png"), appleIcon);
  outputs.push(["src/app/apple-icon.png", "180x180", appleIcon.length]);

  // Nhiều crawler và công cụ cũ vẫn gọi thẳng /favicon.ico bất kể thẻ <link>.
  const icoImages = [];
  for (const size of ICO_SIZES) {
    icoImages.push({ size, data: await resize(size).png({ compressionLevel: 9 }).toBuffer() });
  }
  const ico = buildIco(icoImages);
  await writeFile(path.join(APP_DIR, "favicon.ico"), ico);
  outputs.push(["src/app/favicon.ico", ICO_SIZES.join("/"), ico.length]);

  console.log("\nđã ghi:");
  let total = 0;
  for (const [file, dims, bytes] of outputs) {
    total += bytes;
    console.log(`  ${file.padEnd(28)} ${dims.padEnd(9)} ${(bytes / 1024).toFixed(1)} KB`);
  }
  console.log(`  ${"tổng".padEnd(28)} ${"".padEnd(9)} ${(total / 1024).toFixed(1)} KB`);
}

await main();
