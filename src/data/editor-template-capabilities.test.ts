import assert from "node:assert/strict";
import test from "node:test";

import {
  heroImageCount,
  templateSupportsHeroImage,
  templateSupportsZodiac,
} from "./editor-template-capabilities";

const MINIMALISM_TEMPLATE_SLUGS = [
  "minimalism-dark-red",
  "minimalism-purple",
  "minimalism-brown",
  "minimalism-jade",
  "minimalism-sky-blue",
  "minimalism-powder-pink",
] as const;

test("only the Thập Nhị Chi template exposes zodiac editor fields", () => {
  assert.equal(templateSupportsZodiac("thap-nhi-chi-do"), true);
  assert.equal(templateSupportsZodiac("double-phoenix-red"), false);
  assert.equal(templateSupportsZodiac("double-phoenix-green"), false);
  assert.equal(templateSupportsZodiac("unknown-template"), false);
});

test("Minimalism templates expose one dedicated opening image field", () => {
  for (const slug of MINIMALISM_TEMPLATE_SLUGS) {
    assert.equal(templateSupportsHeroImage(slug), true, slug);
    assert.equal(heroImageCount(slug), 1, slug);
  }
});
