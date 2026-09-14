"use client";

import { NextIntlClientProvider } from "next-intl";
import { ChungDoiDemo } from "@chungdoi/invitation-core/demo-shell";
import type { ChungDoiTemplate } from "@chungdoi/invitation-data/catalog";
import type { ChungDoiDemoContent } from "@chungdoi/invitation-data/demo-content";

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

export default function SignatureDemoView({
  template,
  content,
}: {
  template: ChungDoiTemplate;
  content: ChungDoiDemoContent;
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
      <ChungDoiDemo template={template} content={content} />
    </NextIntlClientProvider>
  );
}
