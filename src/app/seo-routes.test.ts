import assert from "node:assert/strict";
import test from "node:test";

import { completedTemplates, getVietnameseTemplateSlug } from "@/data/chungdoi";
import { templateSeoFacets } from "@/data/template-seo-facets";
import { SITE_URL } from "@/lib/site-url";

import robots from "./robots";
import sitemap from "./sitemap";

test("sitemap contains every canonical indexable Vietnamese page exactly once", () => {
  const entries = sitemap();
  const staticUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/tao-thiep-cuoi-online`,
    `${SITE_URL}/bang-gia`,
    `${SITE_URL}/mau-thiep`,
    `${SITE_URL}/cong-cu`,
    `${SITE_URL}/help`,
    `${SITE_URL}/chinh-sach-bao-mat`,
    `${SITE_URL}/dieu-khoan-su-dung`,
    `${SITE_URL}/chinh-sach-hoan-tien`,
  ];
  const demoUrls = completedTemplates.map(
    (template) =>
      `${SITE_URL}/mau-thiep/${getVietnameseTemplateSlug(template.slug)}/demo`,
  );
  const facetUrls = templateSeoFacets.map((facet) =>
    facet.kind === "style"
      ? `${SITE_URL}/mau-thiep/phong-cach/${facet.slug}`
      : `${SITE_URL}/mau-thiep/mau-sac/${facet.slug}`,
  );
  const urls = entries.map((entry) => entry.url);

  assert.ok(entries.every((entry) => entry.url.startsWith("http")));
  assert.ok(entries.every((entry) => !/\/(en|ko|ja|zh)\//.test(entry.url)));
  assert.ok(entries.every((entry) => !entry.url.includes("/blog")));
  assert.ok(entries.every((entry) => entry.lastModified === undefined));
  assert.ok(entries.every((entry) => entry.changeFrequency === undefined));
  assert.ok(entries.every((entry) => entry.priority === undefined));
  assert.ok(entries.every((entry) => entry.alternates === undefined));
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.every((url) => !url.includes("?")));
  assert.deepEqual(urls, [...staticUrls, ...facetUrls, ...demoUrls]);
});

test("robots allows noindex pages to be crawled and blocks only APIs", () => {
  const config = robots();
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  const disallowed = rules.flatMap((rule) => rule.disallow ?? []);

  assert.deepEqual(disallowed, ["/api/"]);
  assert.equal(config.sitemap, `${SITE_URL}/sitemap.xml`);
});
