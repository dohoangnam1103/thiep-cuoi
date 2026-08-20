import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/components/chungdoi-tpl-elegant-leaf-green.tsx"),
  "utf8",
);

test("Elegant Leaf sizes desktop names by trimmed length", () => {
  assert.match(source, /function desktopNameSizeClass\(name: string\)/);
  assert.match(source, /if \(length <= 14\) return "md:text-\[58px\]";/);
  assert.match(source, /if \(length <= 20\) return "md:text-\[52px\]";/);
  assert.match(source, /return "md:text-\[46px\]";/);
});

test("Elegant Leaf keeps name wrapping mobile-only", () => {
  assert.match(
    source,
    /w-\[80%\][^"`]*text-\[42px\][^"`]*md:w-full[^"`]*md:whitespace-nowrap/,
  );
  assert.match(source, /desktopNameSizeClass\(people\[0\]\.fullName\)/);
  assert.match(source, /desktopNameSizeClass\(people\[1\]\.fullName\)/);
});
