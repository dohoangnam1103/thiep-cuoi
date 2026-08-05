import assert from "node:assert/strict";
import test from "node:test";

import { templateSupportsZodiac } from "./editor-template-capabilities";

test("only the Thập Nhị Chi template exposes zodiac editor fields", () => {
  assert.equal(templateSupportsZodiac("thap-nhi-chi-do"), true);
  assert.equal(templateSupportsZodiac("double-phoenix-red"), false);
  assert.equal(templateSupportsZodiac("double-phoenix-green"), false);
  assert.equal(templateSupportsZodiac("unknown-template"), false);
});
