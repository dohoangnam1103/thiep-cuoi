const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function validateInvitationSlug(slug: string): {
  available: true;
} | {
  available: false;
  reasonCode: "slugMissing" | "slugMalformed";
} {
  if (!slug) return { available: false, reasonCode: "slugMissing" };
  if (!SLUG_RE.test(slug)) {
    return { available: false, reasonCode: "slugMalformed" };
  }
  return { available: true };
}

export function publicationIssue(data: {
  brideFullName: string;
  groomFullName: string;
  date: string;
  time: string;
}): {
  errorCode: "coupleRequired" | "dateRequired" | "timeRequired";
  focusField: string;
} | null {
  if (!data.brideFullName.trim() || !data.groomFullName.trim()) {
    return {
      errorCode: "coupleRequired",
      focusField: !data.brideFullName.trim() ? "brideFullName" : "groomFullName",
    };
  }
  if (!data.date.trim()) return { errorCode: "dateRequired", focusField: "date" };
  if (!data.time.trim()) return { errorCode: "timeRequired", focusField: "time" };
  return null;
}
