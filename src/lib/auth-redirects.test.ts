import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_AUTH_RETURN_PATH,
  TEMPLATE_LIST_PATH,
  googleCompleteHref,
  loginHref,
  loginReasonHref,
  safeAuthReturnPath,
} from "./auth-redirects";

test("keeps local post-login paths and rejects external redirects", () => {
  assert.equal(safeAuthReturnPath("/mau-thiep"), "/mau-thiep");
  assert.equal(safeAuthReturnPath("//example.com"), DEFAULT_AUTH_RETURN_PATH);
  assert.equal(safeAuthReturnPath("/\\example.com"), DEFAULT_AUTH_RETURN_PATH);
  assert.equal(safeAuthReturnPath("https://example.com"), DEFAULT_AUTH_RETURN_PATH);
});

test("builds CTA and Google callback URLs for the protected template list", () => {
  assert.equal(loginHref(), `/login?next=${encodeURIComponent(TEMPLATE_LIST_PATH)}`);
  assert.equal(
    googleCompleteHref(TEMPLATE_LIST_PATH),
    `/auth/google/complete?next=${encodeURIComponent(TEMPLATE_LIST_PATH)}`,
  );
});


test("publication login preserves the private editor, intent and selected slug", () => {
  const next = "/editor2/private-invitation?publish=1&slug=lan-anh-minh-duc";
  const login = new URL(loginReasonHref("publish", next), "https://example.test");
  assert.equal(login.pathname, "/login");
  assert.equal(login.searchParams.get("reason"), "publish");
  assert.equal(login.searchParams.get("next"), next);
  const callback = new URL(googleCompleteHref(next), "https://example.test");
  assert.equal(callback.searchParams.get("next"), next);
});
