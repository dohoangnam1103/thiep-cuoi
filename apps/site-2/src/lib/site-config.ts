import { createSiteDefinition } from "@chungdoi/site-config";
import type { SiteDefinition } from "@chungdoi/site-config";

import { resolveSite2Url } from "./site-url";

export const SITE2_ID = "site-2" as const;

export function getSite2Definition(): SiteDefinition {
  return createSiteDefinition(
    SITE2_ID,
    resolveSite2Url(
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NODE_ENV ?? "development",
    ),
  );
}
