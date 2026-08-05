import assert from "node:assert/strict";
import test from "node:test";

import { resolveZodiacInvitationArtwork } from "./zodiac-invitation-artwork";

test("zodiac invitation artwork follows bride-first display order in hero and parallax", () => {
  const artwork = resolveZodiacInvitationArtwork({
    brideZodiac: "meo",
    groomZodiac: "ho",
    brideFirst: true,
  });

  assert.equal(artwork.heroLeft.endsWith("zodiac-meo.webp"), true);
  assert.equal(artwork.heroRight.endsWith("zodiac-ho.webp"), true);
  assert.equal(artwork.parallaxRight.endsWith("zodiac-meo-line.webp"), true);
  assert.equal(artwork.parallaxLeft.endsWith("zodiac-ho-line.webp"), true);
});

test("zodiac invitation artwork swaps fixed positions when the groom is displayed first", () => {
  const artwork = resolveZodiacInvitationArtwork({
    brideZodiac: "meo",
    groomZodiac: "ho",
    brideFirst: false,
  });

  assert.equal(artwork.heroLeft.endsWith("zodiac-ho.webp"), true);
  assert.equal(artwork.heroRight.endsWith("zodiac-meo.webp"), true);
  assert.equal(artwork.parallaxRight.endsWith("zodiac-ho-line.webp"), true);
  assert.equal(artwork.parallaxLeft.endsWith("zodiac-meo-line.webp"), true);
});

test("zodiac invitation artwork falls back independently to bride Phoenix and groom Dragon", () => {
  const artwork = resolveZodiacInvitationArtwork({
    brideZodiac: "",
    groomZodiac: "invalid",
    brideFirst: true,
  });

  assert.equal(artwork.heroLeft.endsWith("zodiac-phuong.webp"), true);
  assert.equal(artwork.heroRight.endsWith("zodiac-rong.webp"), true);
  assert.equal(artwork.parallaxRight.endsWith("zodiac-phuong-line.webp"), true);
  assert.equal(artwork.parallaxLeft.endsWith("zodiac-rong-line.webp"), true);
});
