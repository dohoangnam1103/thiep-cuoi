import assert from "node:assert/strict";
import test from "node:test";

import { envelopeSizingForTemplate } from "./chungdoi-envelope-sizing-policy";

test("keeps the approved cherry blossom template responsive", () => {
  assert.equal(envelopeSizingForTemplate("cherry-blossom-pink"), "responsive-natural");
});

test("keeps unknown templates on the safe fixed fallback", () => {
  assert.equal(envelopeSizingForTemplate("unknown-template"), "fixed");
});
