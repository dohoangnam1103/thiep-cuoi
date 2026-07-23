import assert from "node:assert/strict";
import test from "node:test";

import robots from "./robots";
import sitemap from "./sitemap";
import { SITE_URL } from "@/lib/site-url";

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
  assert.ok(entries.every((entry) => entry.changeFrequency === undefined));
  assert.ok(entries.every((entry) => entry.priority === undefined));
  assert.ok(entries.every((entry) => entry.alternates === undefined));
  assert.deepEqual(
    entries.map((entry) => entry.url),
    [
      `${SITE_URL}/`,
      `${SITE_URL}/tao-thiep-cuoi-online`,
      `${SITE_URL}/bang-gia`,
      `${SITE_URL}/cong-cu`,
      `${SITE_URL}/help`,
      `${SITE_URL}/chinh-sach-bao-mat`,
      `${SITE_URL}/dieu-khoan-su-dung`,
      `${SITE_URL}/chinh-sach-hoan-tien`,
    ],
  );
});

test("robots allows noindex pages to be crawled and blocks only APIs", () => {
  const config = robots();
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  const disallowed = rules.flatMap((rule) => rule.disallow ?? []);

  assert.deepEqual(disallowed, ["/api/"]);
  assert.equal(config.sitemap, `${SITE_URL}/sitemap.xml`);
});
