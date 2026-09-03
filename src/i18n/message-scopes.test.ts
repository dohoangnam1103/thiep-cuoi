import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vi from "../../messages/vi.json";
import { homeMessageNamespaces, invitationMessageNamespaces, pricingMessageNamespaces, selectMessages } from "./message-scopes";

test("public scopes exclude editor/admin text and keep their required namespaces", () => {
  for (const keys of [homeMessageNamespaces, pricingMessageNamespaces, invitationMessageNamespaces]) {
    const messages = selectMessages(vi, keys);
    assert.deepEqual(Object.keys(messages), [...keys]);
    assert.equal(messages.editor, undefined);
    assert.ok(JSON.stringify(messages).length < JSON.stringify(vi).length / 2);
  }
  assert.throws(() => selectMessages(vi, ["missing_namespace"]));
});

test("localized branches have providers and the root retains error-boundary copy", () => {
  const root = readFileSync("src/app/[locale]/layout.tsx", "utf8");
  assert.match(root, /RouteMessages namespaces=\{\["errorBoundary"\]\}/);
  for (const route of ["help", "blog", "home-2", "lab", "tools", "create-wedding-invitation-online", "terms-of-service", "privacy-policy", "refund-policy", "templates/style", "templates/color"]) {
    assert.match(readFileSync(`src/app/[locale]/${route}/layout.tsx`, "utf8"), /RouteMessages/);
  }
});

test("client invitation renderer no longer imports the full catalog", () => {
  const source = readFileSync("src/components/chungdoi-demo.tsx", "utf8");
  assert.doesNotMatch(source, /import .*messages\/vi.json/);
  assert.doesNotMatch(source, /NextIntlClientProvider/);
  assert.doesNotMatch(readFileSync("src/components/chungdoi-tpl-shared.tsx", "utf8"), /import .*messages\/vi.json/);
});
