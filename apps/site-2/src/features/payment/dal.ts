import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { prisma } from "../../lib/prisma";
import type {
  Site2CheckoutProvider,
  Site2OrderView,
  Site2PaymentMode,
  Site2WebhookData,
  Site2WebhookEvent,
} from "./types";

/* Site-2 payment boundary. Env names, order codes and webhook secrets are all
 * namespaced away from site 1: nothing here reads PAYOS_* or master return
 * URLs, and no master credential ever unlocks a site-2 order. */

export const SITE2_ORDER_PREFIX = "S2-";
const TERMINAL_STATES = ["paid", "expired", "failed"] as const;

function readAmount(env: Record<string, string | undefined>): number | null {
  const amount = Number(env.SITE2_PLAN_PRICE);
  return Number.isInteger(amount) && amount > 0 ? amount : null;
}

/* Disabled unless explicitly enabled with a real amount, plus either the
 * sandbox switch or the full live credential set. */
export function resolveSite2PaymentFeature(
  env: Record<string, string | undefined> = process.env,
): Site2PaymentMode {
  if (env.SITE2_PAYMENT_ENABLED !== "1") return "disabled";
  if (readAmount(env) === null) return "disabled";
  if (env.SITE2_PAYOS_SANDBOX === "1") return "sandbox";
  if (
    env.SITE2_PAYOS_CLIENT_ID &&
    env.SITE2_PAYOS_API_KEY &&
    env.SITE2_PAYOS_CHECKSUM_KEY
  ) {
    return "live";
  }
  return "disabled";
}

export function getSite2PlanAmount(
  env: Record<string, string | undefined> = process.env,
): number | null {
  return readAmount(env);
}

function buildSignatureData(data: Record<string, string | number>): string {
  return Object.keys(data)
    .sort()
    .map((key) => `${key}=${String(data[key])}`)
    .join("&");
}

export function signSite2WebhookData(
  data: Record<string, string | number>,
  checksumKey: string,
): string {
  return createHmac("sha256", checksumKey)
    .update(buildSignatureData(data))
    .digest("hex");
}

export function verifySite2WebhookSignature(
  data: Record<string, string | number>,
  signature: string,
  checksumKey: string,
): boolean {
  if (!signature || !checksumKey) return false;
  const expected = signSite2WebhookData(data, checksumKey);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/* Sandbox checkout: no network, no charge, deterministic provider codes so
 * E2E can settle orders without secrets leaking into assertions. */
export const sandboxCheckoutProvider: Site2CheckoutProvider = {
  async createCheckout(input) {
    return {
      providerOrderCode: `SBX-${input.code}`,
      checkoutUrl: null,
      qrCode: `SANDBOX:${input.code}:${input.amount}`,
    };
  },
};

async function requireOwnedInvitation(userId: string, invitationId: string) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId },
    select: { id: true },
  });
  if (!invitation) {
    throw new Error("Invitation not found");
  }
  return invitation;
}

function orderCode(): string {
  return `${SITE2_ORDER_PREFIX}${randomUUID().slice(0, 8).toLowerCase()}`;
}

async function insertOrder(
  userId: string,
  invitationId: string,
  amount: number,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.payment.create({
        data: {
          invitationId,
          code: orderCode(),
          amount,
          status: "unpaid",
          provider: "payos",
        },
        select: { code: true, amount: true, status: true },
      });
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: string }).code
          : undefined;
      if (attempt < 2 && code === "P2002") continue;
      throw error;
    }
  }
  throw new Error("Could not mint a payment code");
}

export async function createSite2Order(
  userId: string,
  invitationId: string,
  amount: number,
): Promise<{ code: string; amount: number; status: string }> {
  await requireOwnedInvitation(userId, invitationId);
  const existing = await prisma.payment.findFirst({
    where: {
      invitationId,
      status: { notIn: [...TERMINAL_STATES] },
    },
    orderBy: { createdAt: "desc" },
    select: { code: true, amount: true, status: true },
  });
  if (existing) return existing;
  return insertOrder(userId, invitationId, amount);
}

