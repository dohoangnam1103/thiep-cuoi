import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import vi from "../../messages/vi.json";

const root = process.cwd();
const demoSource = readFileSync(join(root, "src/components/chungdoi-demo.tsx"), "utf8");
const wishFormSource = readFileSync(join(root, "src/components/chungdoi-tpl-shared.tsx"), "utf8");

test("audited dynamic template renderers receive invitation translations explicitly", () => {
  assert.match(demoSource, /NextIntlClientProvider/);
  assert.match(demoSource, /messages=\{\{ invitationTemplate: viMessages\.invitationTemplate \}\}/);
});

test("wish form uses catalog-backed Vietnamese validation messages", () => {
  assert.match(wishFormSource, /<form noValidate onSubmit=\{handleSubmit\}/);
  assert.match(wishFormSource, /setValidationError\(copy\.nameRequired\)/);
  assert.match(wishFormSource, /setValidationError\(copy\.textRequired\)/);
  assert.match(wishFormSource, /role="alert"/);
});

test("the invitation catalog includes required wish validation copy", () => {
  assert.equal(typeof vi.invitationTemplate.wishNameRequired, "string");
  assert.equal(typeof vi.invitationTemplate.wishTextRequired, "string");
});
