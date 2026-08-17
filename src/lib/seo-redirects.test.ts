import assert from "node:assert/strict";
import test from "node:test";

import { canonicalHostRedirects, canonicalTemplatePath } from "./seo-redirects";

test("redirects template detail and alias URLs directly to the canonical demo", () => {
  assert.equal(
    canonicalTemplatePath("/mau-thiep/song-hy-red"),
    "/mau-thiep/song-hy-do/demo",
  );
  assert.equal(
    canonicalTemplatePath("/mau-thiep/song-hy-red/demo"),
    "/mau-thiep/song-hy-do/demo",
  );
  assert.equal(
    canonicalTemplatePath("/en/templates/song-hy-do/demo"),
    "/mau-thiep/song-hy-do/demo",
  );
  assert.equal(
    canonicalTemplatePath("/en/templates/song-hy-red/demo"),
    "/mau-thiep/song-hy-do/demo",
  );
  assert.equal(
    canonicalTemplatePath("/templates/song-hy-red/demo"),
    "/mau-thiep/song-hy-do/demo",
  );
  assert.equal(
    canonicalTemplatePath("/vi/templates/song-hy-red"),
    "/mau-thiep/song-hy-do/demo",
  );
});

test("leaves canonical demo URLs and unrelated paths unchanged", () => {
  assert.equal(canonicalTemplatePath("/mau-thiep/song-hy-do/demo"), null);
  assert.equal(canonicalTemplatePath("/mau-thiep/khong-ton-tai/demo"), null);
  assert.equal(canonicalTemplatePath("/bang-gia"), null);
});

test("redirects internal and retired-locale facet aliases to public URLs", () => {
  assert.equal(
    canonicalTemplatePath("/templates/style/truyen-thong"),
    "/mau-thiep/phong-cach/truyen-thong",
  );
  assert.equal(
    canonicalTemplatePath("/vi/templates/color/do/"),
    "/mau-thiep/mau-sac/do",
  );
  assert.equal(
    canonicalTemplatePath("/en/templates/style/hoa-la"),
    "/mau-thiep/phong-cach/hoa-la",
  );
  assert.equal(canonicalTemplatePath("/templates/style/khong-ton-tai"), null);
});

test("builds production-only HTTPS and www canonical redirects", () => {
  const redirects = canonicalHostRedirects("https://thiepmungonline.com");

  assert.equal(redirects.length, 2);
  assert.equal(redirects[0]?.destination, "https://thiepmungonline.com/:path*");
  assert.deepEqual(redirects[0]?.has, [
    { type: "host", value: "www.thiepmungonline.com" },
  ]);
  assert.deepEqual(redirects[1]?.has, [
    { type: "header", key: "x-forwarded-proto", value: "http" },
  ]);
  assert.deepEqual(canonicalHostRedirects("http://localhost:3000"), []);
  assert.deepEqual(canonicalHostRedirects(undefined), []);
});
