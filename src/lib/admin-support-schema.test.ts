import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync("prisma/schema.prisma", "utf8");

test("Invitation separates complimentary activation from paid payments", () => {
  assert.match(schema, /adminPriceOverride\s+Int\?/);
  assert.match(schema, /complimentary\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /complimentaryAt\s+DateTime\?/);
});

test("AdminAuditLog preserves actor and target snapshots", () => {
  assert.match(schema, /model AdminAuditLog\s*\{/);
  assert.match(schema, /adminEmail\s+String/);
  assert.match(schema, /targetUserEmail\s+String\?/);
  assert.match(schema, /onDelete:\s*SetNull/);
  assert.match(schema, /@@index\(\[targetUserId, createdAt\]\)/);
  assert.match(schema, /@@index\(\[invitationId, createdAt\]\)/);
  assert.match(schema, /@@index\(\[adminId, createdAt\]\)/);
});

test("email operations retain recipient snapshots and optional invitation context", () => {
  assert.match(schema, /model EmailRun\s*\{/);
  assert.match(schema, /model EmailDelivery\s*\{/);
  assert.match(schema, /model EmailDeliveryAttempt\s*\{/);
  assert.match(schema, /dedupeKey\s+String\s+@unique/);
  assert.match(schema, /recipientEmail\s+String/);
  assert.match(schema, /html\s+String/);
  assert.match(schema, /invitationId\s+String\?/);
  assert.match(schema, /status\s+String\s+@default\("running"\)/);
  assert.match(schema, /errorMessage\s+String\?/);
  assert.match(schema, /onDelete:\s*SetNull/);
  assert.match(schema, /@@index\(\[runId, attemptedAt\]\)/);
});
