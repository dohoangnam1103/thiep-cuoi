import assert from "node:assert/strict";
import test from "node:test";

import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";
import {
  pickReadableColor,
  relativeLuminance,
  resolveDashboardCardTheme,
} from "@/lib/dashboard-card-theme";

test("resolveDashboardCardTheme returns null for an unknown template", () => {
  assert.equal(resolveDashboardCardTheme("nope-not-real"), null);
});

test("resolveDashboardCardTheme exposes the template background", () => {
  const theme = resolveDashboardCardTheme("song-hy-red");
  if (!theme) throw new Error("expected a theme for song-hy-red");
  assert.match(theme.background, /linear-gradient/);
});

test("resolveDashboardCardTheme dedupes decorations and caps at two", () => {
  const theme = resolveDashboardCardTheme("song-hy-red");
  if (!theme) throw new Error("expected a theme for song-hy-red");
  // song-hy-red lists chu-hy.webp twice → one unique decoration.
  assert.deepEqual(theme.decorations, [
    "/chungdoi/images/themes/_decor/song-hy-red/chu-hy.webp",
  ]);
});

test("resolveDashboardCardTheme returns two decorations for double-phoenix-red", () => {
  const theme = resolveDashboardCardTheme("double-phoenix-red");
  if (!theme) throw new Error("expected a theme for double-phoenix-red");
  assert.equal(theme.decorations.length, 2);
});

test("resolveDashboardCardTheme replaces zodiac placeholders with safe fallback artwork", () => {
  const slug = "test-zodiac-placeholder-dashboard";
  const base = chungdoiThemeConfig["double-phoenix-red"];
  if (!base) throw new Error("expected the double-phoenix-red fixture");
  chungdoiThemeConfig[slug] = {
    ...base,
    decorations: {
      cardImages: [
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
      ],
    },
  };

  try {
    const theme = resolveDashboardCardTheme(slug);
    if (!theme) throw new Error("expected the zodiac fixture theme");
    assert.deepEqual(theme.decorations, [
      "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-phuong.webp",
      "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-rong.webp",
    ]);
    assert.equal(theme.decorations.some((src) => src.includes("{{")), false);
  } finally {
    delete chungdoiThemeConfig[slug];
  }
});

test("pickReadableColor keeps a dark theme color on a light surface", () => {
  assert.equal(pickReadableColor("#710001", "#111111"), "#710001");
});

test("pickReadableColor falls back when the theme color is too light", () => {
  assert.equal(pickReadableColor("#f0d497", "#111111"), "#111111");
});

test("pickReadableColor falls back for an unparseable color", () => {
  assert.equal(pickReadableColor("var(--x)", "#111111"), "#111111");
});

test("relativeLuminance parses rgb and hex consistently", () => {
  const hex = relativeLuminance("#ffffff");
  const rgb = relativeLuminance("rgb(255,255,255)");
  if (hex === null || rgb === null) throw new Error("expected parseable colors");
  assert.ok(Math.abs(hex - rgb) < 1e-9);
  assert.ok(hex > 0.99);
});

test("relativeLuminance composites fully transparent rgba over white", () => {
  const luminance = relativeLuminance("rgba(0,0,0,0)");
  if (luminance === null) throw new Error("expected a parseable color");
  assert.ok(luminance > 0.99);
});

test("relativeLuminance lightens translucent rgba over white", () => {
  const translucent = relativeLuminance("rgba(210, 95, 101, 0.7)");
  const opaque = relativeLuminance("rgb(210, 95, 101)");
  if (translucent === null || opaque === null) {
    throw new Error("expected parseable colors");
  }
  assert.ok(translucent > opaque);
});
