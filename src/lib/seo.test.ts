import assert from "node:assert/strict";
import test from "node:test";

import { routing } from "@/i18n/routing";

import { SITE_SOCIAL_IMAGE_PATH, SITE_URL } from "./site-url";
import { pageSeo, staticAlternates, templateAlternates } from "./seo";

test("disables next-intl alternate headers so metadata is the single hreflang source", () => {
  assert.equal(routing.alternateLinks, false);
});

test("uses a self-referencing canonical while exposing only indexable hreflang locales", () => {
  const vietnamese = staticAlternates("/templates", "vi");
  const english = staticAlternates("/templates", "en");

  assert.equal(vietnamese.canonical, "/mau-thiep");
  assert.equal(english.canonical, "/en/templates");
  assert.equal(english.languages.vi, "/mau-thiep");
  assert.equal(english.languages.en, undefined);
  assert.equal(english.languages["x-default"], "/mau-thiep");
});

test("keeps localized template slugs in canonical and hreflang links", () => {
  const alternates = templateAlternates("dragon-phoenix-v2-red", "en");

  assert.ok(alternates);
  assert.equal(alternates.canonical, "/en/templates/dragon-phoenix-v2-red/demo");
  assert.equal(alternates.languages.vi, "/mau-thiep/long-phung-v2-do/demo");
  assert.equal(alternates.languages.en, undefined);
});

test("uses the branded social card by default without replacing page-specific images", () => {
  const defaults = pageSeo({
    title: "Trang thử",
    description: "Mô tả thử",
    alternates: staticAlternates("/", "vi"),
    locale: "vi",
  });
  const custom = pageSeo({
    title: "Trang có ảnh riêng",
    description: "Mô tả thử",
    alternates: staticAlternates("/create-wedding-invitation-online", "vi"),
    locale: "vi",
    image: "/thiepmungonline/wedding-guide/chon-mau-thiep-tmo.webp",
  });
  const defaultImages = defaults.openGraph?.images;
  const customImages = custom.openGraph?.images;

  assert.equal(defaults.openGraph?.locale, "vi_VN");
  assert.ok(Array.isArray(defaultImages));
  assert.ok(Array.isArray(customImages));
  assert.equal(
    String((defaultImages[0] as { url: string }).url),
    `${SITE_URL}${SITE_SOCIAL_IMAGE_PATH}`,
  );
  assert.equal(
    String((customImages[0] as { url: string }).url),
    `${SITE_URL}/thiepmungonline/wedding-guide/chon-mau-thiep-tmo.webp`,
  );
});
