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
