"use client";

import { NextIntlClientProvider } from "next-intl";
import {
  JasmineWhiteInvitation,
  SilkFloraBrownInvitation,
} from "@chungdoi/invitation-core/signature";
import type { InvitationRenderContent } from "@chungdoi/invitation-core/signature";

import vi from "@messages/vi.json";

const SIGNATURE_VIEWS = {
  "jasmine-white": JasmineWhiteInvitation,
  "silk-flora-brown": SilkFloraBrownInvitation,
} as const;

export default function SignatureDemoView({
  slug,
  content,
}: {
  slug: keyof typeof SIGNATURE_VIEWS;
  content: InvitationRenderContent;
}) {
  const Renderer = SIGNATURE_VIEWS[slug];
  return (
    <NextIntlClientProvider
      locale="vi"
      timeZone="Asia/Ho_Chi_Minh"
      messages={{ invitationTemplate: vi.invitationTemplate }}
    >
      <Renderer content={content} />
    </NextIntlClientProvider>
  );
}