export async function checkoutSite2Order(
  userId: string,
  invitationId: string,
  provider: Site2CheckoutProvider,
  urls: { returnUrl: string; cancelUrl: string },
): Promise<{ code: string; amount: number; status: string }> {
  const invitation = await requireOwnedInvitation(userId, invitationId);
  const amount = getSite2PlanAmount();
  if (amount === null) {
    throw new Error("Payment is not configured");
  }
  const order = await createSite2Order(userId, invitation.id, amount);
  const stored = await prisma.payment.findUniqueOrThrow({
    where: { code: order.code },
    select: { providerOrderCode: true },
  });
  if (stored.providerOrderCode) return order;
  const checkout = await provider.createCheckout({
    code: order.code,
    amount: order.amount,
    description: order.code,
    returnUrl: urls.returnUrl,
    cancelUrl: urls.cancelUrl,
  });
  await prisma.payment.update({
    where: { code: order.code },
    data: {
      status: "pending",
      providerOrderCode: checkout.providerOrderCode,
      providerCheckoutUrl: checkout.checkoutUrl,
      providerQrCode: checkout.qrCode,
    },
  });
  return { ...order, status: "pending" };
}

function webhookStatus(
  status: Site2WebhookData["status"],
): "paid" | "expired" | "failed" {
  if (status === "PAID") return "paid";
  if (status === "FAILED") return "failed";
  return "expired";
}

/* Applies one provider webhook event. Verification runs before any lookup so
 * forged events die cheaply; unknown order codes (including the master order
 * namespace, which never lands in site-2 rows) are acknowledged without
 * touching state so providers stop retrying. Paid is sticky: once an order
 * is paid, later events cannot move it. */
export async function applySite2WebhookEvent(
  event: Site2WebhookEvent,
  checksumKey: string,
): Promise<
  | { ok: true; status?: string; ignored?: boolean }
  | { ok: false; error: string }
> {
  const data = event?.data;
  const signature = event?.signature;
  if (!data || typeof data.orderCode !== "string" || !signature) {
    return { ok: false, error: "invalid event" };
  }
  const signed: Record<string, string | number> = {
    amount: data.amount,
    orderCode: data.orderCode,
    status: data.status,
  };
  if (!verifySite2WebhookSignature(signed, signature, checksumKey)) {
    return { ok: false, error: "invalid signature" };
  }
  const payment = await prisma.payment.findUnique({
    where: { providerOrderCode: data.orderCode },
    select: {
      code: true,
      amount: true,
      status: true,
      invitationId: true,
    },
  });
  if (!payment || !payment.code.startsWith(SITE2_ORDER_PREFIX)) {
    return { ok: true, ignored: true };
  }
  if (payment.amount !== data.amount) {
    return { ok: true, ignored: true };
  }
  if ((TERMINAL_STATES as readonly string[]).includes(payment.status)) {
    return { ok: true, status: payment.status };
  }
  const status = webhookStatus(data.status);
  await prisma.payment.update({
    where: { code: payment.code },
    data: {
      status,
      paidAt: status === "paid" ? new Date() : null,
    },
  });
  if (status === "paid") {
    await prisma.invitation.update({
      where: { id: payment.invitationId },
      data: { paid: true },
    });
  }
  return { ok: true, status };
}

export async function getSite2OrderView(
  userId: string,
  invitationId: string,
): Promise<Site2OrderView> {
  const invitation = await requireOwnedInvitation(userId, invitationId);
  const order = await prisma.payment.findFirst({
    where: { invitationId: invitation.id },
    orderBy: { createdAt: "desc" },
    select: { code: true, amount: true, status: true },
  });
  if (!order) {
    return { state: "unpaid", code: "", amount: getSite2PlanAmount() ?? 0 };
  }
  const state =
    order.status === "paid" ||
    order.status === "pending" ||
    order.status === "expired" ||
    order.status === "failed"
      ? order.status
      : "unpaid";
  return { state, code: order.code, amount: order.amount };
}
