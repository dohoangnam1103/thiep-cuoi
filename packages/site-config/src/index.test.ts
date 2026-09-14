import assert from "node:assert/strict";
import test from "node:test";
import {
  SITE_IDS,
  MASTER_SESSION_COOKIE,
  SITE2_SESSION_COOKIE,
  createSiteDefinition,
} from "./index.js";

test("site ids are exactly master and site-2", () => {
  assert.deepEqual([...SITE_IDS], ["master", "site-2"]);
});

test("master and site-2 have isolated session cookies", () => {
  assert.equal(MASTER_SESSION_COOKIE, "session");
  assert.equal(SITE2_SESSION_COOKIE, "site2_session");
  assert.notEqual(MASTER_SESSION_COOKIE, SITE2_SESSION_COOKIE);
});

test("site-2 MVP disables payments, reminders and transactional email", () => {
  const site2 = createSiteDefinition("site-2", "https://site2.example");
  assert.equal(site2.id, "site-2");
  assert.equal(site2.sessionCookieName, SITE2_SESSION_COOKIE);
  assert.deepEqual(site2.features, {
    payments: false,
    trialReminders: false,
    transactionalEmail: false,
  });
});

test("master definition keeps its own cookie and origin", () => {
  const master = createSiteDefinition(
    "master",
    "https://thiepmungonline.com",
  );
  assert.equal(master.sessionCookieName, MASTER_SESSION_COOKIE);
  assert.equal(master.publicUrl, "https://thiepmungonline.com");
});
