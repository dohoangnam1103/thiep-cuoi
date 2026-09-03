import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { parse } from "@formatjs/icu-messageformat-parser";

import vi from "../../messages/vi.json";
import { templates } from "../data/chungdoi";
import { generatedListingMessages } from "../data/templates/generated-data";
import {
  editorMessageNamespaces,
  homeMessageNamespaces,
  invitationMessageNamespaces,
  pricingMessageNamespaces,
  selectMessages,
} from "./message-scopes";

const messages = {
  ...vi,
  listing: { ...vi.listing, templates: { ...vi.listing.templates, ...generatedListingMessages.vi } },
};

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (file === "src/generated/prisma") return [];
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) ? [file] : [];
  });
}

const sources = new Map(sourceFiles("src").map((file) => [
  file, ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true),
]));

function valueAt(object: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((value, part) =>
    value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined, object);
}

function translationNamespace(call: ts.CallExpression): string | undefined {
  if (!["useTranslations", "getTranslations"].includes(call.expression.getText())) return undefined;
  let arg = call.arguments[0];
  if (arg && ts.isObjectLiteralExpression(arg)) {
    const property = arg.properties.find((prop) => ts.isPropertyAssignment(prop) && prop.name.getText() === "namespace");
    if (property && ts.isPropertyAssignment(property)) arg = property.initializer;
  }
  return arg && ts.isStringLiteralLike(arg) ? arg.text : undefined;
}

test("translation namespaces and literal keys exist throughout application source", () => {
  const failures: string[] = [];
  let checked = 0;
  for (const [file, source] of sources) {
    function visit(node: ts.Node, inherited: Map<string, string>) {
      const bindings = ts.isBlock(node) || ts.isSourceFile(node) ? new Map(inherited) : inherited;
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        const init = ts.isAwaitExpression(node.initializer) ? node.initializer.expression : node.initializer;
        if (ts.isCallExpression(init)) {
          const namespace = translationNamespace(init);
          if (namespace) bindings.set(node.name.text, namespace);
        }
      }
      if (ts.isCallExpression(node)) {
        const namespace = translationNamespace(node);
        if (namespace && valueAt(messages, namespace) === undefined) failures.push(`${file}: ${namespace}`);
        const callee = ts.isPropertyAccessExpression(node.expression) ? node.expression.expression : node.expression;
        if (ts.isIdentifier(callee) && bindings.has(callee.text)) {
          const key = node.arguments[0];
          // Computed keys are covered by the data/catalog and browser tests below.
          if (key && ts.isStringLiteralLike(key)) {
            const fullKey = `${bindings.get(callee.text)}.${key.text}`;
            checked++;
            if (valueAt(messages, fullKey) === undefined) {
              const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
              failures.push(`${file}:${line}: ${fullKey}`);
            }
          }
        }
      }
      ts.forEachChild(node, (child) => visit(child, bindings));
    }
    visit(source, new Map());
  }
  assert.ok(checked > 1900, `Unexpectedly low translation coverage: ${checked}`);
  assert.deepEqual(failures, []);
});

// Follow imports (including dynamic imports and re-exports), so adding a new
// template/hook automatically adds its required namespace to this contract.
function requiredNamespaces(file: string, visited = new Set<string>()): Set<string> {
  const result = new Set<string>();
  if (visited.has(file)) return result;
  visited.add(file);
  const source = sources.get(file);
  if (!source) return result;
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText() === "useTranslations") {
      const namespace = translationNamespace(node);
      if (namespace) result.add(namespace);
    }
    if (ts.isStringLiteral(node) && (node.text.startsWith("@/") || node.text.startsWith("."))) {
      const base = node.text.startsWith("@/") ? `src/${node.text.slice(2)}` : path.join(path.dirname(file), node.text);
      const dependency = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
        .find((candidate) => sources.has(candidate));
      if (dependency) for (const namespace of requiredNamespaces(dependency, visited)) result.add(namespace);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return result;
}

test("scoped payloads cover all hooks in their component dependency trees", () => {
  const cases = [
    ["src/components/chungdoi-clone.tsx", homeMessageNamespaces],
    ["src/components/chungdoi-pricing.tsx", pricingMessageNamespaces],
    ["src/components/chungdoi-demo.tsx", invitationMessageNamespaces],
    ["src/app/editor/[id]/EditorForm.tsx", editorMessageNamespaces],
    ["src/components/template-studio/template-studio.tsx", ["templateStudio"]],
    ["src/app/dashboard/[id]/guests/GuestManager.tsx", ["guestManager"]],
  ] as const;
  for (const [file, namespaces] of cases) {
    const payload = selectMessages(messages, namespaces);
    for (const namespace of requiredNamespaces(file)) {
      assert.ok(valueAt(payload, namespace), `${file} requires ${namespace}`);
    }
  }
});

test("every editor entry point supplies the shared preview scope", () => {
  for (const file of [
    "src/app/editor/layout.tsx",
    "src/app/admin/demos/[id]/page.tsx",
    "src/app/admin/invitations/[id]/edit/page.tsx",
  ]) {
    assert.match(readFileSync(file, "utf8"), /messages=\{selectMessages\(viMessages, editorMessageNamespaces\)\}/, file);
  }
  assert.doesNotMatch(readFileSync("src/components/chungdoi-demo.tsx", "utf8"), /NextIntlClientProvider/,
    "The renderer must inherit the complete invitation payload, including comicHero");
  assert.throws(() => selectMessages({ invitationTemplate: undefined } as never, invitationMessageNamespaces));
  assert.throws(() => selectMessages(messages, ["toString"]));
});

test("every catalog message has valid ICU syntax and is not a leaked translation key", () => {
  function visit(value: unknown, key = "") {
    if (typeof value === "string") {
      assert.notEqual(value, key, `Raw translation key stored as copy: ${key}`);
      assert.doesNotThrow(() => parse(value), `Invalid ICU message: ${key}`);
    } else if (value && typeof value === "object") {
      for (const [childKey, child] of Object.entries(value)) visit(child, key ? `${key}.${childKey}` : childKey);
    }
  }
  visit(messages);
});

test("dynamic listing keys cover every registered template, category and color", () => {
  for (const template of templates) {
    for (const key of [
      `listing.templates.${template.slug}.name`,
      `listing.templates.${template.slug}.description`,
      `listing.categories.${template.category}`,
      `listing.colors.${template.color}`,
    ]) assert.equal(typeof valueAt(messages, key), "string", key);
  }
});
