import assert from "node:assert/strict";
import test from "node:test";
import { SITE2_SESSION_COOKIE } from "./session";
import { resolveMediaRoot } from "./media-paths";

test("site 2 uses namespaced session and data-root media", () => {
  assert.equal(SITE2_SESSION_COOKIE, "site2_session");
  assert.equal(resolveMediaRoot("/app/data"), "/app/data/media");
  assert.notEqual(SITE2_SESSION_COOKIE, "session");
});
