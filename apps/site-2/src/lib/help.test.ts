import assert from "node:assert/strict";
import test from "node:test";

import { filterArticles, helpArticles, presentHelpCategories } from "./help";

test("help search finds the publish guide by a step keyword", () => {
  const found = filterArticles(helpArticles, "xuất bản", "all");
  assert.ok(found.some((article) => article.slug === "xuat-ban-thiep"));
});

test("help category filter narrows to that shelf", () => {
  const found = filterArticles(helpArticles, "", "thanh-toan");
  assert.ok(found.length > 0);
  assert.ok(found.every((article) => article.category === "thanh-toan"));
});

test("empty query returns every article and unknown text returns none", () => {
  assert.equal(filterArticles(helpArticles, "   ", "all").length, helpArticles.length);
  assert.equal(filterArticles(helpArticles, "zzz-khong-co", "all").length, 0);
});

test("only categories with articles are presented", () => {
  const presented = presentHelpCategories(helpArticles);
  assert.ok(!presented.includes("khach-moi"));
  assert.ok(presented.includes("bat-dau"));
});
