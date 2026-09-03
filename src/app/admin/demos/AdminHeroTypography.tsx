"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Bold, Italic, X } from "lucide-react";
import { HeroTypographyDraft, useHeroTypographyDefaults } from "@/components/hero-typography-provider";
import { HERO_FONT_OPTIONS, ORIGINAL_HERO_TYPOGRAPHY } from "@/lib/hero-typography";
import { saveHeroTypography } from "./hero-typography-actions";

export function AdminHeroTypography({ invitationId, slug, active, children }: { invitationId: string; slug: string; active: boolean; children: ReactNode }) {
  const t = useTranslations("editor.heroTypography");
  const defaults = useHeroTypographyDefaults(slug);
  const [saved, setSaved] = useState(defaults ?? ORIGINAL_HERO_TYPOGRAPHY);
  const [draft, setDraft] = useState(saved);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  function save() {
    const submitted = { ...draft };
    setMessage("");
    startTransition(async () => {
      try {
        const result = await saveHeroTypography(invitationId, slug, submitted);
        if (result.error) { setMessage(t(result.error)); return; }
        setSaved(submitted);
        setMessage(t("saved"));
      } catch { setMessage(t("failed")); }
    });
  }
  return <HeroTypographyDraft value={draft}>
    {children}
    {active && <div className="fixed bottom-24 left-4 z-[150] flex max-w-[calc(100vw-2rem)] flex-col items-start gap-3">
      {open && <section aria-label={t("title")} className="max-h-[70dvh] w-80 overflow-y-auto rounded-2xl border border-border bg-background p-4 text-foreground shadow-xl" data-lenis-prevent>
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-base font-semibold">{t("title")}</h2><button type="button" onClick={() => setOpen(false)} aria-label={t("collapse")} className="rounded-md p-2 hover:bg-muted"><X size={18} /></button></div>
        <p className="mb-4 text-xs text-muted-foreground">{t("scope")}</p>
        <label htmlFor="admin-hero-font" className="mb-1 block text-sm font-medium">{t("font")}</label>
        <select id="admin-hero-font" value={draft.fontFamily} disabled={pending} data-hero-font={draft.fontFamily} onChange={event => { setDraft({ ...draft, fontFamily: event.target.value }); setMessage(""); }} className="mb-4 w-full rounded-lg border border-border bg-background p-2 text-base">
          <option value="">{t("originalFont")}</option>
          {HERO_FONT_OPTIONS.map(font => <option key={font.value} value={font.value} data-font-sample={font.value}>{font.label}</option>)}
        </select>
        <div className="mb-3 flex gap-2">
          <button type="button" aria-label={t("bold")} aria-pressed={draft.bold === true} disabled={pending} onClick={() => { setDraft({ ...draft, bold: !draft.bold }); setMessage(""); }} className="rounded-lg border border-border p-3 aria-pressed:bg-primary aria-pressed:text-primary-foreground"><Bold size={18} /></button>
          <button type="button" aria-label={t("italic")} aria-pressed={draft.italic === true} disabled={pending} onClick={() => { setDraft({ ...draft, italic: !draft.italic }); setMessage(""); }} className="rounded-lg border border-border p-3 aria-pressed:bg-primary aria-pressed:text-primary-foreground"><Italic size={18} /></button>
          <button type="button" disabled={pending} onClick={() => { setDraft(ORIGINAL_HERO_TYPOGRAPHY); setMessage(""); }} className="ml-auto text-xs text-primary underline">{t("reset")}</button>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">{t("styleState", { bold: draft.bold === null ? t("original") : draft.bold ? t("on") : t("off"), italic: draft.italic === null ? t("original") : draft.italic ? t("on") : t("off") })}</p>
        <div className="flex gap-2"><button type="button" disabled={!dirty || pending} onClick={save} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending ? t("saving") : t("save")}</button><button type="button" disabled={pending} onClick={() => { setDraft(saved); setMessage(""); }} className="rounded-lg border border-border px-4 py-2 text-sm">{t("cancel")}</button></div>
        {message && <p role="status" className="mt-3 text-sm">{message}</p>}
      </section>}
      <button type="button" aria-label={t("title")} aria-expanded={open} onClick={() => setOpen(!open)} className="relative flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"><span aria-hidden className="text-xl font-semibold">Aa</span>{dirty && <span className="absolute -top-6 left-0 whitespace-nowrap rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-900">{t("unsaved")}</span>}</button>
    </div>}
  </HeroTypographyDraft>;
}
