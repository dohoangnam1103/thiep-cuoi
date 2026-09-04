import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const component = (name: string) => readFileSync(
  join(process.cwd(), "src/components", name),
  "utf8",
);

const templatesWithInternalCeremonies = [
  ["chungdoi-tpl-boho-floral-brown.tsx", "data-boho-ceremonies"],
  ["chungdoi-tpl-dragon-phoenix.tsx", "data-dragon-phoenix-ceremonies"],
  ["chungdoi-tpl-dragon-phoenix-v3-red.tsx", "data-dragon-phoenix-v3-ceremonies"],
  ["chungdoi-tpl-minimalism-dark-red.tsx", "data-minimalism-dark-red-ceremonies"],
] as const;

test("templates with native ceremony layouts render every stored ceremony", () => {
  for (const [file, marker] of templatesWithInternalCeremonies) {
    const source = component(file);
    assert.match(source, /invitationCeremonies\(content\)/, file);
    assert.match(source, /ceremonies\.map/, file);
    assert.match(source, new RegExp(marker), file);
    assert.match(source, /formatDate\(ceremony\.date\)/, file);
  }
});

test("the generic post-template ceremony card stays off for native layouts", () => {
  const source = component("chungdoi-demo.tsx");

  for (const slug of [
    "song-hy-red",
    "song-hy-green",
    "boho-floral-brown",
    "dragon-phoenix-red",
    "dragon-phoenix-v3-red",
    "minimalism-dark-red",
  ]) {
    assert.match(source, new RegExp(`"${slug}"`));
  }
  assert.match(source, /!isPhysicalExperience && !rendersCeremoniesInsideTemplate/);
});
