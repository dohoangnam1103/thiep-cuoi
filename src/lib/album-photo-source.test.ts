import assert from "node:assert/strict";
import test from "node:test";
import { albumPhotoProps, albumPhotoSource } from "./album-photo-source";

test("album display variants are bounded while retaining the original source", () => {
  const original = "/uploads/wedding.webp";
  const display = new URL(albumPhotoSource(original, 1077), "https://example.test");
  assert.equal(display.pathname, "/_next/image");
  assert.equal(display.searchParams.get("url"), original);
  assert.equal(display.searchParams.get("w"), "1080");
  assert.equal(new URL(albumPhotoSource(original, 5000), "https://example.test").searchParams.get("w"), "1920");
  const carousel = albumPhotoProps(original, "209px", 1080);
  const widths = carousel.srcSet!.split(", ").map(candidate => Number(candidate.split(" ")[1].slice(0, -1)));
  assert.ok(widths.length > 1);
  assert.ok(widths.every(width => width <= 1080));
  assert.equal(carousel.sizes, "209px");
});

test("external, versioned, vector and draft photo URLs keep their direct path", () => {
  for (const source of ["https://example.test/photo.jpg", "//example.test/photo.jpg", "blob:preview", "data:image/png;base64,abc", "/uploads/photo.webp?v=2", "/images/decoration.svg"]) {
    assert.equal(albumPhotoSource(source, 640), source);
    assert.deepEqual(albumPhotoProps(source, "50vw"), { src: source, srcSet: undefined, sizes: undefined });
  }
});
