import assert from "node:assert/strict";
import test from "node:test";
import {
  templatePreviewUrl,
  templatePreviewOptimizedUrl,
  listingImageHeight,
} from "./template-preview";

test("templatePreviewUrl appends cache-bust version", () => {
  const url = templatePreviewUrl("/chungdoi/images/template-previews/foo.webp");
  assert.ok(url.includes("?v="));
});

test("templatePreviewOptimizedUrl wraps through /_next/image", () => {
  const source = "/chungdoi/images/template-previews/song_hy_green.webp";
  const optimized = templatePreviewOptimizedUrl(source, 400);
  assert.ok(optimized.startsWith("/_next/image?url="));
  assert.ok(optimized.includes("&w=400"));
  assert.ok(optimized.includes("&q=84"));
  assert.ok(optimized.includes(encodeURIComponent(source)));
});

test("templatePreviewOptimizedUrl respects custom quality", () => {
  const source = "/chungdoi/images/template-previews/royal_blue.webp";
  const optimized = templatePreviewOptimizedUrl(source, 300, 75);
  assert.ok(optimized.includes("&q=75"));
  assert.ok(optimized.includes("&w=300"));
});

test("listingImageHeight returns known height for registered template", () => {
  const src = "/chungdoi/images/template-previews/song_hy_green.webp";
  assert.equal(listingImageHeight(src), 7853);
});

test("listingImageHeight falls back to 768 for unknown template", () => {
  const src = "/chungdoi/images/template-previews/unknown_template.webp";
  assert.equal(listingImageHeight(src), 768);
});
