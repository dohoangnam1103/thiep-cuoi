"use client";

import { NextIntlClientProvider } from "next-intl";
import { ChungDoiDemo } from "@chungdoi/invitation-core/demo-shell";
import type { ChungDoiTemplate } from "@chungdoi/invitation-data/catalog";
import type { ChungDoiDemoContent } from "@chungdoi/invitation-data/demo-content";

import type { PublicState } from "../../features/rsvp/actions";
import type { GuestPrefill } from "../../features/rsvp/types";
import vi from "@messages/vi.json";

const {
  invitationTemplate,
  invitationControls,
  banVeToAmTemplate,
  comicHero,
  hoaMaiThuyMac,
  gatefoldLab,
  sleeveLab,
  coiTrauLab,
  doraemonDoor,
  doraemonDoorLab,
  detectiveConanCasebookLab,
} = vi;

type RsvpQuestionView = {
  id: string;
  label: string;
  type: "text" | "boolean" | "select";
  required: boolean;
  options: string[];
};

type Site2Action = (
  prev: PublicState,
  formData: FormData,
) => Promise<PublicState>;

/* Client shell: same message catalog as the marketing demo, plus the
 * site-2 liveForms assembled from server-resolved props. Kept in a client
 * module because NextIntlClientProvider resolves its server entry (which
 * needs the next-intl plugin) when imported from a server component. */
export function Site2InvitationContent({
  template,
  content,
  slug,
  guest,
  questions,
  wishAction,
  rsvpAction,
}: {
  template: ChungDoiTemplate;
  content: ChungDoiDemoContent;
  slug: string;
  guest: GuestPrefill;
  questions: RsvpQuestionView[];
  wishAction: Site2Action;
  rsvpAction: Site2Action;
}) {
  return (
    <NextIntlClientProvider
      locale="vi"
      timeZone="Asia/Ho_Chi_Minh"
      messages={{
        invitationTemplate,
        invitationControls,
        banVeToAmTemplate,
        comicHero,
        hoaMaiThuyMac,
        gatefoldLab,
        sleeveLab,
        coiTrauLab,
        doraemonDoor,
        doraemonDoorLab,
        detectiveConanCasebookLab,
      }}
    >
      <ChungDoiDemo
        template={template}
        content={content}
        liveForms={{
          wishAction,
          rsvpAction,
          guest,
          recipientLabel: guest?.name.trim() || vi.rsvp.guestFallback,
          personalizationLabels: {
            salutationDefault: vi.rsvp.salutationDefault,
            messageDefault: vi.rsvp.messageDefault,
          },
          questions,
          rsvpLabels: vi.rsvp.labels,
          slug,
          mediaLabels: vi.rsvp.mediaLabels,
        }}
      />
    </NextIntlClientProvider>
  );
}
