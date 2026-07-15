import assert from "node:assert/strict";
import test from "node:test";

import { AUDITED_TEMPLATE_SLUGS, isAuditedTemplateSlug } from "@/lib/audited-template-renderers";

test("the source-parity renderer registry contains all 17 unique templates", () => {
  assert.equal(AUDITED_TEMPLATE_SLUGS.length, 17);
  assert.equal(new Set(AUDITED_TEMPLATE_SLUGS).size, 17);
  for (const slug of AUDITED_TEMPLATE_SLUGS) assert.equal(isAuditedTemplateSlug(slug), true);
  assert.equal(isAuditedTemplateSlug("dragon-phoenix-red"), false);
});
