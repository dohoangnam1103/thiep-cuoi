import assert from "node:assert/strict";
import test from "node:test";

import { routing } from "@/i18n/routing";

import { SITE_SOCIAL_IMAGE_PATH, SITE_URL } from "./site-url";
import { pageSeo, staticAlternates, templateAlternates } from "./seo";

test("disables next-intl alternate headers so metadata is the single hreflang source", () => {
  assert.equal(routing.alternateLinks, false);
});

test("uses Vietnamese canonical and hreflang metadata only", () => {
  const vietnamese = staticAlternates("/templates", "vi");

  assert.equal(vietnamese.canonical, "/mau-thiep");
  assert.equal(vietnamese.languages.vi, "/mau-thiep");
  assert.equal(vietnamese.languages["x-default"], "/mau-thiep");
});

test("keeps localized template slugs in canonical and hreflang links", () => {
  const alternates = templateAlternates("dragon-phoenix-v2-red", "vi");

  assert.ok(alternates);
  assert.equal(alternates.canonical, "/mau-thiep/long-phung-v2-do/demo");
  assert.equal(alternates.languages.vi, "/mau-thiep/long-phung-v2-do/demo");
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
test("adds localized template demo Open Graph URL, locale, and image details", () => {
  const alternates = templateAlternates("song-hy-do", "vi");
  assert.ok(alternates);

  const metadata = pageSeo({
    title: "Mẫu thiệp cưới Song Hỷ Đỏ | Thiệp Mừng Online",
    description: "Thiệp cưới Song Hỷ Đỏ truyền thống.",
    alternates,
    locale: "vi",
    image: "/chungdoi/images/template-previews/en/landscape/song_hy_red.webp",
    imageAlt: "Ảnh xem trước mẫu thiệp cưới Song Hỷ Đỏ",
    imageWidth: 2400,
    imageHeight: 1260,
    imageType: "image/webp",
  });
  const images = metadata.openGraph?.images;

  assert.equal(metadata.description, "Thiệp cưới Song Hỷ Đỏ truyền thống.");
  assert.equal(metadata.openGraph?.url, "/mau-thiep/song-hy-do/demo");
  assert.equal(metadata.openGraph?.locale, "vi_VN");
  assert.ok(Array.isArray(images));
  assert.deepEqual(images[0], {
    url: `${SITE_URL}/chungdoi/images/template-previews/en/landscape/song_hy_red.webp`,
    width: 2400,
    height: 1260,
    alt: "Ảnh xem trước mẫu thiệp cưới Song Hỷ Đỏ",
    type: "image/webp",
  });
});
