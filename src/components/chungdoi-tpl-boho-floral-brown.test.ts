import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/components/chungdoi-tpl-boho-floral-brown.tsx"),
  "utf8",
);

const fullNameTags = source.match(/<h3[^>]*>\s*\{people\[[01]\]\.fullName\}/g) ?? [];

test("Boho Floral Brown lets the full names inherit the body font", () => {
  // Tên đầy đủ phải cùng font với tên ba mẹ do FamilyColumn render, mà
  // FamilyColumn không khai font -> thẻ tên cũng không được khai font.
  assert.equal(fullNameTags.length, 2);
  for (const tag of fullNameTags) {
    assert.doesNotMatch(tag, /style=/);
    assert.doesNotMatch(tag, /font-(art-|qellia|serif|sans)/);
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
