import assert from "node:assert/strict";
import test from "node:test";
import vi from "../../messages/vi.json";
import { completedTemplates, retiredTemplateSlugs } from "@/data/chungdoi";
import { assertTemplateSeoDetailContent, resolveTemplateSeoDetailContent, templateSeoDetailKey, templateSeoDetailPilotSlugs, templateSeoDetailStatus } from "@/data/template-seo-details";
import { templateDetailAlternates } from "@/lib/seo";

test("pilot detail catalog has a complete, distinct content contract", () => {
  const catalog = (vi as unknown as { templateSeoDetails: { items: Record<string, { [key: string]: unknown }> } }).templateSeoDetails;
  const items = catalog.items;
  const intros = new Set<string>();
  for (const slug of templateSeoDetailPilotSlugs) {
    assert.equal(templateSeoDetailStatus(slug), "enabled");
    assert.ok(completedTemplates.some((template) => template.slug === slug));
    const content = items[slug];
    assertTemplateSeoDetailContent(slug, content);
    intros.add(content.intro);
    assert.equal(content.steps.length, 3);
    assert.ok(content.faq.length >= 2);
    assert.ok(content.metaTitle.length < 60);
    assert.ok(content.metaDescription.length >= 140 && content.metaDescription.length <= 160);
    assert.ok(templateSeoDetailKey(completedTemplates.find((template) => template.slug === slug)!).endsWith(slug));
  }
  assert.equal(intros.size, templateSeoDetailPilotSlugs.length);
});

test("detail contract rejects self-links and unknown templates", () => {
  assert.throws(() => assertTemplateSeoDetailContent("song-hy-red", {
    metaTitle: "x", metaDescription: "x", heading: "x", intro: "x", imageAlt: "x",
    highlights: ["x"], suitableFor: ["x"], features: ["x"], steps: ["1", "2", "3"],
    faq: [{ question: "x", answer: "x" }, { question: "y", answer: "y" }],
    relatedSlugs: ["song-hy-red"], relatedBlogSlugs: [],
  }));
});

test("every non-retired completed template resolves complete fallback metadata", () => {
  const eligible = completedTemplates.filter((template) => !retiredTemplateSlugs.has(template.slug));
  assert.equal(eligible.length, 70);
  for (const template of eligible) {
    const content = resolveTemplateSeoDetailContent(template);
    assertTemplateSeoDetailContent(template.slug, content);
    assert.ok(content.relatedSlugs.every((slug) => slug !== template.slug));
    assert.ok(content.relatedSlugs.every((slug) => completedTemplates.some((candidate) => candidate.slug === slug)));
    assert.ok(content.metaTitle.length <= 60);
    assert.ok(content.metaDescription.length >= 140 && content.metaDescription.length <= 160);
  }
  for (const slug of retiredTemplateSlugs) {
    assert.equal(eligible.some((template) => template.slug === slug), false);
  }
});

test("every enabled template has authored Vietnamese detail content", () => {
  const catalog = (vi as unknown as {
    templateSeoDetails: { items: Record<string, unknown> };
  }).templateSeoDetails.items;
  const eligible = completedTemplates.filter((template) => !retiredTemplateSlugs.has(template.slug));
  assert.equal(Object.keys(catalog).length, eligible.length);
  for (const template of eligible) {
    const content = catalog[template.slug];
    assertTemplateSeoDetailContent(template.slug, content);
    const serialized = JSON.stringify(content);
    assert.doesNotMatch(serialized, /Chung ?Đôi|ChungDoi|dùng thử|miễn phí/i);
    assert.ok(content.metaTitle.length <= 60);
    assert.ok(content.metaDescription.length >= 140 && content.metaDescription.length <= 160);
  }
});

test("pilot detail alternates point at the detail URL", () => {
  const alternates = templateDetailAlternates("song-hy-do", "vi");
  assert.equal(alternates.canonical, "/mau-thiep/song-hy-do");
  assert.equal(alternates.languages["x-default"], "/mau-thiep/song-hy-do");
});


test("every non-retired completed template is enabled for detail pages", () => {
  for (const template of completedTemplates) {
    assert.equal(templateSeoDetailStatus(template.slug), "enabled");
  }
});
