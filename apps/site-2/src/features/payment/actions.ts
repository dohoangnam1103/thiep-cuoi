"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "../../lib/action-result";
import { getSite2Session } from "../../lib/session";
import vi from "@messages/vi.json";
import {
  checkoutSite2Order,
  resolveSite2PaymentFeature,
  sandboxCheckoutProvider,
} from "./dal";

/* Creates (idempotently) and checks out the invitation's order. The provider
 * is chosen server-side from the resolved mode: sandbox fakes the checkout,
 * live talks to PayOS with site-2 credentials. Production stays disabled
 * until the integration checklist lands, so live never fires by accident. */
export async function ensureSite2OrderAction(
  invitationId: string,
): Promise<ActionResult<{ code: string }>> {
  const session = await getSite2Session();
  if (!session) {
    return { ok: false, formError: vi.guests.sessionExpired };
  }
  const mode = resolveSite2PaymentFeature();
  if (mode === "disabled") {
    return { ok: false, formError: vi.payment.createError };
  }
  if (mode !== "sandbox") {
    return { ok: false, formError: vi.payment.createError };
  }
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const order = await checkoutSite2Order(
      session.userId,
      invitationId,
      sandboxCheckoutProvider,
      {
        returnUrl: `${origin}/dashboard/${invitationId}/thanh-toan`,
        cancelUrl: `${origin}/dashboard/${invitationId}/thanh-toan`,
      },
    );
    revalidatePath(`/dashboard/${invitationId}/thanh-toan`);
    return { ok: true, data: { code: order.code } };
  } catch {
    return { ok: false, formError: vi.payment.createError };
  }
}
