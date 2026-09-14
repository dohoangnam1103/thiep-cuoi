"use client";

import { NextIntlClientProvider } from "next-intl";
import {
  getTemplateRenderer,
  type InvitationRenderContent,
} from "@chungdoi/invitation-core/templates";

import vi from "@messages/vi.json";

const { invitationTemplate, banVeToAmTemplate, comicHero, hoaMaiThuyMac } = vi;

export default function SignatureDemoView({
  slug,
  content,
}: {
  slug: string;
  content: InvitationRenderContent;
}) {
  // Registry lookup over a module-level map: identity is stable per slug,
  // so this is not a render-time component creation.
  const Renderer = getTemplateRenderer(slug);
  if (!Renderer) return null;
  return (
    <NextIntlClientProvider
      locale="vi"
      timeZone="Asia/Ho_Chi_Minh"
      messages={{
        invitationTemplate,
        banVeToAmTemplate,
        comicHero,
        hoaMaiThuyMac,
      }}
    >
      {/* Registry lookup above is stable per slug (module-level map). */}
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Renderer content={content} />
    </NextIntlClientProvider>
  );
}
