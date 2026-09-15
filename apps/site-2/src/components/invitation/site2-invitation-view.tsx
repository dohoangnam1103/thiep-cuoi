import type { ChungDoiTemplate } from "@chungdoi/invitation-data/catalog";
import type { ChungDoiDemoContent } from "@chungdoi/invitation-data/demo-content";

import {
  getPublishedRsvpContext,
  resolveGuestPrefill,
} from "../../features/rsvp/dal";
import {
  submitRsvpForSlug,
  submitWishForSlug,
} from "../../features/rsvp/actions";
import { Site2InvitationContent } from "./site2-invitation-content";

/* Site-2-owned adapter around the shared invitation renderer. The renderer
 * package stays read-only: this server shell resolves site-2 data (guest
 * prefill scoped to the invitation, questions) and passes site-2 server
 * actions down to the client shell through the existing liveForms contract.
 * No owner or private fields leave the database here. */
export async function Site2InvitationView({
  template,
  content,
  slug,
  guestToken,
}: {
  template: ChungDoiTemplate;
  content: ChungDoiDemoContent;
  slug: string;
  guestToken?: string;
}) {
  const context = await getPublishedRsvpContext(slug);
  const guest = context && guestToken
    ? await resolveGuestPrefill(context.invitationId, guestToken)
    : null;
  return (
    <Site2InvitationContent
      template={template}
      content={content}
      slug={slug}
      guest={guest}
      questions={context?.questions ?? []}
      wishAction={submitWishForSlug.bind(null, slug)}
      rsvpAction={submitRsvpForSlug.bind(null, slug)}
    />
  );
}
