"use client";

import { Plus } from "lucide-react";
import { memo, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { ChungDoiDemo } from "@/components/chungdoi-demo";
import { InvitationEditingContext } from "@/components/invitation-editing-context";
import { templates } from "@/data/chungdoi";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { editor2MissingSections, editor2Preview, type Editor2Draft, type Editor2Samples, type Editor2Section } from "@/lib/editor2-draft";
import { bindEditor2Canvas } from "./canvas-bindings";
import { Editor2GiftPlaceholder } from "./gift-placeholder";
import { heroImageCount } from "@/data/editor-template-capabilities";

/** A single component tree serves desktop, narrow preview and mobile editing. */
export const Editor2InvitationPreview = memo(function Editor2InvitationPreview({ draft, editing, base, cover3dEnabled, hideBranding, samples, onSelect }: {
  draft: Editor2Draft; editing: boolean; base: ChungDoiDemoContent; cover3dEnabled: boolean; hideBranding: boolean; samples?: Editor2Samples;
  onSelect: (section: Editor2Section, field?: string) => void;
}) {
  const t = useTranslations("editor2");
  const root = useRef<HTMLDivElement>(null);
  const [firstPhoto = "", secondPhoto = ""] = samples?.heroPhotos ?? [];
  const content = useMemo(() => {
    const followsDisplayOrder = draft.fields.templateId !== "hoa-tinh-red";
    const [bride, groom] = heroImageCount(draft.fields.templateId) === 2 && followsDisplayOrder && !draft.fields.brideFirst ? [secondPhoto, firstPhoto] : [firstPhoto, secondPhoto];
    return editor2Preview(draft, base, editing && !draft.gallery.length
      ? {
        heroImage: bride ? new URL(bride, location.origin).href : "",
        heroImage2: groom ? new URL(groom, location.origin).href : "",
        gallery: draft.fields.showAlbum ? samples?.gallery : [],
      } : {});
  }, [draft, base, editing, firstPhoto, secondPhoto, samples]);
  useEffect(() => {
    if (!editing || !root.current) return;
    return bindEditor2Canvas(root.current, draft, content, onSelect,
      section => t("editLabel", { section: t(`sections.${section}`) }), t("sample"));
  }, [draft, content, editing, onSelect, t]);
  const template = templates.find(item => item.slug === draft.fields.templateId)!;
  const missing = editor2MissingSections(draft);
  // Seeded template photos are not user uploads; nudge for a real album once.
  const sampleAlbum = samples?.gallery ?? [];
  const hasOwnAlbum = draft.gallery.some(url => !sampleAlbum.includes(url));
  const suggestions = draft.fields.showAlbum && !hasOwnAlbum && !missing.includes("album")
    ? ["album" as const, ...missing] : missing;
  return <>
    <div ref={root} data-editor2-inline className="e2-inline-canvas">
      <InvitationEditingContext value={editing}>
        <ChungDoiDemo template={template} content={content} previewMode embedded cover3dEnabled={cover3dEnabled} hideBranding={hideBranding} />
      </InvitationEditingContext>
    </div>
    <Editor2GiftPlaceholder root={root} enabled={editing && missing.includes("gift")}
      templateId={draft.fields.templateId} heading={t("sections.gift")}
      openLabel={t("editLabel", { section: t("sections.gift") })} accent={content.theme.primaryColor} />
    {editing && suggestions.length > 0 && <aside className="e2-suggestions" aria-label={t("suggestions")}>
      <h2>{t("suggestions")}</h2>
      <div className="e2-actions">{suggestions.map(section => <button key={section} className="e2-button" data-editor2-gift-hint={section === "gift" ? "true" : undefined} onClick={() => onSelect(section)}>
        <Plus size={16} className="shrink-0" aria-hidden />{section === "gift" ? t("giftSetupHint") : section === "album" && draft.fields.showAlbum ? t("albumSetupHint") : t("addSection", { section: t(`sections.${section}`) })}
      </button>)}</div>
    </aside>}
  </>;
});
