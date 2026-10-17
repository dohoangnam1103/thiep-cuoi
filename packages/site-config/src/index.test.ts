import assert from "node:assert/strict";
import test from "node:test";
import {
  SITE_IDS,
  MASTER_SESSION_COOKIE,
  createSiteDefinition,
} from "./index.js";

test("site ids contain only the production app", () => {
  assert.deepEqual([...SITE_IDS], ["master"]);
});

test("production uses the session cookie", () => {
  assert.equal(MASTER_SESSION_COOKIE, "session");
});

test("master definition keeps its own cookie and origin", () => {
  const master = createSiteDefinition(
    "master",
    "https://thiepmungonline.com",
  );
  assert.equal(master.sessionCookieName, MASTER_SESSION_COOKIE);
  assert.equal(master.publicUrl, "https://thiepmungonline.com");
  assert.deepEqual(master.features, {
    payments: true,
    trialReminders: true,
    transactionalEmail: true,
  });
});
