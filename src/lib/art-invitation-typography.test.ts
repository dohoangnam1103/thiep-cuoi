import assert from "node:assert/strict";
import test from "node:test";

import { resolveArtDisplayFontClass } from "@/lib/art-invitation-typography";

test("resolveArtDisplayFontClass maps a template family", () => {
  assert.equal(
    resolveArtDisplayFontClass("SVN-HC Haydon Brush", "font-art-fallback"),
    "font-art-haydon",
  );
});

test("resolveArtDisplayFontClass accepts a quoted editor font stack", () => {
  assert.equal(
    resolveArtDisplayFontClass('"Fz Qellia", Georgia, serif', "font-art-fallback"),
    "font-art-qellia",
  );
});

test("resolveArtDisplayFontClass keeps the template class for an unknown family", () => {
  assert.equal(
    resolveArtDisplayFontClass("Unknown Wedding Font", "font-art-signora"),
    "font-art-signora",
  );
  assert.equal(resolveArtDisplayFontClass(null, "font-art-lora"), "font-art-lora");
});
