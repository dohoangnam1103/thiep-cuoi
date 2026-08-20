import assert from "node:assert/strict";
import test from "node:test";

import { completedTemplates } from "@/data/chungdoi";
import {
  colorTemplateSeoFacets,
  findTemplateSeoFacet,
  styleTemplateSeoFacets,
  templateSeoFacets,
  templatesForSeoFacet,
} from "@/data/template-seo-facets";

test("curates a unique, intentionally small set of indexable template facets", () => {
  const ids = templateSeoFacets.map((facet) => facet.id);
  const paths = templateSeoFacets.map((facet) => `${facet.kind}/${facet.slug}`);

  assert.equal(templateSeoFacets.length, 7);
  assert.equal(styleTemplateSeoFacets.length, 4);
  assert.equal(colorTemplateSeoFacets.length, 3);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(templateSeoFacets.every((facet) => String(facet.filterValue) !== "All"));
});

test("every indexable facet has a substantial matching collection", () => {
  for (const facet of templateSeoFacets) {
    const templates = templatesForSeoFacet(facet);

    assert.ok(
      templates.length >= 6,
      `${facet.id} must not become an indexable thin collection`,
    );
    assert.ok(templates.every((template) => completedTemplates.includes(template)));
    assert.ok(templates.every(
      (template) => template[facet.filterKey] === facet.filterValue,
    ));
    assert.equal(findTemplateSeoFacet(facet.kind, facet.slug), facet);
  }

  assert.equal(findTemplateSeoFacet("style", "khong-ton-tai"), undefined);
  assert.equal(findTemplateSeoFacet("color", "hong"), undefined);
});
