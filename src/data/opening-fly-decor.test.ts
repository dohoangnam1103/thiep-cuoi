import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";

/**
 * Lớp "bay ra" của decor bìa (`OpeningFlyDecor` và nhánh fly-out trong
 * `CoverCard`, xem src/components/chungdoi-demo.tsx) bọc ảnh trong một `div` mang
 * `cardImages[].className` rồi cho ảnh `class="block h-auto w-full"`.
 *
 * Cách đó chỉ đúng khi className chốt chiều RỘNG: div có bề rộng xác định nên
 * `w-full` của ảnh giải được. Nếu className chốt chiều CAO (`h-36 w-auto`) thì bề
 * rộng của div là shrink-to-fit quanh chính ảnh — vòng lặp — và ảnh bay ra to hơn
 * ảnh tĩnh gấp 1.6 đến 5 lần. Trên màn hình nó hiện thành cú zoom thô bạo lúc bấm
 * "Mở thiệp", còn build/typecheck/lint đều xanh, nên bug này chỉ lộ khi có người
 * ngồi xem. Đã sập hai lần: `crystal-floral-blue` và `minimalism-brown`.
 *
 * Escape hatch là class `envelope-fly-fit-height` trong globals.css: nó ép ảnh bay
 * đo theo chiều cao của wrapper.
 */
const FIT_HEIGHT_CLASS = "envelope-fly-fit-height";

/** Utility cho ra bề rộng XÁC ĐỊNH (không phụ thuộc nội dung). */
const DEFINITE_WIDTH =
  /^(w-\d+(\.\d+)?|w-\d+\/\d+|w-\[.+\]|w-full|w-screen|w-px|w-dvw|w-lvw|w-svw|size-\d+(\.\d+)?|size-\[.+\])$/;

/** Utility cho ra chiều cao XÁC ĐỊNH — điều kiện để `envelope-fly-fit-height` hoạt động. */
const DEFINITE_HEIGHT =
  /^(h-\d+(\.\d+)?|h-\d+\/\d+|h-\[.+\]|h-full|h-screen|h-dvh|h-lvh|h-svh|size-\d+(\.\d+)?|size-\[.+\])$/;

/**
 * Chỉ xét class ở breakpoint gốc: một `md:w-40` trần không chữa được trạng thái
 * mobile, mà mobile mới là nơi phần lớn khách mở thiệp.
 */
function baseTokens(className: string): string[] {
  return className.split(/\s+/).filter((token) => token.length > 0 && !token.includes(":"));
}

type FlyEntry = { slug: string; index: number; className: string };

const flyEntries: FlyEntry[] = Object.entries(chungdoiThemeConfig).flatMap(([slug, config]) =>
  config.decorations.cardImages
    .map((image, index) => ({ slug, index, className: image.className, flyOnOpen: image.flyOnOpen }))
    .filter((entry) => entry.flyOnOpen)
    .map(({ slug: s, index, className }) => ({ slug: s, index, className })),
);

test("mọi decor bìa bay lúc mở thiệp đều đo được kích thước", () => {
  assert.ok(flyEntries.length > 0, "không tìm thấy entry flyOnOpen nào — selector đã lệch?");

  const broken = flyEntries.filter((entry) => {
    const tokens = baseTokens(entry.className);
    if (tokens.includes(FIT_HEIGHT_CLASS)) return false;
    return !tokens.some((token) => DEFINITE_WIDTH.test(token));
  });

  assert.deepEqual(
    broken.map((entry) => `${entry.slug}[${entry.index}]`),
    [],
    `Các entry \`flyOnOpen\` sau không có bề rộng xác định ở breakpoint gốc, nên bản sao\n` +
      `bay ra sẽ phình to hơn ảnh tĩnh:\n` +
      broken.map((entry) => `  ${entry.slug}[${entry.index}]  ${entry.className}`).join("\n") +
      `\n\nChữa bằng một trong hai cách:\n` +
      `  1. Thêm \`${FIT_HEIGHT_CLASS}\` vào className (khi theme cố ý chốt chiều cao), hoặc\n` +
      `  2. Đổi \`w-auto\` thành bề rộng tường minh (\`w-[62px]\`, \`w-[38%]\`…).\n`,
  );
});

test("envelope-fly-fit-height cần chiều cao xác định mới có tác dụng", () => {
  const broken = flyEntries.filter((entry) => {
    const tokens = baseTokens(entry.className);
    if (!tokens.includes(FIT_HEIGHT_CLASS)) return false;
    return !tokens.some((token) => DEFINITE_HEIGHT.test(token));
  });

  assert.deepEqual(
    broken.map((entry) => `${entry.slug}[${entry.index}]`),
    [],
    `\`${FIT_HEIGHT_CLASS}\` đặt \`height: 100%\` cho ảnh bay, nên wrapper phải có chiều cao\n` +
      `xác định. Các entry sau thiếu:\n` +
      broken.map((entry) => `  ${entry.slug}[${entry.index}]  ${entry.className}`).join("\n"),
  );
});

test("class envelope-fly-fit-height vẫn còn trong globals.css", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(
    css,
    new RegExp(`\\.${FIT_HEIGHT_CLASS}\\s*>\\s*img`),
    `Không thấy rule \`.${FIT_HEIGHT_CLASS} > img\` trong globals.css. Nếu vừa đổi tên class\n` +
      `thì phải đổi cả FIT_HEIGHT_CLASS trong test này và className của các theme đang dùng.`,
  );
});
