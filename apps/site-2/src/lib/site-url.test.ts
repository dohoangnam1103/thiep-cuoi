import assert from "node:assert/strict";
import test from "node:test";
import { resolveSite2Url } from "./site-url";

test("site 2 production requires its own HTTPS origin", () => {
  assert.throws(() => resolveSite2Url(undefined, "production"));
  assert.throws(() =>
    resolveSite2Url("https://thiepmungonline.com", "production"),
  );
  assert.equal(
    resolveSite2Url("https://site2.example", "production"),
    "https://site2.example",
  );
});
