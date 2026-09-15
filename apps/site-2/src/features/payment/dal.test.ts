import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { before } from "node:test";

const dbFile = join(tmpdir(), `site2-payment-test-${process.pid}.db`);
process.env.DATABASE_URL = `file:${dbFile}`;
process.env.NEXT_PUBLIC_SITE_URL ??= "http://127.0.0.1:3222";
process.env.SITE2_PLAN_PRICE ??= "99000";

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

const SANDBOX_ENV = {
  SITE2_PAYMENT_ENABLED: "1",
  SITE2_PAYOS_SANDBOX: "1",
  SITE2_PLAN_PRICE: "99000",
};

function sign(data: Record<string, string | number>): string {
  return dal.signSite2WebhookData(data, "unit-checksum-key");
}

async function seedInvitation(email: string) {
  const user = await prisma.user.create({ data: { email } });
  const invitation = await prisma.invitation.create({
    data: {
      userId: user.id,
      templateId: "jasmine-white",
      status: "published",
      slug: `pay-${user.id.slice(-6)}`,
      content: { create: {} },
    },
  });
  return { user, invitation };
}

test("payment stays disabled without explicit site 2 configuration", () => {
  assert.equal(dal.resolveSite2PaymentFeature({}), "disabled");
  assert.equal(
    dal.resolveSite2PaymentFeature({ SITE2_PAYMENT_ENABLED: "1" }),
    "disabled",
  );
  assert.equal(dal.resolveSite2PaymentFeature(SANDBOX_ENV), "sandbox");
  assert.equal(
    dal.resolveSite2PaymentFeature({
      SITE2_PAYMENT_ENABLED: "1",
      SITE2_PLAN_PRICE: "99000",
      SITE2_PAYOS_CLIENT_ID: "c",
      SITE2_PAYOS_API_KEY: "k",
      SITE2_PAYOS_CHECKSUM_KEY: "s",
    }),
    "live",
  );
});

test("orders are idempotent per invitation", async () => {
  const { user, invitation } = await seedInvitation(
    `pay1-${Date.now()}@example.com`,
  );
  const first = await dal.createSite2Order(user.id, invitation.id, 99000);
  const second = await dal.createSite2Order(user.id, invitation.id, 99000);
  assert.equal(first.code, second.code);
  assert.match(first.code, /^S2-/);
  const count = await prisma.payment.count({
    where: { invitationId: invitation.id },
  });
  assert.equal(count, 1);
});

test("webhook rejects forged and foreign events", async () => {
  const { invitation } = await seedInvitation(`pay2-${Date.now()}@example.com`);
  const data = { orderCode: "SBX-unknown", amount: 99000, status: "PAID" } as const;

  const missing = await dal.applySite2WebhookEvent(
    { data: { ...data }, signature: "" },
    "unit-checksum-key",
  );
  assert.equal(missing.ok, false);

  const forged = await dal.applySite2WebhookEvent(
    { data: { ...data }, signature: "0".repeat(64) },
    "unit-checksum-key",
  );
  assert.equal(forged.ok, false);

  const foreign = await dal.applySite2WebhookEvent(
    { data: { ...data }, signature: sign({ ...data }) },
    "unit-checksum-key",
  );
  assert.equal(foreign.ok, true);
  assert.equal(
    await prisma.payment.count({ where: { invitationId: invitation.id } }),
    0,
  );
});

test("valid sandbox event pays once and unlocks the invitation", async () => {
  const { user, invitation } = await seedInvitation(
    `pay3-${Date.now()}@example.com`,
  );
  const order = await dal.checkoutSite2Order(
    user.id,
    invitation.id,
    dal.sandboxCheckoutProvider,
    { returnUrl: "http://x/return", cancelUrl: "http://x/cancel" },
  );
  const stored = await prisma.payment.findUniqueOrThrow({
    where: { code: order.code },
    select: { providerOrderCode: true },
  });
  const data = {
    orderCode: stored.providerOrderCode ?? "",
    amount: 99000,
    status: "PAID",
  } as const;
  const applied = await dal.applySite2WebhookEvent(
    { data: { ...data }, signature: sign({ ...data }) },
    "unit-checksum-key",
  );
  assert.equal(applied.ok, true);

  const view = await dal.getSite2OrderView(user.id, invitation.id);
  assert.equal(view.state, "paid");
  const unlocked = await prisma.invitation.findUniqueOrThrow({
    where: { id: invitation.id },
    select: { paid: true },
  });
  assert.equal(unlocked.paid, true);

  const replay = await dal.applySite2WebhookEvent(
    { data: { ...data }, signature: sign({ ...data }) },
    "unit-checksum-key",
  );
  assert.equal(replay.ok, true);
  assert.equal(
    await prisma.payment.count({ where: { invitationId: invitation.id } }),
    1,
  );
});

test("rogue non site-2 rows and strangers stay untouched", async () => {
  const { user, invitation } = await seedInvitation(
    `pay4-${Date.now()}@example.com`,
  );
  const other = await seedInvitation(`pay5-${Date.now()}@example.com`);
  await prisma.payment.create({
    data: {
      invitationId: invitation.id,
      code: "MASTER-1",
      amount: 99000,
      status: "pending",
      provider: "payos",
      providerOrderCode: " Rouge-Master-Code ".trim(),
    },
  });
  const data = {
    orderCode: "Rouge-Master-Code",
    amount: 99000,
    status: "PAID",
  } as const;
  const result = await dal.applySite2WebhookEvent(
    { data: { ...data }, signature: sign({ ...data }) },
    "unit-checksum-key",
  );
  assert.equal(result.ok, true);
  const rogue = await prisma.payment.findFirstOrThrow({
    where: { code: "MASTER-1" },
  });
  assert.equal(rogue.status, "pending");

  await assert.rejects(
    dal.getSite2OrderView(other.user.id, invitation.id),
    /Invitation not found/,
  );
  await assert.rejects(
    dal.createSite2Order(other.user.id, invitation.id, 99000),
    /Invitation not found/,
  );
});
