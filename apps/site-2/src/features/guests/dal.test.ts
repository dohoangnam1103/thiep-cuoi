import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { before } from "node:test";

// Isolated SQLite file: DATABASE_URL must be set before the prisma client
// module loads, so the dal is imported dynamically after the env is ready.
const dbFile = join(tmpdir(), `site2-guests-test-${process.pid}.db`);
process.env.DATABASE_URL = `file:${dbFile}`;
process.env.NEXT_PUBLIC_SITE_URL ??= "http://127.0.0.1:3222";

const appDir = new URL("../../../", import.meta.url).pathname;

before(() => {
  execFileSync("npx", ["prisma", "db", "push", "--force-reset"], {
    cwd: appDir,
    env: process.env,
    stdio: "pipe",
  });
});

const dal = await import("./dal");
const { prisma } = await import("../../lib/prisma");

async function seedAccount(email: string) {
  const user = await prisma.user.create({ data: { email } });
  const invitation = await prisma.invitation.create({
    data: {
      userId: user.id,
      templateId: "jasmine-white",
      status: "draft",
      slug: `test-${user.id.slice(-6)}`,
      content: { create: {} },
    },
  });
  return { user, invitation };
}

test("owner manages guests and gets site-2 personal links", async () => {
  const { user, invitation } = await seedAccount(
    `owner-${Date.now()}@example.com`,
  );
  assert.deepEqual(await dal.listGuests(user.id, invitation.id), []);
  const created = await dal.createGuest(user.id, invitation.id, {
    name: "Nguyễn Văn A",
    group: "Nhà trai",
  });
  const guests = await dal.listGuests(user.id, invitation.id);
  assert.equal(guests.length, 1);
  assert.equal(guests[0]?.id, created.id);
  assert.equal(guests[0]?.attendance, "unknown");
  assert.match(
    guests[0]?.personalUrl ?? "",
    /^http:\/\/127\.0\.0\.1:3222\/thiep\/.+\?guest=.+/,
  );
});

test("guests of another account are unreachable", async () => {
  const a = await seedAccount(`a-${Date.now()}@example.com`);
  const b = await seedAccount(`b-${Date.now()}@example.com`);
  const victim = await dal.createGuest(b.user.id, b.invitation.id, {
    name: "Victim",
  });

  await assert.rejects(
    dal.listGuests(a.user.id, b.invitation.id),
    /Invitation not found/,
  );
  await assert.rejects(
    dal.createGuest(a.user.id, b.invitation.id, { name: "Intruder" }),
    /Invitation not found/,
  );
  await assert.rejects(
    dal.updateGuest(a.user.id, a.invitation.id, victim.id, { name: "Hacked" }),
    /Guest not found/,
  );
  await assert.rejects(
    dal.deleteGuest(a.user.id, a.invitation.id, victim.id),
    /Guest not found/,
  );
  const intact = await dal.listGuests(b.user.id, b.invitation.id);
  assert.equal(intact[0]?.name, "Victim");
});

test("blank guest names are rejected", () => {
  const result = dal.validateGuestInput({ name: "   " });
  assert.equal(result.ok, false);
});
