import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Đọc kích thước thật của ảnh preview trong `/public`.
 *
 * Tự parse header WebP thay vì gọi `sharp`: chỉ cần 32 byte đầu file là biết
 * được kích thước, không phải nạp native module và không giải nén ảnh 9000px.
 * Ảnh preview đủ lớn để việc decode nguyên tấm từng làm sập tab trình duyệt
 * (xem memory `project_preview_image_memory`), nên đọc header là lựa chọn đúng
 * cả về bộ nhớ.
 *
 * Kết quả cache theo tiến trình. Ảnh preview chỉ đổi khi chạy lại script chụp
 * screenshot, tức là kèm restart server, nên cache không bao giờ cũ.
 */
const sizeCache = new Map<string, { width: number; height: number }>();

/** Kích thước dùng khi không đọc được file, để trang không bao giờ vỡ vì một
 *  ảnh thiếu. 768 là bề ngang chuẩn của mọi screenshot preview trong repo. */
const FALLBACK = { width: 768, height: 1024 } as const;

function readWebpSize(buffer: Buffer): { width: number; height: number } | null {
  // RIFF....WEBP
  if (buffer.length < 30) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WEBP") return null;

  const format = buffer.toString("ascii", 12, 16);

  if (format === "VP8X") {
    // Canvas size là 24-bit little-endian, lưu dạng (giá trị - 1).
    const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
    const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
    return { width, height };
  }

  if (format === "VP8 ") {
    // Dữ liệu chunk bắt đầu ở offset 20. Bố cục keyframe header:
    //   20..22  frame tag (3 byte)
    //   23..25  sync code 0x9d 0x01 0x2a
    //   26..27  width  (14 bit thấp của uint16 LE)
    //   28..29  height (14 bit thấp của uint16 LE)
    const sync = 23;
    if (buffer[sync] !== 0x9d || buffer[sync + 1] !== 0x01 || buffer[sync + 2] !== 0x2a) {
      return null;
    }
    const width = buffer.readUInt16LE(sync + 3) & 0x3fff;
    const height = buffer.readUInt16LE(sync + 5) & 0x3fff;
    return { width, height };
  }

  if (format === "VP8L") {
    // 14-bit width rồi 14-bit height, đều lưu dạng (giá trị - 1), sau 1 byte signature.
    const bits = buffer.readUInt32LE(21);
    const width = 1 + (bits & 0x3fff);
    const height = 1 + ((bits >> 14) & 0x3fff);
    return { width, height };
  }

  return null;
}

function readPngSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  if (buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export async function publicImageSize(
  publicPath: string,
): Promise<{ width: number; height: number }> {
  const cached = sizeCache.get(publicPath);
  if (cached) return cached;

  const relative = publicPath.split("?")[0].replace(/^\/+/, "");
  const file = path.join(process.cwd(), "public", relative);

  let size: { width: number; height: number } | null = null;
  try {
    const handle = await fs.open(file, "r");
    try {
      const buffer = Buffer.alloc(64);
      await handle.read(buffer, 0, 64, 0);
      size = readWebpSize(buffer) ?? readPngSize(buffer);
    } finally {
      await handle.close();
    }
  } catch {
    size = null;
  }

  const resolved = size ?? FALLBACK;
  sizeCache.set(publicPath, resolved);
  return resolved;
}
