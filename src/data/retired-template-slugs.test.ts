import assert from "node:assert/strict";
import test from "node:test";

import { retiredTemplateSlugs } from "./chungdoi";
import { retiredTemplateRouteSlugs } from "./retired-template-slugs";

test("every retired template slug is covered by the permanent redirect routes", () => {
  const redirectSlugs = new Set<string>(retiredTemplateRouteSlugs);

  for (const slug of retiredTemplateSlugs) {
    assert.ok(redirectSlugs.has(slug), `Missing retired template redirect: ${slug}`);
  }
});
