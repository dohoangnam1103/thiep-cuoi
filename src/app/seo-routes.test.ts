import assert from "node:assert/strict";
import test from "node:test";

import { completedTemplates, getVietnameseTemplateSlug } from "@/data/chungdoi";
import { templateSeoFacets } from "@/data/template-seo-facets";
import { SITE_URL } from "@/lib/site-url";
import { buildSitemapEntries } from "@/lib/sitemap-entries";

import robots from "./robots";

// Fixtures rather than the real query: `src/app/sitemap.ts` imports
// `@/lib/blog-posts`, which imports `server-only` — that package throws when
// resolved without the react-server condition, so it cannot be pulled into a
// plain node test. `sitemap()` itself is a thin wrapper around this builder.
const posts = [
  { slug: "thu-moi-cuoi-online", updatedAt: new Date("2026-08-20T03:00:00.000Z") },
  { slug: "chon-mau-thiep-cuoi", updatedAt: new Date("2026-07-11T09:30:00.000Z") },
];

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

test("sitemap contains every canonical indexable Vietnamese page exactly once", () => {
  const entries = buildSitemapEntries(posts);
  const urls = entries.map((entry) => entry.url);

  assert.ok(entries.every((entry) => entry.url.startsWith("http")));
  assert.ok(entries.every((entry) => !/\/(en|ko|ja|zh)\//.test(entry.url)));
  assert.ok(entries.every((entry) => entry.changeFrequency === undefined));
  assert.ok(entries.every((entry) => entry.priority === undefined));
  assert.ok(entries.every((entry) => entry.alternates === undefined));
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.every((url) => !url.includes("?")));
  assert.deepEqual(urls, [
    ...staticUrls,
    ...facetUrls,
    ...demoUrls,
    `${SITE_URL}/blog`,
    `${SITE_URL}/blog/thu-moi-cuoi-online`,
    `${SITE_URL}/blog/chon-mau-thiep-cuoi`,
  ]);
});

test("only blog URLs carry lastModified, and it comes from the post's own date", () => {
  const entries = buildSitemapEntries(posts);
  const byUrl = new Map(entries.map((entry) => [entry.url, entry]));

  // Marketing and template pages have no real per-page modification date, so
  // they must stay bare instead of claiming a build timestamp.
  assert.ok(
    entries
      .filter((entry) => !entry.url.includes("/blog"))
      .every((entry) => entry.lastModified === undefined),
  );

  assert.deepEqual(
    byUrl.get(`${SITE_URL}/blog/thu-moi-cuoi-online`)?.lastModified,
    posts[0].updatedAt,
  );
  assert.deepEqual(
    byUrl.get(`${SITE_URL}/blog/chon-mau-thiep-cuoi`)?.lastModified,
    posts[1].updatedAt,
  );
  // Index tracks the newest modification across posts, not the newest publish.
  assert.deepEqual(
    byUrl.get(`${SITE_URL}/blog`)?.lastModified,
    posts[0].updatedAt,
  );
});

test("sitemap omits blog URLs entirely when no post is published", () => {
  const urls = buildSitemapEntries([]).map((entry) => entry.url);

  assert.ok(urls.every((url) => !url.includes("/blog")));
  assert.deepEqual(urls, [...staticUrls, ...facetUrls, ...demoUrls]);
});

test("robots allows noindex pages to be crawled and blocks only APIs", () => {
  const config = robots();
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  const disallowed = rules.flatMap((rule) => rule.disallow ?? []);

  assert.deepEqual(disallowed, ["/api/"]);
  assert.equal(config.sitemap, `${SITE_URL}/sitemap.xml`);
});
