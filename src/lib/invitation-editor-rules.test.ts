import assert from "node:assert/strict";
import test from "node:test";

import { publicationIssue, validateInvitationSlug } from "./invitation-editor-rules";

const validDraft = {
  brideFullName: "Nguyễn Mai",
  groomFullName: "Trần Nam",
  date: "2026-12-20",
  time: "18:00",
};

test("publication requires bride, groom, date and time in order", () => {
  assert.deepEqual(publicationIssue({ ...validDraft, brideFullName: "" }), {
    errorCode: "coupleRequired",
    focusField: "brideFullName",
  });
  assert.deepEqual(publicationIssue({ ...validDraft, date: "" }), {
    errorCode: "dateRequired",
    focusField: "date",
  });
  assert.equal(publicationIssue(validDraft), null);
});

test("slug validation accepts lowercase path and rejects malformed values", () => {
  assert.deepEqual(validateInvitationSlug("mai-nam"), { available: true });
  assert.deepEqual(validateInvitationSlug("Mai Nam"), {
    available: false,
    reasonCode: "slugMalformed",
  });
});
