import assert from "node:assert/strict";
import test from "node:test";

import { createTemplateSeoDetailFallback } from "@/data/template-seo-details";
import { completedTemplates } from "@/data/chungdoi";
import {
  isOverridableTemplateSlug,
  overrideContent,
  parseTemplateSeoOverrideRow,
  sanitizeRelatedSlugs,
  templateSeoOverrideContentSchema,
  templateSeoOverrideSchema,
} from "@/lib/template-seo-override-schema";

const template = completedTemplates.find((candidate) => candidate.slug === "song-hy-red");
assert.ok(template, "fixture template song-hy-red must exist");

const validContent = createTemplateSeoDetailFallback(template);

test("accepts the generated catalog fallback as a valid override payload", () => {
  const parsed = templateSeoOverrideContentSchema.safeParse(validContent);
  assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
});

test("rejects a blank meta title instead of letting the page render an empty <title>", () => {
  const parsed = templateSeoOverrideContentSchema.safeParse({ ...validContent, metaTitle: "   " });
  assert.equal(parsed.success, false);
});

test("rejects an empty highlights array because the section renders a required list", () => {
  const parsed = templateSeoOverrideContentSchema.safeParse({ ...validContent, highlights: [] });
  assert.equal(parsed.success, false);
});

test("pins the step count to the three the ordered list is laid out for", () => {
  assert.equal(
    templateSeoOverrideContentSchema.safeParse({ ...validContent, steps: ["a", "b"] }).success,
    false,
  );
  assert.equal(
    templateSeoOverrideContentSchema.safeParse({ ...validContent, steps: ["a", "b", "c", "d"] }).success,
    false,
  );
  assert.equal(
    templateSeoOverrideContentSchema.safeParse({ ...validContent, steps: ["a", "b", "c"] }).success,
    true,
  );
});

test("rejects a FAQ entry with an empty answer, which would emit an invalid FAQPage node", () => {
  const parsed = templateSeoOverrideContentSchema.safeParse({
    ...validContent,
    faq: [{ question: "Có mất phí không?", answer: "" }],
  });
  assert.equal(parsed.success, false);
});

test("rejects more related templates than the three-column grid holds", () => {
  const parsed = templateSeoOverrideContentSchema.safeParse({
    ...validContent,
    relatedSlugs: ["a", "b", "c", "d"],
  });
  assert.equal(parsed.success, false);
});

test("only accepts the four robots combinations the metadata builder understands", () => {
  for (const robots of ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"]) {
    assert.equal(
      templateSeoOverrideSchema.safeParse({ slug: "song-hy-red", robots, content: validContent }).success,
      true,
      robots,
    );
  }
  assert.equal(
    templateSeoOverrideSchema.safeParse({ slug: "song-hy-red", robots: "index", content: validContent }).success,
    false,
  );
});

test("drops related slugs that are unknown, retired, or the page itself", () => {
  const result = sanitizeRelatedSlugs(
    "song-hy-red",
    ["song-hy-red", "song-hy-green", "khong-ton-tai"],
    ["thu-moi-cuoi-online"],
  );
  assert.deepEqual(result.relatedSlugs, ["song-hy-green"]);
  assert.deepEqual(result.relatedBlogSlugs, ["thu-moi-cuoi-online"]);
});

test("refuses to treat a retired template slug as overridable", () => {
  assert.equal(isOverridableTemplateSlug("song-hy-red"), true);
  assert.equal(isOverridableTemplateSlug("khong-ton-tai"), false);
});

test("overrideContent returns the stored content object the view consumes", () => {
  const override = templateSeoOverrideSchema.parse({
    slug: "song-hy-red",
    robots: "index,follow",
    content: validContent,
  });
  assert.equal(overrideContent(override).heading, validContent.heading);
  assert.equal(overrideContent(override).faq.length, validContent.faq.length);
});

test("a malformed stored row is dropped rather than thrown, so the page falls back", () => {
  assert.equal(
    parseTemplateSeoOverrideRow({ slug: "song-hy-red", content: "{not json", robots: "index,follow" }),
    null,
  );
  assert.equal(
    parseTemplateSeoOverrideRow({ slug: "song-hy-red", content: JSON.stringify({ heading: "x" }), robots: "index,follow" }),
    null,
  );
  assert.equal(
    parseTemplateSeoOverrideRow({ slug: "song-hy-red", content: JSON.stringify(validContent), robots: "index" }),
    null,
  );
});

test("a well-formed stored row parses back into the content object", () => {
  const parsed = parseTemplateSeoOverrideRow({
    slug: "song-hy-red",
    content: JSON.stringify(validContent),
    robots: "noindex,follow",
  });
  assert.ok(parsed);
  assert.equal(parsed.robots, "noindex,follow");
  assert.equal(parsed.content.heading, validContent.heading);
});
