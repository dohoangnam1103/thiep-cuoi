import assert from "node:assert/strict";
import test from "node:test";
import { resolveTemplateConfig } from "./resolve-template.js";

test("invitation override wins over site variant and shared default", () => {
  const result = resolveTemplateConfig(
    {
      id: "jasmine-white",
      availableOn: ["master", "site-2"],
      defaultConfig: { fontSize: 48, color: "#404a1d", spacing: 24 },
      siteVariants: {
        "site-2": { fontSize: 52, color: "#334411" },
      },
    },
    "site-2",
    { fontSize: 56 },
  );

  assert.deepEqual(result, {
    fontSize: 56,
    color: "#334411",
    spacing: 24,
  });
});

test("resolving a master-only template for site-2 throws not available", () => {
  assert.throws(
    () =>
      resolveTemplateConfig(
        {
          id: "song-hy-red",
          availableOn: ["master"],
          defaultConfig: { fontSize: 48 },
        },
        "site-2",
      ),
    /not available/,
  );
});
