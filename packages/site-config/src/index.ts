export const SITE_IDS = ["master", "site-2"] as const;
export type SiteId = (typeof SITE_IDS)[number];

export type SiteFeatures = {
  payments: boolean;
  trialReminders: boolean;
  transactionalEmail: boolean;
};

export type SiteDefinition = {
  id: SiteId;
  publicUrl: string;
  sessionCookieName: string;
  features: SiteFeatures;
};

export const MASTER_SESSION_COOKIE = "session";
export const SITE2_SESSION_COOKIE = "site2_session";

export function isSiteId(value: string): value is SiteId {
  return (SITE_IDS as readonly string[]).includes(value);
}

function featuresForSite(id: SiteId): SiteFeatures {
  if (id === "site-2") {
    return {
      payments: false,
      trialReminders: false,
      transactionalEmail: false,
    };
  }
  return {
    payments: true,
    trialReminders: true,
    transactionalEmail: true,
  };
}

function sessionCookieForSite(id: SiteId): string {
  return id === "site-2" ? SITE2_SESSION_COOKIE : MASTER_SESSION_COOKIE;
}

export function createSiteDefinition(
  id: SiteId,
  publicUrl: string,
): SiteDefinition {
  return {
    id,
    publicUrl,
    sessionCookieName: sessionCookieForSite(id),
    features: featuresForSite(id),
  };
}
