import { resolveSite2Url } from "./site-url";
import { SITE2_ID } from "./site-config";

export type Site2BuildInfo = {
  appId: typeof SITE2_ID;
  /** Canonical origin when configured, otherwise null (never throws). */
  origin: string | null;
};

/** Build metadata: which app this image is, and which origin it was built for. */
export function getSite2BuildInfo(): Site2BuildInfo {
  let origin: string | null = null;
  try {
    origin = resolveSite2Url(
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NODE_ENV ?? "development",
    );
  } catch {
    origin = null;
  }
  return { appId: SITE2_ID, origin };
}
