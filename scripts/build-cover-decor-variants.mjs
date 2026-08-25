#!/usr/bin/env node
// Sinh bản decor ĐÚNG CỠ CHO BÌA từ ảnh gốc.
//
// Vì sao cần: ảnh trong `_decor/` được dùng ở hai nơi với hai cỡ rất khác nhau.
// Renderer thân thiệp phóng chúng gần full width (cần ~1200px), còn bìa chỉ vẽ ở
// 200–500px CSS. Bìa lại là đường chặn: `Envelope3D` phải tải xong ảnh rồi mới
// rasterize DOM thành texture, nên mỗi KB ở đây là thời gian người dùng nhìn màn
// hình trống. Ghi đè ảnh gốc thì thân thiệp mờ, nên sinh bản `-cover.webp` riêng.
//
// Cỡ đích = bề rộng CSS lớn nhất bìa vẽ ảnh × 2 (Envelope3D chụp ở pixelRatio 2).
// Cấp thêm pixel là vô nghĩa: bước rasterize sẽ bỏ đi.
//
// Chạy: node scripts/build-cover-decor-variants.mjs [--check]
// --check chỉ báo file thiếu/lệch cỡ, không ghi gì (dùng cho CI).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PIXEL_RATIO = 2;
const PUBLIC_DIR = "public";

/**
 * `cssWidth` là bề rộng CSS LỚN NHẤT mà bìa vẽ ảnh đó, đọc từ className trong
 * `src/data/chungdoi-theme-config.ts` (lấy mốc `md:` vì đó là mốc lớn nhất).
 */
const TARGETS = [
  {
    source: "/chungdoi/images/themes/_decor/longphung-v3-red/phung.webp",
    cssWidth: 320, // className: w-[230px] md:w-[320px]
  },
  {
    source: "/chungdoi/images/themes/_decor/longphung-v3-red/rong.webp",
    cssWidth: 320, // className: w-[230px] md:w-[320px]
  },
];

export function coverVariantPath(source) {
  const ext = path.extname(source);
  return `${source.slice(0, -ext.length)}-cover${ext}`;
}

const checkOnly = process.argv.includes("--check");
let failed = false;

for (const { source, cssWidth } of TARGETS) {
  const sourceFile = path.join(PUBLIC_DIR, source);
  const outputPath = coverVariantPath(source);
  const outputFile = path.join(PUBLIC_DIR, outputPath);

  if (!existsSync(sourceFile)) {
    console.error(`THIẾU ẢNH GỐC: ${source}`);
    failed = true;
    continue;
  }

  const meta = await sharp(sourceFile).metadata();
  // Không upscale: ảnh gốc nhỏ hơn đích thì giữ nguyên bề rộng gốc.
  const targetWidth = Math.min(meta.width, cssWidth * PIXEL_RATIO);

  if (checkOnly) {
    if (!existsSync(outputFile)) {
      console.error(`THIẾU BẢN BÌA: ${outputPath} (chạy lại script không có --check)`);
      failed = true;
      continue;
    }
    const outMeta = await sharp(outputFile).metadata();
    if (outMeta.width !== targetWidth) {
      console.error(`LỆCH CỠ: ${outputPath} rộng ${outMeta.width}px, cần ${targetWidth}px`);
      failed = true;
      continue;
    }
    console.log(`ok  ${outputPath} ${outMeta.width}x${outMeta.height}`);
    continue;
  }

  await mkdir(path.dirname(outputFile), { recursive: true });
  // alpha phải giữ: decor là hoa/rồng cắt nền, nền đục sẽ che mất chữ trên bìa.
  //
  // alphaQuality là tham số quyết định dung lượng ở đây, KHÔNG phải quality: mấy
  // ảnh này là hình cắt nền nên kênh alpha chiếm phần lớn byte. Đo trên
  // longphung-v3-red: quality 82→52 chỉ giảm 121→114KB, còn alphaQuality 80→70
  // giảm 108→68KB (libwebp đổi chế độ nén alpha ở ngưỡng này). Dưới 70 lãi ít.
  const buffer = await sharp(sourceFile)
    .resize({ width: targetWidth, withoutEnlargement: true })
    .webp({ quality: 78, alphaQuality: 70, effort: 6 })
    .toBuffer();
  await writeFile(outputFile, buffer);

  const before = (await readFile(sourceFile)).byteLength;
  const outMeta = await sharp(buffer).metadata();
  console.log(
    `${outputPath}\n  ${meta.width}x${meta.height} ${Math.round(before / 1024)}KB`
      + ` -> ${outMeta.width}x${outMeta.height} ${Math.round(buffer.byteLength / 1024)}KB`
      + ` (-${Math.round((1 - buffer.byteLength / before) * 100)}%)`,
  );
}

if (failed) process.exit(1);
