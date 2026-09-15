import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { before } from "node:test";

const dbFile = join(tmpdir(), `site2-rsvp-test-${process.pid}.db`);
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

async function seedPublished(email: string, slug: string) {
  const user = await prisma.user.create({ data: { email } });
  const invitation = await prisma.invitation.create({
    data: {
      userId: user.id,
      templateId: "jasmine-white",
      status: "published",
      slug,
      content: { create: {} },
    },
  });
  const guest = await prisma.guest.create({
    data: { invitationId: invitation.id, token: `tok-${slug}`, name: "Khách A" },
  });
  return { user, invitation, guest };
}

test("valid guest response is recorded and summarized", async () => {
  const { invitation, guest } = await seedPublished(
    `r1-${Date.now()}@example.com`,
    `rsvp-one-${Date.now()}`,
  );
  const result = await dal.submitPublicRsvp({
    slug: invitation.slug ?? "",
    token: guest.token,
    name: "Khách A",
    attending: true,
    partySize: 1,
    message: "Chắc chắn đến!",
  });
  assert.equal(result.ok, true);

  const owner = await prisma.invitation.findUniqueOrThrow({
    where: { id: invitation.id },
    select: { userId: true },
  });
  const summary = await dal.getRsvpSummary(owner.userId, invitation.id);
  assert.equal(summary.attendingGuests, 1);
  assert.equal(summary.declinedGuests, 0);
  assert.equal(summary.pendingGuests, 0);
  assert.equal(summary.responses.length, 1);
  assert.equal(summary.responses[0]?.guestName, "Khách A");
});

test("duplicate guest submissions update one response", async () => {
  const { invitation, guest } = await seedPublished(
    `r2-${Date.now()}@example.com`,
    `rsvp-two-${Date.now()}`,
  );
  await dal.submitPublicRsvp({
    slug: invitation.slug ?? "",
    token: guest.token,
    name: "Khách A",
    attending: true,
    partySize: 1,
  });
  const second = await dal.submitPublicRsvp({
    slug: invitation.slug ?? "",
    token: guest.token,
    name: "Khách A",
    attending: false,
    partySize: 1,
    message: "Bận đột xuất",
  });
  assert.equal(second.ok, true);

  const count = await prisma.rsvp.count({
    where: { invitationId: invitation.id },
  });
  assert.equal(count, 1);
  const owner = await prisma.invitation.findUniqueOrThrow({
    where: { id: invitation.id },
    select: { userId: true },
  });
  const summary = await dal.getRsvpSummary(owner.userId, invitation.id);
  assert.equal(summary.attendingGuests, 0);
  assert.equal(summary.declinedGuests, 1);
});

test("foreign guest tokens and strangers are rejected", async () => {
  const a = await seedPublished(`r3a-${Date.now()}@example.com`, `rsvp-a-${Date.now()}`);
  const b = await seedPublished(`r3b-${Date.now()}@example.com`, `rsvp-b-${Date.now()}`);
  const cross = await dal.submitPublicRsvp({
    slug: a.invitation.slug ?? "",
    token: b.guest.token,
    name: "Xâm nhập",
    attending: true,
    partySize: 1,
  });
  assert.equal(cross.ok, false);

  const owner = await prisma.invitation.findUniqueOrThrow({
    where: { id: a.invitation.id },
    select: { userId: true },
  });
  await assert.rejects(
    dal.getRsvpSummary(b.user.id, a.invitation.id),
    /Invitation not found/,
  );
  const summary = await dal.getRsvpSummary(owner.userId, a.invitation.id);
  assert.equal(summary.responses.length, 0);
  assert.equal(summary.pendingGuests, 1);
});

test("guest prefill stays inside its own invitation", async () => {
  const a = await seedPublished(`r4a-${Date.now()}@example.com`, `rsvp-c-${Date.now()}`);
  const b = await seedPublished(`r4b-${Date.now()}@example.com`, `rsvp-d-${Date.now()}`);
  const own = await dal.resolveGuestPrefill(a.invitation.id, a.guest.token);
  assert.equal(own?.name, "Khách A");
  assert.equal(
    await dal.resolveGuestPrefill(a.invitation.id, b.guest.token),
    null,
  );
  assert.equal(
    await dal.resolveGuestPrefill(a.invitation.id, "nope"),
    null,
  );
});
