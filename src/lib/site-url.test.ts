import assert from "node:assert/strict";
import test from "node:test";

import { resolveSiteUrl } from "./site-url";

test("uses the localhost fallback outside production", () => {
  assert.equal(resolveSiteUrl(undefined, "development"), "http://localhost:3000");
  assert.equal(resolveSiteUrl(undefined, "test"), "http://localhost:3000");
});

test("normalizes a configured site URL", () => {
  assert.equal(
    resolveSiteUrl("https://thiepmungonline.com/", "production"),
    "https://thiepmungonline.com",
  );
});

test("fails fast for unsafe production SITE_URL values", () => {
  assert.throws(
    () => resolveSiteUrl(undefined, "production"),
    /required in production/,
  );
  assert.throws(
    () => resolveSiteUrl("http://thiepmungonline.com", "production"),
    /must use HTTPS/,
  );
  assert.throws(
    () => resolveSiteUrl("https://localhost:3000", "production"),
    /must not use localhost/,
  );
});

test("allows a loopback SITE_URL when the insecure opt-in is set", () => {
  assert.equal(
    resolveSiteUrl("http://127.0.0.1:3100", "production", true),
    "http://127.0.0.1:3100",
  );
  assert.throws(
    () => resolveSiteUrl(undefined, "production", true),
    /required in production/,
  );
});
