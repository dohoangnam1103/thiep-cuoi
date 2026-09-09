import assert from "node:assert/strict";
import test from "node:test";

import { resolveGiftVisual } from "./chungdoi-gift-visuals";

test("hoa mai watercolor resolves its dedicated gift envelope", () => {
  assert.deepEqual(resolveGiftVisual("hoa-mai-thuy-mac"), {
    kind: "layered-image",
    asset: "/chungdoi/images/envelope/hoa_mai_thuy_mac.webp",
  });
});
