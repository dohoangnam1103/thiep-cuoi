import assert from "node:assert/strict";
import test from "node:test";

import { staticAlternates, templateAlternates } from "./seo";

test("uses a self-referencing canonical for every locale", () => {
  const vietnamese = staticAlternates("/templates", "vi");
  const english = staticAlternates("/templates", "en");

  assert.equal(vietnamese.canonical, "/mau-thiep");
  assert.equal(english.canonical, "/en/templates");
  assert.equal(english.languages.vi, "/mau-thiep");
  assert.equal(english.languages.en, "/en/templates");
  assert.equal(english.languages["x-default"], "/mau-thiep");
});

test("keeps localized template slugs in canonical and hreflang links", () => {
  const alternates = templateAlternates("dragon-phoenix-v2-red", "en");

  assert.ok(alternates);
  assert.equal(alternates.canonical, "/en/templates/dragon-phoenix-v2-red/demo");
  assert.equal(alternates.languages.vi, "/mau-thiep/long-phung-v2-do/demo");
});
