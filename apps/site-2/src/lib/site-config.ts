import { createSiteDefinition } from "@chungdoi/site-config";
import type { SiteDefinition } from "@chungdoi/site-config";

import { resolveSite2Url } from "./site-url";

export const SITE2_ID = "site-2" as const;

/* Required site-2 payment env names. Production enables only when every one
 * is present alongside SITE2_PAYMENT_ENABLED=1 and a real SITE2_PLAN_PRICE;
 * sandbox mode needs just the flag, the price and the checksum key. */
export const SITE2_PAYMENT_CONFIG_NAMES = [
  "SITE2_PAYMENT_ENABLED",
  "SITE2_PLAN_PRICE",
  "SITE2_PAYOS_CLIENT_ID",
  "SITE2_PAYOS_API_KEY",
  "SITE2_PAYOS_CHECKSUM_KEY",
] as const;

export function getSite2Definition(): SiteDefinition {
  return createSiteDefinition(
    SITE2_ID,
    resolveSite2Url(
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NODE_ENV ?? "development",
    ),
  );
}
