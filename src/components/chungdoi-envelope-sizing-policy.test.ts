import assert from "node:assert/strict";
import test from "node:test";

import { vietnameseTemplateSlugs } from "@/data/template-route-slugs";
import {
  envelopeSizingForTemplate,
  responsiveEnvelopeTemplateSlugs,
} from "./chungdoi-envelope-sizing-policy";

test("keeps the approved cherry blossom template responsive", () => {
  assert.equal(envelopeSizingForTemplate("cherry-blossom-pink"), "responsive-natural");
});

test("keeps unknown templates on the safe fixed fallback", () => {
  assert.equal(envelopeSizingForTemplate("unknown-template"), "fixed");
});

test("responsive rollout contains only registered source slugs", () => {
  const registered = new Set<string>(vietnameseTemplateSlugs.map(([sourceSlug]) => sourceSlug));
  for (const slug of responsiveEnvelopeTemplateSlugs) {
    assert.equal(registered.has(slug), true, `unregistered responsive slug: ${slug}`);
  }
});

const groupAAndB = [
  "song-hy-red",
  "song-hy-green",
  "double-dragon-red",
  "double-dragon-green",
  "double-dragon-blue",
  "double-phoenix-red",
  "double-phoenix-green",
  "dragon-phoenix-red",
  "dragon-phoenix-green",
  "dragon-phoenix-v3-red",
  "dragon-phoenix-v2-red",
  "dragon-phoenix-blue",
  "dragon-phoenix-black",
  "royal-red",
  "royal-blue",
  "royal-green",
  "nhat-binh-red",
  "hoa-tinh-red",
  "co-ba-red",
] as const;

test("groups A and B use responsive natural sizing", () => {
  for (const slug of groupAAndB) {
    assert.equal(envelopeSizingForTemplate(slug), "responsive-natural", slug);
  }
});
