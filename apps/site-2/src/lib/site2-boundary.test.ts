import assert from "node:assert/strict";
import test from "node:test";

import { assertSite2Path } from "./site2-boundary";

test("accepts site 2 sources and rejects site 1 sources", () => {
  assert.doesNotThrow(() => assertSite2Path("apps/site-2/src/app/page.tsx"));
  assert.throws(
    () => assertSite2Path("src/app/page.tsx"),
    /outside site 2 scope/,
  );
});
