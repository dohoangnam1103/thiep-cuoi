import assert from "node:assert/strict";
import test from "node:test";

import robots from "./robots";
import sitemap from "./sitemap";

test("sitemap contains only indexable Vietnamese pages with honest modification data", () => {
  const entries = sitemap();

  assert.ok(entries.length > 0);
  assert.ok(entries.every((entry) => entry.url.startsWith("http")));
  assert.ok(entries.every((entry) => !entry.url.includes("/en/")));
  assert.ok(entries.every((entry) => !entry.url.includes("/ko/")));
  assert.ok(entries.every((entry) => !entry.url.includes("/ja/")));
  assert.ok(entries.every((entry) => !entry.url.includes("/zh/")));
  assert.ok(entries.every((entry) => !entry.url.includes("/blog")));
  assert.ok(entries.every((entry) => !entry.url.includes("/mau-thiep")));
  assert.ok(entries.every((entry) => entry.lastModified === undefined));
  assert.ok(entries.every((entry) => entry.alternates === undefined));
});

test("robots allows noindex pages to be crawled and blocks only APIs", () => {
  const config = robots();
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  const disallowed = rules.flatMap((rule) => rule.disallow ?? []);

  assert.deepEqual(disallowed, ["/api/"]);
});
