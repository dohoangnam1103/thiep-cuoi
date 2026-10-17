export const SITE_IDS = ["master"] as const;
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

export function isSiteId(value: string): value is SiteId {
  return (SITE_IDS as readonly string[]).includes(value);
}

export function createSiteDefinition(
  id: SiteId,
  publicUrl: string,
): SiteDefinition {
  return {
    id,
    publicUrl,
    sessionCookieName: MASTER_SESSION_COOKIE,
    features: {
      payments: true,
      trialReminders: true,
      transactionalEmail: true,
    },
  };
}
