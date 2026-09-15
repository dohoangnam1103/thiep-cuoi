import { applySite2WebhookEvent } from "../../../../features/payment/dal";

/* Site-2 PayOS webhook. Verifies the site-2 checksum signature before any
 * lookup, so events signed with master credentials die here. Unknown order
 * codes (including the master order namespace) are acknowledged without
 * state changes so the provider stops retrying. */
export async function POST(request: Request) {
  const checksumKey = process.env.SITE2_PAYOS_CHECKSUM_KEY;
  if (!checksumKey) {
    return Response.json({ error: "not configured" }, { status: 500 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("data" in body) ||
    !("signature" in body)
  ) {
    return Response.json({ error: "invalid event" }, { status: 400 });
  }
  const { data, signature } = body as {
    data: { orderCode?: unknown; amount?: unknown; status?: unknown };
    signature?: unknown;
  };
  if (
    typeof data.orderCode !== "string" ||
    typeof data.amount !== "number" ||
    typeof signature !== "string" ||
    (data.status !== "PAID" &&
      data.status !== "CANCELLED" &&
      data.status !== "EXPIRED" &&
      data.status !== "FAILED")
  ) {
    return Response.json({ error: "invalid event" }, { status: 400 });
  }
  const result = await applySite2WebhookEvent(
    {
      data: {
        orderCode: data.orderCode,
        amount: data.amount,
        status: data.status,
      },
      signature,
    },
    checksumKey,
  );
  if (!result.ok) {
    const status = result.error === "invalid signature" ? 401 : 400;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json(result);
}
