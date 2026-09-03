import assert from "node:assert/strict";
import test from "node:test";
import { getDemoFontFamily } from "./demo-font-default";

test("font defaults read only the selected template's demo and return a copied value", async () => {
  let family = "Fz Aghita";
  const db = { invitation: { findFirst: async (query: unknown) => {
    assert.deepEqual(query, {
      where: { templateId: "minimalism-green", isDemo: true },
      select: { content: { select: { fontFamily: true } } },
    });
    return { content: { fontFamily: family } };
  } } } as unknown as Parameters<typeof getDemoFontFamily>[0];
  const firstInvitationFont = await getDemoFontFamily(db, "minimalism-green");
  family = "Fz Qellia";
  assert.equal(await getDemoFontFamily(db, "minimalism-green"), "Fz Qellia");
  assert.equal(firstInvitationFont, "Fz Aghita");
});

test("no demo or no selected font keeps the template's original default", async () => {
  for (const demo of [null, { content: null }, { content: { fontFamily: "" } }]) {
    const db = { invitation: { findFirst: async () => demo } } as unknown as Parameters<typeof getDemoFontFamily>[0];
    assert.equal(await getDemoFontFamily(db, "minimalism-green"), "");
  }
});
