"use client";

import { NextIntlClientProvider } from "next-intl";
import { getTemplateRenderer } from "@chungdoi/invitation-core/templates";
import type { InvitationRenderContent } from "@chungdoi/invitation-core/templates";

import vi from "@messages/vi.json";

/** Body-only live preview for the editor (no cover overlay). */
export function EditorPreview({
  slug,
  content,
}: {
  slug: string;
  content: InvitationRenderContent;
}) {
  const Renderer = getTemplateRenderer(slug);
  if (!Renderer) return null;
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)]">
      <NextIntlClientProvider
        locale="vi"
        timeZone="Asia/Ho_Chi_Minh"
        messages={{
          invitationTemplate: vi.invitationTemplate,
          banVeToAmTemplate: vi.banVeToAmTemplate,
          comicHero: vi.comicHero,
          hoaMaiThuyMac: vi.hoaMaiThuyMac,
        }}
      >
        {/* Registry lookup above is stable per slug (module-level map). */}
        {/* eslint-disable-next-line react-hooks/static-components */}
        <Renderer content={content} />
      </NextIntlClientProvider>
    </div>
  );
}
