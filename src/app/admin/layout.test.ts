import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const layoutSource = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");
const studioPage = new URL("./template-studio/page.tsx", import.meta.url);

test("admin navigation hides AI Studio while preserving its direct route", () => {
  assert.doesNotMatch(layoutSource, /href:\s*["']\/admin\/template-studio["']/);
  assert.doesNotMatch(layoutSource, /label:\s*["']AI Studio["']/);
  assert.equal(existsSync(studioPage), true);
});
