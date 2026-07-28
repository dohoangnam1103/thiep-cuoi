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

const groupCAndD = [
  "elegant-leaf-green",
  "boho-floral-green",
  "boho-floral-pink",
  "boho-floral-brown",
  "jasmine-white",
  "silk-flora-brown",
  "brocade-flower-red",
  "crystal-floral-blue",
  "glass-garden-green",
  "spring-garden-green",
  "spring-garden-red",
  "spring-garden-blue",
  "chateau-blue",
  "chateau-green",
  "baroque-gold",
  "qasr-green",
  "qasr-gold",
] as const;

test("groups C and D use responsive natural sizing", () => {
  for (const slug of groupCAndD) {
    assert.equal(envelopeSizingForTemplate(slug), "responsive-natural", slug);
  }
});

const groupE = [
  "chibi-red",
  "minimalism-red",
  "maroon-love",
  "editorial-noir",
  "ticket-terracotta",
  "zen-sand",
  "arch-sage",
] as const;

test("group E uses responsive natural sizing", () => {
  for (const slug of groupE) {
    assert.equal(envelopeSizingForTemplate(slug), "responsive-natural", slug);
  }
});

// Khóa coverage: một template mới thêm vào registry mà chưa qua policy sẽ fail
// ngay tại đây, thay vì âm thầm quay về kích thước cũ 340px/3:4.5.
test("every registered invitation uses responsive natural sizing", () => {
  for (const [sourceSlug] of vietnameseTemplateSlugs) {
    assert.equal(
      envelopeSizingForTemplate(sourceSlug),
      "responsive-natural",
      sourceSlug,
    );
  }
});
