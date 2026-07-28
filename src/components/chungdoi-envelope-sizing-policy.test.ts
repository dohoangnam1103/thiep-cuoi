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
