import assert from "node:assert/strict";
import test from "node:test";

import { vietnameseTemplateSlugs } from "@/data/template-route-slugs";
import {
  envelopeDecorOverflowForTemplate,
  overflowingEnvelopeDecorTemplateSlugs,
} from "./chungdoi-envelope-decor-policy";

test("audited envelope exceptions keep decorations outside the card", () => {
  for (const [sourceSlug] of vietnameseTemplateSlugs) {
    assert.equal(
      envelopeDecorOverflowForTemplate(sourceSlug),
      overflowingEnvelopeDecorTemplateSlugs.has(sourceSlug) ? "visible" : "clip",
      sourceSlug,
    );
  }
});

test("visible decoration exceptions are registered templates", () => {
  const registered = new Set<string>(
    vietnameseTemplateSlugs.map(([sourceSlug]) => sourceSlug),
  );

  for (const slug of overflowingEnvelopeDecorTemplateSlugs) {
    assert.equal(registered.has(slug), true, slug);
  }
});

test("unknown templates use the safe clipped fallback", () => {
  assert.equal(envelopeDecorOverflowForTemplate("unknown-template"), "clip");
});
