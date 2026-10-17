import assert from "node:assert/strict";
import test from "node:test";
import { resolveTemplateConfig } from "./resolve-template.js";

test("invitation override wins over the production variant and shared default", () => {
  const result = resolveTemplateConfig(
    {
      id: "jasmine-white",
      availableOn: ["master"],
      defaultConfig: { fontSize: 48, color: "#404a1d", spacing: 24 },
      siteVariants: {
        master: { fontSize: 52, color: "#334411" },
      },
    },
    "master",
    { fontSize: 56 },
  );

  assert.deepEqual(result, {
    fontSize: 56,
    color: "#334411",
    spacing: 24,
  });
});

test("resolving a template with no available production target throws", () => {
  assert.throws(
    () =>
      resolveTemplateConfig(
        {
          id: "song-hy-red",
          availableOn: [],
          defaultConfig: { fontSize: 48 },
        },
        "master",
      ),
    /not available/,
  );
});
