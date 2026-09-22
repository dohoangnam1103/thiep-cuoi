import assert from "node:assert/strict";
import test from "node:test";

import { templatePreviewVersion } from "@/data/template-preview-version";

import { templateFullPreviewUrl } from "./template-preview-url";

const version = `?v=${templatePreviewVersion}`;

test("derives the full-page PNG from the listing asset name", () => {
  assert.equal(
    templateFullPreviewUrl("/chungdoi/images/template-previews/en/listing/song_hy_red.webp"),
    `/chungdoi/images/template-previews/en/png/song_hy_red.png${version}`,
  );
});

test("keeps a listing-only suffix instead of assuming the landscape stem", () => {
  // Regression: dragon-phoenix-red's listing is `dragon_phoenix_red_480.webp`
  // while its landscape is `dragon_phoenix_red.webp`. Deriving the PNG from the
  // landscape requested `dragon_phoenix_red.png`, which the capture pipeline
  // never writes, so the SEO detail hero rendered a 404.
  assert.equal(
    templateFullPreviewUrl("/chungdoi/images/template-previews/en/listing/dragon_phoenix_red_480.webp"),
    `/chungdoi/images/template-previews/en/png/dragon_phoenix_red_480.png${version}`,
  );
});
