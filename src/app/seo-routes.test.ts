import assert from "node:assert/strict";
import test from "node:test";

import { getVietnameseTemplateSlug } from "@/data/chungdoi";
import { templateSeoFacets } from "@/data/template-seo-facets";
import { SITE_URL } from "@/lib/site-url";
import { buildSitemapEntries } from "@/lib/sitemap-entries";

import { templateSeoDetailEnabledSlugs } from "@/data/template-seo-details";
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
const detailUrls = templateSeoDetailEnabledSlugs.map(
  (slug) => `${SITE_URL}/mau-thiep/${getVietnameseTemplateSlug(slug)}`,
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
  assert.ok(urls.every((url) => !url.includes("?") && !url.endsWith("/demo")));
  assert.deepEqual(urls, [
    ...staticUrls,
    ...facetUrls,
    ...detailUrls,
    `${SITE_URL}/blog`,
    `${SITE_URL}/blog/thu-moi-cuoi-online`,
    `${SITE_URL}/blog/chon-mau-thiep-cuoi`,
  ]);
});

test("non-blog routes have stable content dates and blog dates come from posts", () => {
  const entries = buildSitemapEntries(posts);
  const byUrl = new Map(entries.map((entry) => [entry.url, entry]));

  for (const url of [...staticUrls, ...facetUrls, ...detailUrls]) {
    assert.match(String(byUrl.get(url)?.lastModified), /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.notEqual(byUrl.get(`${SITE_URL}/`)?.lastModified, byUrl.get(`${SITE_URL}/help`)?.lastModified);

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

test("template detail dates use newer SEO edits by source slug, even for canonical aliases", () => {
  const updatedAt = "2026-10-01T08:30:00.000Z";
  const originalDates = new Map(buildSitemapEntries([]).map((entry) => [entry.url, entry.lastModified]));
  const entries = buildSitemapEntries([], { "song-hy-red": "song-hy-cap-nhat" }, undefined, {
    "song-hy-red": { updatedAt },
    "minimalism-red": { updatedAt: "2026-08-01T08:30:00.000Z" },
  });
  const byUrl = new Map(entries.map((entry) => [entry.url, entry.lastModified]));
  const originalUrl = `${SITE_URL}/mau-thiep/${getVietnameseTemplateSlug("song-hy-red")}`;

  assert.equal(byUrl.get(`${SITE_URL}/mau-thiep/song-hy-cap-nhat`), updatedAt);
  assert.equal(byUrl.has(originalUrl), false);
  for (const [url, lastModified] of originalDates) {
    if (url !== originalUrl) assert.equal(byUrl.get(url), lastModified);
  }
});

test("sitemap omits blog URLs entirely when no post is published", () => {
  const urls = buildSitemapEntries([]).map((entry) => entry.url);

  assert.ok(urls.every((url) => !url.includes("/blog")));
  assert.deepEqual(urls, [...staticUrls, ...facetUrls, ...detailUrls]);
});

test("robots keeps public assets crawlable, including deployment-versioned URLs", () => {
  const config = robots();
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  const disallowed = rules.flatMap((rule) => rule.disallow ?? []);

  assert.deepEqual(disallowed, ["/api/"]);
  assert.equal(config.sitemap, `${SITE_URL}/sitemap.xml`);
});
