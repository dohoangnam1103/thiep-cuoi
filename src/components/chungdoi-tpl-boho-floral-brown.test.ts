import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/components/chungdoi-tpl-boho-floral-brown.tsx"),
  "utf8",
);

const fullNameTags = source.match(/<h3[^>]*>\s*\{people\[[01]\]\.fullName\}/g) ?? [];

test("Boho Floral Brown sets the couple names in EB Garamond like the source card", () => {
  // Thẻ gốc trên chungdoi.com đặt tên đầy đủ bằng EB Garamond 40px (xem
  // docs/research/couple-name-fonts.json). Trước đây để tên thừa hưởng font body
  // sans của thẻ, nên nhìn khác hẳn bản gốc.
  assert.equal(fullNameTags.length, 2);
  for (const tag of fullNameTags) {
    assert.match(tag, /font-couple-garamond/);
    // Font đặt bằng class, không bằng inline style — inline style sẽ đè class.
    assert.doesNotMatch(tag, /fontFamily/);
  }
});

test("Boho Floral Brown keeps the full names inside the frame", () => {
  // Không nowrap và cỡ chữ hạ: font body rộng hơn script nên tên 4 từ
  // ở khổ 360px sẽ tràn nếu giữ cỡ cũ.
  for (const tag of fullNameTags) {
    assert.doesNotMatch(tag, /whitespace-nowrap/);
    assert.match(tag, /text-\[30px\][^"`]*md:text-\[40px\]/);
  }
  assert.doesNotMatch(source, /desktopNameSizeClass/);
});
