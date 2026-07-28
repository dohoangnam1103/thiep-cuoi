import assert from "node:assert/strict";
import test from "node:test";

import { generatedTemplateSlugs } from "@/data/templates/generated-data";
import {
  AUDITED_TEMPLATE_SLUGS,
  BASE_AUDITED_TEMPLATE_SLUGS,
  isAuditedTemplateSlug,
} from "@/lib/audited-template-renderers";

test("the dedicated renderer registry contains every base and generated template", () => {
  assert.equal(
    AUDITED_TEMPLATE_SLUGS.length,
    BASE_AUDITED_TEMPLATE_SLUGS.length + generatedTemplateSlugs.length,
  );
  assert.equal(new Set(AUDITED_TEMPLATE_SLUGS).size, AUDITED_TEMPLATE_SLUGS.length);
  for (const slug of AUDITED_TEMPLATE_SLUGS) assert.equal(isAuditedTemplateSlug(slug), true);
  assert.equal(isAuditedTemplateSlug("dragon-phoenix-red"), false);
});
