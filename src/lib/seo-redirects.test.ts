import assert from "node:assert/strict";
import test from "node:test";

import { canonicalHostRedirects, canonicalTemplatePath } from "./seo-redirects";

test("canonical detail and demo aliases remain separate and terminate in one hop", () => {
  for (const prefix of ["/mau-thiep", "/templates", "/vi/templates", "/en/templates", "/ko/templates", "/ja/templates", "/zh/templates"]) {
    for (const suffix of ["", "/demo"]) {
      const destination = `/mau-thiep/song-hy-do${suffix}`;
      assert.equal(canonicalTemplatePath(`${prefix}/song-hy-red${suffix}`), destination);
      assert.equal(canonicalTemplatePath(destination), null);
    }
  }
  assert.equal(canonicalTemplatePath("/mau-thiep/song-hy-do"), null);
  assert.equal(canonicalTemplatePath("/mau-thiep/song-hy-do/demo"), null);
  assert.equal(canonicalTemplatePath("/mau-thiep/khong-ton-tai"), null);
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
