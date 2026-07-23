import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_AUTH_RETURN_PATH,
  TEMPLATE_LIST_PATH,
  googleCompleteHref,
  loginHref,
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
