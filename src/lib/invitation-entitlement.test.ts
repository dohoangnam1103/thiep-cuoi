import assert from "node:assert/strict";
import test from "node:test";

import {
  getInvitationActivation,
  isInvitationActivated,
  isInvitationExpired,
} from "./invitation-entitlement";
import { FREE_TRIAL_MS } from "./trial";

test("paid takes precedence over complimentary", () => {
  assert.equal(getInvitationActivation({ paid: true, complimentary: true }), "paid");
});

test("complimentary activates without claiming payment", () => {
  assert.equal(
    getInvitationActivation({ paid: false, complimentary: true }),
    "complimentary",
  );
  assert.equal(isInvitationActivated({ paid: false, complimentary: true }), true);
});

test("unpaid non-complimentary invitation remains trial", () => {
  assert.equal(getInvitationActivation({ paid: false, complimentary: false }), "trial");
});

test("complimentary invitation never expires", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");
  const publishedAt = new Date(now.getTime() - FREE_TRIAL_MS - 1);
  assert.equal(
    isInvitationExpired({ paid: false, complimentary: true, publishedAt }, now),
    false,
  );
});

test("trial expires after the configured window", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");
  const publishedAt = new Date(now.getTime() - FREE_TRIAL_MS);
  assert.equal(
    isInvitationExpired({ paid: false, complimentary: false, publishedAt }, now),
    true,
  );
});
