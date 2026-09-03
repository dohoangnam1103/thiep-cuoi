import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TemplateListingImage } from "./template-listing-image";
import thumbnails from "../data/listing-thumbnails.json";
import mobileThumbnails from "../data/listing-mobile-thumbnails.json";
import { completedTemplates } from "../data/chungdoi";

const props = {
  source: "/chungdoi/images/template-previews/en/listing/song_hy_red.webp",
  fallbackHeight: 7885,
  alt: "Song Hỷ Đỏ",
  slug: "song-hy-red",
  onSelect: () => {},
};

test("listing thumbnails are prebuilt, versioned and cover the current catalog", () => {
  for (const template of completedTemplates) {
    assert.ok(Object.hasOwn(thumbnails, template.listing), `Missing thumbnail: ${template.slug}`);
  }
  for (const thumbnail of Object.values(thumbnails)) {
    assert.ok(thumbnail.cropHeight <= thumbnail.height);
    assert.equal(thumbnail.cropHeight, Math.min(thumbnail.height, thumbnail.width * 2));
    const expectedWidths = [...new Set([...[320, 480, 640, 768].filter(width => width <= thumbnail.width), Math.min(thumbnail.width, 768)])].sort((a, b) => a - b);
    assert.deepEqual(thumbnail.variants.map(variant => variant.width), expectedWidths);
    for (const variant of thumbnail.variants) {
      assert.match(variant.src, /-[a-f0-9]{12}-\d+\.webp$/);
      assert.ok(existsSync(path.join(process.cwd(), "public", variant.src)));
    }
  }
});

test("initial card HTML loads only a cropped responsive image and prioritizes the first card", () => {
  const html = renderToStaticMarkup(createElement(TemplateListingImage, { ...props, eager: true, highPriority: true }));
  assert.equal((html.match(/<img /g) ?? []).length, 1);
  assert.match(html, /listing-thumbnails/);
  assert.match(html, /loading="eager"/);
  assert.match(html, /fetchPriority="high"/);
  assert.doesNotMatch(html, /template-listing-full/);
  assert.doesNotMatch(html, /_next\/image/);
});

test("mobile overrides use picture art direction, not a second eager image", () => {
  const html = renderToStaticMarkup(createElement(TemplateListingImage, { ...props, mobileThumbnailUrl: "/uploads/mobile.webp" }));
  assert.equal((html.match(/<img /g) ?? []).length, 1);
  assert.match(html, /<source media="\(max-width: 639px\)"/);
  assert.match(html, /%2Fuploads%2Fmobile.webp/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /listing-thumbnails/);
});

test("unknown catalog assets fall back to the existing optimized image", () => {
  const html = renderToStaticMarkup(createElement(TemplateListingImage, { ...props, source: "/chungdoi/images/template-previews/en/listing/future.webp" }));
  assert.match(html, /_next\/image/);
  assert.doesNotMatch(html, /listing-thumbnails/);
});

test("remaining first-row preloads are desktop-only so mobile avoids eager offscreen downloads", () => {
  const html = renderToStaticMarkup(createElement(TemplateListingImage, { ...props, eager: true }));
  assert.match(html, /rel="preload"/);
  assert.match(html, /media="\(min-width: 640px\)"/);
  assert.match(html, /loading="lazy"/);
});

test("prepared public mobile overrides avoid runtime image optimization", () => {
  for (const [source, thumbnail] of Object.entries(mobileThumbnails)) {
    const html = renderToStaticMarkup(createElement(TemplateListingImage, { ...props, mobileThumbnailUrl: source }));
    assert.match(html, /mobile-thumbnails/);
    assert.doesNotMatch(html, /_next\/image/);
    for (const variant of thumbnail.variants) {
      assert.ok(existsSync(path.join(process.cwd(), "public", variant.src)));
    }
  }
});
