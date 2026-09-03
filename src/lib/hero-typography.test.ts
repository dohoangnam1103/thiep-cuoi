import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
import { HERO_FONT_OPTIONS, ORIGINAL_HERO_TYPOGRAPHY, heroTypographySchema, resolveHeroTypography } from "./hero-typography";

test("user font wins, admin styles remain, originals survive null settings", () => {
  assert.deepEqual(resolveHeroTypography(undefined), ORIGINAL_HERO_TYPOGRAPHY);
  const admin = { fontFamily: "Pattaya", bold: true, italic: false };
  assert.equal(resolveHeroTypography(admin).fontFamily, "Pattaya");
  assert.deepEqual(resolveHeroTypography(admin, "Fz Aghita"), { ...admin, fontFamily: "Fz Aghita" });
  assert.equal(resolveHeroTypography(admin, "  ").fontFamily, "Pattaya");
});

test("only available fonts and typed style controls may be persisted", () => {
  for (const font of HERO_FONT_OPTIONS) assert.ok(heroTypographySchema.safeParse({ fontFamily: font.value, bold: null, italic: false }).success);
  for (const value of [null, { fontFamily: "url(https://invalid)", bold: false, italic: false }, { ...ORIGINAL_HERO_TYPOGRAPHY, bold: "false" }, { ...ORIGINAL_HERO_TYPOGRAPHY, templateId: "other" }]) assert.equal(heroTypographySchema.safeParse(value).success, false);
});

test("hero markers never target containers, footers or the ampersand", () => {
  let count = 0;
  for (const name of readdirSync("src/components").filter(name => name.startsWith("chungdoi-tpl-") && name.endsWith(".tsx"))) {
    const file = `src/components/${name}`;
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node: ts.Node) {
      if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(prop => ts.isJsxAttribute(prop) && prop.name.getText(source) === "data-invitation-short-name")) {
        count++;
        assert.ok(node.children.every(child => ts.isJsxExpression(child) || (ts.isJsxText(child) && !child.text.trim())), `${file}: marker must contain only name expressions`);
        for (const child of node.children) if (ts.isJsxExpression(child) && child.expression) {
          assert.ok(!child.expression.getText(source).includes("<"), `${file}: nested markup could style other text`);
        }
        let parent: ts.Node | undefined = node.parent;
        while (parent) { if (ts.isJsxElement(parent)) assert.notEqual(parent.openingElement.tagName.getText(source), "footer", file); parent = parent.parent; }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.ok(count > 90);
});

test("all picker families have scoped CSS rules without changing unmarked text", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  for (const font of HERO_FONT_OPTIONS) assert.ok(css.includes(`[data-hero-font="${font.value}"] [data-invitation-short-name]`), font.value);
});
