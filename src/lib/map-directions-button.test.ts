import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MapDirectionsButton } from "@/components/chungdoi-tpl-shared";

test("MapDirectionsButton keeps icon and label inline when a color class is supplied", () => {
  const html = renderToStaticMarkup(createElement(MapDirectionsButton, {
    className: "text-[#8c3b2f]",
    query: "Hanoi",
  }));

  assert.match(html, /class="[^"]*inline-flex[^"]*"/);
  assert.match(html, /class="[^"]*items-center[^"]*"/);
  assert.match(html, /class="[^"]*text-\[#8c3b2f\][^"]*"/);
});
