import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { HomeHero } from "./home-hero";
import { HomeFinale } from "./home-finale";
import { HomeMotion } from "./home-motion";
import { HomeLivePreview } from "./home-live-preview";
import { HomeGallery } from "./home-gallery";
import { HomeSteps } from "./home-steps";
import type { Site2ListingItem } from "../../../lib/catalog";

const cover: Site2ListingItem = {
  slug: "mau-thiep", name: "Mẫu thiệp", category: "Minimal", categoryVi: "Tối giản",
  descriptionVi: null, listing: "/people-photo.jpg", portrait: "/people-photo.jpg",
};

test("hero is copy-only with browse and collection anchors", () => {
  const html = renderToStaticMarkup(<HomeHero />);
  assert.match(html, /<h1/);
  assert.match(html, /href="\/mau-thiep"/);
  assert.match(html, /href="#bo-suu-tap"/);
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /s2-home-exhibition|s2-home-fan/);
});

test("motion scope contains server-rendered children", () => {
  const html = renderToStaticMarkup(<HomeMotion><section data-home-reveal>Visible content</section></HomeMotion>);
  assert.match(html, /class="s2-home"/);
  assert.match(html, /Visible content/);
  assert.doesNotMatch(html, /opacity:0|visibility:hidden/);
});

test("live preview has labelled bounded inputs and illustrative output", () => {
  const html = renderToStaticMarkup(<HomeLivePreview />);
  assert.equal((html.match(/<label/g) ?? []).length, 3);
  assert.equal((html.match(/maxLength=/g) ?? []).length, 3);
  assert.match(html, /minh hoạ/);
  assert.match(html, /aria-label=/);
});

test("live preview echoes names inline and carries them to the catalog link", () => {
  const html = renderToStaticMarkup(<HomeLivePreview />);
  assert.match(html, /s2-home-preview-echo/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /href="\/mau-thiep\?[^"]*bride=[^"]*"/);
  assert.match(html, /href="\/mau-thiep\?[^"]*groom=[^"]*"/);
});

test("finale starts creation from the template catalog", () => {
  const html = renderToStaticMarkup(<HomeFinale />);
  assert.match(html, /href="\/mau-thiep"/);
  assert.doesNotMatch(html, /dang-nhap/);
});

test("gallery preserves actual demo links and handles empty catalogs", () => {
  assert.match(renderToStaticMarkup(<HomeSteps />), /<ol/);
  const empty = renderToStaticMarkup(<HomeGallery templates={[]} totalCount={0} />);
  assert.match(empty, /href="\/mau-thiep"/);
  assert.doesNotMatch(empty, /<img|<button|home-gallery-stage/);
});

test("gallery features one invitation with a rail of real demo links", () => {
  const templates = Array.from({ length: 12 }, (_, index) => ({ ...cover, slug: `cover-${index}`, name: `Thiệp ${index}` }));
  const html = renderToStaticMarkup(<HomeGallery templates={templates} totalCount={24} />);
  assert.match(html, /id="home-gallery-stage"/);
  assert.match(html, /aria-roledescription="bộ sưu tập dạng trượt"/);
  assert.equal((html.match(/data-home-gallery-feature="true"/g) ?? []).length, 1);
  assert.equal((html.match(/data-home-gallery-thumb="true"/g) ?? []).length, 3);
  assert.match(html, /href="\/mau-thiep\/cover-0\/demo"/);
  assert.match(html, /aria-label="Thiệp 1"/);
  assert.match(html, /aria-label="Thiệp 3"/);
  assert.doesNotMatch(html, /aria-label="Thiệp 4"/);
  assert.doesNotMatch(html, /cover-10\/demo/);
  assert.match(html, /Khám phá 24 mẫu thiệp/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /s2-home-gallery-progress/);
});

test("a single invitation remains usable without redundant navigation", () => {
  const html = renderToStaticMarkup(<HomeGallery templates={[cover]} totalCount={1} />);
  assert.match(html, /data-home-gallery-feature="true"/);
  assert.match(html, /href="\/mau-thiep\/mau-thiep\/demo"/);
  assert.doesNotMatch(html, /data-home-gallery-thumb|<button|NaN|undefined/);
});
