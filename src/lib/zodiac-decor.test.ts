import assert from "node:assert/strict";
import test from "node:test";

import type { ChungDoiCardImage } from "@/data/chungdoi-theme-config";

import { resolveZodiacCardImages } from "./zodiac-decor";

const cardImages: ChungDoiCardImage[] = [
  {
    src: "{{brideZodiac}}",
    className: "left-slot",
    flyOnOpen: true,
  },
  {
    src: "{{groomZodiac}}",
    className: "right-slot",
    flyOnOpen: true,
  },
  {
    src: "{{brideZodiacLine}}",
    className: "right-line-slot",
    flyOnOpen: false,
  },
  {
    src: "{{groomZodiacLine}}",
    className: "left-line-slot",
    flyOnOpen: false,
  },
];

test("resolveZodiacCardImages resolves valid role tokens without changing card metadata", () => {
  const resolved = resolveZodiacCardImages(cardImages, {
    couple: {
      brideZodiac: "meo",
      groomZodiac: "ho",
      brideFirst: true,
    },
  });

  assert.deepEqual(resolved, [
    {
      src: "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-meo.webp",
      className: "left-slot",
      flyOnOpen: true,
    },
    {
      src: "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-ho.webp",
      className: "right-slot",
      flyOnOpen: true,
    },
    {
      src: "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-meo-line.webp",
      className: "right-line-slot",
      flyOnOpen: false,
    },
    {
      src: "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-ho-line.webp",
      className: "left-line-slot",
      flyOnOpen: false,
    },
  ]);
});

test("resolveZodiacCardImages swaps sources between fixed left/right slots for groom-first display", () => {
  const resolved = resolveZodiacCardImages(cardImages, {
    couple: {
      brideZodiac: "meo",
      groomZodiac: "ho",
      brideFirst: false,
    },
  });

  assert.equal(resolved[0]?.className, "left-slot");
  assert.equal(resolved[0]?.src.endsWith("zodiac-ho.webp"), true);
  assert.equal(resolved[1]?.className, "right-slot");
  assert.equal(resolved[1]?.src.endsWith("zodiac-meo.webp"), true);
  assert.equal(resolved[2]?.src.endsWith("zodiac-ho-line.webp"), true);
  assert.equal(resolved[3]?.src.endsWith("zodiac-meo-line.webp"), true);
});

test("resolveZodiacCardImages falls back per role to Phoenix bride and Dragon groom", () => {
  const resolved = resolveZodiacCardImages(cardImages, {
    couple: {
      brideZodiac: "",
      groomZodiac: "not-a-zodiac",
      brideFirst: true,
    },
  });

  assert.equal(resolved[0]?.src.endsWith("zodiac-phuong.webp"), true);
  assert.equal(resolved[1]?.src.endsWith("zodiac-rong.webp"), true);
  assert.equal(resolved[2]?.src.endsWith("zodiac-phuong-line.webp"), true);
  assert.equal(resolved[3]?.src.endsWith("zodiac-rong-line.webp"), true);
});

test("resolveZodiacCardImages replaces an unknown placeholder with a safe Dragon fallback", () => {
  const resolved = resolveZodiacCardImages([
    { src: "{{unexpectedToken}}", className: "slot", flyOnOpen: true },
  ]);

  assert.deepEqual(resolved, [
    {
      src: "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-rong.webp",
      className: "slot",
      flyOnOpen: true,
    },
  ]);
});

test("resolveZodiacCardImages returns the same array for themes without placeholders", () => {
  const staticImages: ChungDoiCardImage[] = [
    { src: "/static/flower.webp", className: "flower", flyOnOpen: false },
  ];

  assert.equal(resolveZodiacCardImages(staticImages), staticImages);
});
