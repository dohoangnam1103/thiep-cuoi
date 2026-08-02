import assert from "node:assert/strict";
import test from "node:test";

import {
  INVITATION_SCENIC_PAUSE_MS,
  getInvitationContentState,
} from "./invitation-content-visibility";

test("invitation content preserves a half-second background-only pause", () => {
  assert.equal(INVITATION_SCENIC_PAUSE_MS, 500);
});

test("invitation content stays hidden in transit and pauses after arrival", () => {
  assert.equal(
    getInvitationContentState({
      activeIndex: 2,
      phase: "travelling",
      revealedIndex: 2,
    }),
    "hidden",
  );
  assert.equal(
    getInvitationContentState({
      activeIndex: 2,
      phase: "settled",
      revealedIndex: null,
    }),
    "scenic-pause",
  );
  assert.equal(
    getInvitationContentState({
      activeIndex: 2,
      phase: "fallback-settled",
      revealedIndex: null,
    }),
    "scenic-pause",
  );
});

test("only the revealed settled checkpoint exposes invitation content", () => {
  assert.equal(
    getInvitationContentState({
      activeIndex: 3,
      phase: "settled",
      revealedIndex: 3,
    }),
    "visible",
  );
  assert.equal(
    getInvitationContentState({
      activeIndex: 3,
      phase: "fallback-settled",
      revealedIndex: 3,
    }),
    "visible",
  );
  assert.equal(
    getInvitationContentState({
      activeIndex: 3,
      phase: "settled",
      revealedIndex: 2,
    }),
    "scenic-pause",
  );
  assert.equal(
    getInvitationContentState({
      activeIndex: 3,
      phase: "threshold",
      revealedIndex: 3,
    }),
    "hidden",
  );
});
