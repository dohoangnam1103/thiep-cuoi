import type { Editor2Fields } from "./editor2-draft";
import { publicationIssue } from "./invitation-editor-rules";

type PublicationIssue = {
  errorCode: "coupleRequired" | "dateRequired" | "timeRequired" | "venueRequired";
  focusField: string;
  section: "couple" | "event" | "venue";
};

/** Check the current draft on every step, so edits determine what opens next. */
export function editor2PublicationIssue(fields: Editor2Fields): PublicationIssue | null {
  const issue = publicationIssue(fields);
  if (issue) return { ...issue, section: issue.errorCode === "coupleRequired" ? "couple" : "event" };
  if (!fields.venueName.trim() || !fields.address.trim()) {
    return { errorCode: "venueRequired", focusField: !fields.venueName.trim() ? "venueName" : "address", section: "venue" };
  }
  return null;
}
