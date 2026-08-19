import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/components/chungdoi-tpl-comic-hero-assemble.tsx"),
  "utf8",
);

function section(startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing ${startMarker}`);
  assert.notEqual(end, -1, `missing ${endMarker}`);
  return source.slice(start, end);
}

test("cover codenames wrap and shrink instead of overflowing the 480px issue", () => {
  const lockup = section("{/* Codename lockup */}", "<BurstBadge");

  assert.match(lockup, /data-comic-cover-name/);
  assert.match(lockup, /break-words/);
  assert.match(lockup, /text-balance/);
  assert.match(lockup, /clamp\(/);
  assert.doesNotMatch(lockup, /text-\[42px\]/);
  assert.doesNotMatch(lockup, /md:text-\[64px\]/);
});

test("origin-story hero cards stack on mobile so names keep full width", () => {
  const origin = section("{/* ── ORIGIN STORY", "{/* ── TEAM-UP SPLASH");

  assert.match(origin, /flex-col/);
  assert.match(origin, /md:flex-row/);
});

test("hero card short names wrap inside the origin panel", () => {
  const card = section("function HeroCard(", "function SpeechBubble(");

  assert.match(card, /\{person\.shortName\}/);
  assert.match(card, /break-words/);
  assert.match(card, /text-balance/);
  assert.match(card, /clamp\(/);
});
