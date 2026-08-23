import { prisma } from "@/lib/prisma";
import { SETTLEABLE_PAYMENT_STATUSES } from "@/lib/payment-settlement";

export type UnattributedPayment = {
  id: string;
  code: string;
  status: string;
  amount: number;
  createdAt: Date;
  paidAt: Date | null;
  couple: string | null;
  slug: string | null;
};

export type UnattributedPayments = {
  /** Money already taken on an account nobody can be contacted through. */
  paid: UnattributedPayment[];
  /** Not paid yet, but the provider link can still settle into the state above. */
  atRisk: UnattributedPayment[];
};

function coupleName(content: {
  brideFullName: string | null;
  groomFullName: string | null;
} | null): string | null {
  if (!content) return null;
  const names = [content.groomFullName, content.brideFullName]
    .map((name) => name?.trim())
    .filter((name): name is string => Boolean(name));
  return names.length ? names.join(" & ") : null;
}

/**
 * Orders whose invitation belongs to a User row carrying no email — the state
 * that produced order CD43QQQW, where we had taken the money and had no way to
 * reach the buyer. Checkout now refuses anonymous sessions, so this list is a
 * shrinking backlog rather than a growing one; if it grows again, something has
 * reopened a path to Payment that bypasses `verifyAccountSession`.
 *
 * `atRisk` uses the settleable statuses rather than just "pending" on purpose:
 * `markPaymentPaid` accepts cancelled orders too, and the payOS webhook applies
 * no age limit, so an old link that gets paid still lands in `paid`.
 */
export async function findUnattributedPayments(): Promise<UnattributedPayments> {
  const rows = await prisma.payment.findMany({
    where: {
      status: { in: ["paid", ...SETTLEABLE_PAYMENT_STATUSES] },
      invitation: { user: { email: null } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      status: true,
      amount: true,
      createdAt: true,
      paidAt: true,
      invitation: {
        select: {
          slug: true,
          content: { select: { brideFullName: true, groomFullName: true } },
        },
      },
    },
  });

  const mapped = rows.map((row) => ({
    id: row.id,
    code: row.code,
    status: row.status,
    amount: row.amount,
    createdAt: row.createdAt,
    paidAt: row.paidAt,
    couple: coupleName(row.invitation.content),
    slug: row.invitation.slug,
  }));

  return {
    paid: mapped.filter((row) => row.status === "paid"),
    atRisk: mapped.filter((row) => row.status !== "paid"),
  };
}
