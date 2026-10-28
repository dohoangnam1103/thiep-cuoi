"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createVisualInvitation } from "@/app/editor2/actions";
import { completedTemplates } from "@/data/chungdoi";
import { readEditor2Basics, writeEditor2Basics } from "@/lib/editor2-basics-storage";
import { Editor2ClientReady } from "./client-ready";
import type { EditorState } from "@/app/editor/[id]/content-schema";

type Editor2StartProps = { templateId: string; templateLabel: string; isAccount: boolean };

export function Editor2Start(props: Editor2StartProps) {
  return <Editor2ClientReady><Editor2StartForm {...props} /></Editor2ClientReady>;
}

function Editor2StartForm({ templateId, templateLabel, isAccount }: Editor2StartProps) {
  const t = useTranslations("editor2");
  const errors = useTranslations("editor.errors");
  const [state, action, pending] = useActionState<EditorState, FormData>(createVisualInvitation, undefined);
  const [basics, setBasics] = useState(() => readEditor2Basics());
  const template = completedTemplates.find(item => item.slug === templateId)!;
  return <main className="e2-start">
    <Link href={isAccount ? "/dashboard" : "/"} className="e2-back"><ArrowLeft size={16} />{t(isAccount ? "dashboard" : "home")}</Link>
    <div className="e2-start-grid">
      <section className="e2-intro">
        <h1>{t("startTitle")}</h1>
        <p className="e2-lead">{t("startDescription")}</p>
        <form action={action} className="e2-start-form">
          <input type="hidden" name="templateId" value={templateId} />
          {(["brideFullName", "groomFullName", "date"] as const).map(name => <label className="e2-field" key={name}>
            <span>{t(`fields.${name}`)}</span>
            <input name={name} type={name === "date" ? "date" : "text"} required maxLength={name === "date" ? undefined : 120}
              placeholder={name === "date" ? undefined : t(`placeholders.${name}`)} autoComplete="off" disabled={pending} value={basics[name]} onChange={event => {
                const next = { ...basics, [name]: event.target.value };
                setBasics(next); writeEditor2Basics(next);
              }} />
          </label>)}
          {state?.errorCode && <p className="e2-error" role="alert">{errors(state.errorCode)}</p>}
          <button className="e2-button e2-primary" disabled={pending}>{t(pending ? "creating" : "create")}<ArrowRight size={18} /></button>
        </form>
        <p className="e2-footnote">{t("startFootnote", { template: templateLabel })}</p>
        {!isAccount && <p className="e2-footnote">{t("guestDraftNotice")}</p>}
      </section>
      <aside className="e2-start-art" aria-label={templateLabel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={template.listing} alt={templateLabel} width={480} height={640} />
      </aside>
    </div>
  </main>;
}
