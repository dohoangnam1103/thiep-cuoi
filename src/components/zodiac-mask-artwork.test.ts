import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ZodiacMaskArtwork } from "./zodiac-mask-artwork";

test("ZodiacMaskArtwork exposes a CSS mask URL and remains decorative", () => {
  const html = renderToStaticMarkup(createElement(ZodiacMaskArtwork, {
    src: "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-meo.webp",
    className: "size-24",
    "data-envelope-opening-fly": true,
    style: { animation: "demo-dragon-fly 1.2s ease-in forwards" },
  }));

  assert.match(html, /class="zodiac-mask-artwork zodiac-opening-fly size-24"/);
  assert.match(html, /--zodiac-mask-image:url\(&quot;\/chungdoi\/images\/themes\/_decor\/thap-nhi-chi-do\/zodiac-meo.webp&quot;\)/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /data-envelope-opening-fly="true"/);
  assert.match(html, /animation:demo-dragon-fly 1.2s ease-in forwards/);
});
