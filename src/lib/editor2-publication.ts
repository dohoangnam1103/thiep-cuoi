import type { Editor2Fields } from "./editor2-draft";
import { publicationIssue } from "./invitation-editor-rules";

type PublicationIssue = {
  errorCode: "coupleRequired" | "dateRequired" | "timeRequired" | "venueRequired";
  focusField: string;
  section: "couple" | "event" | "venue";
};

/** Check the current draft on every step, so edits determine what opens next. */
export function editor2PublicationIssue(fields: Editor2Fields, samples: Pick<Editor2Fields, "venueName" | "address">): PublicationIssue | null {
  const issue = publicationIssue(fields);
  if (issue) return { ...issue, section: issue.errorCode === "coupleRequired" ? "couple" : "event" };
  const missingVenueField = (["venueName", "address"] as const).find(key => {
    const value = fields[key].trim().toLocaleLowerCase("vi-VN");
    return !value || value === samples[key].trim().toLocaleLowerCase("vi-VN");
  });
  if (missingVenueField) {
    return { errorCode: "venueRequired", focusField: missingVenueField, section: "venue" };
  }
  return null;
}
