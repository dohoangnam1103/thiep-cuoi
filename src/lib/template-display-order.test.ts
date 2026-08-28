import assert from "node:assert/strict";
import test from "node:test";

import { sortByTemplateDisplayOrder } from "./template-display-order";

const templates = [
  { slug: "first" },
  { slug: "second" },
  { slug: "third" },
];

test("template display order uses persisted positions", () => {
  const sorted = sortByTemplateDisplayOrder(
    templates,
    { first: 2, second: 0, third: 1 },
    (template) => template.slug,
  );

  assert.deepEqual(sorted.map((template) => template.slug), [
    "second",
    "third",
    "first",
  ]);
});

test("template display order keeps stable fallback for new templates", () => {
  const sorted = sortByTemplateDisplayOrder(
    templates,
    { third: 0 },
    (template) => template.slug,
    { first: 0, second: 1, third: 2 },
  );

  assert.deepEqual(sorted.map((template) => template.slug), [
    "third",
    "first",
    "second",
  ]);
});
