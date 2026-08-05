import assert from "node:assert/strict";
import test from "node:test";

import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ZODIAC_IDS, zodiacArtworkPath } from "@/lib/zodiac";

type ZodiacHeroPairProps = {
  heroLeft: string;
  heroRight: string;
};

test("the contained zodiac hero pair supports every animal without Phoenix offsets", async () => {
  const phoenixModule = await import("./chungdoi-tpl-phoenix") as unknown as {
    ZodiacHeroPair?: ComponentType<ZodiacHeroPairProps>;
  };
  const ZodiacHeroPair = phoenixModule.ZodiacHeroPair;

  assert.equal(typeof ZodiacHeroPair, "function");
  if (!ZodiacHeroPair) return;

  for (const id of ZODIAC_IDS) {
    const path = zodiacArtworkPath(id);
    const html = renderToStaticMarkup(createElement(ZodiacHeroPair, {
      heroLeft: path,
      heroRight: path,
    }));

    assert.match(html, /data-zodiac-hero-slot="left"/);
    assert.match(html, /data-zodiac-hero-slot="right"/);
    assert.equal(html.match(/data-zodiac-hero-contained="true"/g)?.length, 2, id);
    assert.equal(html.match(/data-zodiac-artwork=/g)?.length, 2, id);
    assert.equal(html.match(new RegExp(path, "g"))?.length, 4, id);
    assert.match(html, /data-parallax="-0.15"/);
    assert.match(html, /data-parallax="0.15"/);
    assert.match(
      html,
      /data-zodiac-hero-facing="left"[^>]*class="[^"]*-scale-x-100/,
      id,
    );
    assert.doesNotMatch(html, /data-zodiac-hero-slot="right"[^>]*data-flip=/, id);
    assert.doesNotMatch(
      html,
      /left-\[-90px\]|md:left-\[-169px\]|top-\[-120px\]|md:top-\[-225px\]/,
      id,
    );
  }
});
